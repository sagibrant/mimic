/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Common.ts
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
import { Action, ActionName, AODesc, ContextType, Message, MessageData, MessageDataType, MessageType, RegExpSpec, Rtid } from "./types/protocol";

/**
 * Browser detection result interface
 */
export interface BrowserInfo {
  name: 'chrome' | 'edge' | 'firefox' | 'safari' | 'unknown';
  version: string;
  majorVersion: number;
};

/**
 * Represents a key-value pair, optionally typed.
 */
export interface NameValuePair {
  name: string;
  value?: unknown;
}

/**
 * successCallback wrapper
 */
export type SuccessCallback = (result: any) => {};
/**
 * failCallback wrapper
 */
export type FailCallback = (result: any) => {};

export class Utils {
  /**
   * Checks if the provided value is `null` or `undefined`.
   * @param value The value to check.
   */
  static isNullOrUndefined(value: unknown): value is null | undefined {
    return value === null || value === undefined;
  }
  /**
     * Overload 1: Check for null | undefined (the most basic empty values)
     */
  static isEmpty(value: null | undefined): value is null | undefined;

  /**
   * Overload 2: Check for empty strings (including whitespace-only strings like "  ", "\t", "\n")
   */
  static isEmpty(value: string | null | undefined): value is null | undefined | "" | " " | "\t" | "\n";

  /**
   * Overload 3: Check for empty arrays (arrays with length 0)
   */
  static isEmpty<T>(value?: T[]): value is [] | undefined;

  /**
   * Overload 4: Check for empty Map
   */
  static isEmpty<K, V>(value: Map<K, V>): value is Map<never, never>;

  /**
   * Overload 5: Check for empty Set
   */
  static isEmpty<T>(value: Set<T>): value is Set<never>;

  /**
   * Overload 6: Check for empty objects (plain objects with no own properties, e.g., {})
   */
  static isEmpty(value: object): value is Record<string, never>;

  /**
   * Overload 7: Handle other unknown types (final match, returns whether empty)
   */
  static isEmpty(value: unknown): boolean;


  /**
   * Implementation logic: Determine if a value is "empty"
   * Definition of empty values:
   * - null/undefined
   * - Empty strings or whitespace-only strings (e.g., "", "  ", "\t", "\n")
   * - Empty arrays ([])
   * - Empty Map/Set
   * - Plain objects with no own properties (e.g., {})
   */
  static isEmpty(value: unknown): boolean {
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
      return Object.keys(value).length === 0;
    }

    // Other types (e.g., number, boolean, function, etc.): Not empty
    return false;
  }

  /**
   * Checks if the provided value is `function`.
   * @param value The value to check.
   */
  static isFunction(value: unknown): value is Function {
    return typeof (value as any) === 'function';
  }

  /**
   * Replaces all occurrences of a pattern in a string with a replacement string.
   * @param str original string
   * @param pattern pattern to search
   * @param replacement replacement string
   * @returns updated string
   */
  static replaceAll(str: string, pattern: string, replacement: string): string {
    if (Utils.isFunction((str as any).replaceAll)) {
      return (str as any).replaceAll(pattern, replacement);
    }
    return str.split(pattern).join(replacement);
  }

  /**
   * Checks if the provided value is `RegExpSpec`
   * @param value The value to check
   * @returns 
   */
  static isRegExpSpec(value: unknown): value is RegExpSpec {
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
  static toRegExpSpec(value: RegExp): RegExpSpec {
    return {
      pattern: value.source,
      flags: value.flags
    };
  }

  /**
   * Generates a UUID using `crypto.randomUUID` if available,
   * otherwise falls back to timestamp-based unique ID.
   */
  static generateUUID(): string {
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
  static deepClone<T>(src: T, includeFunctions = false): T {
    const seen = new WeakMap();

    const clone = (input: unknown): unknown => {
      if (Utils.isNullOrUndefined(input)) return input;

      if (typeof input !== 'object') {
        return includeFunctions || typeof input !== 'function' ? input : undefined;
      }

      if (seen.has(input)) return seen.get(input);

      if (input instanceof Date) return new Date(input.getTime());
      if (input instanceof RegExp) return new RegExp(input);

      const output: unknown = Array.isArray(input) ? [] : {};
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
   * get the item from source object
   * @param key item key
   * @param source source data object
   * @returns item value
   */
  static getItem<T>(key: string, source: Record<string, unknown> | undefined): T | undefined {
    if (Utils.isNullOrUndefined(source)) {
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
  static startsWith(str: string, prefix: string): boolean {
    return str.startsWith(prefix);
  }

  /**
   * fix the rectangle object (fullfill the width, height, right, bottom)
   * @param {Partial<RectInfo>} rect 
   * @returns {RectInfo}
   */
  static fixRectangle(rect: Partial<RectInfo>): RectInfo {
    if (!rect) {
      return rect;
    }
    // x + y = z
    const solveEquation = (x?: number, y?: number, z?: number) => {
      if (Utils.isNullOrUndefined(x) && !Utils.isNullOrUndefined(y) && !Utils.isNullOrUndefined(z)) {
        return [z - y, y, z];
      }
      if (!Utils.isNullOrUndefined(x) && Utils.isNullOrUndefined(y) && !Utils.isNullOrUndefined(z)) {
        return [x, z - x, z];
      }
      if (!Utils.isNullOrUndefined(x) && !Utils.isNullOrUndefined(y) && Utils.isNullOrUndefined(z)) {
        return [x, y, x + y];
      }
      return [x, y, z];
    };
    if (Utils.isNullOrUndefined(rect.left) && !Utils.isNullOrUndefined(rect.x)) {
      rect.left = rect.x;
    }
    if (Utils.isNullOrUndefined(rect.top) && !Utils.isNullOrUndefined(rect.y)) {
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
  static isInternalUrl(url: string): boolean {
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
  static isFileUrl(url: string): boolean {
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
  static isExtensionUrl(url: string): boolean {
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
  static getCombinations<T>(arr: T[], k: number): T[][] {
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
    function backtrack(start: number, current: T[]) {
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

  /**
   * wait 
   * @param ms timeout
   * @returns 
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * wait for the checkFunc to be checked
   * @param checkFunc the check function to validate the requirements
   * @param timeout timeout
   * @param delay delay for each check
   * @returns property value match the expected value
   */
  static async waitChecked(checkFunc: () => Promise<boolean>, timeout: number = 5000, delay: number = 500): Promise<boolean> {
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
        await Utils.wait(delay);
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
  static async rafWaitChecked(checkFunc: () => Promise<boolean>, timeout: number = 5000, delay: number = 100): Promise<boolean> {
    if (typeof requestAnimationFrame !== 'function') {
      throw new Error('requestAnimationFrame is not a valid function');
    }
    const end_time = performance.now() + timeout;
    return new Promise((resolve, _reject) => {
      let lastExecution: number | undefined = undefined;
      const rafFunc = async () => {
        // time out
        if (performance.now() >= end_time) {
          resolve(false);
          return;
        }

        try {
          if (Utils.isNullOrUndefined(lastExecution) || performance.now() - lastExecution >= delay) {
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
        } catch { }
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
  static async waitResult<T>(func: () => Promise<T>, timeout: number = 5000): Promise<T> {
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
  static getTimeStamp(): string {
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

  static fillWithDefaultValues<T extends object>(source: Partial<T>, defaults: T): void {
    for (const key in defaults) {
      if (!defaults.hasOwnProperty(key)) continue;

      if (source[key] === undefined) {
        source[key] = defaults[key];
      }
      else if (typeof defaults[key] === 'object' && defaults[key] !== null &&
        typeof source[key] === 'object' && source[key] !== null) {
        Utils.fillWithDefaultValues(source[key] as Partial<any>, defaults[key]);
      }
    }
  }
}

export class MsgUtils {

  static createMessageData(type: MessageDataType, dest: Rtid, action: Action, target?: AODesc) {
    const msgData: MessageData = { type, dest, action, target };
    return msgData;
  }

  static createEvent(data: MessageData, correlationId?: string): Message {
    return {
      type: 'event',
      uid: Utils.generateUUID(),
      timestamp: Date.now(),
      data: Utils.deepClone(data),
      correlationId: correlationId,
      syncId: undefined,
    };
  }

  static createRequest(data: MessageData, correlationId?: string): Message {
    return {
      type: 'request',
      uid: Utils.generateUUID(),
      timestamp: Date.now(),
      data: Utils.deepClone(data),
      correlationId: correlationId,
      syncId: Utils.generateUUID(),
    };
  }

  static createResponse(data: MessageData, syncId: string, correlationId?: string): Message {
    return {
      type: 'response',
      uid: Utils.generateUUID(),
      timestamp: Date.now(),
      data: Utils.deepClone(data),
      correlationId: correlationId,
      syncId: syncId,
    };
  }

  static cloneMessage(msg: Message): Message | undefined {
    if (msg.type === 'event') {
      return MsgUtils.createEvent(msg.data, msg.correlationId);
    }
    if (msg.type === 'request') {
      return MsgUtils.createRequest(msg.data, msg.correlationId);
    }
    if (msg.type === 'response') {
      return MsgUtils.createResponse(msg.data, msg.syncId!, msg.correlationId);
    }
    return undefined;
  }

  static isMessage(value: unknown): value is Message {
    if (typeof value !== 'object' || Utils.isNullOrUndefined(value)) {
      return false;
    }
    const msg = value as Message;

    const isMessageType = (value: unknown): value is MessageType => {
      return typeof value === 'string' && ['event', 'request', 'response'].includes(value);
    };

    if (!isMessageType(msg.type)) {
      return false;
    }
    if (typeof msg.uid !== 'string' || msg.uid.trim() === '') {
      return false;
    }
    if (typeof msg.timestamp !== 'number' || msg.timestamp < 0) {
      return false;
    }
    if (typeof msg.data !== 'object' || Utils.isNullOrUndefined(msg.data)) {
      return false;
    }

    const data = msg.data as MessageData;
    const isMessageDataType = (value: unknown): value is MessageDataType => {
      return typeof value === 'string' && ['query', 'record', 'command', 'config'].includes(value);
    }
    if (!isMessageDataType(data.type)) {
      return false;
    }
    if (!RtidUtils.isRtid(data.dest)) {
      return false;
    }
    const isActionName = (value: unknown): value is ActionName => {
      return typeof value === 'string' && ['set', 'get', 'query_objects', 'query_object', 'query_property', 'query_properties', 'invoke', 'record_step'].includes(value);
    }
    const isValidAction = (value: unknown): value is Action => {
      if (typeof value !== 'object' || Utils.isNullOrUndefined(value)) {
        return false;
      }
      const action = value as Action;
      if (!isActionName(action.name)) {
        return false;
      }
      return true;
    }
    if (!isValidAction(data.action)) {
      return false;
    }

    return true;
  }

}

export class RtidUtils {

  /**
   * Determines whether an object is an instance of `Rtid` or a compatible shape.
   * @param obj The object to check.
   */
  static isRtid(obj: unknown): obj is Rtid {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as any).browser === 'number' &&
      typeof (obj as any).tab === 'number' &&
      typeof (obj as any).frame === 'number' &&
      typeof (obj as any).object === 'number'
    );
  }

  /**
   * Compares two Rtid objects for structural equality.
   * @param a First Rtid object
   * @param b Second Rtid object
   */
  static isRtidEqual(a: unknown, b: unknown): boolean {
    return (
      RtidUtils.isRtid(a) &&
      RtidUtils.isRtid(b) &&
      a.object === b.object &&
      a.frame === b.frame &&
      a.tab === b.tab &&
      (a.tab === -1 ? a.window === b.window : true) && // compare window only if both tb === -1
      a.browser === b.browser &&
      a.context === b.context &&
      a.external === b.external
    );
  }

  static getAgentRtid(): Rtid {
    return {
      context: 'background',
      browser: -1,
      window: -1,
      tab: -1,
      frame: -1,
      object: -1
    } as Rtid;
  }

  static getBrowserRtid(browserId: number = 0): Rtid {
    return {
      context: 'background',
      browser: browserId,
      window: -1,
      tab: -1,
      frame: -1,
      object: -1
    } as Rtid;
  }

  static getWindowRtid(windowId: number, browserId: number = 0): Rtid {
    return {
      context: 'background',
      browser: browserId,
      window: windowId,
      tab: -1,
      frame: -1,
      object: -1
    } as Rtid;
  }

  static getTabRtid(tabId: number, windowId: number = -1, browserId: number = 0): Rtid {
    return {
      context: 'background',
      browser: browserId,
      window: windowId,
      tab: tabId,
      frame: -1,
      object: -1
    } as Rtid;
  }

  static getFrameRtid(frameId: number, tabId: number, windowId: number = -1, browserId: number = 0): Rtid {
    return {
      context: 'content',
      browser: browserId,
      window: windowId,
      tab: tabId,
      frame: frameId,
      object: -1
    } as Rtid;
  }

  static getObjectRtid(objectId: number, frameId: number, tabId: number, windowId: number = -1, browserId: number = 0): Rtid {
    return {
      context: 'content',
      browser: browserId,
      window: windowId,
      tab: tabId,
      frame: frameId,
      object: objectId
    } as Rtid;
  }

  static getRtidContextType(rtid: Rtid): ContextType | null {

    // message to the specified context
    if (!Utils.isEmpty(rtid.context)) {
      return rtid.context;
    }

    // message to another browser by native application forwarding
    // todo: currently we do not support multiple browsers
    if (rtid.browser > 0) {
      return 'external';
    }

    // agent rtid 
    if (rtid.browser === -1 && rtid.tab === -1 && rtid.frame === -1) {
      return 'background';
    }

    // current browser rtid 
    if (rtid.browser === 0 && rtid.tab === -1 && rtid.frame === -1) {
      return 'background';
    }

    // tab rtid 
    if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame === -1) {
      return 'background';
    }

    // frame rtid 
    if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame >= 0 && rtid.object === -1) {
      return 'content';
    }

    // frame rtid in MAIN WORLD
    if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame >= 0 && rtid.object === 0) {
      return 'MAIN';
    }

    // object rtid
    if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame >= 0 && rtid.object > 0) {
      return 'content';
    }

    return null;
  }
}

export class BrowserUtils {
  /** the device scale factor is decided by --force-device-scale-factor or same as the desktop scale */
  static deviceScaleFactor: number | undefined = undefined;
  /**
   * Detects the current browser name and version
   * Compatible with Chrome, Edge, Firefox, and Safari
   * @returns BrowserInfo object containing name, version, and major version
   */
  static getBrowserInfo(): BrowserInfo {
    const result: BrowserInfo = {
      name: 'unknown',
      version: 'unknown',
      majorVersion: 0
    };

    const userAgent = navigator.userAgent.toLowerCase();
    const vendor = navigator.vendor?.toLowerCase() || '';

    // Helper to extract major version from a version string
    const getMajorVersion = (versionStr: string): number => {
      if (!versionStr || versionStr === 'unknown') return 0;
      const majorStr = versionStr.split('.')[0];
      return parseInt(majorStr, 10) || 0;
    };

    // 1. Detect Firefox (fixed regex for full version)
    if (userAgent.includes('firefox')) {
      result.name = 'firefox';
      // Regex: Capture "129", "129.0", or "129.0.1" (no mandatory dot)
      const match = userAgent.match(/firefox\/(\d+(?:\.\d+)*)/);
      if (match?.[1]) {
        result.version = match[1];
        result.majorVersion = getMajorVersion(result.version);
      }
      return result;
    }

    // 2. Detect Edge (simplified regex + unified version capture)
    if (userAgent.includes('edg') || userAgent.includes('edge')) {
      result.name = 'edge';
      // New Edge: Matches "edg/128.0.2739.50" (no space check)
      const newEdgeMatch = userAgent.match(/edg\/(\d+(?:\.\d+)*)/);
      // Legacy Edge: Matches "edge/13.10586"
      const legacyEdgeMatch = userAgent.match(/edge\/(\d+(?:\.\d+)*)/);
      // Use new Edge first, fall back to legacy
      const match = newEdgeMatch || legacyEdgeMatch;

      if (match?.[1]) {
        result.version = match[1]; // Unified capture group (group 1 for both)
        result.majorVersion = getMajorVersion(result.version);
      }
      return result;
    }

    // 3. Detect Safari (fixed regex for full version)
    if (vendor.includes('apple') && userAgent.includes('safari') && !userAgent.includes('chrome')) {
      result.name = 'safari';
      // Regex: Capture "17", "17.6", or "17.6.1"
      const match = userAgent.match(/version\/(\d+(?:\.\d+)*)/);
      if (match?.[1]) {
        result.version = match[1];
        result.majorVersion = getMajorVersion(result.version);
      }
      return result;
    }

    // 4. Detect Chrome (fixed regex for full version)
    if (userAgent.includes('chrome') && vendor.includes('google')) {
      result.name = 'chrome';
      // Regex: Capture "128", "128.0", or "128.0.0.0"
      const match = userAgent.match(/chrome\/(\d+(?:\.\d+)*)/);
      if (match?.[1]) {
        result.version = match[1];
        result.majorVersion = getMajorVersion(result.version);
      }
      return result;
    }

    // Extract major version (robust to edge cases)
    if (result.version !== 'unknown') {
      result.majorVersion = getMajorVersion(result.version);
    }

    return result;
  }

  static isWindows(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    // Common Windows identifiers in userAgent or platform
    return (
      userAgent.includes('windows') ||
      platform.includes('win32') ||
      platform.includes('win64')
    );
  }

  // Check if the platform is macOS
  static isMacOS(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    // Common macOS identifiers in userAgent or platform
    return (
      userAgent.includes('macintosh') ||
      userAgent.includes('mac os x') ||
      platform.includes('mac')
    );
  }
}