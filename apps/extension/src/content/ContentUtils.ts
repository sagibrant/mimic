/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ContentUtils.ts
 * @description 
 * Shared utility classes and functions for content
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

import { Utils, LocatorUtils, RectInfo, MessageData, Selector, Dispatcher, DOMElementDescription, AODesc, MsgUtils, AO, RtidUtils, DOMPathUtils, ElementInfo } from "@gogogo/shared";
import { ObjectRepository } from "./ObjectRepository";
import { FrameHandler } from "./handlers/FrameHandler";

export class ContentUtils {
  doNothing(): void { }

  /**
   * Recursively traverse a root (document, element, or shadow root) with TreeWalker to find out matched elements
   * @param node the current node
   * @param selectors the selectors
   * @returns the filtered elements
   */
  static traverseSelectorAllElements(node: Node, selectors: Selector[]): Element[] {
    const result: Element[] = [];

    // First, check the starting node itself if it's an Element with shadowRoot
    if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as Element;
      // Process open shadow root of the starting node if it exists
      const shadowRoot = ContentUtils.getShadowRoot(elem);
      if (shadowRoot) {
        const childNodes = ContentUtils.traverseSelectorAllElements(shadowRoot, selectors);
        result.push(...childNodes);
      }
    }

    const treeWalker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT, // Only consider Element nodes
      undefined // No custom filter here (we'll check attributes manually)
    );

    // Traverse all elements in the root
    let currentNode: Node | null = treeWalker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const elem = currentNode as Element;
        if (LocatorUtils.matchSelectors(elem, selectors)) {
          result.push(elem);
        }
        // Recursively check open shadow roots
        const shadowRoot = ContentUtils.getShadowRoot(elem);
        if (shadowRoot) {
          const childNodes = ContentUtils.traverseSelectorAllElements(shadowRoot, selectors);
          result.push(...childNodes);
        }
      }

      currentNode = treeWalker.nextNode();
    }
    return result;
  }

  /**
   * Recursively traverse a root (document, element, or shadow root) with TreeWalker to find out matched frames elements
   * @param node the current node
   * @param selectors the selectors
   * @returns the filtered frame elements
   */
  static traverseSelectorAllFrames(node: Node, selectors: Selector[]): Element[] {
    const result: Element[] = [];

    // First, check the starting node itself if it's an Element with shadowRoot
    if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as Element;
      // Process open shadow root of the starting node if it exists
      const shadowRoot = ContentUtils.getShadowRoot(elem);
      if (shadowRoot) {
        const childNodes = ContentUtils.traverseSelectorAllFrames(shadowRoot, selectors);
        result.push(...childNodes);
      }
    }

    const treeWalker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT, // Only consider Element nodes
      undefined // No custom filter here (we'll check attributes manually)
    );

    // Traverse all elements in the root
    let currentNode: Node | null = treeWalker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const elem = currentNode as Element;
        if (ContentUtils.elemIsIframe(elem) && LocatorUtils.matchSelectors(elem, selectors)) {
          result.push(elem);
        }
        // Recursively check open shadow roots
        const shadowRoot = ContentUtils.getShadowRoot(elem);
        if (shadowRoot) {
          const childNodes = ContentUtils.traverseSelectorAllFrames(shadowRoot, selectors);
          result.push(...childNodes);
        }
      }

      currentNode = treeWalker.nextNode();
    }
    return result;
  }

  /**
 * Recursively traverse a root (document, element, or shadow root) with TreeWalker to find out matched text nodes
 * @param node the current node
 * @param selectors the selectors
 * @returns the filtered text nodes
 */
  static traverseSelectorAllTextNodes(node: Node, selectors: Selector[]): Node[] {
    const result: Node[] = [];

    // First, check the starting node itself if it's an Element with shadowRoot
    if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as Element;
      // Process open shadow root of the starting node if it exists
      const shadowRoot = ContentUtils.getShadowRoot(elem);
      if (shadowRoot) {
        const childNodes = ContentUtils.traverseSelectorAllTextNodes(shadowRoot, selectors);
        result.push(...childNodes);
      }
    }

    const treeWalker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, // Only consider Element nodes
      undefined // No custom filter here (we'll check attributes manually)
    );

    // Traverse all elements in the root
    let currentNode: Node | null = treeWalker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        const text = currentNode as Node;
        if (LocatorUtils.matchSelectors(text, selectors)) {
          result.push(text);
        }
      }
      else if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const elem = currentNode as Element;
        // Recursively check open shadow roots
        const shadowRoot = ContentUtils.getShadowRoot(elem);
        if (shadowRoot) {
          const childNodes = ContentUtils.traverseSelectorAllTextNodes(shadowRoot, selectors);
          result.push(...childNodes);
        }
      }
      currentNode = treeWalker.nextNode();
    }
    return result;
  }

  /**
  * Recursively traverse a root (document, element, or shadow root) with TreeWalker to find out matched shadow roots
  * @param node the current node
  * @param mode open or closed
  * @returns the filtered shadow roots
  */
  static traverseGetAllShadowRoot(node: Node, mode?: 'open' | 'closed'): ShadowRoot[] {
    const result: ShadowRoot[] = [];

    // First, check the starting node itself if it's an Element with shadowRoot
    if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as Element;
      // Process open shadow root of the starting node if it exists
      const shadowRoot = ContentUtils.getShadowRoot(elem, mode);
      if (shadowRoot) {
        result.push(shadowRoot);
        const childShadowRoots = ContentUtils.traverseGetAllShadowRoot(shadowRoot, mode);
        result.push(...childShadowRoots);
      }
    }

    const treeWalker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT, // Only consider Element nodes
      undefined // No custom filter here (we'll check attributes manually)
    );

    // Traverse all elements in the root
    let currentNode: Node | null = treeWalker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const elem = currentNode as Element;
        // Recursively check open shadow roots
        const shadowRoot = ContentUtils.getShadowRoot(elem, mode);
        if (shadowRoot) {
          result.push(shadowRoot);
          const childShadowRoots = ContentUtils.traverseGetAllShadowRoot(shadowRoot, mode);
          result.push(...childShadowRoots);
        }
      }

      currentNode = treeWalker.nextNode();
    }
    return result;
  }

  /**
   * Get the ShadowRoot from node
   * @param node dom node
   * @returns ShadowRoot or null
   */
  static getShadowRoot(node: Node, mode?: 'open' | 'closed'): ShadowRoot | null {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    const elem = node as Element;
    let openShadowRoot = null;
    if (elem.shadowRoot && elem.shadowRoot instanceof ShadowRoot && elem.shadowRoot.mode === 'open') {
      openShadowRoot = elem.shadowRoot;
    }
    if (mode === 'open' || (!mode && openShadowRoot)) {
      return openShadowRoot;
    }
    if (!openShadowRoot
      && (!mode || mode === 'closed')
      && (elem instanceof HTMLElement && typeof chrome !== 'undefined'
        && !Utils.isNullOrUndefined(chrome?.dom) && Utils.isFunction(chrome.dom.openOrClosedShadowRoot))) {
      const closedShadowRoot = chrome.dom.openOrClosedShadowRoot(elem);
      return closedShadowRoot?.mode === 'closed' ? closedShadowRoot : null;
    }
    return null;
  }

  /**
   * get the element by the given node
   * @param {Node} node 
   * @returns {Element|undefined}
   */
  static getElementByNode(node: Node): Element | undefined {
    let elem = node;
    while (elem.nodeType !== Node.ELEMENT_NODE && elem.parentElement) {
      elem = elem.parentElement;
    }
    if (elem.nodeType !== Node.ELEMENT_NODE) {
      return undefined;
    }
    return elem as Element;
  }

  /**
   * get the document of the given node
   * @param {Node} node 
   * @returns {HTMLDocument|ShadowRoot}
   */
  static getDocumentObjectByNode(node: Node): HTMLDocument | ShadowRoot {
    let curNode = node;
    while (curNode) {
      if (curNode.nodeType === Node.DOCUMENT_NODE) {
        return curNode as HTMLDocument;
      }
      else if ('shadowRoot' in curNode
        && curNode.shadowRoot instanceof ShadowRoot
        && curNode.shadowRoot.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        return curNode.shadowRoot as ShadowRoot;
      }

      if (curNode.parentNode) {
        curNode = curNode.parentNode;
      }
      else {
        break;
      }
    }
    return document;
  }

  /**
   * get the element info
   * @param elem dom element
   * @returns 
   */
  static async getElementInfo(elem: Element): Promise<ElementInfo | null> {
    const details = DOMPathUtils.getDOMNodeDetails(elem);
    const aoDesc = await ContentUtils.generateAODesc(elem, details);
    if (!aoDesc) return null;
    const scripts = await ContentUtils.generateElementScript(aoDesc);
    const ao = ContentUtils.repo.getAOByElement(elem);
    const elemInfo: ElementInfo = {
      element: details,
      elementRtid: ao.rtid,
      elementScript: scripts
    };
    return elemInfo;
  }

  /**
   * generate the AO Description
   * @param elem dom element
   * @param desc dom element description
   * @returns 
   */
  static async generateAODesc(elem: Element, desc: DOMElementDescription): Promise<AODesc | null> {
    const ao = ContentUtils.repo.getAOByElement(elem);
    const aoDesc: AODesc = { type: 'element' };
    aoDesc.queryInfo = {};

    const matchAO = async (aoDesc: AODesc, ordinal: boolean = true): Promise<boolean> => {
      aoDesc.queryInfo = aoDesc.queryInfo || {};
      let aos = await ContentUtils.queryObjects(aoDesc);
      if (aos.length === 1 && RtidUtils.isRtidEqual(aos[0].rtid, ao.rtid)) {
        return true;
      }
      else if (aos.length > 1 && ordinal && Utils.isNullOrUndefined(aoDesc.queryInfo.ordinal)) {
        const index = aos.findIndex(a => RtidUtils.isRtidEqual(a.rtid, ao.rtid));
        if (index >= 0) {
          aoDesc.queryInfo.ordinal = { type: 'default', index: index, reverse: false };
          aos = await this.queryObjects(aoDesc);
          if (aos.length === 1 && RtidUtils.isRtidEqual(aos[0].rtid, ao.rtid)) {
            return true;
          }
        }
        aoDesc.queryInfo.ordinal = undefined;
      }
      return false;
    };

    // if in the shadow DOM, use mandatory selector + nth
    // if not in the shadow DOM, use primary css selector + nth
    if (desc.isInShadowRoot !== true) {
      // try with css selector
      aoDesc.queryInfo.primary = [{ name: '#css', value: desc.selector, type: 'property', match: 'exact' }];
      let matched = await matchAO(aoDesc);
      if (matched) {
        return aoDesc;
      }
      // try with xpath
      aoDesc.queryInfo.primary = [{ name: '#xpath', value: desc.xPath, type: 'property', match: 'exact' }];
      matched = await matchAO(aoDesc);
      if (matched) {
        return aoDesc;
      }
      // remove primary if not found
      aoDesc.queryInfo.primary = undefined;
    }

    // try mandatory selectors
    const mandatorySelectors: Selector[] = [];
    {
      if (desc.tagName) {
        mandatorySelectors.push({ name: 'tagName', value: desc.tagName, type: 'property', match: 'exact' });
      }
      if (desc.nodeValue) {
        mandatorySelectors.push({ name: 'nodeValue', value: desc.nodeValue, type: 'property', match: 'exact' });
      }
      if (desc.textContent) {
        mandatorySelectors.push({ name: 'textContent', value: desc.textContent, type: 'property', match: 'exact' });
      }
      if (desc.attributes && Object.keys(desc.attributes).length > 0) {
        const attrs = Object.entries(desc.attributes);
        for (const [name, value] of attrs) {
          mandatorySelectors.push({ name: name, value: value, type: 'attribute', match: 'exact' });
        }
      }

      for (let i = 1; i <= mandatorySelectors.length; i++) {
        const combinations = Utils.getCombinations(mandatorySelectors, i);
        for (const combo of combinations) {
          aoDesc.queryInfo.mandatory = combo;
          const matched = await matchAO(aoDesc);
          if (matched) {
            return aoDesc;
          }
        }
      }
      aoDesc.queryInfo.mandatory = undefined;
    }

    // last try with tagName only
    if (desc.tagName) {
      aoDesc.queryInfo.mandatory = [{ name: 'tagName', value: desc.tagName, type: 'property', match: 'exact' }];
      const matched = await matchAO(aoDesc);
      if (matched) {
        return aoDesc;
      }
    }

    if (mandatorySelectors.length > 0) {
      aoDesc.queryInfo.assistive = mandatorySelectors;
      const matched = await matchAO(aoDesc, false);
      if (matched) {
        return aoDesc;
      }
    }

    // Fail to generate unique AODesc for element
    return null;
  }

  /**
   * query the AO in this frame
   * @param desc AO Description
   * @returns 
   */
  static async queryObjects(desc: AODesc): Promise<AO[]> {
    const frameRtid = ContentUtils.frame.rtid;
    const reqMsgData = MsgUtils.createMessageData('query', frameRtid, { name: 'query_objects' }, desc);
    const resMsgData = await ContentUtils.sendRequest(reqMsgData);
    if (resMsgData.status === 'OK' && resMsgData.objects) {
      return resMsgData.objects;
    }
    else {
      return [];
    }
  }

  /**
   * generate the element script like element('#id').first()
   * @param aoDesc AO Description
   * @returns 
   */
  static async generateElementScript(aoDesc: AODesc): Promise<string> {
    const scripts: string[] = [];
    if (aoDesc.queryInfo && aoDesc.queryInfo.primary && aoDesc.queryInfo.primary.length === 1) {
      const primary = aoDesc.queryInfo.primary[0];
      if (primary.name === '#css') {
        scripts.push(`element('${String(primary.value)}')`);
      }
      else if (primary.name === '#xpath') {
        scripts.push(`element({ xpath: '${String(primary.value)}'})`);
      }
      else {
        scripts.push(`element()`);
      }
    }
    if (scripts.length === 0) {
      scripts.push(`element()`);
    }
    if (aoDesc.queryInfo && aoDesc.queryInfo.mandatory && aoDesc.queryInfo.mandatory.length > 0) {
      const filters: object[] = [];
      for (const selector of aoDesc.queryInfo.mandatory) {
        const filterObj = Object.assign({},
          { name: selector.name, value: selector.value },
          selector.type === 'property' ? {} : { type: selector.type },
          selector.match === 'exact' ? {} : { match: selector.match },
        );
        filters.push(filterObj);
      }
      scripts.push(`filter(${JSON.stringify(filters)})`);
    }
    if (aoDesc.queryInfo && aoDesc.queryInfo.assistive && aoDesc.queryInfo.assistive.length > 0) {
      const filters: object[] = [];
      for (const selector of aoDesc.queryInfo.assistive) {
        const filterObj = Object.assign({},
          { name: selector.name, value: selector.value },
          selector.type === 'property' ? {} : { type: selector.type },
          selector.match === 'exact' ? {} : { match: selector.match },
        );
        filters.push(filterObj);
      }
      scripts.push(`prefer(${JSON.stringify(filters)})`);
    }
    if (aoDesc.queryInfo && aoDesc.queryInfo.ordinal) {
      if (aoDesc.queryInfo.ordinal.index === 0 && aoDesc.queryInfo.ordinal.reverse === false) {
        scripts.push(`first()`);
      }
      else if (aoDesc.queryInfo.ordinal.index === 0 && aoDesc.queryInfo.ordinal.reverse === true) {
        scripts.push(`last()`);
      }
      else {
        scripts.push(`nth(${aoDesc.queryInfo.ordinal.index})`);
      }
    }
    return scripts.join('.');
  }

  /**
   * get the client rect of the element content
   * @param elem dom element
   * @returns 
   */
  static getContentClientRect(elem: Element): RectInfo {
    const boundingClientRect = elem.getBoundingClientRect();
    const elemRect: Partial<RectInfo> = {};
    elemRect.left = boundingClientRect.left;
    elemRect.top = boundingClientRect.top;
    elemRect.right = boundingClientRect.right;
    elemRect.bottom = boundingClientRect.bottom;
    // border offset
    const client_rect: Partial<RectInfo> = {};
    client_rect.left = elem.clientLeft;
    client_rect.top = elem.clientTop;
    client_rect.width = elem.clientWidth;
    client_rect.height = elem.clientHeight;
    // padding offset
    const style = window.getComputedStyle(elem);
    elemRect.left = elemRect.left + client_rect.left + parseInt(style.paddingLeft, 10);
    elemRect.top = elemRect.top + client_rect.top + parseInt(style.paddingTop, 10);
    elemRect.right = elemRect.left + client_rect.width;
    elemRect.bottom = elemRect.top + client_rect.height;
    return Utils.fixRectangle(elemRect);
  }

  /**
   * check if the node is visible according to the css
   * @param {Node} node 
   * @returns {boolean}
   */
  static isVisibleBasedOnCSS(node: Node): boolean {
    if (!node) {
      return false;
    }
    const elem = ContentUtils.getElementByNode(node);
    if (!elem || elem.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    const style = getComputedStyle(elem, null);
    if (!style) {
      return false;
    }
    // these styles will cause the element and the following childNodes invisible
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    // display:contents is not rendered, but its child nodes are. 
    // So the rect for display:contents is zero, but the children will be visible and not zero rect
    if (style.display === 'contents') {
      // display:contents is not rendered itself, but its child nodes are.
      let hasVisibleChild = false;
      for (let child = elem.firstChild; child; child = child?.nextSibling || null) {
        if (!child) break;
        if (child.nodeType === Node.ELEMENT_NODE && ContentUtils.isVisibleBasedOnCSS(child as Element)) {
          hasVisibleChild = true;
          break;
        }
        else if (child.nodeType === Node.TEXT_NODE) {
          const doc = child.ownerDocument ?? document;
          const range = doc.createRange();
          range.selectNode(child);
          const rect = range.getBoundingClientRect();
          if (ContentUtils.isRectangleVisible(rect)) {
            hasVisibleChild = true;
            break;
          }
        }
      }
      if (!hasVisibleChild) {
        return false;
      }
    }

    // handle style with clip
    if (style.position === 'absolute' || style.position === 'fixed') {
      let rect: RectInfo | undefined = undefined;
      const clip = style.clip;
      if (clip && clip !== 'auto' && clip !== 'inherit') {
        const match = clip.match(/rect\(([^)]+)\)/);
        if (match) {
          const values = match[1].split(',').map(value => parseInt(value.trim(), 10));
          if (values.length === 4) {
            const tmp = {
              top: values[0],
              right: values[1],
              bottom: values[2],
              left: values[3],
            };
            rect = Utils.fixRectangle(tmp);
          }
        }
      }
      if (rect && !ContentUtils.isRectangleVisible(rect)) {
        return false;
      }
      rect = undefined
      // Check for 'clip-path' property (inset format)
      const clipPath = style.clipPath;
      if (clipPath && clipPath.startsWith('inset')) {
        const match = clipPath.match(/inset\(([^)]+)\)/);
        if (match) {
          const values = match[1].split(' ').map(value => parseInt(value.trim(), 10));
          if (values.length === 4) {
            const tmp = {
              top: values[0],
              right: values[1],
              bottom: values[2],
              left: values[3]
            };
            rect = Utils.fixRectangle(tmp);
          }
        }
      }
      if (rect && !ContentUtils.isRectangleVisible(rect)) {
        return false;
      }
    }

    const rect = elem.getBoundingClientRect();
    if (!ContentUtils.isRectangleVisible(rect) && !style.overflow.includes('visible')) {
      return false;
    }

    return true;
  }

  /**
   * check if the current node is visible on the current viewport (do not use this method for non leaf nodes)
   * @param {Node} node 
   * @returns {boolean}
   */
  static isVisibleOnViewPort(node: Node): boolean {
    if (!node) {
      return false;
    }
    const elem = ContentUtils.getElementByNode(node);
    if (!elem || elem.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    const style = getComputedStyle(elem, null);
    if (!style) {
      return false;
    }
    if (!ContentUtils.isVisibleBasedOnCSS(node)) {
      return false;
    }

    // checking the parents if the position depends on the parent
    if (style.position !== 'fixed' && style.position !== 'absolute') {
      let isParentNotVisible = false;
      let parent = elem.parentElement;
      while (parent) {
        const parentStyle = getComputedStyle(parent, null);
        if (parentStyle && (parentStyle.position === 'fixed' || parentStyle.position === 'absolute')) {
          isParentNotVisible = false;
          break;
        }
        if (!ContentUtils.isVisibleBasedOnCSS(parent)) {
          isParentNotVisible = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (isParentNotVisible) {
        return false;
      }
    }

    const rect = elem.getBoundingClientRect();
    if (!ContentUtils.isRectangleVisible(rect)) {
      return false;
    }

    return true;
  }

  /**
   * check if the rectangle area of the node is visible on the current viewport based on the inspect simulation
   * @param {Node} node 
   * @param {RectInfo} rect 
   * @returns {boolean}
   */
  static isVisibleUsingInspect(node: Node, rect: RectInfo): boolean {
    const center_x = (rect.right + rect.left) / 2;
    const center_y = (rect.bottom + rect.top) / 2;
    if (center_x < 0 || center_y < 0) {
      return false;
    }
    const elem = ContentUtils.getElementByNode(node);
    if (!elem) {
      return false;
    }
    const doc = ContentUtils.getDocumentObjectByNode(node);
    if (!doc) {
      return false;
    }
    const pointedElem = doc.elementFromPoint(center_x, center_y);
    if (pointedElem && elem === pointedElem) {
      return true;
    }
    if (pointedElem && elem !== pointedElem) {
      const style = getComputedStyle(elem);
      if (style && style.pointerEvents === 'none') {
        return true;
      }
    }

    if (doc.elementsFromPoint) {
      const elems = doc.elementsFromPoint(center_x, center_y);
      if (elems.length > 0 && elems.indexOf(elem) >= 0) {
        // there might be Pseudo-elements (e.g. ::before, ::after)
        if (pointedElem && elems.indexOf(pointedElem) >= 0) {
          const index_elem = elems.indexOf(elem);
          const index_pointed = elems.indexOf(pointedElem);
          const index_last_pointed = elems.lastIndexOf(pointedElem);
          // [pseudo-element of parent, elem, parent, xxx]
          if (index_last_pointed > index_pointed && index_pointed < index_elem && index_last_pointed > index_elem) {
            return true;
          }
        }
        // all the above elements might be transparent
        for (let i = 0; i < elems.length; i++) {
          if (elems[i] === elem) {
            return true;
          }
          const style = getComputedStyle(elems[i]);
          const backgroundColor = style.backgroundColor;
          const rgbaMatch = backgroundColor.match(/^rgba\((\d+), (\d+), (\d+), (\d?\.?\d+)\)$/); // by default 'rgba(0, 0, 0, 0)'
          const isAlphaZero = rgbaMatch && rgbaMatch.length > 4 && parseFloat(rgbaMatch[4]) < 0.5; // Check alpha value
          const opacity = style.opacity || '0';
          const isOpacity = parseFloat(opacity) < 0.5;
          if (isOpacity || (style.backgroundImage === 'none' && isAlphaZero)) {
            continue;
          } else {
            break;
          }
        }
      }
    }

    return false;
  }

  /**
   * check if the rectangle is visible
   * @param {object} rect 
   * @returns {boolean}
   */
  static isRectangleVisible(rect: RectInfo): boolean {
    const temp = Utils.fixRectangle(rect);
    if (!temp) {
      return false;
    }
    if (temp.width <= 1 || temp.height <= 1) {
      return false;
    }
    if (temp.right <= 1 && temp.bottom <= 1) {
      return false;
    }
    return true;
  }

  /**
   * check if the text is noise after trimmed
   * @param {string} text 
   * @returns {boolean}
   */
  static isTrimNoise(text: string): boolean {
    if (typeof (text) !== 'string') {
      return true;
    }
    text = text.replace(/\n|\r/gm, '');
    text = text.replace(/\t/g, ' ');
    text = text.replace(/\xa0/g, ' '); // replace '&nbsp;' with ' '
    text = text.replace(/ +/g, ' ');
    if (text.trim() === '') {
      return true;
    }
    return false;
  }

  static elemIsIframe(elem: Element): boolean {
    const tagName = elem.tagName;
    return tagName === 'IFRAME' ||
      tagName === "FRAME" ||
      (tagName === "OBJECT" && 'contentWindow' in elem);
  }

  static getFrameUrl(elem: Element): string {
    if (!ContentUtils.elemIsIframe(elem)) {
      return '';
    }
    let url = '';
    if (elem.tagName === 'IFRAME' || elem.tagName === 'FRAME') {
      url = (elem as HTMLIFrameElement).src;
    }
    else if (elem.tagName === 'OBJECT') {
      url = (elem as HTMLObjectElement).data;
    }
    if (Utils.isEmpty(url) && 'url' in elem) {
      url = (elem as unknown as Record<string, unknown>)['url'] as string;
    }
    return url;
  }

  static isSpecialUninjectablePage(): boolean {
    const protocol = location.protocol;
    if (protocol === "chrome-extension:" || protocol === "chrome:" || protocol === "edge:") {
      return true;
    }
    return false;
  }

  static getLogicName(elem: Element): string {

    let name: string | undefined | null = undefined;

    if (elem.hasAttribute('name')) {
      name = elem.getAttribute('name');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('acc_name')) {
      name = elem.getAttribute('acc_name');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('aria-label')) {
      name = elem.getAttribute('aria-label');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('aria-labelledby')) {
      name = elem.getAttribute('aria-labelledby');
      if (name && elem.tagName) {
        return name + '_' + elem.tagName;
      }
    }

    if (elem.hasAttribute('title')) {
      name = elem.getAttribute('title');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('id')) {
      name = elem.getAttribute('id');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('alt')) {
      name = elem.getAttribute('alt');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('placeholder')) {
      name = elem.getAttribute('placeholder');
      if (name) {
        return name;
      }
    }

    if (elem.hasAttribute('role')) {
      name = elem.getAttribute('role');
      if (name) {
        return name;
      }
    }

    if (elem.tagName === 'INPUT' && !Utils.isEmpty(elem.nodeValue)) {
      name = elem.nodeValue;
      if (name) {
        return name;
      }
    }

    if (!Utils.isEmpty(elem.textContent)) {
      name = elem.textContent;
      if (name) {
        return name;
      }
    }

    return elem.tagName ?? 'element';
  }

  static getAttributes(elem: Element): Record<string, unknown> {
    const attrs: Record<string, unknown> = {};
    const attrNames = elem.getAttributeNames();
    for (const attrName of attrNames) {
      const attrValue = elem.getAttribute(attrName);
      attrs[attrName] = attrValue;
    }
    return attrs;
  }

  static async highlightRect(rect: RectInfo): Promise<void> {
    // outlineColor = {r:108, g:170, b:78, a:0};
    // color = {r:108, g:170, b:78, a:0.4};
    // outlineColor =  {r:18, g:110, b:198, a: 0};
    // color = {r:18, g:110, b:198, a: 0.4};
    // outlineColor = {r:240, g:125, b:10, a:0};
    // color = {r:240, g:125, b:10, a:0.4};
    const outlineColor = { r: 255, g: 210, b: 88, a: 0 };
    const color = { r: 255, g: 210, b: 88, a: 0.4 };
    const rect_elem = document.createElement('canvas');
    rect_elem.style.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    rect_elem.style.border = `4px solid rgba(${outlineColor.r}, ${outlineColor.g}, ${outlineColor.b}, ${outlineColor.a})`;
    rect_elem.style.boxSizing = 'content-box';
    rect_elem.style.left = (rect.left - 4 > 0 ? rect.left - 4 : 0) + 'px';
    rect_elem.style.top = (rect.top - 4 > 0 ? rect.top - 4 : 0) + 'px';
    rect_elem.style.width = rect.width + 'px';
    rect_elem.style.height = rect.height + 'px';
    rect_elem.style.margin = '0px';
    rect_elem.style.padding = '0px';
    rect_elem.style.position = 'fixed';
    rect_elem.style.zIndex = '999999999';
    rect_elem.dir = 'ltr';
    document.body.appendChild(rect_elem);
    for (let i = 0; i < 3; i++) {
      rect_elem.style.display = 'block';
      await Utils.wait(300);
      rect_elem.style.display = 'none';
      await Utils.wait(200);
    }
    document.body.removeChild(rect_elem);
  }

  static iframeXpathSelector: string = "//iframe | //frame | //object";
  static iframeCssSelector: string = 'iframe,frame,object';

  static async sendEvent(msgData: MessageData, timeout?: number): Promise<void> {
    await ContentUtils.dispatcher.sendEvent(msgData, timeout);
  }

  static async sendRequest(msgData: MessageData, timeout?: number): Promise<MessageData> {
    const result = await ContentUtils.dispatcher.sendRequest(msgData, timeout);
    return result;
  }

  /** ==================================================================================================================== **/
  /** ==================================================== properties ==================================================== **/
  /** ==================================================================================================================== **/
  private static _dispatcher: Dispatcher;
  private static _repo: ObjectRepository;
  private static _frame: FrameHandler;

  static set dispatcher(dispatcher: Dispatcher) {
    ContentUtils._dispatcher = dispatcher;
  }
  static get dispatcher(): Dispatcher {
    if (Utils.isNullOrUndefined(ContentUtils._dispatcher)) {
      throw new Error('The dispatcher is not ready');
    }
    return ContentUtils._dispatcher;
  }

  static set repo(repo: ObjectRepository) {
    ContentUtils._repo = repo;
  }
  static get repo(): ObjectRepository {
    if (Utils.isNullOrUndefined(ContentUtils._repo)) {
      throw new Error('The repo is not ready');
    }
    return ContentUtils._repo;
  }

  static set frame(frame: FrameHandler) {
    ContentUtils._frame = frame;
  }
  static get frame(): FrameHandler {
    if (Utils.isNullOrUndefined(ContentUtils._frame)) {
      throw new Error('The frame is not ready');
    }
    return ContentUtils._frame;
  }

}
