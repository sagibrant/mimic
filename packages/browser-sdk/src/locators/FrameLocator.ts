/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file FrameLocator.ts
 * @description 
 * Class for FrameLocator
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
import { Rtid, Utils, SettingUtils } from "@gogogo/shared";
import { Locator } from "./Locator";
import { Page } from "../aos/Page";
import { Frame } from "../aos/Frame";
import { ElementLocator } from "./ElementLocator";
import { TextLocator } from "./TextLocator";

export class FrameLocator extends Locator<Frame> implements api.FrameLocator {

  /** ==================================================================================================================== */
  /** ===================================================== locator ====================================================== */
  /** ==================================================================================================================== */
  protected override async locateObjects(): Promise<Frame[]> {
    let rtid: Rtid | undefined = undefined;
    if (this.parent) {
      const parent = await this.parent.get();
      if (parent instanceof Page) {
        rtid = parent.rtid();
      }

      if (SettingUtils.getReplaySettings().autoSync) {
        if (parent instanceof Page) {
          await parent.sync();
        }
      }
    }
    if (Utils.isNullOrUndefined(rtid)) {
      return [];
    }

    const queryInfo = super.createQueryInfo();
    const options = this.primary ? this.primary as api.FrameLocatorOptions : undefined;
    if (queryInfo && options) {
      queryInfo.primary = [];
      if (options.selector) {
        queryInfo.primary.push({ name: '#css', value: options.selector, type: 'property', match: 'exact' });
      }
      if (options.url) {
        if (options.url instanceof RegExp) {
          queryInfo.primary.push({ name: 'url', value: Utils.toRegExpSpec(options.url), type: 'property', match: 'regex' });
        }
        else {
          queryInfo.primary.push({ name: 'url', value: options.url, type: 'property', match: 'exact' });
        }
      }
    }

    const aos = await this.queryObjects(rtid, {
      type: 'frame',
      queryInfo: queryInfo
    });

    const results: Frame[] = [];
    for (const ao of aos) {
      const frame = this.repo.getFrame(ao.rtid);
      results.push(frame);
    }
    return results;
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

  async page(): Promise<api.Page> {
    const frame = await this.get();
    return await frame.page();
  }

  async parentFrame(): Promise<api.Frame | null> {
    const frame = await this.get();
    return await frame.parentFrame();
  }

  async childFrames(): Promise<api.Frame[]> {
    const frame = await this.get();
    return await frame.childFrames();
  }

  async ownerElement(): Promise<api.Element | null> {
    const frame = await this.get();
    return await frame.ownerElement();
  }

  async url(): Promise<string> {
    const frame = await this.get();
    return await frame.url();
  }

  async content(): Promise<string> {
    const frame = await this.get();
    return await frame.content();
  }

  async removed(): Promise<boolean> {
    const frame = await this.get();
    return await frame.removed();
  }

  async status(): Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'> {
    const frame = await this.get();
    return await frame.status();
  }

  async readyState(): Promise<'loading' | 'interactive' | 'complete'> {
    const frame = await this.get();
    return await frame.readyState();
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  async sync(timeout: number = 5000): Promise<void> {
    const frame = await this.get();
    return await frame.sync(timeout);
  }

  async executeScript<Args extends unknown[], Result>(func: (...args: Args) => Result, args?: Args): Promise<Result> {
    const frame = await this.get();
    return await frame.executeScript(func, args);
  }

  async querySelectorAll(selector: string): Promise<api.Element[]> {
    const frame = await this.get();
    return await frame.querySelectorAll(selector);
  }

  /** ==================================================================================================================== */
  /** ==================================================== DOM Object ==================================================== */
  /** ==================================================================================================================== */

  async document(): Promise<api.JSObject> {
    const frame = await this.get();
    return await frame.document();
  }

}