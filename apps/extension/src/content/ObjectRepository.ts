/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ElementRepository.ts
 * @description 
 * Support to manager the element objects in this frame
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

import { RtidUtils, Utils, AutomationObject, Rtid, Logger } from "@gogogo/shared";
import { ElementHandler } from "./handlers/ElementHandler";
import { FrameHandler } from "./handlers/FrameHandler";
import { ContentUtils } from "./ContentUtils";
import { TextHandler } from "./handlers/TextHandler";

export class ObjectRepository {
  private readonly _logger: Logger;
  private readonly _frame: FrameHandler;

  private readonly _elemDict: Record<number, Element>;
  private readonly _elemHandlerMap: Map<Element, ElementHandler>;

  private readonly _textNodeDict: Record<number, Node>;
  private readonly _textHandlerMap: Map<Node, TextHandler>;

  private _nextObjId: number;

  constructor(frame: FrameHandler) {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "AORepository" : this.constructor?.name;
    this._logger = new Logger(prefix);
    this._frame = frame;
    this._elemDict = {};
    this._elemHandlerMap = new Map();
    this._textNodeDict = {};
    this._textHandlerMap = new Map();
    this._nextObjId = 1;
  }

  getObjectHandler(objId: number): ElementHandler | TextHandler | null {
    if (objId in this._elemDict) {
      const elem = this._elemDict[objId];
      if (this._elemHandlerMap.has(elem)) {
        const handler = this._elemHandlerMap.get(elem);
        return handler || null;
      }
    }
    if (objId in this._textNodeDict) {
      const node = this._textNodeDict[objId];
      if (this._textHandlerMap.has(node)) {
        const textHandler = this._textHandlerMap.get(node);
        return textHandler || null;
      }
    }
    return null;
  }

  /** ==================================================================================================================== **/
  /** ===================================================== element  ===================================================== **/
  /** ==================================================================================================================== **/

  getElementByObjId(objId: number): Element | null {
    if (objId in this._elemDict) {
      const elem = this._elemDict[objId];
      return elem;
    }
    return null;
  }

  getAOByElement(elem: Element): AutomationObject {
    let rtid: Rtid | undefined = undefined;
    if (this._elemHandlerMap.has(elem)) {
      const ao = this._elemHandlerMap.get(elem);
      rtid = ao?.rtid;
    }
    if (Utils.isNullOrUndefined(rtid)) {
      const ao = this._cacheElement(elem);
      rtid = ao.rtid;
    }
    const attrs = ContentUtils.getAttributes(elem);
    return {
      type: "element" as const,
      name: ContentUtils.getLogicName(elem),
      rtid: rtid,
      runtimeInfo: { ...Utils.deepClone(attrs) }
    };
  }

  private _cacheElement(elem: Element): ElementHandler {
    const objId = this._nextObjId++;
    const rtid = RtidUtils.getObjectRtid(objId, this._frame.rtid.frame, this._frame.rtid.tab, -1, this._frame.rtid.browser);
    const ao = new ElementHandler(this._frame, elem, rtid);
    this._elemDict[objId] = elem;
    this._elemHandlerMap.set(elem, ao);
    ContentUtils.dispatcher.addHandler(ao);
    this._logger.debug('Create ElementHandler and added to AORepo', ao);
    return ao;
  }

  /** ==================================================================================================================== **/
  /** ====================================================== text  ======================================================= **/
  /** ==================================================================================================================== **/
  getAOByTextNode(node: Node): AutomationObject {
    if (node.nodeType !== Node.TEXT_NODE) {
      throw new Error(`Invalid nodeType - ${node.nodeType}`);
    }
    let rtid: Rtid | undefined = undefined;
    if (this._textHandlerMap.has(node)) {
      const ao = this._textHandlerMap.get(node);
      rtid = ao?.rtid;
    }
    if (Utils.isNullOrUndefined(rtid)) {
      const ao = this._cacheTextNode(node);
      rtid = ao.rtid;
    }
    return {
      type: "text" as const,
      name: 'text',
      rtid: rtid,
      runtimeInfo: { text: node.textContent }
    };
  }

  private _cacheTextNode(node: Node): TextHandler {
    const objId = this._nextObjId++;
    const rtid = RtidUtils.getObjectRtid(objId, this._frame.rtid.frame, this._frame.rtid.tab, -1, this._frame.rtid.browser);
    const ao = new TextHandler(this._frame, node, rtid);
    this._textNodeDict[objId] = node;
    this._textHandlerMap.set(node, ao);
    ContentUtils.dispatcher.addHandler(ao);
    this._logger.debug('Create TextHandler and added to AORepo', ao);
    return ao;
  }

}