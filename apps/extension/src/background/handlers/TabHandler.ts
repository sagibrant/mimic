/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file TabHandler.ts
 * @description 
 * Support the automation actions on a specific Tab
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

import { MsgUtils, RtidUtils, Utils, AODesc, AutomationObject, InvokeAction, QueryInfo, RecordedStep, Rtid, ClickOptions, Point, RectInfo, TextInputOptions, LocatorUtils, MsgDataHandlerBase, KeyDefinitionUtils, ElementInfo } from "@mimic-sdk/core";
import { ChromeExtensionAPI } from "../api/ChromeExtensionAPI";
import { FrameInfo, TabInfo, WindowInfo } from "../api/BrowserWrapperTypes";
import { WebNavigationEventDetails } from "../api/ChromeWebNavigationAPI";
import { CDPKeyboard, CDPMouse, CDPTouchscreen } from "../api/CDPInput";
import { BackgroundUtils } from "../BackgroundUtils";
import { CDPOverlay } from "../api/CDPOverlay";
import { CDPDOM } from "../api/CDPDOM";
import { DebuggerSession } from "../api/CDPTypes";

export interface FrameDetails {
  lastWebNavigationStatus?: string;
  lastWebNavigationEventDetails?: WebNavigationEventDetails;
}

export class TabHandler extends MsgDataHandlerBase {
  private readonly _contentId: Rtid;
  private readonly _tabId: number;
  private readonly _browserAPI: ChromeExtensionAPI;
  private readonly _frameDict: Record<number, FrameDetails>;
  private readonly _cdpMouse: CDPMouse;
  private readonly _cdpKeyboard: CDPKeyboard;
  private readonly _cdpTouchscreen: CDPTouchscreen;
  private readonly _cdpOverlay: CDPOverlay;
  private readonly _cdpDOM: CDPDOM;

  private _inspectMode: 'searchForNode' | 'none';
  /** the device scale factor is decided by --force-device-scale-factor or same as the desktop scale */
  private _deviceScaleFactor: number | undefined = undefined;

  constructor(tabId: number, browserAPI: ChromeExtensionAPI) {
    const rtid = RtidUtils.getTabRtid(tabId, -1);
    super(rtid);
    this._tabId = tabId;
    this._contentId = Utils.deepClone(rtid);
    this._contentId.context = 'content';
    this._contentId.frame = 0;
    this._browserAPI = browserAPI;
    this._frameDict = {};
    // cdp related objects
    this._cdpKeyboard = new CDPKeyboard(this._tabId, this._browserAPI.cdpAPI);
    this._cdpMouse = new CDPMouse(this._tabId, this._browserAPI.cdpAPI, this._cdpKeyboard);
    this._cdpTouchscreen = new CDPTouchscreen(this._tabId, this._browserAPI.cdpAPI, this._cdpKeyboard);
    this._cdpOverlay = new CDPOverlay(this._tabId, this._browserAPI.cdpAPI);
    this._cdpDOM = new CDPDOM(this._tabId, this._browserAPI.cdpAPI);
    this._inspectMode = 'none';
  }

  /** ==================================================================================================================== */
  /** ===================================================== methods ====================================================== */
  /** ==================================================================================================================== */

  /** The ID of the window that contains the tab. */
  windowId?: number;
  /** The zero-based index of the tab within its window. */
  index?: number;
  /** The title of the tab. */
  title?: string;
  /** The last committed URL of the main frame of the tab. Or the value of pendingUrl: The URL the tab is navigating to, before it has committed */
  url?: string;
  /** The URL of the tab's favicon */
  favIconUrl?: string;
  /** The tab's loading status. */
  status?: 'unloaded' | 'loading' | 'complete';
  /** The tab's ZoomFactor. */
  zoomFactor: number | undefined;

  /** tab rtid */
  get tabId(): number {
    return this._tabId;
  }

  /** content rtid */
  get contentId(): Rtid {
    return this._contentId;
  }

  async window(): Promise<WindowInfo> {
    let tab = await this._browserAPI.tabAPI.get(this._tabId);
    let window = await this._browserAPI.windowAPI.get(tab.windowId);
    return Utils.deepClone(window);
  }

  async mainFrame(): Promise<FrameInfo> {
    let frames = await this.frames();
    let roots = frames.filter((f) => f.parentFrameId === -1);
    if (roots.length !== 1) {
      throw new Error(`Find ${roots.length} frames with parentFrameId === -1`);
    }
    return Utils.deepClone(roots[0]);
  }

  async frames(parentFrameId?: number): Promise<FrameInfo[]> {
    let frames = await this._browserAPI.webNavigationAPI.getAllFrames(this._tabId);
    if (!Utils.isNullOrUndefined(parentFrameId)) {
      frames = frames.filter(f => f.parentFrameId === parentFrameId);
    }
    return Utils.deepClone(frames);
  }

  async frameTree(): Promise<FrameInfo> {
    let frames = await this.frames();
    if (Utils.isNullOrUndefined(frames) || Utils.isEmpty(frames)) {
      throw new Error(`No frames`);
    }
    frames.sort((a, b) => a.frameId - b.frameId);
    const frameInfoList: FrameInfo[] = [];
    for (const frame of frames) {
      const frameInfo: FrameInfo = { ...frame, children: [] };
      frameInfoList.push(frameInfo);
    }
    for (const frameInfo of frameInfoList) {
      if (!Utils.isNullOrUndefined(frameInfo.parentFrameId) && frameInfo.parentFrameId >= 0) {
        const parents = frameInfoList.filter((f) => f.frameId === frameInfo.parentFrameId);
        if (parents.length === 1) {
          parents[0].children?.push(frameInfo);
        }
      }
    }
    let roots = frameInfoList.filter((f) => f.parentFrameId === -1);
    if (roots.length !== 1) {
      throw new Error(`Find ${roots.length} frames with parentFrameId === -1`);
    }
    return roots[0]
  }

  updateFrameDetails(frameId: number, options: { status?: string, ev?: WebNavigationEventDetails, connected?: false }) {
    if (frameId === 0 && options.status === 'Committed') {
      const frameIds = Object.keys(this._frameDict);
      for (const id of frameIds) {
        delete this._frameDict[Number(id)];
      }
    }
    if (Utils.isNullOrUndefined(this._frameDict[frameId])) {
      this._frameDict[frameId] = {
        lastWebNavigationEventDetails: options.ev,
        lastWebNavigationStatus: options.status
      };
    }
    else {
      if (!Utils.isNullOrUndefined(options.status)) {
        this._frameDict[frameId].lastWebNavigationStatus = options.status;
      }
      if (!Utils.isNullOrUndefined(options.ev)) {
        this._frameDict[frameId].lastWebNavigationEventDetails = Object.assign({}, this._frameDict[frameId].lastWebNavigationEventDetails, options.ev);
      }
    }
  }

  async updateFrameInfos(): Promise<void> {
    const frames = await this.frames();
    for (const frame of frames) {
      const subFrames = frames.filter(f => f.parentFrameId === frame.frameId);
      if (subFrames.length > 0) {
        await this._updateFrameInfos(frame.frameId, subFrames);
      }
    }
  }

  async startRecording(): Promise<void> {
    const frames = await this.frames();
    for (const frame of frames) {
      try {
        const rtid = Utils.deepClone(this.contentId);
        rtid.frame = frame.frameId;
        const reqMsgData = MsgUtils.createMessageData('command', rtid, {
          name: 'invoke',
          params: {
            name: 'startRecording',
            args: []
          }
        } as InvokeAction);
        const resMsgData = await BackgroundUtils.sendRequest(reqMsgData);
        if (resMsgData.status !== 'OK') {
          this.logger.warn('startRecording failed for frame - ', frame.frameId, resMsgData.error);
        }
      } catch (error) {
        this.logger.warn('startRecording', frame, error);
      }
    }
  }

  async stopRecording(): Promise<void> {
    const frames = await this.frames();
    for (const frame of frames) {
      try {
        const rtid = Utils.deepClone(this.contentId);
        rtid.frame = frame.frameId;
        const reqMsgData = MsgUtils.createMessageData('command', rtid, {
          name: 'invoke',
          params: {
            name: 'stopRecording',
            args: []
          }
        } as InvokeAction);
        const resMsgData = await BackgroundUtils.sendRequest(reqMsgData);
        if (resMsgData.status !== 'OK') {
          this.logger.warn('stopRecording failed for frame - ', frame.frameId, resMsgData.error);
        }
      } catch (error) {
        this.logger.warn('stopRecording', frame, error);
      }
    }
  }

  async getElementFromPoint(x: number, y: number, width?: number, height?: number): Promise<ElementInfo | null> {
    // must update frame infos first to make sure all frames registered
    await this.updateFrameInfos();
    // send to content to find the element from point
    const result = await this._invokeContentFunction("getElementFromPoint", [x, y, width, height]);
    if (!result) {
      return null;
    }
    const elemInfo = result as ElementInfo;
    elemInfo.pageScript = 'page';
    if (elemInfo.elementRtid && elemInfo.elementRtid.frame !== this._contentId.frame) {
      const frameId = elemInfo.elementRtid.frame;
      const frames = await this.frames();
      const index = frames.findIndex(f => f.frameId === frameId);
      elemInfo.frameScript = `frame().nth(${index})`;
    }
    else {
      elemInfo.frameScript = undefined;
    }
    return elemInfo;
  }

  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/

  async activate(focusWindow: boolean = false): Promise<TabInfo> {
    let tab = await this._browserAPI.tabAPI.get(this._tabId);
    if (focusWindow) {
      const window = await this._browserAPI.windowAPI.get(tab.windowId);
      if (!window.focused && !Utils.isNullOrUndefined(window.id)) {
        await this._browserAPI.windowAPI.update(window.id, { focused: true });
      }
    }
    tab = await this._browserAPI.tabAPI.activate(this._tabId);
    const tabInfo = Utils.deepClone(tab);
    return tabInfo;
  }

  async capturePage(): Promise<string> {
    const result = this._browserAPI.tabAPI.capturePage(this._tabId);
    return result;
  }

  async close(): Promise<void> {
    let isClosed = false;
    try {
      const isAttached = this._browserAPI.cdpAPI.isTabAttached(this._tabId);
      if (isAttached) {
        await this._browserAPI.cdpAPI.pageClose(this._tabId);
        isClosed = true;
      }
    } catch (err) {
      this.logger.error(err);
    }
    if (!isClosed) {
      await this._browserAPI.tabAPI.close(this._tabId);
    }
  }

  async goBack(): Promise<void> {
    await this._browserAPI.tabAPI.goBack(this._tabId);
  }

  async goForward(): Promise<void> {
    await this._browserAPI.tabAPI.goForward(this._tabId);
  }

  async moveToWindow(windowId: number, index: number = -1): Promise<TabInfo> {
    const tab = await this._browserAPI.tabAPI.moveToWindow(this._tabId, windowId, index);
    const tabInfo = Utils.deepClone(tab);
    return tabInfo;
  }

  async navigate(url: string): Promise<TabInfo | undefined> {
    let isNavigated = false;
    // for internal and file urls, the content scripts/history may be blocked
    const isNewURLRestricted = Utils.isInternalUrl(url) || Utils.isFileUrl(url);
    const cur = await this._browserAPI.tabAPI.get(this._tabId);
    const tabUrl = cur.url ?? cur.pendingUrl;
    // for internal urls, the debugger cannot be attached
    const isTabUrlRestricted = tabUrl ? Utils.isInternalUrl(tabUrl) : true;

    if (!isNavigated && !isTabUrlRestricted) {
      try {
        const isAttached = this._browserAPI.cdpAPI.isTabAttached(this._tabId);
        if (isAttached) {
          await this._browserAPI.cdpAPI.pageNavigate(this._tabId, url);
          isNavigated = true;
        }
      } catch (err) {
        this.logger.error(err);
      }
    }

    if (!isNavigated && !isNewURLRestricted && !isTabUrlRestricted) {
      try {
        await this._invokeContentFunction('navigate', [url]);
        isNavigated = true;
      } catch { }
    }

    if (!isNavigated && !isNewURLRestricted && !isTabUrlRestricted) {
      try {
        await this._browserAPI.scriptingAPI.executeFunction(this._tabId, this._contentId.frame, async (url: string) => {
          const a = document.createElement('a');
          a.href = url;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          // window.location.href = url;
          return true;
        }, [url]);
        isNavigated = true;
      } catch { }
    }

    // navigate without update the history
    if (!isNavigated) {
      const tab = await this._browserAPI.tabAPI.navigate(this._tabId, url);
      const tabInfo = Utils.deepClone(tab);
      return tabInfo;
    }
    else {
      const tab = await this._browserAPI.tabAPI.get(this._tabId);
      const tabInfo = Utils.deepClone(tab);
      return tabInfo;
    }
  }

  async openNewTab(url?: string): Promise<TabInfo> {
    const cur = await this._browserAPI.tabAPI.get(this._tabId);
    const tab = await this._browserAPI.tabAPI.openNewTab(url, cur.windowId, this._tabId);
    const tabInfo = Utils.deepClone(tab);
    return tabInfo;
  }

  async reload(bypassCache: boolean = false): Promise<void> {
    await this._browserAPI.tabAPI.reload(this._tabId, bypassCache);
  }

  async zoom(zoomFactor: number): Promise<void> {
    await this._browserAPI.tabAPI.zoom(this._tabId, zoomFactor);
  }

  /** both page and frame use this method to execute the script */
  async executeScript(script: string, frameId?: number, nonceValue?: string): Promise<any> {
    if (Utils.isNullOrUndefined(frameId)) {
      frameId = 0;
    }
    const result = await this._browserAPI.scriptingAPI.executeScript(this._tabId, frameId, script, nonceValue);
    return result;
  }

  /** frame use this method to get status */
  async getFrameStatus(frameId: number): Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'> {
    // we must filter the frames first
    // because the webnavigation event does not contain the remove info
    const frames = await this.frames();
    const frame = frames.find(frame => frame.frameId === frameId);
    if (Utils.isNullOrUndefined(frame)) {
      return 'Removed';
    }
    // if bg sleep and active again, the this._frameDict is empty
    if (Utils.isEmpty(this._frameDict)) {
      if (frame.errorOccurred) {
        return 'ErrorOccurred';
      }
      else {
        return 'DOMContentLoaded';
      }
    }
    const frameDetails = this._frameDict[frameId];
    if (frameDetails && !Utils.isNullOrUndefined(frameDetails.lastWebNavigationStatus)) {
      // ErrorOccurred : "net::ERR_BLOCKED_BY_RESPONSE"
      return frameDetails.lastWebNavigationStatus as 'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred';
    }
    else {
      this.logger.warn(`getFrameStatus: find one frame without frameNavigationEventDetail. ${frame}`);
      return 'Removed';
    }
  }

  /** frame use this method to get url */
  async getFrameUrl(frameId: number): Promise<string> {
    const frames = await this.frames();
    const frame = frames.find(f => f.frameId === frameId);
    if (frame) {
      return frame.url;
    }
    else {
      throw new Error('Frame is not valid');
    }
  }

  /** frame use this method to get parent frame id and create parent frame */
  async getParentFrameId(frameId: number): Promise<number> {
    const frames = await this.frames();
    const frame = frames.find(f => f.frameId === frameId);
    if (frame && !Utils.isNullOrUndefined(frame.parentFrameId)) {
      return frame.parentFrameId;
    }
    else {
      throw new Error('Frame is not valid');
    }
  }

  /** frame use this method to create child frame ids and create child frames */
  async getChildFrameIds(parentFrameId: number): Promise<number[]> {
    let frames = await this.frames();
    frames = frames.filter(f => f.parentFrameId === parentFrameId);
    return frames.map(f => f.frameId);
  }
  /** ==================================================================================================================== **/
  /** ======================================================= cdp ======================================================== **/
  /** ==================================================================================================================== **/
  async isDebuggerAttached(): Promise<boolean> {
    const isAttached = this._browserAPI.cdpAPI.isTabAttached(this._tabId);
    return isAttached;
  }
  async sendCDPCommand(method: string, commandParams?: { [key: string]: unknown }): Promise<void> {
    await this._browserAPI.cdpAPI.sendCommand(this._tabId, method, commandParams);
  }
  async getInspectMode(): Promise<string> {
    return this._inspectMode;
  }
  async toggleInspectMode(): Promise<void> {
    if (this._inspectMode === 'none') {
      const isTabAttachedByOthers = await this._browserAPI.cdpAPI.isTabAttachedByOthers(this._tabId);
      if (isTabAttachedByOthers) {
        throw new Error('Another debugger is already attached to this page—please close DevTools and other debugging tools first.');
      }
      await this._browserAPI.cdpAPI.attachTab(this._tabId);
      await Utils.wait(1000);
      await this._cdpOverlay.setInspectMode('searchForNode');
      this._inspectMode = 'searchForNode';
    }
    else {
      this._inspectMode = 'none';
      await this._cdpOverlay.setInspectMode('none');
      const isAttached = await this._browserAPI.cdpAPI.isTabAttached(this._tabId);
      if (BackgroundUtils.browser.autoAttachDebugger === false && isAttached) {
        await this._browserAPI.cdpAPI.detachTab(this._tabId);
      }
    }
  }
  async handleInspectNodeRequested(source: DebuggerSession, backendNodeId: number): Promise<void> {
    await this._cdpDOM.handleInspectNodeRequested(backendNodeId, source);
    await this.toggleInspectMode();
  }
  async getJavaScriptDialog(): Promise<any> {
    return this._browserAPI.cdpAPI.getJavascriptDialog(this._tabId);
  }
  async handleJavaScriptDialog(accept: boolean, promptText?: string): Promise<void> {
    await this._browserAPI.cdpAPI.handleJavaScriptDialog(this._tabId, accept, promptText);
  }
  async setFileInputFiles(files: string[]): Promise<void> {
    await this._cdpDOM.setFileInputFiles(files);
  }
  /** ==================================================================================================================== **/
  /** ==================================================== cdp mouse ===================================================== **/
  /** ==================================================================================================================== **/
  async mouseClick(options?: ClickOptions): Promise<void> {
    const {
      button = 'left',
      clickCount = 1,
      position,
      modifiers = [],
      delayBetweenDownUp = 0,
      delayBetweenClick = 0
    } = options || {};

    if (position) {
      await this.mouseMove(position.x, position.y);
    }

    if (modifiers.length > 0) {
      for (const modifier of modifiers) {
        await this.keyboardDown(modifier);
      }
    }
    for (let i = 1; i <= clickCount; i++) {
      await this.mouseDown({ button: button, clickCount: i });
      if (delayBetweenDownUp > 0) {
        await Utils.wait(delayBetweenDownUp);
      }
      await this.mouseUp({ button: button, clickCount: i });
      if (i < clickCount && delayBetweenClick > 0) {
        await Utils.wait(delayBetweenClick);
      }
    }
    if (modifiers.length > 0) {
      for (const modifier of modifiers) {
        await this.keyboardUp(modifier);
      }
    }
  }
  async mouseDown(options?: { button?: "left" | "right" | "middle"; clickCount?: number; }): Promise<void> {
    await this._cdpMouse.down(options);
  }
  async mouseUp(options?: { button?: "left" | "right" | "middle"; clickCount?: number; }): Promise<void> {
    await this._cdpMouse.up(options);
  }
  async mouseMove(x: number, y: number, options?: { steps?: number }): Promise<void> {
    const { steps = 1 } = options || {};
    await this._cdpMouse.move(x, y, steps);
  }
  async mouseWheel(deltaX: number, deltaY: number): Promise<void> {
    await this._cdpMouse.wheel({ deltaX: deltaX, deltaY: deltaY });
  }
  async mouseDragAndDrop(startPoint: Point, endPoint: Point, steps: number): Promise<void> {
    await this.mouseMove(startPoint.x, startPoint.y);
    await this.mouseDown({ button: 'left', clickCount: 1 });
    await this.mouseMove(endPoint.x, endPoint.y, { steps: steps });
    await this.mouseUp({ button: 'left', clickCount: 1 });
  }

  /** ==================================================================================================================== **/
  /** =================================================== cdp keyboard =================================================== **/
  /** ==================================================================================================================== **/
  async keyboardType(text: string, options?: TextInputOptions): Promise<void> {
    const {
      delayBetweenDownUp = 0,
      delayBetweenChar = 0
    } = options || {};

    // must use for (const char of text) to support the unicode characters
    for (const char of text) {
      if (KeyDefinitionUtils.KeyDefinitions.has(char)) {
        await this.keyboardPress(char, { delayBetweenDownUp: delayBetweenDownUp });
      }
      else {
        if (delayBetweenDownUp > 0) {
          await Utils.wait(delayBetweenDownUp);
        }
        await this._cdpKeyboard.insertText(char);
      }
      if (delayBetweenChar > 0) {
        await Utils.wait(delayBetweenChar);
      }
    }
  }
  async keyboardDown(key: string): Promise<void> {
    await this._cdpKeyboard.down(key);
  }
  async keyboardUp(key: string): Promise<void> {
    await this._cdpKeyboard.up(key);
  }
  async keyboardPress(keys: string | string[], options?: { delayBetweenDownUp?: number; }): Promise<void> {
    // only support tokens in KeyDefinitionUtils.KeyDefinitions
    const { delayBetweenDownUp = 0 } = options || {};
    const tokens = Array.isArray(keys) ? keys : [keys];
    for (const token of tokens) {
      await this.keyboardDown(token);
    }
    if (delayBetweenDownUp > 0) {
      await Utils.wait(delayBetweenDownUp);
    }
    const reverseTokens = Utils.deepClone(tokens);
    reverseTokens.reverse();
    for (const token of reverseTokens) {
      await this.keyboardUp(token);
    }
  }
  async keyboardClearText(x: number, y: number): Promise<void> {
    await this.mouseClick({ position: { x, y } });
    // await this.keyboardPress(['ControlOrMeta', 'a']);
    await this._cdpKeyboard.selectAll();
    await Utils.wait(200);
    await this.keyboardPress('Backspace');
  }
  /** ==================================================================================================================== **/
  /** ==================================================== cdp touch ===================================================== **/
  /** ==================================================================================================================== **/
  async touchscreenTap(x: number, y: number, modifiers?: Array<"Alt" | "Control" | "ControlOrMeta" | "Meta" | "Shift">): Promise<void> {
    if (modifiers && modifiers.length > 0) {
      for (const modifier of modifiers) {
        await this.keyboardDown(modifier);
      }
    }

    await this._cdpTouchscreen.tap(x, y);

    if (modifiers && modifiers.length > 0) {
      for (const modifier of modifiers) {
        await this.keyboardUp(modifier);
      }
    }
  }

  /** ==================================================================================================================== **/
  /** ====================================================== query ======================================================= **/
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
      const window = await this.window();
      const parentRtid = Utils.deepClone(this.rtid);
      parentRtid.window = window.id || -1;
      parentRtid.tab = -1;
      return parentRtid;
    }
    else if (propName === 'zoom_factor') {
      return this.zoomFactor;
    }
    else if (propName === 'content') {
      const content = await this._queryContentProperty('content') as string;
      return content;
    }
    else if (propName === 'rect') {
      // the rect in viewport coordinate
      const rect = (await this._invokeContentFunction('rect')) as RectInfo;
      return rect;
    }
    else if (propName === 'screen_rect') {
      // screenRect(pageZoomFactor: number, isMaximized?: boolean, desktopScaleFactor?: number)
      const window = await this.window();
      const rect = (await this._invokeContentFunction('screenRect', [this.zoomFactor, window.state == 'maximized'])) as RectInfo;
      return rect;
    }
    else if (propName === 'deviceScaleFactor' || propName === 'device_scale_factor') {
      if (!Utils.isNullOrUndefined(this._deviceScaleFactor)) {
        return this._deviceScaleFactor;
      }
      const devicePixelRatio = await this._queryContentProperty('device_pixel_ratio') as number;
      this._deviceScaleFactor = devicePixelRatio / (this.zoomFactor || 1);
      return this._deviceScaleFactor;
    }
    else if (propName === 'active') {
      const tab = await this._browserAPI.tabAPI.get(this._tabId);
      return tab.active;
    }
    else {
      const tab = await this._browserAPI.tabAPI.get(this._tabId);
      if (propName in tab) {
        const propValue = (tab as any)[propName];
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
    // page.window()
    if (desc.type === 'window') {
      const window = await this.window();
      return [{
        type: "window" as const,
        name: 'window-' + window.id,
        rtid: Object.assign({}, this.rtid, { window: window.id, tab: -1 }),
        runtimeInfo: { ...Utils.deepClone(window) },
        metaData: undefined
      }];
    }
    /**
     * page.frame({ url?:'https://x/x', selector?: 'iframe'})
     * element().contentFrame() => element.rtid => desc.rtids
     */
    if (desc.type === 'frame') {
      const frames = await this._queryFrames(desc);
      return frames;
    }
    // page.element()
    if (desc.type === 'element') {
      const elements = await this._queryElements(desc);
      return elements;
    }
    if (desc.type === 'text') {
      const texts = await this._queryTexts(desc);
      return texts;
    }
    throw new Error(`Unknown description type - ${desc.type}`);
  }

  /**
   * page.frame(url?:'https://x/x', selector?: 'iframe' )
   * element().contentFrame() => element.rtid => desc.rtids
   * @param desc 
   * @returns 
   */
  private async _queryFrames(desc: AODesc): Promise<AutomationObject[]> {
    let candidates: FrameInfo[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      const frames = await this.frames();
      for (const rtid of desc.rtids) {
        const frame = frames.find(frame => (frame.frameId === rtid.frame));
        if (frame) {
          candidates.push(frame);
        }
      }
    }
    else if (desc.queryInfo) {
      // if filter by url? or ordinal?, we query by tabAPI directly
      if (Utils.isEmpty(desc.queryInfo?.mandatory) && Utils.isEmpty(desc.queryInfo?.assistive)
        && (
          Utils.isEmpty(desc.queryInfo?.primary)
          ||
          (!Utils.isEmpty(desc.queryInfo?.primary) && desc.queryInfo.primary?.length === 1 && desc.queryInfo.primary[0].name === 'url')
        )
      ) {
        // page.frame({ url?:'https://x/x'}).nth()?
        const frames = await this.frames();
        candidates = LocatorUtils.filterObjects(frames, desc.queryInfo?.primary || []);
        if (!Utils.isNullOrUndefined(desc.parent?.frame)) {
          candidates = candidates.filter(f => f.parentFrameId === desc.parent?.frame);
        }
        if (desc.queryInfo.ordinal && candidates.length > 0) {
          const ordinal = desc.queryInfo.ordinal;
          const index = ordinal.reverse ? candidates.length - 1 - ordinal.index : ordinal.index;
          if (index >= 0 && index < candidates.length) {
            candidates = [candidates[index]];
          }
          else {
            candidates = [];
          }
        }
        usedQueryInfo = desc.queryInfo;
      }
      else {
        // page.frame({selector: 'iframe'}).filter([{name: 'hahahah'}]).filter({title: ''gegegege})
        // must exist primary with #css selector or mandatory filters, so it must not be the main frame
        // send message to frame contents to query the frame objects
        let frames = await this.frames();
        // we first update all frame information to the contents so that some blocked frames can also get frame rtid
        await this.updateFrameInfos();
        // if parent specified, only query sub frames in the specified frame
        if (!Utils.isNullOrUndefined(desc.parent?.frame)) {
          frames = frames.filter(f => f.frameId === desc.parent?.frame);
        }
        const frameAOs: AutomationObject[] = [];
        // remove the ordinal selector as it should be handled
        const ordinal = desc.queryInfo.ordinal;
        desc.queryInfo.ordinal = undefined;
        desc.type = 'frame';
        // query sub frames in parent frame content with primary, mandatory, assistive
        for (const frame of frames) {
          const subframes = frames.filter(f => f.parentFrameId === frame.frameId);
          if (subframes.length === 0) {
            continue;
          }
          const objects = await this._queryFrameAOs(frame.frameId, desc);
          if (objects.length > 0) {
            frameAOs.push(...objects);
          }
        }
        if (frameAOs.length > 1) {
          // if there's only one frameAO with assistive, choose this one
          const filteredAOs = frameAOs.filter((ao) => {
            if (ao.metaData && 'used' in ao.metaData) {
              const usedQueryInfo = ao.metaData.used as QueryInfo;
              if (usedQueryInfo.assistive && usedQueryInfo.assistive.length > 0) {
                return true;
              }
            }
            return false;
          });
          if (filteredAOs.length === 1) {
            frameAOs.splice(0);
            frameAOs.push(filteredAOs[0]);
          }
        }
        desc.queryInfo.ordinal = ordinal;
        if (ordinal && frameAOs.length > 0) {
          const index = ordinal.reverse ? frameAOs.length - 1 - ordinal.index : ordinal.index;
          if (index >= 0 && index < frameAOs.length) {
            const frameAO = frameAOs[index];
            frameAOs.splice(0);
            frameAOs.push(frameAO);
          }
          else {
            frameAOs.splice(0);
          }
        }
        return frameAOs;
      }
    }
    else {
      // page.frames() => all frames 
      let frames = await this.frames(desc.parent?.frame);
      candidates.push(...frames);
    }

    const objects = candidates.map((frame) => {
      return {
        type: "frame" as const,
        name: 'frame-' + frame.frameId,
        rtid: Object.assign({}, this._contentId, { frame: frame.frameId }),
        runtimeInfo: { url: frame.url },
        metaData: usedQueryInfo ? { used: usedQueryInfo } : undefined
      };
    });
    return objects;
  }

  private async _updateFrameInfos(parentFrameId: number, frameInfos: FrameInfo[]): Promise<void> {
    try {
      const rtid = Utils.deepClone(this.contentId);
      rtid.frame = parentFrameId;
      const reqMsgData = MsgUtils.createMessageData('command', rtid, {
        name: 'invoke',
        params: {
          name: 'updateFrameInfos',
          args: [frameInfos]
        }
      } as InvokeAction);
      const resMsgData = await BackgroundUtils.sendRequest(reqMsgData);
      if (resMsgData.status === 'OK') {
        return;
      }
      else {
        throw new Error(resMsgData.error || 'updateFrameInfos failed');
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async _queryFrameAOs(parentFrameId: number, desc: AODesc): Promise<AutomationObject[]> {
    try {
      const rtid = Utils.deepClone(this.contentId);
      rtid.frame = parentFrameId;
      desc.type = 'frame';
      const reqMsgData = MsgUtils.createMessageData('query', rtid, { name: 'query_objects' }, desc);
      const resMsgData = await BackgroundUtils.sendRequest(reqMsgData);
      if (resMsgData.status === 'OK' && resMsgData.objects && resMsgData.objects.length >= 0) {
        return resMsgData.objects;
      }
      return [];
    } catch (error) {
      try {
        const status = await this.getFrameStatus(parentFrameId);
        // some frames may not ready for communication
        // only log error for the frames which is ready for communication
        if (status === 'Completed') {
          this.logger.error('_queryFrameAOs:', error);
        }
      } catch { }
      return [];
    }
  }

  /** query elements in mainFrame */
  private async _queryElements(desc: AODesc): Promise<AutomationObject[]> {
    const rtid = Utils.deepClone(this.rtid);
    rtid.context = 'content';
    rtid.frame = desc.parent?.frame || 0;
    const reqMsgData = MsgUtils.createMessageData('query', rtid, { name: 'query_objects' }, desc);
    const resMsgData = await BackgroundUtils.sendRequest(reqMsgData);
    return resMsgData.objects || [];
  }

  /** query texts in mainFrame */
  private async _queryTexts(desc: AODesc): Promise<AutomationObject[]> {
    const rtid = Utils.deepClone(this.rtid);
    rtid.context = 'content';
    rtid.frame = desc.parent?.frame || 0;
    const reqMsgData = MsgUtils.createMessageData('query', rtid, { name: 'query_objects' }, desc);
    const resMsgData = await BackgroundUtils.sendRequest(reqMsgData);
    return resMsgData.objects || [];
  }

  /** query the property in mainFrame */
  private async _queryContentProperty(propName: string): Promise<unknown> {
    const reqMsgData = MsgUtils.createMessageData('query', this.contentId, { name: 'query_property', params: { name: propName } });
    const resMsgData = await BackgroundUtils.sendRequest(reqMsgData);
    const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
    return propValue;
  }

  /** invoke the function in mainFrame */
  private async _invokeContentFunction(funcName: string, args?: any[]): Promise<unknown> {
    const reqMsgData = MsgUtils.createMessageData('command', this.contentId, {
      name: 'invoke',
      params: {
        name: funcName,
        args: args
      }
    } as InvokeAction);
    const resMsgData = await BackgroundUtils.sendRequest(reqMsgData);
    if (resMsgData.status === 'OK') {
      return resMsgData.result;
    }
    else {
      throw new Error(resMsgData.error || '_invokeContentFunction failed');
    }
  }

  /** record the step with page & frame information */
  protected override async recordStep(step: RecordedStep): Promise<void> {
    step.pageScript = 'page';
    if (step.elementRtid && step.elementRtid.frame !== this._contentId.frame) {
      const frameId = step.elementRtid.frame;
      const frames = await this.frames();
      const index = frames.findIndex(f => f.frameId === frameId);
      step.frameScript = `frame().nth(${index})`;
    }
    else {
      step.frameScript = undefined;
    }
    // send record event to browser 
    const rtid = RtidUtils.getBrowserRtid();
    const msgData = MsgUtils.createMessageData('record', rtid, { name: 'record_step', params: { step: step } });
    await BackgroundUtils.sendEvent(msgData);
  }

  protected override async inspectObject(elem: ElementInfo): Promise<void> {
    const elemInfo = Utils.deepClone(elem);
    elemInfo.pageScript = 'page';
    if (elemInfo.elementRtid && elemInfo.elementRtid.frame !== this._contentId.frame) {
      const frameId = elemInfo.elementRtid.frame;
      const frames = await this.frames();
      const index = frames.findIndex(f => f.frameId === frameId);
      elemInfo.frameScript = `frame().nth(${index})`;
    }
    else {
      elemInfo.frameScript = undefined;
    }
    // send nodeInspected event to sidebar
    await BackgroundUtils.dispatchEvent('nodeInspected', elemInfo);
  }
}
