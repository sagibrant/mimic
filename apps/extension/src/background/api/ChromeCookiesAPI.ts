/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ChromeCookiesAPI.ts
 * @description 
 * Provide Chrome cookies APIs
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

/**
 * The browser cookies api wrapper on chrome based browsers
 */
export class ChromeCookiesAPI {

  constructor() {
  }

  async get(details: chrome.cookies.CookieDetails): Promise<chrome.cookies.Cookie | null> {
    return new Promise((resolve, reject) => {
      chrome.cookies.get(details, (result: chrome.cookies.Cookie | null) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`cookies.get failed: ${error.message}`));
        }
        else {
          resolve(result);
        }
      });
    });
  }

  async getAll(details: chrome.cookies.GetAllDetails): Promise<chrome.cookies.Cookie[]> {
    return new Promise((resolve, reject) => {
      chrome.cookies.getAll(details, (result: chrome.cookies.Cookie[]) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`cookies.getAll failed: ${error.message}`));
        }
        else {
          resolve(result);
        }
      });
    });
  }

  async getAllCookieStores(): Promise<chrome.cookies.CookieStore[]> {
    return new Promise((resolve, reject) => {
      chrome.cookies.getAllCookieStores((result: chrome.cookies.CookieStore[]) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`cookies.getAllCookieStores failed: ${error.message}`));
        }
        else {
          resolve(result);
        }
      });
    });
  }

  async remove(details: chrome.cookies.CookieDetails): Promise<chrome.cookies.CookieDetails> {
    return new Promise((resolve, reject) => {
      chrome.cookies.remove(details, (result: chrome.cookies.CookieDetails) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`cookies.remove failed: ${error.message}`));
        }
        else {
          resolve(result);
        }
      });
    });
  }

  async set(details: chrome.cookies.SetDetails): Promise<chrome.cookies.Cookie | null> {
    return new Promise((resolve, reject) => {
      chrome.cookies.set(details, (result: chrome.cookies.Cookie | null) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`cookies.set failed: ${error.message}`));
        }
        else {
          resolve(result);
        }
      });
    });
  }
}