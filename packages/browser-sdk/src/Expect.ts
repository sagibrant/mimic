/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Expect.ts
 * @description 
 * Class for Expect Assertions
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as api from "@mimic-sdk/core";
import { RtidUtils } from "@mimic-sdk/core";
import { ChannelBase } from "./Channel";
import { Browser } from "./aos/Browser";
import { Window } from "./aos/Window";
import { Page } from "./aos/Page";
import { Frame } from "./aos/Frame";
import { Element } from "./aos/Element";
import { Text } from "./aos/Text";
import { AutomationObject } from "./aos/AutomationObject";

/**
 * Assertion Error Class: Carries full values but displays concise messages
 */
export class AssertionError extends Error {
  constructor(
    message: string,
    public actual: unknown,
    public expected?: unknown
  ) {
    // Message is structured as three lines: reason, expected, actual
    super(`Assertion Failed:\n${message}`);
    this.name = "AssertionError";
  }
}

/**
 * Utility to format values concisely (max ~20 chars) for error messages
 * Full values are still stored in AssertionError for debugging
 */
const formatValueBrief = (value: unknown): string => {
  // Handle null/undefined
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  // Primitives
  if (typeof value !== 'object') {
    const str = typeof value === 'string' ? `"${value}"` : String(value);
    return str;
  }

  // Special types
  if (value instanceof Date) return `Date(${value.toISOString()})`;
  if (value instanceof RegExp) return `RegExp(${value.source.slice(0, 10)}...)`;

  // Custom classes
  if ([Browser, Window, Page, Frame, Element, Text].some(cls => value instanceof cls)) {
    return `${value.constructor.name}["${JSON.stringify((value as AutomationObject).rtid())}"]`;
  }

  // Arrays
  if (Array.isArray(value)) {
    return value.length > 3
      ? `Array[-${value.length}-]`
      : `Array[${value.map(v => formatValueBrief(v)).join(',')}]`;
  }

  // Objects (show first 2 keys)
  const keys = Object.keys(value);
  const shortKeys = keys.slice(0, 5).map(key => {
    const val = (value as Record<string, unknown>)[key];
    const str = typeof val === 'object' ? '{...}' : String(val);
    return `${key}:${str.length > 20 ? str.slice(0, 17) + '...' : str}`;
  });
  const objStr = `Object{${shortKeys.join(',')}${keys.length > 5 ? ',...' : ''}}`;
  return objStr;
};

/**
 * Check if a value is a reference type (excluding null)
 */
const isReferenceType = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

/**
 * Deep comparison for reference types
 */
const deepEqual = (actual: unknown, expected: unknown): boolean => {
  if (!isReferenceType(actual) || !isReferenceType(expected)) {
    return actual === expected || (Number.isNaN(actual) && Number.isNaN(expected));
  }

  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    return actual.every((item, index) => deepEqual(item, expected[index]));
  }

  if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();
  }
  if (actual instanceof RegExp && expected instanceof RegExp) {
    return actual.source === expected.source && actual.flags === expected.flags;
  }

  const actualKeys = Object.keys(actual);
  const expectedKeys = Object.keys(expected);
  if (actualKeys.length !== expectedKeys.length) return false;

  return actualKeys.every((key) => {
    if (!expectedKeys.includes(key)) return false;
    return deepEqual((actual as Record<string, unknown>)[key], (expected as Record<string, unknown>)[key]);
  });
};

/**
 * Core Expect Class with concise error messages
 */
export class Expect extends ChannelBase implements api.Expect {
  private _mode: 'log' | 'report' | 'error' = 'error';
  private _not: boolean = false;

  constructor(private actual: unknown) {
    super();
  }

  private assert(check: boolean, reason: string, expected?: unknown, actual?: unknown): void {
    if ((this._not && !check) || (!this._not && check)) {
      return;
    }

    // Format brief values for message (full values stored in error)
    const expectedBrief = expected !== undefined ? formatValueBrief(expected) : '';
    const actualBrief = actual !== undefined ? formatValueBrief(actual) : formatValueBrief(this.actual);

    // Structured message: [reason]\nExpected: [expected]\nActual: [actual]
    const message = `${reason}\nExpected: ${expectedBrief}\nActual: ${actualBrief}`;

    if (this._mode === 'log') {
      this.logger.warn(message);
    } else if (this._mode === 'report') {
      // this.logger.error(message);
    } else if (this._mode === 'error') {
      actual = actual ?? this.actual;
      throw new AssertionError(message, actual, expected);
    }
  }

  changeMode(mode: 'log' | 'report' | 'error'): void {
    if (['log', 'report', 'error'].includes(mode)) {
      this._mode = mode;
    }
  }

  /**
   * Strict equality assertion
   */
  toBe(expected: unknown): void {
    let isEqual = false;
    if (Number.isNaN(this.actual) && Number.isNaN(expected as number)) {
      isEqual = true;
    } else {
      isEqual = this.actual === expected;
    }

    const reason = this._not
      ? `Actual value should NOT be strictly equal to expected`
      : `Actual value should be strictly equal to expected`;
    this.assert(isEqual, reason, expected);
  }

  /**
   * Deep equality assertion
   */
  toEqual(expected: unknown): void {
    let isEqual: boolean;
    if ([Browser, Window, Page, Frame, Element, Text].some(cls =>
      this.actual instanceof cls && expected instanceof cls)) {
      isEqual = RtidUtils.isRtidEqual((this.actual as AutomationObject).rtid(), (expected as AutomationObject).rtid());
    } else {
      isEqual = deepEqual(this.actual, expected);
    }

    const reason = this._not
      ? `Actual value should NOT be deeply equal to expected`
      : `Actual value should be deeply equal to expected`;
    this.assert(isEqual, reason, expected);
  }

  /**
   * Truthy value assertion
   */
  toBeTruthy(): void {
    const isTruthy = Boolean(this.actual);
    const reason = this._not
      ? `Value should NOT be truthy`
      : `Value should be truthy`;
    this.assert(isTruthy, reason);
  }

  /**
   * Falsy value assertion
   */
  toBeFalsy(): void {
    const isFalsy = !this.actual;
    const reason = this._not
      ? `Value should NOT be falsy`
      : `Value should be falsy`;
    this.assert(isFalsy, reason);
  }

  /**
   * NaN assertion
   */
  toBeNaN(): void {
    const isNaN = Number.isNaN(this.actual);
    const reason = this._not
      ? `Value should NOT be NaN`
      : `Value should be NaN`;
    this.assert(isNaN, reason, NaN);
  }

  /**
   * Null assertion
   */
  toBeNull(): void {
    const isNull = this.actual === null;
    const reason = this._not
      ? `Value should NOT be null`
      : `Value should be null`;
    this.assert(isNull, reason, null);
  }

  /**
   * Undefined assertion
   */
  toBeUndefined(): void {
    const isUndefined = this.actual === undefined;
    const reason = this._not
      ? `Value should NOT be undefined`
      : `Value should be undefined`;
    this.assert(isUndefined, reason, undefined);
  }

  /**
   * Defined assertion
   */
  toBeDefined(): void {
    const isDefined = this.actual !== undefined;
    const reason = this._not
      ? `Value should NOT be defined`
      : `Value should be defined`;
    this.assert(isDefined, reason);
  }

  /**
   * Null or undefined assertion
   */
  toBeNullOrUndefined(): void {
    const isNullOrUndefined = this.actual === null || this.actual === undefined;
    const reason = this._not
      ? `Value should NOT be null or undefined`
      : `Value should be null or undefined`;
    this.assert(isNullOrUndefined, reason);
  }

  /**
   * Length assertion
   */
  toHaveLength(expected: number): void {
    if (typeof this.actual !== 'string' && !Array.isArray(this.actual) &&
      !(isReferenceType(this.actual) && 'length' in this.actual)) {
      this.assert(false, `Value does not have a length property`, expected);
      return;
    }

    const actualLength = (this.actual as { length: number }).length;
    const hasCorrectLength = actualLength === expected;

    const reason = this._not
      ? `Length should NOT be ${expected}`
      : `Length should be ${expected}`;
    this.assert(hasCorrectLength, reason, expected, actualLength);
  }

  /**
   * Inclusion assertion
   */
  toContain(expected: unknown): void {
    if (Array.isArray(this.actual)) {
      const includes = this.actual.includes(expected);
      const reason = this._not
        ? `Array should NOT contain expected element`
        : `Array should contain expected element`;
      this.assert(includes, reason, expected);
      return;
    }

    if (typeof this.actual === "string" && typeof expected === "string") {
      const includes = this.actual.includes(expected);
      const reason = this._not
        ? `String should NOT contain expected substring`
        : `String should contain expected substring`;
      this.assert(includes, reason, expected);
      return;
    }

    this.assert(false, `toContain requires Array or String`, expected);
  }

  /**
   * Pattern matching assertion
   */
  toMatch(expected: RegExp | string): void {
    if (typeof this.actual !== 'string') {
      this.assert(false, `toMatch requires a string value`, expected);
      return;
    }

    const regex = typeof expected === 'string' ? new RegExp(expected) : expected;
    const matches = regex.test(this.actual);
    const reason = this._not
      ? `String should NOT match pattern`
      : `String should match pattern`;
    this.assert(matches, reason, expected);
  }

  /**
   * Error throwing assertion
   */
  toThrow(expectedErrorMsg?: string): void {
    if (typeof this.actual !== "function") {
      this.assert(false, `toThrow requires a function`, undefined);
      return;
    }

    let didThrow = false;
    let actualErrorMsg = "";

    try {
      (this.actual as () => unknown)();
    } catch (error) {
      didThrow = true;
      actualErrorMsg = error instanceof Error ? error.message : String(error);
    }

    if (!expectedErrorMsg) {
      const reason = this._not
        ? `Function should NOT throw an error`
        : `Function should throw an error`;
      this.assert(didThrow, reason);
      return;
    }

    if (!didThrow) {
      const reason = this._not
        ? `Function should NOT throw (no error expected)`
        : `Function should throw error containing "${expectedErrorMsg}"`;
      this.assert(didThrow, reason, expectedErrorMsg);
      return;
    }

    const reason = this._not
      ? `Function should NOT throw error containing "${expectedErrorMsg}"`
      : `Error message should contain "${expectedErrorMsg}"`;
    this.assert(actualErrorMsg.includes(expectedErrorMsg), reason, expectedErrorMsg, actualErrorMsg);
  }

  /**
   * Negation modifier
   */
  get not(): this {
    this._not = !this._not;
    return this;
  }
}

/**
 * Entry function for assertions
 */
export const expect = (actual: unknown): Expect => new Expect(actual);
