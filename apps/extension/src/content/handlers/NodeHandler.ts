/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file NodeHandler.ts
 * @description 
 * Support the automation actions on a specific node
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

import { RtidUtils, Utils, AODesc, AutomationObject, QueryInfo, Rtid, Selector, LocatorUtils, MsgDataHandlerBase, ClickOptions, Point, RectInfo, TextInputOptions } from "@mimic-sdk/core";
import { ContentUtils } from "../ContentUtils";
import { FrameHandler } from "./FrameHandler";
import * as EventSimulator from "../EventSimulator";

export class NodeHandler extends MsgDataHandlerBase {
  protected readonly _node: Node;
  protected readonly _frame: FrameHandler;

  constructor(frame: FrameHandler, node: Node, rtid: Rtid) {
    super(rtid);
    this._node = node;
    this._frame = frame;
  }

  ownerFrame(): FrameHandler {
    return this._frame;
  }

  get node(): Node {
    return this._node;
  }

  get elem(): Element | null {
    let node: Node | null = this._node;
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode;
    }
    if (node && node.nodeType === Node.ELEMENT_NODE) {
      return node as Element;
    }
    else {
      return null;
    }
  }
  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  nodeName(): string {
    return this._node.nodeName;
  }
  nodeType(): number {
    return this._node.nodeType;
  }
  nodeValue(): string | null {
    return this._node.nodeValue;
  }
  isConnected(): boolean {
    return this._node.isConnected;
  }
  textContent(): string | null {
    return this._node.textContent;
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  getProperty(name: string): any {
    const value = (this._node as any)[name];
    if (value instanceof Element) {
      const ao = ContentUtils.repo.getAOByElement(value);
      if (ao) {
        return ao.rtid;
      }
    }
    // todo: support for other 
    if (typeof value === 'object') {
      throw new Error(`Unsupported property ${name}`);
    }
    return value;
  }
  setProperty(name: string, value: any): void {
    (this._node as any)[name] = value;
  }

  getBoundingClientRect(): RectInfo {
    if (!this._node.isConnected) {
      throw new Error('Node is not connected to the DOM');
    }
    if (this._node.nodeType === Node.TEXT_NODE) {
      const doc = this._node.ownerDocument ?? document;
      const range = doc.createRange();
      range.selectNodeContents(this._node);
      // filter the invisible text
      const rect = range.getBoundingClientRect();
      return Utils.fixRectangle(rect);
    }
    else {
      const elem = this.elem;
      if (!elem) {
        throw new Error('Not ready for getBoundingClientRect');
      }
      const rect = elem.getBoundingClientRect();
      return Utils.fixRectangle(rect);
    }
  }

  getContentClientRect(): RectInfo {
    if (!this._node.isConnected) {
      throw new Error('Node is not connected to the DOM');
    }
    if (this._node.nodeType === Node.TEXT_NODE) {
      return this.getBoundingClientRect();
    }
    else {
      const elem = this.elem;
      if (!elem) {
        throw new Error('Not ready for getContentClientRect');
      }
      return ContentUtils.getContentClientRect(elem);
    }
  }

  async highlight(): Promise<void> {
    const elem = this.elem;
    if (!elem) {
      return;
    }
    if ('scrollIntoViewIfNeeded' in elem) {
      (elem as any).scrollIntoViewIfNeeded();
    }
    else {
      elem.scrollIntoView();
    }
    const rect = this.getBoundingClientRect();
    await ContentUtils.highlightRect(rect);
  }

  dispatchEvent(type: string, options?: Object): void {
    EventSimulator.dispatchEvent(this._node, type, options);
  }

  checkStates(states: ('visible' | 'hidden' | 'enabled' | 'disabled' | 'editable')[]): boolean {
    if (!this._node.isConnected) {
      if (states.includes('hidden') && states.length === 1) {
        return true;
      }
      return false;
    }

    // check 'visible' | 'hidden' 
    let checkVisible = states.includes('visible') ? true : (states.includes('hidden') ? false : undefined);
    if (checkVisible !== undefined) {
      const visible = ContentUtils.isVisibleBasedOnCSS(this.node);
      if (checkVisible !== visible) {
        return false;
      }
    }

    // check 'enabled' | 'disabled'
    let checkEnabled = states.includes('enabled') ? true : (states.includes('disabled') ? false : undefined);
    if (checkEnabled !== undefined) {
      if (this._node.nodeType === Node.ELEMENT_NODE) {
        const elem = this._node as Element;
        const disabled = elem.hasAttribute('disabled') || (elem.hasAttribute('aria-disabled') && elem.getAttribute('aria-disabled')?.toLowerCase() === 'true');
        if (checkEnabled === disabled) {
          return false;
        }
      }
    }

    // check 'editable'
    let checkEditable = states.includes('editable') ? true : undefined;
    if (checkEditable !== undefined) {
      if (this._node.nodeType === Node.ELEMENT_NODE) {
        const elem = this._node as Element;
        const disabled = elem.hasAttribute('disabled') || (elem.hasAttribute('aria-disabled') && elem.getAttribute('aria-disabled')?.toLowerCase() === 'true');
        const readonly = elem.hasAttribute('readonly') || (elem.hasAttribute('aria-readonly') && elem.getAttribute('aria-readonly')?.toLowerCase() === 'true');
        if (disabled || readonly) {
          return false;
        }
        const isEditableElement = elem.nodeName.toLowerCase() === 'input' || elem.nodeName.toLowerCase() === 'textarea' || (elem as HTMLElement).isContentEditable;
        if (!isEditableElement) {
          return false;
        }
      }
    }

    return true;
  }

  requireCDPClick() {
    const node = this._node;
    if (this._hasJsUrl(node) && this._isInShadowRoot(node, 'closed')) {
      return true;
    }
    return false;
  }

  /** ==================================================================================================================== */
  /** ================================================== mouse actions =================================================== */
  /** ==================================================================================================================== */
  hover(options?: { position?: Point }): void {
    const elem = this.elem;
    if (!elem) {
      throw new Error('Not ready for hover');
    }
    const { position } = options || {};
    const { x, y } = this._getClientPoint(this, position);
    EventSimulator.simulateHoverStart(elem, { x, y });
  }
  async click(options?: ClickOptions): Promise<void> {
    const elem = this.elem;
    if (!elem) {
      throw new Error('Not ready for click');
    }
    const { position } = options || {};
    const { x, y } = this._getClientPoint(this, position);
    const clickOption = Object.assign({}, options, { position: { x, y } });
    if (this._hasJsUrl(elem) && !this._isInShadowRoot(elem, 'closed')) {
      const isReady = await ContentUtils.frame.installFrameInMAIN();
      if (!isReady) {
        throw new Error('The frame is not ready in MAIN world');
      }
      ContentUtils.frame.main.clickElement(elem, clickOption);
    }
    else {
      await EventSimulator.simulateClick(elem, clickOption);
    }
  }
  async wheel(options?: { deltaX?: number, deltaY?: number }): Promise<void> {
    const elem = this.elem;
    if (!elem) {
      throw new Error('Not ready for wheel');
    }
    const { x, y } = this._getClientPoint(this);
    const wheelOptions = Object.assign({}, options, { x, y });
    await EventSimulator.dispatchWheelEvent(elem, wheelOptions);
  }
  async dragTo(target: Rtid, options?: { sourcePosition?: Point, targetPosition?: Point, steps?: number }): Promise<void> {
    const elem = this.elem;
    if (!elem) {
      throw new Error('Not ready for dragTo');
    }
    const handler = ContentUtils.repo.getObjectHandler(target.object);
    if (Utils.isNullOrUndefined(handler)) {
      throw new Error("Invalid dragTo target");
    }
    const targetElem = handler.elem;
    let { sourcePosition, targetPosition, steps = 10 } = options || {};
    sourcePosition = this._getClientPoint(this, sourcePosition);
    targetPosition = this._getClientPoint(handler, targetPosition);
    await EventSimulator.simulateDragDrop(elem, targetElem || undefined, { startPoint: sourcePosition, endPoint: targetPosition, steps: steps });
  }
  /** ==================================================================================================================== */
  /** ================================================== touch actions =================================================== */
  /** ==================================================================================================================== */
  async tap(options?: { position?: Point }): Promise<void> {
    const elem = this.elem;
    if (!elem) {
      throw new Error('Not ready for tap');
    }
    const { position } = options || {};
    const { x, y } = this._getClientPoint(this, position);
    await EventSimulator.simulateTap(elem, { x, y });
  }
  /** ==================================================================================================================== */
  /** ================================================ keyboard actions ================================================== */
  /** ==================================================================================================================== */
  async fill(text: string, options?: TextInputOptions): Promise<void> {
    const elem = this.elem;
    if (!elem) {
      throw new Error('Not ready for fill');
    }
    await EventSimulator.simulateSetText(elem, text, options);
  }
  clear(): void {
    const elem = this.elem;
    if (!elem) {
      throw new Error('Not ready for clear');
    }
    (elem as HTMLInputElement | HTMLTextAreaElement).value = '';
  }
  async press(keys: string | string[], options?: { delayBetweenDownUp?: number }): Promise<void> {
    const elem = this.elem;
    if (!elem) {
      throw new Error('Not ready for press');
    }
    await EventSimulator.simulatePressKeys(elem, keys, options);
  }

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
    } else {
      if (propName in this._node) {
        const propValue = (this._node as any)[propName];
        if (typeof propValue === 'function') {
          return propValue();
        }
        return propValue;
      }
    }
    throw new Error(`Unknown property name - ${propName}`);
  }

  /**
   * query automation objects
   * @param desc description for objects
   * @returns automation objects
   */
  protected override async queryObjects(desc: AODesc): Promise<AutomationObject[]> {
    if (desc.type === 'element') {
      const elems = this._queryElements(desc);
      return elems;
    }
    if (desc.type === 'text') {
      const texts = this._queryTexts(desc);
      return texts;
    }
    throw new Error(`Unknown description type - ${desc.type}`);
  }

  /** query elements */
  private _queryElements(desc: AODesc): AutomationObject[] {
    let candidates: Element[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      for (const rtid of desc.rtids) {
        try {
          if (rtid.object >= 1) {
            const elem = ContentUtils.repo.getElementByObjId(rtid.object);
            if (elem) {
              candidates.push(elem);
            }
          }
        } catch (error) {
          this.logger.warn('getElementByObjId: error', error, ' rtid', rtid);
        }
      }
      // find frames via rtids (frame.rtid is set by the init function)
      const frameRtids = desc.rtids.filter(rtid => rtid.object === -1 && rtid.frame > 0);
      if (frameRtids.length > 0) {
        const frameElements = ContentUtils.traverseSelectorAllFrames(document, []);
        for (const frameElement of frameElements) {
          if ('rtid' in frameElement as any) {
            const rtid = (frameElement as any).rtid as Rtid;
            if (frameRtids.find(r => RtidUtils.isRtidEqual(rtid, r))) {
              candidates.push(frameElement);
            }
          }
        }
      }
    }
    else if (desc.queryInfo) {
      let root: Node = this._node || document;
      if (desc.parent) {
        root = ContentUtils.repo.getElementByObjId(desc.parent.object) as Node;
        if (Utils.isNullOrUndefined(root)) {
          throw new Error('Invalid parent element');
        }
      }
      const queryResult = LocatorUtils.queryObjects((selectors) => {
        return this._queryElementsWithSelectors(selectors, root);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      const root: Node = this._node || document;
      const all = ContentUtils.traverseSelectorAllElements(root, []);
      all.forEach((elem) => {
        candidates.push(elem);
      });
    }

    const objects = candidates.map((elem) => {
      const ao = ContentUtils.repo.getAOByElement(elem);
      ao.metaData = usedQueryInfo ? { used: usedQueryInfo } : undefined;
      return ao;
    });
    return objects;
  }

  /** query elements with selectors */
  private _queryElementsWithSelectors(selectors: Selector[], root: Node): Element[] {
    // primary selectors: css/xpath
    let cssSelector: Selector | undefined = undefined;
    let xpathSelector: Selector | undefined = undefined;
    const querySelectors: Selector[] = [];
    for (const selector of selectors) {
      const key = selector.name;
      // use #css and #xpath as the primary selector key to avoid conflict with element attributes
      if (key === '#css') {
        cssSelector = selector;
      }
      else if (key === '#xpath') {
        xpathSelector = selector;
      }
      else {
        querySelectors.push(selector);
      }
    }

    // query elements using id/css/xpath selector
    const candidates: Element[] = [];
    if (cssSelector && cssSelector.value) {
      const container = 'querySelectorAll' in root ? root as ParentNode : document;
      const res = container.querySelectorAll(cssSelector.value as string);
      res.forEach((elem) => {
        candidates.push(elem);
      });
    }
    if (xpathSelector && xpathSelector.value) {
      const container = 'evaluate' in root ? root as Document : document;
      let it = container.evaluate(xpathSelector.value as string, container, null, XPathResult.ANY_TYPE, null);
      let node = it.iterateNext();
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          candidates.push(node as Element);
        }
        node = it.iterateNext();
      }
    }

    if (cssSelector || xpathSelector) {
      return LocatorUtils.filterObjects(candidates, querySelectors);
    }
    else {
      return ContentUtils.traverseSelectorAllElements(root, querySelectors);
    }
  }

  /** query the text */
  private _queryTexts(desc: AODesc): AutomationObject[] {
    let candidates: Node[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;
    if (desc.rtids && desc.rtids.length > 0) {
      for (const rtid of desc.rtids) {
        try {
          const handler = ContentUtils.repo.getObjectHandler(rtid.object);
          if (handler) {
            candidates.push(handler.node);
          }
        } catch (error) {
          this.logger.warn('getObjectHandler: error', error, ' rtid', rtid);
        }
      }
    }
    else if (desc.queryInfo) {
      let root: Node = this._node || document;
      if (desc.parent) {
        const handler = ContentUtils.repo.getObjectHandler(desc.parent.object);
        if (Utils.isNullOrUndefined(handler)) {
          throw new Error('Invalid parent object');
        }
        root = handler.node;
      }
      const queryResult = LocatorUtils.queryObjects((selectors) => {
        return ContentUtils.traverseSelectorAllTextNodes(root, selectors);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      const root: Node = this._node || document;
      const all = ContentUtils.traverseSelectorAllTextNodes(root, []);
      all.forEach((node) => {
        candidates.push(node);
      });
    }

    const objects = candidates.map((node) => {
      const ao = ContentUtils.repo.getAOByTextNode(node);
      ao.metaData = usedQueryInfo ? { used: usedQueryInfo } : undefined;
      return ao;
    });
    return objects;
  }

  /** get the point coordicate to the viewport */
  private _getClientPoint(node?: NodeHandler, offset?: Point): Point {
    node = node ?? this;
    const rect = node.getBoundingClientRect();
    let x = rect.x + rect.width / 2;
    let y = rect.y + rect.height / 2;
    if (offset) {
      x = rect.x + offset.x;
      y = rect.y + offset.y;
    }
    return { x, y }
  }

  protected _hasJsUrl(node: Node | null): boolean {
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as Element;
        if (elem.tagName === 'A') {
          let href = (elem as HTMLAnchorElement).href || '';
          if (href.toLowerCase().startsWith('javascript:')) {
            return true;
          }
        }
      }
      node = node.parentNode;
    }
    return false;
  }

  protected _isInShadowRoot(node: Node | null, mode?: 'open' | 'closed'): boolean {
    while (node) {
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && node instanceof ShadowRoot) {
        const root = node as ShadowRoot;
        if (!mode || mode === root.mode) {
          return true
        }
      }
      node = node.parentNode;
    }
    return false;
  }

}