/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Page.ts
 * @description 
 * Class for Page automation
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
import { Window } from "./Window";
import { FrameLocator } from "../locators/FrameLocator";
import { PageLocator } from "../locators/PageLocator";
import { ElementLocator } from "../locators/ElementLocator";
import { TextLocator } from "../locators/TextLocator";
import { Mouse } from "./Mouse";
import { Keyboard } from "./Keyboard";
import { Dialog } from "./Dialog";
import { AutomationObject } from "./AutomationObject";

export interface TabInfo extends Record<string, unknown> {
  id?: number;
}

export class Page extends AutomationObject implements api.Page {
  private readonly _browser: api.Browser;
  private readonly _mouse: api.Mouse;
  private readonly _keyboard: api.Keyboard;
  private readonly _dialog: api.Dialog;

  constructor(rtid: Rtid) {
    const pageRtid = RtidUtils.getTabRtid(rtid.tab);
    super(pageRtid);
    const browserRtid = RtidUtils.getBrowserRtid(rtid.browser);
    this._browser = this.repo.getBrowser(browserRtid);
    const pageLocator = new PageLocator();
    pageLocator.resolve([this]);
    this._mouse = new Mouse(pageLocator);
    this._keyboard = new Keyboard(pageLocator);
    this._dialog = new Dialog(pageLocator);
  }

  /** ==================================================================================================================== */
  /** ===================================================== locator ====================================================== */
  /** ==================================================================================================================== */

  frame(selector?: api.FrameLocatorOptions | string): api.FrameLocator {
    const pageLocator = new PageLocator();
    pageLocator.resolve([this]);
    const options = typeof selector === 'string' ? { selector: selector } : selector;
    const frameLocator = new FrameLocator(pageLocator, options);
    return frameLocator;
  }
  element(selector?: api.ElementLocatorOptions | string): api.ElementLocator {
    const pageLocator = new PageLocator();
    pageLocator.resolve([this]);
    const options = typeof selector === 'string' ? { selector: selector } : selector;
    const elementLocator = new ElementLocator(pageLocator, options);
    return elementLocator;
  }
  text(selector?: api.TextLocatorOptions | string | RegExp): api.TextLocator {
    const pageLocator = new PageLocator();
    pageLocator.resolve([this]);
    const options = (typeof selector === 'string' || selector instanceof RegExp) ? { text: selector } : selector;
    const locator = new TextLocator(pageLocator, options);
    return locator;
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

  async window(): Promise<api.Window | null> {
    const rtid = await this.queryProperty(this._rtid, 'parent_rtid') as Rtid;
    if (rtid && !Utils.isNullOrUndefined(rtid.window)) {
      const window = this.repo.getWindow(rtid);
      return window;
    }
    else {
      return null;
    }
  }

  async mainFrame(): Promise<api.Frame | null> {
    const rtid = RtidUtils.getFrameRtid(0, this._rtid.tab, -1, this._rtid.browser);
    const frame = this.repo.getFrame(rtid);
    return frame;
  }

  async frames(): Promise<api.Frame[]> {
    const locators = await this.frame().all();
    const frames = [];
    for (const locator of locators) {
      const frame = await locator.get();
      frames.push(frame);
    }
    return frames;
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
    const propValue = await this.queryProperty(this._rtid, 'url');
    return propValue as string;
  }

  async title(): Promise<string> {
    const propValue = await this.queryProperty(this._rtid, 'title');
    return propValue as string;
  }

  async content(): Promise<string> {
    const propValue = await this.queryProperty(this._rtid, 'content');
    return propValue as string;
  }

  async status(): Promise<'unloaded' | 'loading' | 'complete'> {
    const propValue = await this.queryProperty(this._rtid, 'status');
    return propValue as 'unloaded' | 'loading' | 'complete';
  }

  async active(): Promise<boolean> {
    const propValue = await this.queryProperty(this._rtid, 'active');
    return propValue as boolean;
  }

  async closed(): Promise<boolean> {
    const browserRtid = RtidUtils.getBrowserRtid(this._rtid.browser);
    const isClosed = await this.invokeFunction(browserRtid, 'isTabClosed', [this._rtid.tab]) as boolean;
    return isClosed;
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */
  async activate(): Promise<void> {
    await this.invokeFunction(this._rtid, 'activate', []);
  }

  async bringToFront(): Promise<void> {
    const window = await this.window();
    if (window) {
      await window.focus();
    }
    await this.activate();
  }

  async sync(timeout: number = 5000): Promise<void> {
    const check = async (): Promise<boolean> => {
      const status = await this.status();
      return status === 'complete';
    };
    const result = await Utils.waitChecked(check, timeout);
    if (!result) {
      this.logger.warn('sync: status is still not complete');
    }
  }

  async openNewPage(url?: string): Promise<api.Page> {
    const tabInfo = await this.invokeFunction(this._rtid, 'openNewTab', [url]) as TabInfo;
    if (tabInfo && !Utils.isNullOrUndefined(tabInfo.id) && typeof tabInfo.id === 'number') {
      const tabId = tabInfo.id;
      const tabRtid = RtidUtils.getTabRtid(tabId, -1, this._rtid.browser);
      const newPage = this.repo.getPage(tabRtid);
      return newPage;
    }
    else {
      throw new Error('Failed on open new page');
    }
  }

  async navigate(url?: string): Promise<void> {
    await this.invokeFunction(this._rtid, 'navigate', [url]);
  }

  async refresh(bypassCache: boolean = false): Promise<void> {
    await this.invokeFunction(this._rtid, 'reload', [bypassCache]);
  }

  async back(): Promise<void> {
    await this.invokeFunction(this._rtid, 'goBack', []);
  }

  async forward(): Promise<void> {
    await this.invokeFunction(this._rtid, 'goForward', []);
  }

  async close(): Promise<void> {
    await this.invokeFunction(this._rtid, 'close', []);
    await Utils.wait(200);
  }

  async zoom(zoomFactor: number): Promise<void> {
    await this.invokeFunction(this._rtid, 'zoom', [zoomFactor]);
  }

  async moveToWindow(window: api.Window, index?: number): Promise<void> {
    const windowId = (window as Window).rtid().window;
    await this.invokeFunction(this._rtid, 'moveToWindow', [windowId, index]);
  }

  async captureScreenshot(): Promise<string> {
    const base64ImgString = await this.invokeFunction(this._rtid, 'capturePage', []);
    return base64ImgString as string;
  }

  async executeScript<Args extends unknown[], Result>(func: (...args: Args) => Result, args?: Args): Promise<Result> {
    const funcScript = func.toString();
    const buildArgsString = (arg: unknown): string => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg);
      }
      if (Array.isArray(arg)) {
        return `[${arg.map(i => buildArgsString(i)).join(',')}]`
      }
      return String(arg);
    }
    let script = `(${funcScript})()`;
    if (args && Array.isArray(args)) {
      script = `(${funcScript})(...${buildArgsString(args)})`;
    }
    else if (args) {
      script = `(${funcScript})(${buildArgsString(args)})`;
    }
    const result = await this.invokeFunction(this._rtid, 'executeScript', [script]) as Result;
    return result;
  }

  async querySelectorAll(selector: string): Promise<api.Element[]> {
    const mainFrame = await this.mainFrame();
    if (!mainFrame) {
      throw new Error('Main frame not found');
    }
    return await mainFrame.querySelectorAll(selector);
  }

  /** ==================================================================================================================== */
  /** ====================================================== events ====================================================== */
  /** ==================================================================================================================== */
  on(event: 'domcontentloaded' | 'close', listener: (page: api.Page) => (unknown | Promise<unknown>)): this;
  on(event: 'dialog', listener: (dialog: api.Dialog) => (unknown | Promise<unknown>)): this;
  on(event: 'dialog' | 'domcontentloaded' | 'close', listener: ((page: api.Page) => (unknown | Promise<unknown>)) | ((dialog: api.Dialog) => (unknown | Promise<unknown>))): this {
    return super.on(event, listener as (arg: unknown) => (unknown | Promise<unknown>));
  }
  emit(event: 'close' | 'dialog' | 'domcontentloaded', _data?: unknown): void {
    if (event === 'close') {
      super.emit('close', this);
    }
    else if (event === 'dialog') {
      super.emit('dialog', this._dialog);
    }
    else if (event === 'domcontentloaded') {
      super.emit('domcontentloaded', this);
    }
  }

  /** ==================================================================================================================== */
  /** ==================================================== DOM Object ==================================================== */
  /** ==================================================================================================================== */

  async document(): Promise<api.JSObject> {
    const rawObj = new Proxy(this, {
      get: async (_target, _prop): Promise<void> => {
        //console.log(`getting ${ prop } from ${ target } `);
      },

      set: (_target, _prop, _value, _receiver): boolean => {
        //console.log(`setting ${ prop } from ${ target } to ${ value } `);
        return true;
      },
    });

    return rawObj as unknown as api.JSObject;
  }

}
