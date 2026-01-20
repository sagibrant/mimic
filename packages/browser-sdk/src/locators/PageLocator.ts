/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file PageLocator.ts
 * @description 
 * Class for PageLocator
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
import { Locator } from "./Locator";
import { Page } from "../aos/Page";
import { Window } from "../aos/Window";
import { Browser } from "../aos/Browser";
import { FrameLocator } from "./FrameLocator";
import { ElementLocator } from "./ElementLocator";
import { TextLocator } from "./TextLocator";
import { Mouse } from "../aos/Mouse";
import { Keyboard } from "../aos/Keyboard";
import { Dialog } from "../aos/Dialog";

export class PageLocator extends Locator<Page> implements api.PageLocator {
  private readonly _mouse: api.Mouse;
  private readonly _keyboard: api.Keyboard;
  private readonly _dialog: api.Dialog;

  constructor(parent?: api.WindowLocator | api.BrowserLocator, options?: api.PageLocatorOptions) {
    super(parent, options);
    this._mouse = new Mouse(this);
    this._keyboard = new Keyboard(this);
    this._dialog = new Dialog(this);
  }

  /** ==================================================================================================================== */
  /** ===================================================== locator ====================================================== */
  /** ==================================================================================================================== */
  protected override async locateObjects(): Promise<Page[]> {
    let rtid: Rtid | undefined = undefined;
    if (this.parent) {
      const parent = await this.parent.get();
      if (parent instanceof Browser) {
        rtid = parent.rtid();
      }
      else if (parent instanceof Window) {
        rtid = parent.rtid();
      }
    }
    if (Utils.isNullOrUndefined(rtid)) {
      rtid = RtidUtils.getBrowserRtid();
    }

    const queryInfo = super.createQueryInfo();
    const options = this.primary ? this.primary as api.PageLocatorOptions : undefined;
    if (queryInfo && options?.active && options?.lastFocusedWindow) {
      queryInfo.primary = [];
      queryInfo.primary.push({ name: 'active', value: true, type: 'property', match: 'exact' });
      queryInfo.primary.push({ name: 'lastFocusedWindow', value: true, type: 'property', match: 'exact' });
    }

    const aos = await this.queryObjects(rtid, {
      type: 'tab',
      queryInfo: queryInfo
    });

    const results: Page[] = [];
    for (const ao of aos) {
      const page = this.repo.getPage(ao.rtid);
      results.push(page);
    }
    return results;
  }

  frame(selector?: api.FrameLocatorOptions | string): api.FrameLocator {
    const options = typeof selector === 'string' ? { selector: selector } : selector;
    const frameLocator = new FrameLocator(this, options);
    return frameLocator;
  }
  element(selector?: api.ElementLocatorOptions | string): api.ElementLocator {
    const options = typeof selector === 'string' ? { selector: selector } : selector;
    const elementLocator = new ElementLocator(this, options);
    return elementLocator;
  }
  text(selector?: api.TextLocatorOptions | string | RegExp): api.TextLocator {
    const options = (typeof selector === 'string' || selector instanceof RegExp) ? { text: selector } : selector;
    const textLocator = new TextLocator(this, options);
    return textLocator;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  async window(): Promise<api.Window | null> {
    const page = await this.get();
    return await page.window();
  }

  async mainFrame(): Promise<api.Frame | null> {
    const page = await this.get();
    return await page.mainFrame();
  }

  async frames(): Promise<api.Frame[]> {
    const page = await this.get();
    return await page.frames();
  }

  mouse(): api.Mouse {
    return this._mouse;
  }

  keyboard(): api.Keyboard {
    return this._keyboard;
  }

  dialog(): api.Dialog {
    return this._dialog;
  }

  async url(): Promise<string> {
    const page = await this.get();
    return await page.url();
  }

  async title(): Promise<string> {
    const page = await this.get();
    return await page.title();
  }

  async content(): Promise<string> {
    const page = await this.get();
    return await page.content();
  }

  async status(): Promise<'unloaded' | 'loading' | 'complete'> {
    const page = await this.get();
    return await page.status();
  }

  async active(): Promise<boolean> {
    const page = await this.get();
    return await page.active();
  }

  async closed(): Promise<boolean> {
    const page = await this.get();
    return await page.closed();
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */
  async activate(): Promise<void> {
    const page = await this.get();
    return await page.activate();
  }

  async bringToFront(): Promise<void> {
    const page = await this.get();
    return await page.bringToFront();
  }

  async sync(timeout: number = 5000): Promise<void> {
    const page = await this.get();
    return await page.sync(timeout);
  }

  async openNewPage(url?: string): Promise<api.Page> {
    const page = await this.get();
    return await page.openNewPage(url);
  }

  async navigate(url?: string): Promise<void> {
    const page = await this.get();
    return await page.navigate(url);
  }

  async refresh(bypassCache: boolean = false): Promise<void> {
    const page = await this.get();
    return await page.refresh(bypassCache);
  }

  async back(): Promise<void> {
    const page = await this.get();
    return await page.back();
  }

  async forward(): Promise<void> {
    const page = await this.get();
    return await page.forward();
  }

  async close(): Promise<void> {
    const page = await this.get();
    return await page.close();
  }

  async zoom(zoomFactor: number): Promise<void> {
    const page = await this.get();
    return await page.zoom(zoomFactor);
  }

  async moveToWindow(window: api.Window, index?: number): Promise<void> {
    const page = await this.get();
    return await page.moveToWindow(window, index);
  }

  async captureScreenshot(): Promise<string> {
    const page = await this.get();
    return await page.captureScreenshot();
  }

  async executeScript<Args extends unknown[], Result>(func: (...args: Args) => Result, args: Args): Promise<Result> {
    const page = await this.get();
    return await page.executeScript(func, args);
  }

  async querySelectorAll(selector: string): Promise<api.Element[]> {
    const page = await this.get();
    return await page.querySelectorAll(selector);
  }

  on(event: string, listener: ((page: api.Page) => (unknown | Promise<unknown>)) | ((dialog: api.Dialog) => (unknown | Promise<unknown>))): this {
    this.get().then((page) => {
      if (event === 'close') {
        page.on(event, listener as ((page: api.Page) => (unknown | Promise<unknown>)));
      } else if (event === 'dialog') {
        page.on(event, listener as ((dialog: api.Dialog) => (unknown | Promise<unknown>)));
      } else if (event === 'domcontentloaded') {
        page.on(event, listener as ((page: api.Page) => (unknown | Promise<unknown>)));
      }
    }).catch(error => {
      this.logger.error(error);
    });
    return this;
  }

  /** ==================================================================================================================== */
  /** ==================================================== DOM Object ==================================================== */
  /** ==================================================================================================================== */

  async document(): Promise<api.JSObject> {
    const page = await this.get();
    return await page.document();
  }
}
