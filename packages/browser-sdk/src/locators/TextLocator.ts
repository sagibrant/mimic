/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file TextLocator.ts
 * @description 
 * Class for TextLocator
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
import { Element } from "../aos/Element";
import { Text } from "../aos/Text";

export class TextLocator extends Locator<Text> implements api.TextLocator {

  /** ==================================================================================================================== */
  /** ===================================================== locator ====================================================== */
  /** ==================================================================================================================== */
  protected override async locateObjects(): Promise<Text[]> {
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

      if (SettingUtils.getReplaySettings().autoSync) {
        if (parent instanceof Page) {
          await parent.sync();
        }
        else if (parent instanceof Frame) {
          await parent.sync();
        }
      }
    }
    if (Utils.isNullOrUndefined(rtid)) {
      return [];
    }

    const queryInfo = super.createQueryInfo();
    const options = this.primary ? this.primary as api.TextLocatorOptions : undefined;
    if (queryInfo && options && options.text) {
      queryInfo.primary = [];
      if (options.text instanceof RegExp) {
        queryInfo.primary.push({ name: 'text', value: Utils.toRegExpSpec(options.text), type: 'text', match: 'regex' });
      }
      else {
        queryInfo.primary.push({ name: 'text', value: options.text, type: 'text', match: 'exact' });
      }
    }

    const aos = await this.queryObjects(rtid, {
      type: 'text',
      queryInfo: queryInfo
    });

    const results: Text[] = [];
    for (const ao of aos) {
      const text = this.repo.getText(ao.rtid);
      results.push(text);
    }
    return results;
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  async ownerFrame(): Promise<api.Frame> {
    const text = await this.get();
    return await text.ownerFrame();
  }

  async ownerElement(): Promise<api.Element | null> {
    const text = await this.get();
    return await text.ownerElement();
  }

  async nodeName(): Promise<string> {
    const text = await this.get();
    return await text.nodeName();
  }
  async nodeType(): Promise<number> {
    const text = await this.get();
    return await text.nodeType();
  }
  async nodeValue(): Promise<string> {
    const text = await this.get();
    return await text.nodeValue();
  }
  async isConnected(): Promise<boolean> {
    const text = await this.get();
    return await text.isConnected();
  }
  async textContent(): Promise<string> {
    const text = await this.get();
    return await text.textContent();
  }


  async boundingBox(): Promise<api.RectInfo | null> {
    const text = await this.get();
    return await text.boundingBox();
  }
  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */
  async highlight(): Promise<void> {
    const text = await this.get();
    return await text.highlight();
  }
  async getProperty(name: string): Promise<unknown> {
    const text = await this.get();
    return await text.getProperty(name);
  }
  async setProperty(name: string, value: unknown): Promise<void> {
    const text = await this.get();
    return await text.setProperty(name, value);
  }
  async dispatchEvent(type: string, options?: object): Promise<void> {
    const text = await this.get();
    return await text.dispatchEvent(type, options);
  }
  async sendCDPCommand(method: string, commandParams?: { [key: string]: unknown }): Promise<void> {
    const text = await this.get();
    return await text.sendCDPCommand(method, commandParams);
  }

  async getBoundingClientRect(): Promise<api.RectInfo> {
    const text = await this.get();
    return await text.getBoundingClientRect();
  }
  async click(options?: api.ClickOptions & api.ActionOptions): Promise<void> {
    const text = await this.get();
    return await text.click(options);
  }
  async dblclick(options?: Omit<api.ClickOptions, 'clickCount'> & api.ActionOptions): Promise<void> {
    const text = await this.get();
    return await text.dblclick(options);
  }
  async wheel(options?: { deltaX?: number, deltaY?: number } & api.ActionOptions): Promise<void> {
    const text = await this.get();
    return await text.wheel(options);
  }
  async dragTo(target: api.Element | api.Text, options?: { sourcePosition?: api.Point; targetPosition?: api.Point; } & api.ActionOptions): Promise<void> {
    const text = await this.get();
    return await text.dragTo(target, options);
  }
  async hover(options?: { position?: api.Point } & api.ActionOptions): Promise<void> {
    const text = await this.get();
    return await text.hover(options);
  }

  async tap(options?: { position?: api.Point } & api.ActionOptions): Promise<void> {
    const text = await this.get();
    return await text.tap(options);
  }

  async fill(text: string, options?: api.TextInputOptions & api.ActionOptions): Promise<void> {
    const textObj = await this.get();
    return await textObj.fill(text, options);
  }
  async clear(options?: api.ActionOptions): Promise<void> {
    const text = await this.get();
    return await text.clear(options);
  }
  async press(keys: string | string[], options?: { delayBetweenDownUp?: number } & api.ActionOptions): Promise<void> {
    const text = await this.get();
    return await text.press(keys, options);
  }

}