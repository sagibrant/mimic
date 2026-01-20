/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Mouse.ts
 * @description 
 * Class for Mouse automation (cdp based)
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
import { ChannelBase } from "../Channel";
import { PageLocator } from "../locators/PageLocator";

export class Mouse extends ChannelBase implements api.Mouse {
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
  async click(x: number, y: number, options?: Omit<api.ClickOptions, 'position'>): Promise<void> {
    const tabRtid = await this.tabRtid();
    const clickOptions: api.ClickOptions = Object.assign({}, options, { position: { x, y } });
    await this.invokeFunction(tabRtid, 'mouseClick', [clickOptions]);
  }
  async down(options?: { button?: "left" | "right" | "middle"; clickCount?: number; }): Promise<void> {
    const tabRtid = await this.tabRtid();
    await this.invokeFunction(tabRtid, 'mouseDown', [options]);
  }
  async up(options?: { button?: "left" | "right" | "middle"; clickCount?: number; }): Promise<void> {
    const tabRtid = await this.tabRtid();
    await this.invokeFunction(tabRtid, 'mouseUp', [options]);
  }
  async move(x: number, y: number, options?: { steps?: number }): Promise<void> {
    const tabRtid = await this.tabRtid();
    await this.invokeFunction(tabRtid, 'mouseMove', [x, y, options]);
  }
  async wheel(deltaX: number, deltaY: number): Promise<void> {
    const tabRtid = await this.tabRtid();
    await this.invokeFunction(tabRtid, 'mouseWheel', [deltaX, deltaY]);
  }
}