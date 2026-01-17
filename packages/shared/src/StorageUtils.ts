/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Storage.ts
 * @description 
 * Shared utility classes for storage
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

// Declare chrome in a way that avoids TypeScript errors without adding dependencies
declare global {
  // eslint-disable-next-line no-var
  var chrome: {
    storage?: {
      local?: {
        get: (keys: string[]) => Promise<Record<string, unknown>>;
        set: (items: Record<string, unknown>) => Promise<void>;
      };
      onChanged?: {
        addListener: (callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => void) => void;
      };
    };
  };
}

export async function get(key: string): Promise<string | null> {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    const result = await chrome.storage.local.get([key]);
    if (key in result && typeof result[key] === 'string') {
      return result[key] as string
    }
  }
  else if (typeof localStorage !== 'undefined') {
    const result = localStorage.getItem(key);
    return result;
  }
  // todo: add node env support
  return null;
}

export async function set(key: string, value: string): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    const obj: Record<string, string> = {};
    obj[key] = value;
    await chrome.storage.local.set(obj);
  }
  else if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  }
  // todo: add node env support
}

export function AddOnChangedListener(listener: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => void): void {
  if (typeof chrome !== 'undefined' && chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener(listener);
  }
}
