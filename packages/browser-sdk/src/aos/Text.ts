/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Text.ts
 * @description 
 * Class for Text automation
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
import { Node } from "./Node";

export class Text extends Node implements api.Text {

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  rtid(): Rtid {
    return this._rtid;
  }

  async ownerFrame(): Promise<api.Frame> {
    return await super.ownerFrame();
  }

  async ownerElement(): Promise<api.Element | null> {
    const elemRtid = await this.invokeFunction(this._rtid, 'getOwnerElementRtid', []);
    if (Utils.isNullOrUndefined(elemRtid) || !RtidUtils.isRtid(elemRtid)) {
      return null;
    }
    const elem = this.repo.getElement(elemRtid);
    return elem;
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */


}