/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ChromeScriptingAPI.ts
 * @description 
 * Provide Chrome Scripting APIs
 * We wrapper the known apis again so that old version apis can be used with promise
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

import { Utils, Logger } from "@mimic-sdk/core";

/**
 * The chrome script api wrapper on chrome based browsers
 */
export class ChromeScriptingAPI {
  private _logger: Logger;

  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "ChromeScriptingAPI" : this.constructor?.name;
    this._logger = new Logger(prefix);
  }

  async executeScript(tabId: number, frameId: number, script: string, nonceValue?: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this._logger.debug('executeScript: ', tabId, frameId, script, nonceValue);
      chrome.scripting.executeScript({
        target: {
          tabId: tabId,
          frameIds: [frameId]
        },
        world: 'MAIN',
        func: async (script: string, nonceValue?: string) => {
          // require 'unsafe inline'
          // var func = new Function(script);
          // func();
          // check if we can get nonce value from the meta fields

          let result = undefined;

          const evalFunc = async () => {
            try {
              result = await eval(script);
              return true;
            } catch {
              return false;
            }
          };

          const newFunc = async () => {
            try {
              const func = new Function(
                'fetch', 'console',
                `return ${script}`
              );
              // Inject whitelisted globals as arguments
              result = await func(fetch, console);
              return true;
            } catch {
              return false;
            }
          };

          const inlineFunc = async () => {
            try {
              const wrapperScript = `
                try {
                  window.mimic_result = ${script};
                } catch { }
              `;
              const node = document.getElementsByTagName("head")[0] || document.documentElement;
              const scriptNode = document.createElement("script");
              scriptNode.type = "text/javascript";
              if (nonceValue && nonceValue.length > 0) {
                scriptNode.setAttribute('nonce', nonceValue);
              }
              const textNode = document.createTextNode(wrapperScript);
              scriptNode.appendChild(textNode);
              node.appendChild(scriptNode);
              node.removeChild(scriptNode);
              if ('mimic_result' in window) {
                result = await window.mimic_result;
                delete window.mimic_result;
              }
              return true;
            } catch {
              return false;
            }
          };

          let handled = await evalFunc();
          if (handled) {
            return result;
          }
          handled = await newFunc();
          if (handled) {
            return result;
          }
          handled = await inlineFunc();
          if (handled) {
            return result;
          }
          return result;
        },
        args: [script, nonceValue ?? '']
      }, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`scripting.executeScript failed: ${error.message}`));
        }
        else {
          if (result.length > 0) {
            resolve(result[0].result);
          }
          else {
            resolve(undefined);
          }
        }
      });
    });
  }

  async executeFunction<Args extends any[], Result>(tabId: number, frameId: number, func: (...args: Args) => Result, args: Args): Promise<Result> {
    return new Promise((resolve, reject) => {
      this._logger.debug('executeFunction: ', tabId, frameId);
      chrome.scripting.executeScript({
        target: {
          tabId: tabId,
          frameIds: [frameId]
        },
        world: 'MAIN',
        func: func,
        args: args
      }, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`scripting.executeScript executeFunction failed: ${error.message}`));
        }
        else {
          if (result.length > 0) {
            resolve(result[0].result as Result);
          }
          else {
            resolve(undefined as Result);
          }
        }
      });
    });
  }

}