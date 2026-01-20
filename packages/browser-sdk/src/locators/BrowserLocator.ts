/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file BrowserLocator.ts
 * @description 
 * Class for BrowserLocator
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
import { BrowserUtils, RtidUtils } from "@mimic-sdk/core";
import { Browser } from "../aos/Browser";
import { Locator } from "./Locator";
import { WindowLocator } from "./WindowLocator";
import { PageLocator } from "./PageLocator";

export class BrowserLocator extends Locator<Browser> implements api.BrowserLocator {

  constructor(options?: api.BrowserLocatorOptions) {
    super(undefined, options);
  }

  /** ==================================================================================================================== */
  /** ================================================= locator methods ================================================== */
  /** ==================================================================================================================== */
  protected override async locateObjects(): Promise<Browser[]> {
    // TODO: support external browsers if external extension or native app connected
    const browser = this.repo.getBrowser(RtidUtils.getBrowserRtid());
    return [browser];
  }
  window(selector?: api.WindowLocatorOptions): api.WindowLocator {
    const winLocator = new WindowLocator(this, selector);
    return winLocator;
  }
  page(selector?: api.PageLocatorOptions): api.PageLocator {
    const winLocator = this.window({ lastFocused: true });
    const pageLocator = new PageLocator(winLocator, selector);
    return pageLocator;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  async windows(): Promise<api.Window[]> {
    const browser = await this.get();
    return await browser.windows();
  }

  async pages(): Promise<api.Page[]> {
    const browser = await this.get();
    return await browser.pages();
  }

  async lastFocusedWindow(): Promise<api.Window> {
    const browser = await this.get();
    return await browser.lastFocusedWindow();
  }

  async lastActivePage(): Promise<api.Page> {
    const browser = await this.get();
    return await browser.lastActivePage();
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
    const browser = await this.get();
    return await browser.attachDebugger();
  }

  async detachDebugger(): Promise<void> {
    const browser = await this.get();
    return await browser.detachDebugger();
  }

  async setDefaultTimeout(timeout: number): Promise<void> {
    const browser = await this.get();
    return await browser.setDefaultTimeout(timeout);
  }

  async cookies(urls?: string | string[]): Promise<api.Cookie[]> {
    const browser = await this.get();
    return await browser.cookies(urls);
  }

  async addCookies(cookies: (api.Cookie & { url?: string }) | (api.Cookie & { url?: string })[]): Promise<void> {
    const browser = await this.get();
    return await browser.addCookies(cookies);
  }

  async clearCookies(options?: { name?: string | RegExp, domain?: string | RegExp, path?: string | RegExp }): Promise<void> {
    const browser = await this.get();
    return await browser.clearCookies(options);
  }

  async openNewWindow(url?: string): Promise<api.Window> {
    const browser = await this.get();
    return await browser.openNewWindow(url);
  }

  async openNewPage(url?: string): Promise<api.Page> {
    const browser = await this.get();
    return await browser.openNewPage(url);
  }

  async close(): Promise<void> {
    const browser = await this.get();
    return await browser.close();
  }

  on(event: 'window', listener: (window: api.Window) => (unknown | Promise<unknown>)): this;
  on(event: 'page', listener: (page: api.Page) => (unknown | Promise<unknown>)): this;
  on(event: 'window' | 'page', listener: ((window: api.Window) => (unknown | Promise<unknown>)) | ((page: api.Page) => (unknown | Promise<unknown>))): this {
    this.get().then((browser) => {
      if (event === 'window') {
        browser.on(event, listener as ((window: api.Window) => (unknown | Promise<unknown>)));
      } else if (event === 'page') {
        browser.on(event, listener as ((page: api.Page) => (unknown | Promise<unknown>)));
      }
    }).catch(error => {
      this.logger.error(error);
    });
    return this;
  }
}
