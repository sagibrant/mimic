/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Window.ts
 * @description 
 * Class for Window automation
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
import { Rtid, RtidUtils, Utils } from "@mimic-sdk/core";
import { WindowLocator } from "../locators/WindowLocator";
import { PageLocator } from "../locators/PageLocator";
import { AutomationObject } from "./AutomationObject";

interface TabInfo extends Record<string, unknown> {
  id?: number;
}

export class Window extends AutomationObject implements api.Window {
  private readonly _browser: api.Browser;

  constructor(rtid: Rtid) {
    super(rtid);
    const browserRtid = RtidUtils.getBrowserRtid(rtid.browser);
    this._browser = this.repo.getBrowser(browserRtid);
  }

  /** ==================================================================================================================== */
  /** ===================================================== locator ====================================================== */
  /** ==================================================================================================================== */

  page(selector?: api.PageLocatorOptions): api.PageLocator {
    const windowLocator = new WindowLocator();
    windowLocator.resolve([this]);
    const pageLocator = new PageLocator(windowLocator, selector);
    return pageLocator;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  rtid(): Rtid {
    return this._rtid;
  }

  async browser(): Promise<api.Browser> {
    return this._browser;
  }

  async pages(): Promise<api.Page[]> {
    const locators = await this.page().all();
    const pages = [];
    for (const locator of locators) {
      const page = await locator.get();
      pages.push(page);
    }
    return pages;
  }

  async activePage(): Promise<api.Page> {
    const page = await this.page({ active: true }).get();
    return page;
  }

  async state(): Promise<'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen'> {
    const propValue = await this.queryProperty(this._rtid, 'state');
    return propValue as 'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen';
  }

  async focused(): Promise<boolean> {
    const propValue = await this.queryProperty(this._rtid, 'focused');
    return propValue as boolean;
  }

  async incognito(): Promise<boolean> {
    const propValue = await this.queryProperty(this._rtid, 'incognito');
    return propValue as boolean;
  }

  async closed(): Promise<boolean> {
    const browserRtid = RtidUtils.getBrowserRtid(this._rtid.browser);
    const isClosed = await this.invokeFunction(browserRtid, 'isWindowClosed', [this._rtid.window]) as boolean;
    return isClosed;
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async openNewPage(url?: string): Promise<api.Page> {
    const tabInfo = await this.invokeFunction(this._rtid, 'openNewTab', [url]) as TabInfo;
    if (tabInfo && !Utils.isNullOrUndefined(tabInfo.id) && typeof tabInfo.id === 'number') {
      const tabId = tabInfo.id;
      const tabRtid = RtidUtils.getTabRtid(tabId, -1, this._rtid.browser);
      const page = this.repo.getPage(tabRtid);
      return page;
    }
    else {
      throw new Error('Failed on openNewPage.');
    }
  }

  async focus(): Promise<void> {
    await this.invokeFunction(this._rtid, 'focus', []);
  }

  async close(): Promise<void> {
    await this.invokeFunction(this._rtid, 'close', []);
    await Utils.wait(200);
  }

  async minimize(): Promise<void> {
    await this.invokeFunction(this._rtid, 'minimize', []);
  }

  async maximize(): Promise<void> {
    await this.invokeFunction(this._rtid, 'maximize', []);
  }

  async restore(): Promise<void> {
    await this.invokeFunction(this._rtid, 'restore', []);
  }

  async fullscreen(toggle: boolean = true): Promise<void> {
    await this.invokeFunction(this._rtid, 'fullscreen', [toggle]);
  }

  /** ==================================================================================================================== */
  /** ====================================================== events ====================================================== */
  /** ==================================================================================================================== */
  on(event: 'page', listener: (page: api.Page) => (unknown | Promise<unknown>)): this;
  on(event: 'close', listener: (window: api.Window) => (unknown | Promise<unknown>)): this;
  on(event: 'page' | 'close', listener: ((page: api.Page) => (unknown | Promise<unknown>)) | ((window: api.Window) => (unknown | Promise<unknown>))): this {
    return super.on(event, listener as (arg: unknown) => (unknown | Promise<unknown>));
  }
  emit(event: 'page' | 'close', data?: unknown): void {
    if (event === 'page') {
      const tabInfo = data as TabInfo;
      if (!Utils.isNullOrUndefined(tabInfo?.id) && typeof tabInfo.id === 'number') {
        const tabId = tabInfo.id;
        const tabRtid = RtidUtils.getTabRtid(tabId, -1, this._rtid.browser);
        const page = this.repo.getPage(tabRtid);
        super.emit('page', page);
      }
    }
    else if (event === 'close') {
      super.emit('close', this);
    }
  }
}
