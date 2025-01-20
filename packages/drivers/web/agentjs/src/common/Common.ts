/**
 * Common.ts
 * Shared utility classes and functions
 * Author: Zhang Jie
 */

/**
 * context type
 *   MAIN : The web page execution environment (MAIN WORLD)
 *   content : the content context
 *   background : the background context
 *   extension : the external extension
 *   native : the native application
 *   server : the remote server
 */
export type ContextType = 'MAIN' | 'content' | 'background' | 'extension' | 'native' | 'server';
/**
 * the runtime id for a specified runtime object
 */
export class Rtid {
  /**
   * the context type
   */
  context?: ContextType = undefined;
  /**
   * the external id used for connection. e.g. external extension id, native app name, server ip
   */
  external?: string = undefined;
  /**
   * the browser id, -1 means the current browser, or equals to app id in cross app automation environments, 
   */
  browser: number = -1;
  /**
   * the page id,  
   * 0 means the last focused tab, or equals to the tab.id (starts from 1 in extension), 
   */
  page: number = -1;
  /**
   * the frame id, 0 means the top frame, or equals to the frameId in port.sender:MessageSender (starts from 0 in extension)
   */
  frame: number = -1;
  /**
   * the object id
   */
  object: number = -1;

  /**
   * Determines whether an object is an instance of `Rtid` or a compatible shape.
   * @param obj The object to check.
   */
  static isRtid(obj: unknown): obj is Rtid {
    if (obj instanceof Rtid) return true;

    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as any).browser === 'number' &&
      typeof (obj as any).page === 'number' &&
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
      Rtid.isRtid(a) &&
      Rtid.isRtid(b) &&
      a.browser === b.browser &&
      a.page === b.page &&
      a.frame === b.frame &&
      a.object === b.object
    );
  }

  static getAgentRtid(): Rtid {
    let rtid = new Rtid();
    rtid.context = 'background';
    rtid.browser = -1;
    rtid.page = -1;
    rtid.frame = -1;
    rtid.object = -1;

    return rtid;
  }
};

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
export class NameValuePair<T = unknown> {
  constructor(
    _name: string | null = null,
    _value: T | null = null
  ) { }
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
  static isEmpty<T>(value: T[]): value is [];

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
   * Get the last chromium api error
   * @returns last chrome api error
   */
  static getLastError(): chrome.runtime.LastError | chrome.extension.LastError | undefined {
    if (typeof (chrome) === "undefined")
      return undefined;

    if (chrome && chrome.runtime && chrome.runtime.lastError)
      return chrome.runtime.lastError;

    if (chrome && chrome.extension && chrome.extension.lastError)
      return chrome.extension.lastError;

    return undefined;
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
   * Checks if the given string starts with the specified substring.
   * @param str The full string.
   * @param prefix The prefix to test.
   */
  static startsWith(str: string, prefix: string): boolean {
    return str.startsWith(prefix);
  }

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

    // 1. Detect Firefox first
    // Example UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0"
    if (userAgent.includes('firefox')) {
      result.name = 'firefox';
      const match = userAgent.match(/firefox\/(\d+\.\d+)/); // Extracts "129.0"
      if (match?.[1]) {
        result.version = match[1];
      }
      return result;
    }

    // 2. Detect Edge next
    // New Edge example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.2739.50"
    // Legacy Edge example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586"
    if (userAgent.includes('edg') || userAgent.includes('edge')) {
      result.name = 'edge';
      // Matches "Edg/128.0.2739.50" or "edge/13.10586"
      const match = userAgent.match(/edg(\/| )(\d+\.\d+)/) ||
        userAgent.match(/edge\/(\d+\.\d+)/);
      if (match?.[2]) {
        result.version = match[2]; // For new Edge: "128.0.2739.50"
      } else if (match?.[1]) {
        result.version = match[1]; // For legacy Edge: "13.10586"
      }
      return result;
    }

    // 3. Detect Safari
    // Example UA: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15"
    if (vendor.includes('apple') && userAgent.includes('safari') && !userAgent.includes('chrome')) {
      result.name = 'safari';
      const match = userAgent.match(/version\/(\d+\.\d+)/); // Extracts "17.6"
      if (match?.[1]) {
        result.version = match[1];
      }
      return result;
    }

    // 4. Finally detect Chrome
    // Example UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    if (userAgent.includes('chrome') && vendor.includes('google')) {
      result.name = 'chrome';
      const match = userAgent.match(/chrome\/(\d+\.\d+)/); // Extracts "128.0.0.0"
      if (match?.[1]) {
        result.version = match[1];
      }
      return result;
    }

    // Extract major version
    if (result.version !== 'unknown') {
      result.majorVersion = parseInt(result.version.split('.')[0], 10) || 0;
    }

    return result;
  }
}
