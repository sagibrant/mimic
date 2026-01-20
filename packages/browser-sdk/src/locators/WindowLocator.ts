/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file WindowLocator.ts
 * @description 
 * Class for WindowLocator
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
import { Window } from "../aos/Window";
import { Locator } from "./Locator";
import { PageLocator } from "./PageLocator";
import { Browser } from "../aos/Browser";

export class WindowLocator extends Locator<Window> implements api.WindowLocator {

  /** ==================================================================================================================== */
  /** ================================================= locator methods ================================================== */
  /** ==================================================================================================================== */

  protected override async locateObjects(): Promise<Window[]> {
    let rtid: Rtid | undefined = undefined;
    if (this.parent) {
      const browser = await this.parent.get();
      if (browser instanceof Browser) {
        rtid = browser.rtid();
      }
    }
    if (Utils.isNullOrUndefined(rtid)) {
      rtid = RtidUtils.getBrowserRtid();
    }

    const queryInfo = super.createQueryInfo();
    const options = this.primary ? this.primary as api.WindowLocatorOptions : undefined;
    if (queryInfo && options?.lastFocused) {
      queryInfo.primary = [];
      queryInfo.primary.push({ name: 'lastFocused', value: true, type: 'property', match: 'exact' });
    }

    const aos = await this.queryObjects(rtid, {
      type: 'window',
      queryInfo: queryInfo
    });

    const results: Window[] = [];
    for (const ao of aos) {
      const window = this.repo.getWindow(ao.rtid);
      results.push(window);
    }
    return results;
  }

  page(selector?: api.PageLocatorOptions): api.PageLocator {
    const pageLocator = new PageLocator(this, selector);
    return pageLocator;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  async browser(): Promise<api.Browser> {
    const window = await this.get();
    return await window.browser();
  }

  async pages(): Promise<api.Page[]> {
    const window = await this.get();
    return await window.pages();
  }

  async activePage(): Promise<api.Page> {
    const window = await this.get();
    return await window.activePage();
  }

  async state(): Promise<'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen'> {
    const window = await this.get();
    return await window.state();
  }

  async focused(): Promise<boolean> {
    const window = await this.get();
    return await window.focused();
  }

  async incognito(): Promise<boolean> {
    const window = await this.get();
    return await window.incognito();
  }

  async closed(): Promise<boolean> {
    const window = await this.get();
    return await window.closed();
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async openNewPage(url?: string): Promise<api.Page> {
    const window = await this.get();
    return await window.openNewPage(url);
  }

  async focus(): Promise<void> {
    const window = await this.get();
    return await window.focus();
  }

  async close(): Promise<void> {
    const window = await this.get();
    return await window.close();
  }

  async minimize(): Promise<void> {
    const window = await this.get();
    return await window.minimize();
  }

  async maximize(): Promise<void> {
    const window = await this.get();
    return await window.maximize();
  }

  async restore(): Promise<void> {
    const window = await this.get();
    return await window.restore();
  }

  async fullscreen(toggle: boolean = true): Promise<void> {
    const window = await this.get();
    return await window.fullscreen(toggle);
  }
  on(event: string, listener: ((page: api.Page) => (unknown | Promise<unknown>)) | ((window: api.Window) => (unknown | Promise<unknown>))): this {
    this.get().then((window) => {
      if (event === 'page') {
        window.on(event, listener as ((page: api.Page) => (unknown | Promise<unknown>)));
      } else if (event === 'close') {
        window.on(event, listener as ((window: api.Window) => (unknown | Promise<unknown>)));
      }
    }).catch(error => {
      this.logger.error(error);
    });
    return this;
  }
}