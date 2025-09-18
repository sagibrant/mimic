/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file LocatorUtils.ts
 * @description 
 * Shared utility classes for locator
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

import { Utils } from "./Common";
import { OrdinalSelector, QueryInfo, RegExpSpec, Selector } from "@/types/protocol";


export class LocatorUtils {

  /**
   * query objects using queryInfo 
   * result = primary => mandatory
   * @param queryObjectsFunc query objects function
   * @param queryInfo query info
   * @returns objects which match the selectors in queryInfo
   */
  static async queryObjectsAsync<T extends object>(
    queryObjectsFunc: (selectors: Selector[]) => Promise<T[] | undefined>,
    queryInfo: QueryInfo
  ): Promise<ObjectQueryResult<T> | undefined> {

    let queryResults: ObjectQueryResult<T> | undefined = undefined;
    if (!Utils.isEmpty(queryInfo.primary)) {
      let candidates = await queryObjectsFunc(queryInfo.primary) || [];
      if (!Utils.isEmpty(queryInfo.mandatory)) {
        candidates = LocatorUtils.filterObjects(candidates, queryInfo.mandatory);
      }
      queryResults = {
        objects: candidates,
        queryInfo: { primary: queryInfo.primary, mandatory: queryInfo.mandatory }
      };
    }
    else {
      // even queryInfo.mandatory is undefined, we still need to call queryObjectsFunc once with empty selectors
      // because the queryObjectsFunc return all objects if no selectors 
      let candidates = await queryObjectsFunc(queryInfo.mandatory || []) || [];
      queryResults = {
        objects: candidates || [],
        queryInfo: { primary: [], mandatory: queryInfo.mandatory }
      };
    }

    return LocatorUtils.filterQueryResult(queryResults, queryInfo.assistive || [], queryInfo.ordinal);
  }

  /**
   * query objects using queryInfo 
   * result = primary => mandatory
   * @param queryObjectsFunc query objects function
   * @param queryInfo query info
   * @returns objects which match the selectors in queryInfo
   */
  static queryObjects<T extends object>(
    queryObjectsFunc: (selectors: Selector[]) => T[] | undefined,
    queryInfo: QueryInfo
  ): ObjectQueryResult<T> | undefined {

    let queryResults: ObjectQueryResult<T> | undefined = undefined;

    if (!Utils.isEmpty(queryInfo.primary)) {
      let candidates = queryObjectsFunc(queryInfo.primary) || [];
      if (!Utils.isEmpty(queryInfo.mandatory)) {
        candidates = LocatorUtils.filterObjects(candidates, queryInfo.mandatory);
      }
      queryResults = {
        objects: candidates,
        queryInfo: { primary: queryInfo.primary, mandatory: queryInfo.mandatory }
      };
    }
    else {
      let candidates = queryObjectsFunc(queryInfo.mandatory || []);
      queryResults = {
        objects: candidates || [],
        queryInfo: { primary: [], mandatory: queryInfo.mandatory, assistive: [] }
      };
    }

    return LocatorUtils.filterQueryResult(queryResults, queryInfo.assistive || [], queryInfo.ordinal);
  }

  /**
   * filter the query result with assistive and ordinal selectors
   * @param queryResult the pre query result
   * @param assistive assistive selectos
   * @param ordinal ordinal selector
   * @returns query result
   */
  static filterQueryResult<T extends object>(queryResult: ObjectQueryResult<T>, assistive: Selector[], ordinal?: OrdinalSelector): ObjectQueryResult<T> | undefined {

    // if no objects, return directly
    if (queryResult.objects.length <= 0) {
      return queryResult;
    }

    // filter with assistive selectors
    if (assistive.length > 0) {
      const candidates = queryResult.objects;
      for (let i = assistive.length; i > 0; --i) {
        const nCi = Utils.getCombinations(assistive, i);
        for (let j = 0; j < nCi.length; ++j) {
          const assistive_selectors = nCi[j];
          const filtered_objects = LocatorUtils.filterObjects(candidates, assistive_selectors);
          if (filtered_objects.length == 1) {
            return {
              objects: filtered_objects,
              queryInfo: {
                primary: queryResult.queryInfo.primary,
                mandatory: queryResult.queryInfo.mandatory,
                assistive: assistive_selectors
              }
            };
          }
        }
      }
    }

    // filter with ordinal selector
    if (ordinal) {
      // todo: sort queryResult.objects by ordinal.type
      // e.g. queryResult.objects.sort(...by creationtime, ...by location x,y, ...)
      const index = ordinal.reverse ? queryResult.objects.length - 1 - ordinal.index : ordinal.index;
      const objs = (index >= 0 && index < queryResult.objects.length) ? [queryResult.objects[index]] : [];
      return {
        objects: objs,
        queryInfo: {
          primary: queryResult.queryInfo.primary,
          mandatory: queryResult.queryInfo.mandatory,
          assistive: [],
          ordinal: ordinal
        }
      };
    }

    return queryResult;
  }

  /**
   * filter the objects according to the filter selectors
   * @param objects candidate objects
   * @param selectors filter selectors
   * @returns filtered objects
   */
  static filterObjects<T extends object>(objects: T[], selectors: Selector[]): T[] {
    const res: T[] = [];
    for (const obj of objects) {
      if (LocatorUtils.matchSelectors(obj, selectors)) {
        res.push(obj);
      }
    }
    return res;
  }

  /**
   * check if the given object match the give selectors
   * @param {T} obj 
   * @param {Selector[]} selectors
   * @returns {boolean}
   */
  static matchSelectors<T extends object>(obj: T, selectors: Selector[]): boolean {
    for (const selector of selectors) {
      if (!LocatorUtils.matchSelector(obj, selector)) {
        return false;
      }
    }
    return true;
  }

  /**
   * check if the given object match the give selector
   * @param {T} obj 
   * @param {Selector} selector
   * @returns {boolean}
   */
  static matchSelector<T extends object>(obj: T, selector: Selector): boolean {
    const key = selector.name;
    if (Utils.isNullOrUndefined(key)) {
      throw new Error(`Invalid Arguments: selector.name are null or undefined`);
    }

    const matchType = selector.match;
    if (matchType === 'has') {
      return LocatorUtils.hasSelectorKey(obj, selector);
    }
    else if (matchType === 'hasNot') {
      return !LocatorUtils.hasSelectorKey(obj, selector);
    }
    else {
      const actualValue = LocatorUtils.getValueBySelector(obj, selector);
      return LocatorUtils.matchValue(matchType, selector.value, actualValue);
    }
  }

  /**
   * check if the object has the selector item
   * @param obj object
   * @param selector selector
   * @returns if the selector item exists in object
   */
  static hasSelectorKey<T extends object>(obj: T, selector: Selector): boolean {
    const key = selector.name;
    if (selector.match !== 'has') {
      throw new Error(`Invalid Arguments: selector.match cannot be ${selector.match}`);
    }

    if (selector.type === 'property') {
      return key in obj;
    }
    else if (selector.type === 'attribute') {
      if ('hasAttribute' in obj && Utils.isFunction(obj.hasAttribute)) {
        return obj.hasAttribute(key);
      }
      return false;
    }
    else if (selector.type === 'function') {
      return key in obj && Utils.isFunction((obj as any)[key]);
    }
    else if (selector.type === 'text') {
      return obj instanceof Node && obj.nodeType === Node.TEXT_NODE;
    }
    return false;
  }

  /**
   * get the actual value from object for selector
   * @param obj object
   * @param selector selector
   * @returns actual value in the object 
   */
  static getValueBySelector<T extends object>(obj: T, selector: Selector): string | number | boolean | undefined | null {
    const key = selector.name;
    let nodeValue: string | number | boolean | undefined | null = undefined;

    if (selector.type === 'property') {
      nodeValue = (obj as any)[key];
    }
    else if (selector.type === 'attribute') {
      if ('getAttribute' in obj && Utils.isFunction(obj.getAttribute)) {
        nodeValue = obj.getAttribute(key);
      }
    }
    else if (selector.type === 'function') {
      if (key in obj && Utils.isFunction((obj as any)[key])) {
        nodeValue = (obj as any)[key]();
      }
    }
    else if (selector.type === 'text') {
      if (obj instanceof Node && obj.nodeType === Node.TEXT_NODE) {
        nodeValue = obj.textContent as string;
      }
    }

    return nodeValue;
  }

  /**
   * check if the actual value match the expected value
   * @param expected expected value
   * @param actual actual value
   * @returns if matched
   */
  static matchValue(
    matchType: 'exact' | 'includes' | 'startsWith' | 'endsWith' | 'regex',
    expected: string | number | boolean | RegExpSpec | undefined | null,
    actual: string | number | boolean | undefined | null): boolean {

    if (matchType === 'exact') {
      return expected === actual;
    }
    else if (matchType === 'includes') {
      return (actual as string).includes(expected as string);
    }
    else if (matchType === 'startsWith') {
      return (actual as string).startsWith(expected as string);
    }
    else if (matchType === 'endsWith') {
      return (actual as string).endsWith(expected as string);
    }
    else if (matchType === 'regex') {
      if (Utils.isRegExpSpec(expected)) {
        const regExp = new RegExp(expected.pattern, expected.flags);
        return regExp.test(actual as string);
      }
      else {
        var regExp = new RegExp(expected as string);
        return regExp.test(actual as string);
      }
    }
    return false;
  }

}


/**
 * Interface representing the query result for objects
 */
export interface ObjectQueryResult<T> {
  /**
   * the objects match the queryInfo
   */
  readonly objects: T[];
  /**
   * the query properties
   */
  readonly queryInfo: QueryInfo;
}
