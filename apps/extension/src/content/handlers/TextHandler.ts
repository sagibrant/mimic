/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ElementHandler.ts
 * @description 
 * Support the automation actions on a specific Frame
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

import { Utils, Rtid } from "@mimic-sdk/core";
import { FrameHandler } from "./FrameHandler";
import { NodeHandler } from "./NodeHandler";
import { ContentUtils } from "../ContentUtils";

export class TextHandler extends NodeHandler {
  protected _text: string | RegExp | undefined;

  constructor(frame: FrameHandler, node: Node, rtid: Rtid) {
    super(frame, node, rtid);
  }

  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  text(): string {
    if (this._text instanceof RegExp) {
      const regex = this._text;
      const text = this.node.textContent || '';
      const matched = text.match(regex);
      if (matched && matched.length > 0) {
        return matched[0];
      }
      return '';
    }
    else if (typeof this._text === 'string') {
      return this._text;
    }
    else {
      const text = this.node.textContent || '';
      return text;
    }
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */
  getOwnerElementRtid(): Rtid | null {
    if (!this._node.isConnected) {
      return null;
    }
    const elem = this.elem;
    if (!elem) {
      return null;
    }
    const ao = ContentUtils.repo.getAOByElement(elem);
    if (ao) {
      return ao.rtid;
    }
    return null;
  }
  /** ==================================================================================================================== */
  /** ====================================================== native ====================================================== */
  /** ==================================================================================================================== */

  /** ==================================================================================================================== **/
  /** =================================================== Query methods ================================================== **/
  /** ==================================================================================================================== **/

  /**
   * query property value 
   * @param propName property name
   * @returns property value
   */
  protected override async queryProperty(propName: string): Promise<unknown> {
    if (propName === 'rtid') {
      return this.rtid;
    }
    else if (propName === 'parent_rtid') {
      let parentRtid = Utils.deepClone(this.rtid);
      parentRtid.object = -1;
      return parentRtid;
    }
    throw new Error(`Unknown property name - ${propName}`);
  }
}