/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ChromeExtensionAPI.ts
 * @description 
 * Provide Chrome Extension APIs
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

import { ChromeCookiesAPI } from "./ChromeCookiesAPI";
import { ChromeDevToolsProtocol } from "./ChromeDevToolsProtocol";
import { ChromeScriptingAPI } from "./ChromeScriptingAPI";
import { ChromeTabAPI } from "./ChromeTabAPI";
import { ChromeWebNavigationAPI } from "./ChromeWebNavigationAPI";
import { ChromeWindowAPI } from "./ChromeWindowAPI";

export class ChromeExtensionAPI {

  readonly windowAPI: ChromeWindowAPI;
  readonly tabAPI: ChromeTabAPI;
  readonly cdpAPI: ChromeDevToolsProtocol;
  readonly webNavigationAPI: ChromeWebNavigationAPI;
  readonly scriptingAPI: ChromeScriptingAPI;
  readonly cookiesAPI: ChromeCookiesAPI;

  constructor() {
    this.windowAPI = new ChromeWindowAPI();
    this.tabAPI = new ChromeTabAPI();
    this.webNavigationAPI = new ChromeWebNavigationAPI();
    this.cdpAPI = new ChromeDevToolsProtocol();
    this.scriptingAPI = new ChromeScriptingAPI();
    this.cookiesAPI = new ChromeCookiesAPI();
  }
  /**
   * Get the last chrome api error
   * @returns last chrome api error
   */
  static getLastError(): chrome.runtime.LastError | undefined {
    if (typeof (chrome) === "undefined")
      return undefined;

    if (chrome && chrome.runtime && chrome.runtime.lastError)
      return chrome.runtime.lastError;

    if (chrome && chrome.extension && chrome.extension.lastError)
      return chrome.extension.lastError;

    return undefined;
  }
}