/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Keyboard.ts
 * @description 
 * Class for Keyboard automation (cdp based)
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
import { ChannelBase } from "../Channel";
import { PageLocator } from "../locators/PageLocator";

export class Keyboard extends ChannelBase implements api.Keyboard {
  private readonly _pageLocator: PageLocator;
  private _pageRtid?: Rtid;

  constructor(pageLocator: PageLocator) {
    super();
    this._pageLocator = pageLocator;
  }
  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  async tabRtid(): Promise<Rtid> {
    if (Utils.isNullOrUndefined(this._pageRtid)) {
      const page = await this._pageLocator.get();
      this._pageRtid = page.rtid();
    }
    return RtidUtils.getTabRtid(this._pageRtid.tab);
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */
  async type(text: string, options?: api.TextInputOptions): Promise<void> {
    let timeout = 0;
    const { delayBetweenDownUp = 0, delayBetweenChar = 0 } = options || {};
    if (delayBetweenDownUp > 0) {
      timeout += text.length * delayBetweenDownUp;
    }
    if (delayBetweenChar > 0) {
      timeout += text.length * delayBetweenChar;
    }
    const tabRtid = await this.tabRtid();
    await this.invokeFunction(tabRtid, 'keyboardType', [text, options], undefined, timeout > 0 ? timeout + 5000 : undefined);
  }
  async down(key: string): Promise<void> {
    const tabRtid = await this.tabRtid();
    await this.invokeFunction(tabRtid, 'keyboardDown', [key]);
  }
  async up(key: string): Promise<void> {
    const tabRtid = await this.tabRtid();
    await this.invokeFunction(tabRtid, 'keyboardUp', [key]);
  }
  async press(keys: string | string[], options?: { delayBetweenDownUp?: number; }): Promise<void> {
    const tabRtid = await this.tabRtid();
    await this.invokeFunction(tabRtid, 'keyboardPress', [keys, options]);
  }
}