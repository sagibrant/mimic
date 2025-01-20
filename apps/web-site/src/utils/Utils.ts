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

/**
 * Checks if the provided value is `null` or `undefined`.
 * @param value The value to check.
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
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

