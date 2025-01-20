/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Frame.ts
 * @description 
 * Class for Frame automation
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

import * as api from "@gogogo/shared";
import { Rtid, RtidUtils, Utils } from "@gogogo/shared";
import { FrameLocator } from "../locators/FrameLocator";
import { ElementLocator } from "../locators/ElementLocator";
import { TextLocator } from "../locators/TextLocator";
import { AutomationObject } from "../aos/AutomationObject";

export class Frame extends AutomationObject implements api.Frame {
  private readonly _page: api.Page;

  constructor(rtid: Rtid) {
    super(rtid);
    const pageRtid = RtidUtils.getTabRtid(rtid.tab, -1, rtid.browser);
    this._page = this.repo.getPage(pageRtid);
  }

  /** ==================================================================================================================== */
  /** ===================================================== locator ====================================================== */
  /** ==================================================================================================================== */

  element(selector?: api.ElementLocatorOptions | string): api.ElementLocator {
    const frameLocator = new FrameLocator();
    frameLocator.resolve([this]);
    const options = typeof selector === 'string' ? { selector: selector } : selector;
    const elementLocator = new ElementLocator(frameLocator, options);
    return elementLocator;
  }
  text(selector?: api.TextLocatorOptions | string | RegExp): api.TextLocator {
    const frameLocator = new FrameLocator();
    frameLocator.resolve([this]);
    const options = (typeof selector === 'string' || selector instanceof RegExp) ? { text: selector } : selector;
    const textLocator = new TextLocator(frameLocator, options);
    return textLocator;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  rtid(): Rtid {
    return this._rtid;
  }

  async page(): Promise<api.Page> {
    return this._page;
  }

  async parentFrame(): Promise<api.Frame | null> {
    if (this._rtid.frame === 0) {
      return null;
    }
    const tabId = RtidUtils.getTabRtid(this._rtid.tab, -1);
    const parentFrameId = await this.invokeFunction(tabId, 'getParentFrameId', [this._rtid.frame]);
    if (typeof parentFrameId === 'number' && parentFrameId >= 0) {
      const parentFrameRtid = RtidUtils.getFrameRtid(parentFrameId, this._rtid.tab, -1, this._rtid.browser);
      const parentFrame = this.repo.getFrame(parentFrameRtid);
      return parentFrame;
    }
    else {
      return null;
    }
  }

  async childFrames(): Promise<api.Frame[]> {
    const results: api.Frame[] = [];
    const tabId = RtidUtils.getTabRtid(this._rtid.tab, -1);
    const childFrameIds = await this.invokeFunction(tabId, 'getChildFrameIds', [this._rtid.frame]);
    if (!Utils.isNullOrUndefined(childFrameIds) && Array.isArray(childFrameIds)) {
      const frameIds = childFrameIds as number[];
      for (const frameId of frameIds) {
        const childFrameRtid = RtidUtils.getFrameRtid(frameId, this._rtid.tab, -1, this._rtid.browser);
        const childFrame = this.repo.getFrame(childFrameRtid);
        results.push(childFrame);
      }
    }
    return results;
  }

  async ownerElement(): Promise<api.Element | null> {
    const parentFrame = await this.parentFrame();
    if (parentFrame === null) {
      return null;
    }
    const tabRtid = RtidUtils.getTabRtid(this._rtid.tab, -1, this._rtid.browser);
    await this.invokeFunction(tabRtid, 'updateFrameInfos', []);

    const parentFrameRtid = (parentFrame as Frame).rtid();
    const elemRtid = await this.invokeFunction(parentFrameRtid, 'getOwnerElementRtid', [this._rtid]) as Rtid;
    if (Utils.isNullOrUndefined(elemRtid) || !RtidUtils.isRtid(elemRtid)) {
      return null;
    }
    const frameElem = this.repo.getElement(elemRtid);
    return frameElem;
  }

  async url(): Promise<string> {
    const tabId = RtidUtils.getTabRtid(this._rtid.tab, -1);
    const url = await this.invokeFunction(tabId, 'getFrameUrl', [this._rtid.frame]) as string;
    return url;
  }

  async content(): Promise<string> {
    const propValue = await this.queryProperty(this._rtid, 'content');
    return propValue as string;
  }

  async removed(): Promise<boolean> {
    const page = await this.page();
    const frames = await page.frames();
    const frame = frames.find(f => RtidUtils.isRtidEqual(this._rtid, (f as Frame).rtid()));
    if (frame) {
      return false;
    }
    else {
      return true;
    }
  }

  async status(): Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'> {
    const tabId = RtidUtils.getTabRtid(this._rtid.tab, -1);
    const status = await this.invokeFunction(tabId, 'getFrameStatus', [this._rtid.frame]);
    if (status) {
      return status as 'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed';
    }
    else {
      return 'ErrorOccurred'
    }
  }

  async readyState(): Promise<'loading' | 'interactive' | 'complete'> {
    // onBeforeNavigate - N/A.   (no frame connected)
    // onCommitted - "loading"   (frame connected Unreliable)
    // onDOMContentLoaded - 'interactive'
    // onCompleted - 'complete'
    const status = await this.status();
    if (status === 'DOMContentLoaded' || status === 'Completed') {
      const propValue = await this.queryProperty(this._rtid, 'readyState');
      return propValue as 'loading' | 'interactive' | 'complete';
    }
    else {
      return 'loading';
    }
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async sync(timeout: number = 5000): Promise<void> {
    const check = async (): Promise<boolean> => {
      try {
        const readyState = await this.readyState();
        return readyState === 'complete';
      }
      catch {
        return false;
      }
    };
    const result = await Utils.waitChecked(check, timeout);
    if (!result) {
      this.logger.warn('sync: status is still not Completed');
    }
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
    const tabId = RtidUtils.getTabRtid(this._rtid.tab, -1);
    const result = await this.invokeFunction(tabId, 'executeScript', [script, this._rtid.frame]) as Result;
    return result;
  }

  async querySelectorAll(selector: string): Promise<api.Element[]> {
    const rtids = await this.invokeFunction(this._rtid, 'querySelectorAll', [selector]) as Rtid[];
    const results: api.Element[] = [];
    for (const rtid of rtids) {
      const elem = this.repo.getElement(rtid);
      results.push(elem);
    }
    return results;
  }

  /** ==================================================================================================================== */
  /** ==================================================== DOM Object ==================================================== */
  /** ==================================================================================================================== */

  async document(): Promise<api.JSObject> {
    const rawObj = new Proxy(this, {
      get: async (_target, _prop): Promise<void> => {
        //console.log(`getting ${prop} from ${target}`);
      },

      set: (_target, _prop, _value, _receiver): boolean => {
        //console.log(`setting ${prop} from ${target} to ${value}`);
        return true;
      },
    });

    return rawObj as unknown as api.JSObject;
  }

}
