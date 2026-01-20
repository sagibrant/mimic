/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ElementLocator.ts
 * @description 
 * Class for ElementLocator
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
import { Rtid, RtidUtils, Utils, SettingUtils } from "@mimic-sdk/core";
import { Locator } from "./Locator";
import { Page } from "../aos/Page";
import { Frame } from "../aos/Frame";
import { Element } from "../aos/Element";
import { TextLocator } from "./TextLocator";
import { AutomationObject } from "../aos/AutomationObject";

export class ElementLocator extends Locator<Element> implements api.ElementLocator {

  /** ==================================================================================================================== */
  /** ===================================================== locator ====================================================== */
  /** ==================================================================================================================== */
  protected override async locateObjects(): Promise<Element[]> {
    let rtid: Rtid | undefined = undefined;
    if (this.parent) {
      const parent = await this.parent.get();
      if (parent instanceof Page) {
        rtid = parent.rtid();
      }
      else if (parent instanceof Frame) {
        rtid = parent.rtid();
      }
      else if (parent instanceof Element) {
        rtid = parent.rtid();
      }
      else if (parent instanceof AutomationObject) {
        rtid = parent.rtid();
      }
      else if (parent && typeof parent === 'object' && 'rtid' in parent && Utils.isFunction(parent.rtid)) {
        rtid = parent.rtid() as Rtid;
        if (!RtidUtils.isRtid(rtid)) {
          rtid = undefined;
        }
      }

      if (SettingUtils.getReplaySettings().autoSync) {
        if (parent instanceof Page) {
          await parent.sync();
        }
        else if (parent instanceof Frame) {
          await parent.sync();
        }
      }
    }
    if (Utils.isNullOrUndefined(rtid) || !RtidUtils.isRtid(rtid)) {
      return [];
    }

    const queryInfo = super.createQueryInfo();
    const options = this.primary ? this.primary as api.ElementLocatorOptions : undefined;
    if (queryInfo && options) {
      queryInfo.primary = [];
      if (options.selector) {
        queryInfo.primary.push({ name: '#css', value: options.selector, type: 'property', match: 'exact' });
      }
      if (options.xpath) {
        queryInfo.primary.push({ name: '#xpath', value: options.xpath, type: 'property', match: 'exact' });
      }
    }

    const aos = await this.queryObjects(rtid, {
      type: 'element',
      queryInfo: queryInfo
    });

    const results: Element[] = [];
    for (const ao of aos) {
      const elem = this.repo.getElement(ao.rtid);
      results.push(elem);
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

  async ownerFrame(): Promise<api.Frame> {
    const elem = await this.get();
    return await elem.ownerFrame();
  }

  async contentFrame(): Promise<api.Frame | null> {
    const elem = await this.get();
    return await elem.contentFrame();
  }

  async nodeName(): Promise<string> {
    const elem = await this.get();
    return await elem.nodeName();
  }
  async nodeType(): Promise<number> {
    const elem = await this.get();
    return await elem.nodeType();
  }
  async nodeValue(): Promise<string> {
    const elem = await this.get();
    return await elem.nodeValue();
  }
  async isConnected(): Promise<boolean> {
    const elem = await this.get();
    return await elem.isConnected();
  }
  async textContent(): Promise<string> {
    const elem = await this.get();
    return await elem.textContent();
  }

  async tagName(): Promise<string> {
    const elem = await this.get();
    return await elem.tagName();
  }
  async id(): Promise<string> {
    const elem = await this.get();
    return await elem.id();
  }
  async innerHTML(): Promise<string> {
    const elem = await this.get();
    return await elem.innerHTML();
  }
  async outerHTML(): Promise<string> {
    const elem = await this.get();
    return await elem.outerHTML();
  }
  async innerText(): Promise<string> {
    const elem = await this.get();
    return await elem.innerText();
  }
  async outerText(): Promise<string> {
    const elem = await this.get();
    return await elem.outerText();
  }
  async title(): Promise<string> {
    const elem = await this.get();
    return await elem.title();
  }
  async accessKey(): Promise<string> {
    const elem = await this.get();
    return await elem.accessKey();
  }
  async hidden(): Promise<boolean> {
    const elem = await this.get();
    return await elem.hidden();
  }

  async name(): Promise<string> {
    const elem = await this.get();
    return await elem.name();
  }
  async value(): Promise<string> {
    const elem = await this.get();
    return await elem.value();
  }
  async type(): Promise<string> {
    const elem = await this.get();
    return await elem.type();
  }
  async alt(): Promise<string> {
    const elem = await this.get();
    return await elem.alt();
  }
  async accept(): Promise<string> {
    const elem = await this.get();
    return await elem.accept();
  }
  async placeholder(): Promise<string> {
    const elem = await this.get();
    return await elem.placeholder();
  }
  async src(): Promise<string> {
    const elem = await this.get();
    return await elem.src();
  }
  async disabled(): Promise<boolean> {
    const elem = await this.get();
    return await elem.disabled();
  }
  async readOnly(): Promise<boolean> {
    const elem = await this.get();
    return await elem.readOnly();
  }
  async required(): Promise<boolean> {
    const elem = await this.get();
    return await elem.required();
  }
  async checked(): Promise<boolean> {
    const elem = await this.get();
    return await elem.checked();
  }

  async label(): Promise<string> {
    const elem = await this.get();
    return await elem.label();
  }
  async selected(): Promise<boolean> {
    const elem = await this.get();
    return await elem.selected();
  }

  async multiple(): Promise<boolean> {
    const elem = await this.get();
    return await elem.multiple();
  }
  async options(): Promise<api.Element[]> {
    const elem = await this.get();
    return await elem.options();
  }
  async selectedIndex(): Promise<number> {
    const elem = await this.get();
    return await elem.selectedIndex();
  }
  async selectedOptions(): Promise<api.Element[]> {
    const elem = await this.get();
    return await elem.selectedOptions();
  }

  async visible(): Promise<boolean> {
    const elem = await this.get();
    return await elem.visible();
  }

  async boundingBox(): Promise<api.RectInfo | null> {
    const elem = await this.get();
    return await elem.boundingBox();
  }
  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */
  async highlight(): Promise<void> {
    const elem = await this.get();
    return await elem.highlight();
  }
  async getProperty(name: string): Promise<unknown> {
    const elem = await this.get();
    return await elem.getProperty(name);
  }
  async setProperty(name: string, value: unknown): Promise<void> {
    const elem = await this.get();
    return await elem.setProperty(name, value);
  }
  async getAttribute(name: string): Promise<string | null> {
    const elem = await this.get();
    return await elem.getAttribute(name);
  }
  async getAttributes(): Promise<Record<string, unknown>> {
    const elem = await this.get();
    return await elem.getAttributes();
  }
  async setAttribute(name: string, value: string): Promise<void> {
    const elem = await this.get();
    return await elem.setAttribute(name, value);
  }
  async hasAttribute(name: string): Promise<boolean> {
    const elem = await this.get();
    return await elem.hasAttribute(name);
  }
  async toggleAttribute(name: string, force?: boolean): Promise<boolean> {
    const elem = await this.get();
    return await elem.toggleAttribute(name, force);
  }
  async querySelectorAll(selector: string): Promise<api.Element[]> {
    const elem = await this.get();
    return await elem.querySelectorAll(selector);
  }
  async getBoundingClientRect(): Promise<api.RectInfo> {
    const elem = await this.get();
    return await elem.getBoundingClientRect();
  }
  async checkValidity(): Promise<boolean> {
    const elem = await this.get();
    return await elem.checkValidity();
  }
  async checkVisibility(options?: object): Promise<boolean> {
    const elem = await this.get();
    return await elem.checkVisibility(options);
  }

  async focus(): Promise<void> {
    const elem = await this.get();
    return await elem.focus();
  }
  async blur(): Promise<void> {
    const elem = await this.get();
    return await elem.blur();
  }
  async scrollIntoViewIfNeeded(): Promise<void> {
    const elem = await this.get();
    return await elem.scrollIntoViewIfNeeded();
  }
  async check(options?: api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.check(options);
  }
  async uncheck(options?: api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.uncheck(options);
  }
  async selectOption(values: string | string[] | number | number[] | api.Element | api.Element[]): Promise<void> {
    const elem = await this.get();
    return await elem.selectOption(values);
  }
  async setFileInputFiles(files: string | string[]): Promise<void> {
    const elem = await this.get();
    return await elem.setFileInputFiles(files);
  }

  async dispatchEvent(type: string, options?: object): Promise<void> {
    const elem = await this.get();
    return await elem.dispatchEvent(type, options);
  }
  async sendCDPCommand(method: string, commandParams?: { [key: string]: unknown }): Promise<void> {
    const elem = await this.get();
    return await elem.sendCDPCommand(method, commandParams);
  }

  async hover(options?: { position?: api.Point } & api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.hover(options);
  }
  async click(options?: api.ClickOptions & api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.click(options);
  }
  async dblclick(options?: Omit<api.ClickOptions, 'clickCount'> & api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.dblclick(options);
  }
  async wheel(options?: { deltaX?: number, deltaY?: number } & api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.wheel(options);
  }
  async dragTo(target: api.Element | api.Text, options?: { sourcePosition?: api.Point; targetPosition?: api.Point; } & api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.dragTo(target, options);
  }

  async tap(options?: { position?: api.Point } & api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.tap(options);
  }

  async fill(text: string, options?: api.TextInputOptions & api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.fill(text, options);
  }
  async clear(options?: api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.clear(options);
  }
  async press(keys: string | string[], options?: { delayBetweenDownUp?: number } & api.ActionOptions): Promise<void> {
    const elem = await this.get();
    return await elem.press(keys, options);
  }

  /** ==================================================================================================================== */
  /** ==================================================== DOM Object ==================================================== */
  /** ==================================================================================================================== */

  async $0(): Promise<api.JSObject> {
    const elem = await this.get();
    return await elem.$0();
  }

}