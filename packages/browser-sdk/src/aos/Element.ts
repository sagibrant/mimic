/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Element.ts
 * @description 
 * Class for Element automation
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
import { Rtid, RtidUtils, Utils, SettingUtils } from "@gogogo/shared";
import { Frame } from "./Frame";
import { ElementLocator } from "../locators/ElementLocator";
import { TextLocator } from "../locators/TextLocator";
import { Node } from "./Node";

export class Element extends Node implements api.Element {

  /** ==================================================================================================================== */
  /** ===================================================== locator ====================================================== */
  /** ==================================================================================================================== */

  element(selector?: api.ElementLocatorOptions | string): api.ElementLocator {
    const elementLocator = new ElementLocator();
    elementLocator.resolve([this]);
    const options = typeof selector === 'string' ? { selector: selector } : selector;
    const locator = new ElementLocator(elementLocator, options);
    return locator;
  }

  text(selector?: api.TextLocatorOptions | string | RegExp): api.TextLocator {
    const elementLocator = new ElementLocator();
    elementLocator.resolve([this]);
    const options = (typeof selector === 'string' || selector instanceof RegExp) ? { text: selector } : selector;
    const locator = new TextLocator(elementLocator, options);
    return locator;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  rtid(): Rtid {
    return this._rtid;
  }

  async ownerFrame(): Promise<api.Frame> {
    return await super.ownerFrame();
  }

  async contentFrame(): Promise<api.Frame | null> {
    const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
    await this.invokeFunction(tabRtid, 'updateFrameInfos', []);

    const frameRtid = (this._frame as Frame).rtid();
    const contentFrameRtid = await this.invokeFunction(frameRtid, 'getContentFrameRtid', [this._rtid]) as Rtid;
    if (Utils.isNullOrUndefined(contentFrameRtid) || !RtidUtils.isRtid(contentFrameRtid)) {
      return null;
    }
    const contentFrame = this.repo.getFrame(contentFrameRtid);
    return contentFrame;
  }

  async tagName(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'tagName', []);
    return result as string;
  }
  async id(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'id', []);
    return result as string;
  }
  async innerHTML(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'innerHTML', []);
    return result as string;
  }
  async outerHTML(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'outerHTML', []);
    return result as string;
  }
  async innerText(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'innerText', []);
    return result as string;
  }
  async outerText(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'outerText', []);
    return result as string;
  }
  async title(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'title', []);
    return result as string;
  }
  async accessKey(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'accessKey', []);
    return result as string;
  }
  async hidden(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'hidden', []);
    return result as boolean;
  }

  async name(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'name', []);
    return result as string;
  }
  async value(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'value', []);
    return result as string;
  }
  async type(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'type', []);
    return result as string;
  }
  async alt(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'alt', []);
    return result as string;
  }
  async accept(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'accept', []);
    return result as string;
  }
  async placeholder(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'placeholder', []);
    return result as string;
  }
  async src(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'src', []);
    return result as string;
  }
  async disabled(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'disabled', []);
    return result as boolean;
  }
  async readOnly(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'readOnly', []);
    return result as boolean;
  }
  async required(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'required', []);
    return result as boolean;
  }
  async checked(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'checked', []);
    return result as boolean;
  }

  async label(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'label', []);
    return result as string;
  }
  async selected(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'selected', []);
    return result as boolean;
  }

  async multiple(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'multiple', []);
    return result as boolean;
  }
  async options(): Promise<api.Element[]> {
    const rtids = await this.invokeFunction(this._rtid, 'options', []) as Rtid[];
    const results: api.Element[] = [];
    for (const rtid of rtids) {
      if (!RtidUtils.isRtid(rtid)) {
        continue;
      }
      const elem = this.repo.getElement(rtid);
      results.push(elem);
    }
    return results;
  }
  async selectedIndex(): Promise<number> {
    const result = await this.invokeFunction(this._rtid, 'selectedIndex', []);
    return result as number;
  }
  async selectedOptions(): Promise<api.Element[]> {
    const rtids = await this.invokeFunction(this._rtid, 'selectedOptions', []) as Rtid[];
    const results: api.Element[] = [];
    for (const rtid of rtids) {
      if (!RtidUtils.isRtid(rtid)) {
        continue;
      }
      const elem = this.repo.getElement(rtid);
      results.push(elem);
    }
    return results;
  }

  async visible(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'visible', []);
    return result as boolean;
  }

  async boundingBox(): Promise<api.RectInfo | null> {
    return await super.boundingBox();
  }
  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  /** ==================================================================================================================== */
  /** ====================================================== native ====================================================== */
  /** ==================================================================================================================== */
  async getAttribute(name: string): Promise<string | null> {
    const result = await this.invokeFunction(this._rtid, 'getAttribute', [name]);
    return result as string | null;
  }
  async getAttributes(): Promise<Record<string, unknown>> {
    const result = await this.invokeFunction(this._rtid, 'getAttributes', []);
    return result as Record<string, unknown>;
  }
  async setAttribute(name: string, value: string): Promise<void> {
    await this.invokeFunction(this._rtid, 'setAttribute', [name, value]);
  }
  async hasAttribute(name: string): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'hasAttribute', [name]);
    return result as boolean;
  }
  async toggleAttribute(name: string, force?: boolean): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'toggleAttribute', [name, force]);
    return result as boolean;
  }
  async querySelectorAll(selector: string): Promise<api.Element[]> {
    const rtids = await this.invokeFunction(this._rtid, 'querySelectorAll', [selector]) as Rtid[];
    const results: api.Element[] = [];
    for (const rtid of rtids) {
      if (!RtidUtils.isRtid(rtid)) {
        continue;
      }
      const elem = this.repo.getElement(rtid);
      results.push(elem);
    }
    return results;
  }
  async getBoundingClientRect(): Promise<api.RectInfo> {
    return await super.getBoundingClientRect();
  }
  async checkValidity(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'checkValidity', []);
    return result as boolean;
  }
  async checkVisibility(options?: object): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'checkVisibility', [options]);
    return result as boolean;
  }

  async focus(): Promise<void> {
    await this.invokeFunction(this._rtid, 'focus', []);
  }
  async blur(): Promise<void> {
    await this.invokeFunction(this._rtid, 'blur', []);
  }
  async scrollIntoViewIfNeeded(): Promise<void> {
    await this.invokeFunction(this._rtid, 'scrollIntoViewIfNeeded', []);
  }
  async check(options?: api.ActionOptions): Promise<void> {
    let checked = await this.checked();
    if (checked) {
      return;
    }
    const mode = options?.mode ?? await this.getDefaultInputMode();
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck) {
      await this.checkStates(mode === 'cdp' ? ['visible', 'enabled'] : ['enabled']);
    }

    if (mode === 'cdp') {
      const rect = await this.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        await this.invokeFunction(this._rtid, 'check', []);
      }
      else {
        await this.click(options);
      }
    }
    else {
      await this.invokeFunction(this._rtid, 'check', []);
    }

    checked = await this.checked();
    if (checked) {
      return;
    }
    await this.setProperty('checked', true);
  }
  async uncheck(options?: api.ActionOptions): Promise<void> {
    let checked = await this.checked();
    if (!checked) {
      return;
    }
    const mode = options?.mode ?? await this.getDefaultInputMode();
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck) {
      await this.checkStates(mode === 'cdp' ? ['visible', 'enabled'] : ['enabled']);
    }
    if (mode === 'cdp') {
      const rect = await this.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        await this.invokeFunction(this._rtid, 'uncheck', []);
      }
      else {
        await this.click(options);
      }
    }
    else {
      await this.invokeFunction(this._rtid, 'uncheck', []);
    }

    checked = await this.checked();
    if (!checked) {
      return;
    }
    await this.setProperty('checked', false);
  }
  async selectOption(values: string | string[] | number | number[] | api.Element | api.Element[]): Promise<void> {
    const elems = Array.isArray(values) ? values : [values];
    const options = [];
    for (const elem of elems) {
      if (elem instanceof Element && Utils.isFunction(elem.rtid)) {
        const rtid = elem.rtid();
        if (RtidUtils.isRtid(rtid)) {
          options.push(rtid);
        }
      }
      else {
        options.push(elem);
      }
    }
    await this.invokeFunction(this._rtid, 'selectOption', [options]);
  }
  async setFileInputFiles(files: string | string[]): Promise<void> {
    const inputFiles = Array.isArray(files) ? files : [files];
    await this.invokeFunction(this._rtid, 'setFileInputFiles', [inputFiles]);
  }

  /** ==================================================================================================================== */
  /** ==================================================== DOM Object ==================================================== */
  /** ==================================================================================================================== */
  async $0(): Promise<api.JSObject> {
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