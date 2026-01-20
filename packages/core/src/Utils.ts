/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Utils.ts
 * @description 
 * Shared utility classes and functions
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

import { RectInfo } from "./types/types";
import { RegExpSpec } from "./types/protocol";

/**
 * Checks if the provided value is `null` or `undefined`.
 * @param value The value to check.
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}
/**
   * Overload 1: Check for null | undefined (the most basic empty values)
   */
export function isEmpty(value: null | undefined): value is null | undefined;

/**
 * Overload 2: Check for empty strings (including whitespace-only strings like "  ", "\t", "\n")
 */
export function isEmpty(value: string | null | undefined): value is null | undefined | "" | " " | "\t" | "\n";

/**
 * Overload 3: Check for empty arrays (arrays with length 0)
 */
export function isEmpty<T>(value?: T[]): value is [] | undefined;

/**
 * Overload 4: Check for empty Map
 */
export function isEmpty<K, V>(value: Map<K, V>): value is Map<never, never>;

/**
 * Overload 5: Check for empty Set
 */
export function isEmpty<T>(value: Set<T>): value is Set<never>;

/**
 * Overload 6: Check for empty objects (plain objects with no own properties, e.g., {})
 */
export function isEmpty(value: object): value is Record<string, never>;

/**
 * Overload 7: Handle other unknown types (final match, returns whether empty)
 */
export function isEmpty(value: unknown): boolean;


/**
 * Implementation logic: Determine if a value is "empty"
 * Definition of empty values:
 * - null/undefined
 * - Empty strings or whitespace-only strings (e.g., "", "  ", "\t", "\n")
 * - Empty arrays ([])
 * - Empty Map/Set
 * - Plain objects with no own properties (e.g., {})
 */
export function isEmpty(value: unknown): boolean {
  // 1. Directly treat null/undefined as empty
  if (value === null || value === undefined) {
    return true;
  }

  // 2. Strings: Empty or whitespace-only (length 0 after trim)
  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  // 3. Arrays: Treat arrays with length 0 as empty
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  // 4. Map/Set: Treat those with size 0 as empty
  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  // 5. Plain objects: Treat objects with no own properties as empty (null is excluded since checked above)
  if (typeof value === "object") {
    if (value instanceof Date || value instanceof RegExp) {
      return false;
    }
    if (value instanceof Map || value instanceof Set) {
      return value.size === 0;
    }
    const proto: unknown = Object.getPrototypeOf(value);
    if (proto === Object.prototype) {
      return Object.keys(value).length === 0;
    }
    return false;
  }

  // Other types (e.g., number, boolean, function, etc.): Not empty
  return false;
}

/**
 * Checks if the provided value is `function`.
 * @param value The value to check.
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Replaces all occurrences of a pattern in a string with a replacement string.
 * @param str original string
 * @param pattern pattern to search
 * @param replacement replacement string
 * @returns updated string
 */
export function replaceAll(str: string, pattern: string, replacement: string): string {
  if (typeof (str as { replaceAll?: unknown }).replaceAll === 'function') {
    return (str as unknown as { replaceAll: (pattern: string, replacement: string) => string }).replaceAll(pattern, replacement);
  }
  return str.split(pattern).join(replacement);
}

/**
 * Checks if the provided value is `RegExpSpec`
 * @param value The value to check
 * @returns 
 */
export function isRegExpSpec(value: unknown): value is RegExpSpec {
  if (typeof value !== 'object') {
    return false;
  }
  const regExp = value as RegExpSpec;
  const checks = [
    typeof regExp.pattern === 'string',
    typeof regExp.flags === 'string' || regExp.flags === undefined
  ];
  if (checks.some(c => !c)) {
    return false;
  }
  return true;
}

/**
 * Convert the RegExp to RegExpSpec
 * @param value The value of RegExp type
 * @returns 
 */
export function toRegExpSpec(value: RegExp): RegExpSpec {
  return {
    pattern: value.source,
    flags: value.flags
  };
}

/**
 * Generates a UUID using `crypto.randomUUID` if available,
 * otherwise falls back to timestamp-based unique ID.
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `uid-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Deeply clones an object or array, excluding functions by default.
 * Supports circular references.
 * @param src The object to clone.
 * @param includeFunctions Whether to include functions in the clone.
 */
export function deepClone<T>(src: T, includeFunctions = false): T {
  const seen = new WeakMap();

  const clone = (input: unknown): unknown => {
    if (isNullOrUndefined(input)) return input;

    if (typeof input !== 'object') {
      return includeFunctions || typeof input !== 'function' ? input : undefined;
    }

    if (seen.has(input)) return seen.get(input);

    if (input instanceof Date) return new Date(input.getTime());
    if (input instanceof RegExp) return new RegExp(input);

    const output = Array.isArray(input) ? [] : {};
    seen.set(input, output);

    for (const [key, value] of Object.entries(input)) {
      if (!includeFunctions && typeof value === 'function') continue;
      (output as Record<string, unknown>)[key] = clone(value);
    }

    return output;
  };

  return clone(src) as T;
}

/**
 * Performs a deep comparison between two values to determine if they are equivalent (similar to lodash.isEqual).
 * @param a The first value to compare
 * @param b The second value to compare
 * @param comparedCache Used to cache compared reference objects to prevent stack overflow caused by circular references (for internal recursive use only, no need to pass externally)
 * @returns A boolean indicating whether the two values are equivalent
 */
export function isEqual(
  a: unknown,
  b: unknown,
  comparedCache: [unknown, unknown][] = []
): boolean {
  // 1. Handle strictly equal cases (except for NaN)
  if (a === b) {
    return true;
  }

  // 2. Handle the special case of NaN (NaN === NaN returns false, but they should be considered equivalent logically)
  if (Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  }

  // 3. Get the accurate type tag of both values (solves the problem that typeof cannot distinguish between object/array/date etc.)
  const typeTagA = Object.prototype.toString.call(a);
  const typeTagB = Object.prototype.toString.call(b);

  // 3.1 Return false directly if the type tags are inconsistent
  if (typeTagA !== typeTagB) {
    return false;
  }

  const typeTag = typeTagA;

  // 4. Prevent circular references (avoid stack overflow, directly consider cached references as equivalent)
  for (const [cachedA, cachedB] of comparedCache) {
    if (cachedA === a && cachedB === b) {
      return true;
    }
  }
  // Add the current pair of reference objects to be compared to the cache
  comparedCache.push([a, b]);

  try {
    // 5. Perform deep comparison by type
    switch (typeTag) {
      // 5.1 Date objects (compare by timestamp)
      case '[object Date]':
        return (a as Date).getTime() === (b as Date).getTime();

      // 5.2 Regular expression objects (compare source string and flags)
      case '[object RegExp]': {
        const regA = a as RegExp;
        const regB = b as RegExp;
        return regA.source === regB.source && regA.flags === regB.flags;
      }

      // 5.3 Arrays (traverse each element and compare recursively)
      case '[object Array]': {
        const arrA = a as unknown[];
        const arrB = b as unknown[];

        // Return false directly if the array lengths are inconsistent
        if (arrA.length !== arrB.length) {
          return false;
        }

        // Compare each element recursively
        for (let i = 0; i < arrA.length; i++) {
          if (!isEqual(arrA[i], arrB[i], comparedCache)) {
            return false;
          }
        }
        return true;
      }

      // 5.4 Plain objects (traverse own enumerable properties and compare recursively)
      case '[object Object]': {
        const objA = a as Record<string | symbol, unknown>;
        const objB = b as Record<string | symbol, unknown>;

        // Get own enumerable property names (excluding prototype chain properties)
        const keysA = Reflect.ownKeys(objA);
        const keysB = Reflect.ownKeys(objB);

        // Return false directly if the number of properties is inconsistent
        if (keysA.length !== keysB.length) {
          return false;
        }

        // Compare the value of each property recursively
        for (const key of keysA) {
          if (
            !Reflect.has(objB, key) || // The property does not exist in the other object
            !isEqual(objA[key], objB[key], comparedCache) // The property values are not equivalent
          ) {
            return false;
          }
        }
        return true;
      }

      // 5.5 Other unsupported complex types (such as Function, Symbol, etc., compared by reference)
      default:
        return false;
    }
  } finally {
    // Remove the current cache after recursive return to avoid affecting comparisons in other branches
    comparedCache.pop();
  }
}

/**
 * get the item from source object
 * @param key item key
 * @param source source data object
 * @returns item value
 */
export function getItem<T>(key: string, source: Record<string, unknown> | undefined): T | undefined {
  if (isNullOrUndefined(source)) {
    return undefined;
  }
  if (key in source) {
    const value = source[key] as T;
    return value;
  }
  return undefined;
}
/**
 * Checks if the given string starts with the specified substring.
 * @param str The full string.
 * @param prefix The prefix to test.
 */
export function startsWith(str: string, prefix: string): boolean {
  return str.startsWith(prefix);
}

/**
 * fix the rectangle object (fullfill the width, height, right, bottom)
 * @param {Partial<RectInfo>} rect 
 * @returns {RectInfo}
 */
export function fixRectangle(rect: Partial<RectInfo>): RectInfo {
  if (!rect) {
    return rect;
  }
  // x + y = z
  const solveEquation = (x?: number, y?: number, z?: number): (number | undefined)[] => {
    if (isNullOrUndefined(x) && !isNullOrUndefined(y) && !isNullOrUndefined(z)) {
      return [z - y, y, z];
    }
    if (!isNullOrUndefined(x) && isNullOrUndefined(y) && !isNullOrUndefined(z)) {
      return [x, z - x, z];
    }
    if (!isNullOrUndefined(x) && !isNullOrUndefined(y) && isNullOrUndefined(z)) {
      return [x, y, x + y];
    }
    return [x, y, z];
  };
  if (isNullOrUndefined(rect.left) && !isNullOrUndefined(rect.x)) {
    rect.left = rect.x;
  }
  if (isNullOrUndefined(rect.top) && !isNullOrUndefined(rect.y)) {
    rect.top = rect.y;
  }
  const result: Partial<RectInfo> = {};
  let arr = solveEquation(rect.left, rect.width, rect.right);
  result.left = arr[0];
  result.width = arr[1];
  result.right = arr[2];
  arr = solveEquation(rect.top, rect.height, rect.bottom);
  result.top = arr[0];
  result.height = arr[1];
  result.bottom = arr[2];

  result.x = result.left;
  result.y = result.top;
  return result as RectInfo;
}

/**
 * check if the url is an internal url
 * @param url url string
 * @returns 
 */
export function isInternalUrl(url: string): boolean {
  const schemes = [
    'chrome:',     // Chrome internal pages (e.g., chrome://extensions)
    'edge:',       // Edge internal pages
    'about:',      // Browser about pages (e.g., about:blank)
    'opera:',      // Opera internal pages
    'brave:',      // Brave browser internal pages
    'chrome-extension:', // Extension internal pages (chrome)
    'extension:',  // Extension internal pages (edge)
    'moz-extension:'    // Firefox extension pages (for cross-browser compatibility)
  ];
  try {
    const urlObj = new URL(url);
    return schemes.includes(urlObj.protocol);
  }
  catch {
    return false;
  }
}

/**
 * check if the url is a file url
 * @param url url string
 * @returns 
 */
export function isFileUrl(url: string): boolean {
  const schemes = [
    'file:',       // Local files
  ];
  try {
    const urlObj = new URL(url);
    return schemes.includes(urlObj.protocol);
  }
  catch {
    return false;
  }
}

/**
 * check if the url is a extension url
 * @param url url string
 * @returns 
 */
export function isExtensionUrl(url: string): boolean {
  const schemes = [
    'chrome-extension:', // Extension internal pages (chrome)
    'extension:',  // Extension internal pages (edge)
    'moz-extension:'    // Firefox extension pages (for cross-browser compatibility)
  ];
  try {
    const urlObj = new URL(url);
    return schemes.includes(urlObj.protocol);
  }
  catch {
    return false;
  }
}

/**
 * Returns all combinations of size k from the input array.
 * 
 * @template T - The type of elements in the array
 * @param arr - Input array of elements
 * @param k - Size of combinations to generate
 * @returns Array of all combinations of size k
 */
export function getCombinations<T>(arr: T[], k: number): T[][] {
  // Handle edge cases
  if (k === 0) return [[]];
  if (k > arr.length) return [];

  // Create sorted copy to handle duplicate elements
  // const sorted = [...arr].sort();
  const sorted = arr;
  const result: T[][] = [];

  /**
   * Backtracking function to generate combinations
   * @param start - Starting index for selection
   * @param current - Current combination being built
   */
  function backtrack(start: number, current: T[]): void {
    // When current combination reaches size k, add to results
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    // Iterate through remaining elements
    for (let i = start; i < sorted.length; i++) {
      // Skip duplicates to avoid identical combinations
      if (i > start && sorted[i] === sorted[i - 1]) continue;

      // Include current element
      current.push(sorted[i]);

      // Recurse with next elements
      backtrack(i + 1, current);

      // Backtrack: remove last element
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

interface Mimic {
  wait: (ms: number) => Promise<void>
};

/**
 * wait 
 * @param ms timeout
 * @returns 
 */
export async function wait(ms: number): Promise<void> {
  const mimic = (typeof globalThis !== 'undefined' && 'mimic' in globalThis) ? (globalThis as typeof globalThis & { mimic: Mimic }).mimic : undefined;
  if (mimic && typeof mimic.wait === 'function') {
    return await mimic.wait(ms);
  }
  else {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * wait for the checkFunc to be checked
 * @param checkFunc the check function to validate the requirements
 * @param timeout timeout
 * @param delay delay for each check
 * @returns property value match the expected value
 */
export async function waitChecked(checkFunc: () => Promise<boolean>, timeout: number = 5000, delay: number = 500): Promise<boolean> {
  const end_time = performance.now() + timeout;
  let count = 0;
  const noWaitRetryNum = 0;
  while (performance.now() < end_time) {
    const isMatch = await checkFunc();
    if (isMatch) {
      return true;
    }
    else if (performance.now() > end_time) {
      return false;
    }
    count++;
    // let's first try ${noWaitRetryNum} times incase the js wait is not stable and low priority cause long timeout than expected
    // if still failed, we try to wait
    if (count > noWaitRetryNum) {
      await wait(delay);
    }
  }
  return false;
}

/**
 * use requestAnimationFrame for wait 
 * @deprecated not working in extension
 * @param checkFunc the check function to validate the requirements
 * @param timeout timeout
 * @param delay delay for each check
 * @returns property value match the expected value
 */
export async function rafWaitChecked(checkFunc: () => Promise<boolean>, timeout: number = 5000, delay: number = 100): Promise<boolean> {
  if (typeof requestAnimationFrame !== 'function') {
    throw new Error('requestAnimationFrame is not a valid function');
  }
  const end_time = performance.now() + timeout;
  return new Promise((resolve, _reject) => {
    let lastExecution: number | undefined = undefined;
    const rafFunc = async (): Promise<void> => {
      // time out
      if (performance.now() >= end_time) {
        resolve(false);
        return;
      }

      try {
        if (isNullOrUndefined(lastExecution) || performance.now() - lastExecution >= delay) {
          lastExecution = performance.now();
          const isMatch = await checkFunc();
          lastExecution = performance.now();
          if (isMatch) {
            resolve(true);
            return;
          }
          else if (performance.now() >= end_time) {
            resolve(false);
            return;
          }
        }
      } catch {
        // Ignore errors and continue
      }
      requestAnimationFrame(rafFunc);
    };
    requestAnimationFrame(rafFunc);
  });
}

/**
 * wait for the function result within timeout duration
 * @param func the function to wait for
 * @param timeout the timeout
 * @returns the function run result
 */
export async function waitResult<T>(func: () => Promise<T>, timeout: number = 5000): Promise<T> {
  if (timeout <= 0) {
    return await func();
  }
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`timeout after ${timeout}ms`));
    }, timeout);
    func().then((result) => {
      clearTimeout(timeoutId);
      return resolve(result);
    }).catch((error) => {
      clearTimeout(timeoutId);
      return reject(error);
    });
  });
}

/**
 *Generates a timestamp with millisecond precision
 * Format: "YYYY-MM-DD HH:MM:SS.sss"
 * Example output: "2024-05-20 14:35:22.789"
 * @returns Formatted timestamp string
 */
export function getTimeStamp(): string {
  const date = new Date();

  // Extract date components with leading zeros where necessary
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');

  // Extract time components with leading zeros
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Extract milliseconds (0-999) and ensure 3 digits with leading zeros
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  // Combine into human-readable format
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export function fillWithDefaultValues<T extends object>(source: Partial<T>, defaults: T): void {
  for (const key in defaults) {
    if (!Object.prototype.hasOwnProperty.call(defaults, key)) continue;

    if (source[key] === undefined) {
      source[key] = defaults[key];
    }
    else if (typeof defaults[key] === 'object' && defaults[key] !== null &&
      typeof source[key] === 'object' && source[key] !== null) {
      fillWithDefaultValues(source[key] as Partial<object>, defaults[key] as object);
    }
  }
}