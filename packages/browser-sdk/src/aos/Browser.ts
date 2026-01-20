/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Browser.ts
 * @description 
 * Class for Browser automation
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
import { BrowserUtils, Rtid, RtidUtils, Utils } from "@mimic-sdk/core";
import { TabInfo } from "./Page";
import { WindowLocator } from "../locators/WindowLocator";
import { PageLocator } from "../locators/PageLocator";
import { BrowserLocator } from "../locators/BrowserLocator";
import { AutomationObject } from "./AutomationObject";

interface WindowInfo extends Record<string, unknown> {
  id?: number;
  // [key: string]: unknown;
}

export class Browser extends AutomationObject implements api.Browser {

  /** ==================================================================================================================== */
  /** ===================================================== locator ====================================================== */
  /** ==================================================================================================================== */

  window(selector?: api.WindowLocatorOptions): api.WindowLocator {
    const browserLocator = new BrowserLocator();
    browserLocator.resolve([this]);
    const winLocator = new WindowLocator(browserLocator, selector);
    return winLocator;
  }

  page(selector?: api.PageLocatorOptions): api.PageLocator {
    const browserLocator = new BrowserLocator();
    browserLocator.resolve([this]);
    const pageLocator = new PageLocator(browserLocator, selector);
    return pageLocator;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  rtid(): Rtid {
    return this._rtid;
  }

  async windows(): Promise<api.Window[]> {
    const winLocator = this.window();
    const locators = await winLocator.all();
    const windows = [];
    for (const locator of locators) {
      const win = await locator.get();
      windows.push(win);
    }
    return windows;
  }

  async pages(): Promise<api.Page[]> {
    const pageLocator = this.page();
    const locators = await pageLocator.all();
    const pages = [];
    for (const locator of locators) {
      const page = await locator.get();
      pages.push(page);
    }
    return pages;
  }

  async lastFocusedWindow(): Promise<api.Window> {
    const winLocator = this.window({ lastFocused: true });
    const window = await winLocator.get();
    return window;
  }

  async lastActivePage(): Promise<api.Page> {
    const pageLocator = this.page({ active: true, lastFocusedWindow: true });
    const page = await pageLocator.get();
    return page;
  }

  name(): string {
    const info = BrowserUtils.getBrowserInfo();
    return info.name;
  }

  version(): string {
    const info = BrowserUtils.getBrowserInfo();
    return info.version;
  }

  majorVersion(): number {
    const info = BrowserUtils.getBrowserInfo();
    return info.majorVersion;
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async attachDebugger(): Promise<void> {
    await this.invokeFunction(this._rtid, 'attachDebugger', []);
  }

  async detachDebugger(): Promise<void> {
    await this.invokeFunction(this._rtid, 'detachDebugger', []);
  }

  async setDefaultTimeout(timeout: number): Promise<void> {
    super.setDefaultTimeout(timeout);
  }

  async cookies(urls?: string | string[]): Promise<api.Cookie[]> {
    if (Utils.isNullOrUndefined(urls)) {
      urls = [];
    }
    else if (typeof urls === 'string') {
      urls = [urls];
    }
    const result = await this.invokeFunction(this._rtid, 'cookies', [urls]) as api.Cookie[];
    return result;
  }

  async addCookies(cookies: (api.Cookie & { url?: string }) | (api.Cookie & { url?: string })[]): Promise<void> {
    if (Utils.isNullOrUndefined(cookies) || (Array.isArray(cookies) && cookies.length === 0)) {
      return;
    }
    else if (!Array.isArray(cookies) && typeof cookies === 'object') {
      cookies = [cookies];
    }
    await this.invokeFunction(this._rtid, 'addCookies', [cookies]);
  }

  async clearCookies(options?: { name?: string | RegExp, domain?: string | RegExp, path?: string | RegExp }): Promise<void> {
    const getValueWrapper = (value: string | RegExp | undefined): string | RegExp | undefined | api.RegExpSpec => {
      if (value instanceof RegExp) {
        return Utils.toRegExpSpec(value);
      }
      return value;
    };
    const opt = {
      name: getValueWrapper(options?.name),
      domain: getValueWrapper(options?.domain),
      path: getValueWrapper(options?.path),
    };
    await this.invokeFunction(this._rtid, 'clearCookies', [opt]);
  }

  async openNewWindow(url?: string): Promise<api.Window> {
    const windowInfo = await this.invokeFunction(this._rtid, 'openNewWindow', [url]) as WindowInfo;
    if (windowInfo && !Utils.isNullOrUndefined(windowInfo.id) && typeof windowInfo.id === 'number') {
      const windowId = windowInfo.id;
      const windowRtid = RtidUtils.getWindowRtid(windowId, this._rtid.browser);
      const window = this.repo.getWindow(windowRtid);
      return window;
    }
    else {
      throw new Error('Failed on open new window.');
    }
  }

  async openNewPage(url?: string): Promise<api.Page> {
    const lastFocusedWindow = await this.lastFocusedWindow();
    return await lastFocusedWindow.openNewPage(url);
  }

  async close(): Promise<void> {
    await this.invokeFunction(this._rtid, 'close', []);
  }

  /** ==================================================================================================================== */
  /** ====================================================== events ====================================================== */
  /** ==================================================================================================================== */
  on(event: 'window', listener: (window: api.Window) => (unknown | Promise<unknown>)): this;
  on(event: 'page', listener: (page: api.Page) => (unknown | Promise<unknown>)): this;
  on(event: 'window' | 'page', listener: ((window: api.Window) => (unknown | Promise<unknown>)) | ((page: api.Page) => (unknown | Promise<unknown>))): this {
    return super.on(event, listener as (arg: unknown) => (unknown | Promise<unknown>));
  }
  emit(event: 'window' | 'page', data?: unknown): void {
    if (event === 'window') {
      const windowInfo = data as WindowInfo;
      if (!Utils.isNullOrUndefined(windowInfo?.id) && typeof windowInfo.id === 'number') {
        const windowId = windowInfo.id;
        const windowRtid = RtidUtils.getWindowRtid(windowId, this._rtid.browser);
        const window = this.repo.getWindow(windowRtid);
        super.emit('window', window);
      }
    }
    else if (event === 'page') {
      const tabInfo = data as TabInfo;
      if (!Utils.isNullOrUndefined(tabInfo?.id) && typeof tabInfo.id === 'number') {
        const tabId = tabInfo.id;
        const tabRtid = RtidUtils.getTabRtid(tabId, -1, this._rtid.browser);
        const page = this.repo.getPage(tabRtid);
        super.emit('page', page);
      }
    }
  }
}
