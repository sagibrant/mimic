/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file FrameHandler.ts
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

import { MsgUtils, RtidUtils, Utils, AODesc, AutomationObject, QueryInfo, Rtid, Selector, LocatorUtils, MsgDataHandlerBase, RectInfo, ElementInfo } from "@mimic-sdk/core";
import { ContentUtils } from "../ContentUtils";
import * as CoordinateUtils from "../CoordinateUtils";
import { FrameInfo } from "../../background/api/BrowserWrapperTypes";
import { Recorder } from "../Recorder";
import { FrameInMAIN } from "../FrameInMAIN";

export class FrameHandler extends MsgDataHandlerBase {
  private readonly _isPage: boolean;
  private readonly _recorder: Recorder;
  private readonly _main: FrameInMAIN;

  constructor() {
    const rtid = RtidUtils.getTabRtid(-1, -1);
    rtid.context = 'content';
    super(rtid);
    this._isPage = window.top === window;
    this._recorder = new Recorder();
    this._main = new FrameInMAIN();
  }

  async init(tabId: number, frameId: number): Promise<void> {
    this.rtid.tab = tabId;
    // sometimes chrome return frameId != 0 if navigated from build-in pages
    this.rtid.frame = this._isPage ? 0 : frameId;
    window.addEventListener('message', (event) => {
      const data = Utils.deepClone(event.data);
      if (!(event.source && 'parent' in event.source && event.source.parent === window
        && !Utils.isNullOrUndefined((data as any).rtid) && RtidUtils.isRtid(data.rtid) && data.rtid.frame > 0)) {
        this.logger.debug('Frame.init: receive unexpected message from other window', event);
        return;
      }
      const frames = ContentUtils.traverseSelectorAllFrames(document, []);
      try {
        for (const frame of frames) {
          if ('contentWindow' in frame && frame.contentWindow === event.source) {
            (frame as any).rtid = data.rtid;
            this.logger.debug('Frame.init: set frame element ', frame, ' with rtid', data.rtid);
          }
        }
      } catch (error) {
        this.logger.error('init: error ', error);
      }
    });
    if (!this._isPage) {
      // register the current frame to parent frame with rtid
      window.parent.postMessage({ rtid: this.rtid }, '*');
    }
  }

  async installFrameInMAIN(): Promise<boolean> {
    try {
      let ready = this._main.isReady();
      if (!ready) {
        this._main.init();
        const codeUrl = chrome.runtime.getURL('frame-in-main-loader.js');
        const response = await fetch(codeUrl);
        if (!response.ok) {
          throw new Error(`resource error: status - ${response.status}`);
        }
        const codes = await response.text();
        const script = `(function(){
          ${codes}
        })()`;
        const frameId = this.rtid.frame;
        await this._invokeTabMethod('executeScript', [script, frameId]);
        ready = this._main.isReady();
      }
      return ready;
    }
    catch (error) {
      this.logger.error('installFrameInMAIN', error);
      return false;
    }
  }

  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/

  get main(): FrameInMAIN {
    return this._main;
  }
  rect(): RectInfo {
    const boundingClientRect = document.documentElement.getBoundingClientRect();
    const rect = {
      top: 0,
      left: 0,
      width: boundingClientRect.width,
      height: boundingClientRect.height,
    } as RectInfo;
    return Utils.fixRectangle(rect);
  }

  screenRect(pageZoomFactor: number, isMaximized?: boolean, desktopScaleFactor?: number): RectInfo {
    return CoordinateUtils.getPageRect(pageZoomFactor, isMaximized, desktopScaleFactor);
  }

  windowRect(): RectInfo {
    const rect = {
      top: window.screenY,
      left: window.screenX,
      right: window.screenX + window.outerWidth,
      bottom: window.screenY + window.outerHeight,
      width: window.outerWidth,
      height: window.outerHeight
    } as RectInfo;
    return Utils.fixRectangle(rect);
  }

  windowScreenRect(pageZoomFactor: number): RectInfo {
    const deviceScaleFactor = window.devicePixelRatio / pageZoomFactor;
    const rect = {
      top: Math.floor(window.screenY * deviceScaleFactor),
      left: Math.floor(window.screenX * deviceScaleFactor),
      right: Math.ceil((window.screenX + window.outerWidth) * deviceScaleFactor),
      bottom: Math.ceil((window.screenY + window.outerHeight) * deviceScaleFactor),
    } as RectInfo;
    return Utils.fixRectangle(rect);
  }

  querySelectorAll(selector: string): Rtid[] {
    const results: Rtid[] = [];
    const elems = document.querySelectorAll(selector);
    elems.forEach((elem) => {
      const ao = ContentUtils.repo.getAOByElement(elem);
      if (ao) {
        results.push(ao.rtid);
      }
    });
    return results;
  }

  async navigate(url: string): Promise<void> {
    if (!Utils.isNullOrUndefined((window as any).navigation) && Utils.isFunction((window as any).navigation.navigate)) {
      (window as any).navigation.navigate(url);
    }
    else {
      // use window.location.href = url to do the navigation
      window.location.href = url;
    }
  }

  async updateFrameInfos(frameInfos: FrameInfo[]): Promise<void> {
    const unmatched_frameInfos = Utils.deepClone(frameInfos);
    const unregister_frameElements = [];
    const frameElements = ContentUtils.traverseSelectorAllFrames(document, []);
    for (const frameElement of frameElements) {
      if ('rtid' in frameElement && RtidUtils.isRtid(frameElement.rtid)) {
        const rtid = frameElement.rtid as Rtid;
        const index = unmatched_frameInfos.findIndex(f => f.frameId === rtid.frame);
        if (index >= 0) {
          const matchedFrameInfo = unmatched_frameInfos[index];
          // set url so that the query with url can work
          (frameElement as any).url = matchedFrameInfo.url;
          unmatched_frameInfos.splice(index, 1);
        }
        else {
          this.logger.warn('Find a frame: ', frameElement, 'with rtid:', frameElement.rtid, ' , but no background frameInfo');
        }
      }
      else {
        unregister_frameElements.push(frameElement);
      }
    }
    // match unmatched_frameInfos & unregister_frame with url
    for (const frameElement of unregister_frameElements) {
      let url = ContentUtils.getFrameUrl(frameElement);
      const index = unmatched_frameInfos.findIndex(f => f.url === url);
      if (index >= 0) {
        const matchedFrameInfo = unmatched_frameInfos[index];
        const frameRtid = Utils.deepClone(this.rtid);
        frameRtid.frame = matchedFrameInfo.frameId;
        // set rtid & url so that the query with url can work
        (frameElement as any).url = matchedFrameInfo.url;
        (frameElement as any).rtid = frameRtid;
        unmatched_frameInfos.splice(index, 1);
      }
    }
  }

  async getContentFrameRtid(rtid: Rtid): Promise<Rtid | null> {
    const elem = ContentUtils.repo.getElementByObjId(rtid.object);
    if (Utils.isNullOrUndefined(elem)) {
      throw new Error('Invalid Element');
    }
    if (ContentUtils.elemIsIframe(elem)) {
      const frameElement = elem;
      if ('rtid' in frameElement && RtidUtils.isRtid(frameElement.rtid)) {
        return frameElement.rtid;
      }
      else {
        throw new Error('Frame is not registered');
      }
    }
    else {
      return null;
    }
  }

  async getOwnerElementRtid(rtid: Rtid): Promise<Rtid> {
    const frameElements = ContentUtils.traverseSelectorAllFrames(document, []);
    const unregister_frame = [];
    for (const frameElement of frameElements) {
      if ('rtid' in frameElement && RtidUtils.isRtid(frameElement.rtid)) {
        if (RtidUtils.isRtidEqual(frameElement.rtid, rtid)) {
          const elem = frameElement;
          const ao = ContentUtils.repo.getAOByElement(elem);
          if (ao) {
            return ao.rtid;
          }
        }
      }
      else {
        this.logger.warn('Unexpected Error: the frame is not registered', frameElement);
        unregister_frame.push(frameElement);
      }
    }
    // todo: try get rtid by post message or filter by url on unregister_frame
    throw new Error('Invalid Frame');
  }

  async startRecording(): Promise<void> {
    await this._recorder.startRecording();
  }

  async stopRecording(): Promise<void> {
    await this._recorder.stopRecording();
  }

  async getElementFromPoint(x: number, y: number, width?: number, height?: number, doc: Document | ShadowRoot = document): Promise<ElementInfo | null> {
    const elems = doc.elementsFromPoint(x, y);
    if (elems.length <= 0) {
      return null;
    }
    const candidates: { elemInfo: ElementInfo, offsetX: number, offsetY: number }[] = [];
    for (const elem of elems) {
      // skip Pseudo-elements
      if (elem.nodeType !== Node.ELEMENT_NODE || elem.nodeName.startsWith(':')) {
        continue;
      }
      // getElementFromPoint in frame
      if (ContentUtils.elemIsIframe(elem)) {
        const frameElement = elem;
        if ('rtid' in frameElement && RtidUtils.isRtid(frameElement.rtid)) {
          const rtid = frameElement.rtid as Rtid;
          const clientRect = ContentUtils.getContentClientRect(frameElement);
          const clientX = x - clientRect.x;
          const clientY = y - clientRect.y;
          try {
            const result = await this._invokeMethod(rtid, "getElementFromPoint", [clientX, clientY, width, height]);
            if (result) {
              return result as ElementInfo;
            }
          }
          catch { }
        }
      }
      // getElementFromPoint in shadowRoot
      const shadowRoot = ContentUtils.getShadowRoot(elem);
      if (shadowRoot) {
        if (shadowRoot === doc) {
          break;
        }
        const result = await this.getElementFromPoint(x, y, width, height, shadowRoot);
        if (result) {
          return result;
        }
      }
      // check width & height
      const elemInfo = await ContentUtils.getElementInfo(elem);
      if (!elemInfo) {
        continue;
      }
      if (!Utils.isNullOrUndefined(width) && !Utils.isNullOrUndefined(height)) {
        const rect = elem.getBoundingClientRect();
        const offsetX = rect.width - width;
        const offsetY = rect.height - height;
        if (Math.abs(offsetX) < 20 && Math.abs(offsetY) < 20) {
          candidates.push({ elemInfo, offsetX, offsetY });
        }
      }
      else {
        candidates.push({ elemInfo, offsetX: 0, offsetY: 0 });
      }
    }
    if (candidates.length <= 0) {
      return null;
    }
    const elem = candidates.reduce((pre, cur) => {
      const pre_offset = pre.offsetX ** 2 + pre.offsetY ** 2;
      const cur_offset = cur.offsetX ** 2 + cur.offsetY ** 2;
      return pre_offset > cur_offset ? cur : pre;
    }, candidates[0]);
    return elem.elemInfo;
  }

  async inspectNode(node: Node) {
    const elem = ContentUtils.getElementByNode(node);
    if (!elem) return;
    const elemInfo = await ContentUtils.getElementInfo(elem);
    if (!elemInfo) return;
    const frameRtid = ContentUtils.frame.rtid;
    const rtid = RtidUtils.getTabRtid(frameRtid.tab, -1);
    const msgData = MsgUtils.createMessageData('record', rtid, { name: 'inspect_object', params: { elem: elemInfo } });
    await ContentUtils.sendEvent(msgData);
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
      parentRtid.frame = -1;
      return parentRtid;
    }
    else if (propName === 'device_pixel_ratio' || propName === 'devicePixelRatio') {
      return window.devicePixelRatio;
    }
    else if (propName === 'content') {
      return document.documentElement.outerHTML;
    }
    else {
      if (propName in document) {
        const propValue = (document as any)[propName];
        if (typeof propValue === 'function') {
          return propValue();
        }
        return propValue;
      }
      else if (propName in window) {
        const propValue = (window as any)[propName];
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
    if (desc.type === 'frame') {
      const frames = this._queryFrames(desc);
      return frames;
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
          const elem = ContentUtils.repo.getElementByObjId(rtid.object);
          if (elem) {
            candidates.push(elem);
          }
        } catch (error) {
          this.logger.warn('getElementByObjId: error ', error, ' rtid', rtid);
        }
      }
    }
    else if (desc.queryInfo) {
      let root: Node = document;
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
      const all = ContentUtils.traverseSelectorAllElements(document, []);
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

  /** query frames */
  private _queryFrames(desc: AODesc): AutomationObject[] {
    // todo: add frame element attribute filters
    let candidates: Element[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      const frameRtids = desc.rtids.filter(rtid => rtid.object === -1 && rtid.frame >= 0);
      if (frameRtids.length > 0) {
        const frameElements = ContentUtils.traverseSelectorAllFrames(document, []);
        for (const frameElement of frameElements) {
          if ('rtid' in frameElement && RtidUtils.isRtid(frameElement.rtid)) {
            const rtid = (frameElement as any).rtid as Rtid;
            if (frameRtids.find(r => RtidUtils.isRtidEqual(rtid, r))) {
              candidates.push(frameElement);
            }
          }
        }
      }
    }
    else if (desc.queryInfo) {
      let root: Node = document;
      if (desc.parent) {
        root = ContentUtils.repo.getElementByObjId(desc.parent.object) as Node;
        if (Utils.isNullOrUndefined(root)) {
          throw new Error('Invalid parent element');
        }
      }
      const queryResult = LocatorUtils.queryObjects((selectors) => {
        return this._queryFrameElementsWithSelectors(selectors, root);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      candidates = ContentUtils.traverseSelectorAllFrames(document, []);
    }

    candidates = candidates.filter(f => ContentUtils.elemIsIframe(f) && 'rtid' in f && RtidUtils.isRtid(f.rtid));
    const objects = candidates.map((elem) => {
      const ao = ContentUtils.repo.getAOByElement(elem);
      const rtid = (elem as any).rtid as Rtid;
      ao.type = "frame" as const;
      ao.name = 'frame-' + rtid.frame;
      ao.rtid = rtid;
      ao.runtimeInfo = { ...ao.runtimeInfo, url: ContentUtils.getFrameUrl(elem) };
      ao.metaData = usedQueryInfo ? { used: usedQueryInfo } : undefined;
      return ao;
    });
    return objects;
  }

  /** query frames with selectors */
  private _queryFrameElementsWithSelectors(selectors: Selector[], root: Node): Element[] {
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

    if (candidates.length > 0) {
      const frameElements = candidates.filter(elem => ContentUtils.elemIsIframe(elem));
      candidates.splice(0);
      candidates.push(...frameElements);
    }

    if (cssSelector || xpathSelector) {
      return LocatorUtils.filterObjects(candidates, querySelectors);
    }
    else {
      return ContentUtils.traverseSelectorAllFrames(root, querySelectors);
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
          this.logger.warn('getObjectHandler: error ', error, ' rtid', rtid);
        }
      }
    }
    else if (desc.queryInfo) {
      let root: Node = document;
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
      const all = ContentUtils.traverseSelectorAllTextNodes(document, []);
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

  /** query the property from tab */
  protected async _queryTabProperty(propName: string): Promise<unknown> {
    const rtid = RtidUtils.getTabRtid(this.rtid.tab, -1);
    const reqMsgData = MsgUtils.createMessageData('query', rtid, { name: 'query_property', params: { name: propName } });
    const resMsgData = await ContentUtils.sendRequest(reqMsgData);
    const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
    return propValue;
  }

  protected async _invokeTabMethod(funcName: string, args?: any[]): Promise<unknown> {
    const rtid = RtidUtils.getTabRtid(this.rtid.tab, -1);
    const result = await this._invokeMethod(rtid, funcName, args);
    return result;
  }

  protected async _invokeMethod(rtid: Rtid, funcName: string, args?: any[]): Promise<unknown> {
    const reqMsgData = MsgUtils.createMessageData('command', rtid, {
      name: 'invoke',
      params: {
        name: funcName,
        args: args
      }
    });
    const resMsgData = await ContentUtils.sendRequest(reqMsgData);
    if (resMsgData.status === 'OK') {
      return resMsgData.result;
    }
    else {
      throw new Error(resMsgData.error || '_invokeMethod failed');
    }
  }

}