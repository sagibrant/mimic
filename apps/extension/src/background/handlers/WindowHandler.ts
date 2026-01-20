/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file WindowHandler.ts
 * @description 
 * Support the automation actions on a specific Window
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

import { MsgUtils, RtidUtils, Utils, AODesc, AutomationObject, QueryInfo, Selector, LocatorUtils, MsgDataHandlerBase } from "@mimic-sdk/core";
import { ChromeExtensionAPI } from "../api/ChromeExtensionAPI";
import { TabInfo, WindowInfo } from "../api/BrowserWrapperTypes";
import { BackgroundUtils } from "../BackgroundUtils";

export class WindowHandler extends MsgDataHandlerBase {
  private readonly _windowId: number;
  private readonly _browserAPI: ChromeExtensionAPI;
/** the device scale factor is decided by --force-device-scale-factor or same as the desktop scale */
  private _deviceScaleFactor: number | undefined = undefined;

  constructor(windowId: number, browserAPI: ChromeExtensionAPI) {
    const rtid = RtidUtils.getWindowRtid(windowId);
    super(rtid);
    this._windowId = windowId;
    this._browserAPI = browserAPI;
  }

  /** ==================================================================================================================== */
  /** ===================================================== methods ====================================================== */
  /** ==================================================================================================================== */

  get windowId(): number {
    return this._windowId;
  }

  async windowInfo(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.get(this._windowId);
    return Utils.deepClone(window);
  }

  async tabs(): Promise<TabInfo[]> {
    const window = await this._browserAPI.windowAPI.get(this._windowId, true);
    const tabInfos = window.tabs?.map(t => Utils.deepClone(t)) || [];
    return tabInfos;
  }

  async activeTab(): Promise<TabInfo | undefined> {
    const window = await this._browserAPI.windowAPI.get(this._windowId, true);
    const tabInfos = window.tabs?.map(t => Utils.deepClone(t)) || [];
    const activeTab = tabInfos.find(t => t.active);
    return activeTab;
  }

  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/

  async openNewTab(url?: string): Promise<TabInfo | undefined> {
    const tab = await this._browserAPI.tabAPI.openNewTab(url, this._windowId);
    const tabInfo = Utils.deepClone(tab);
    return tabInfo;
  }

  async focus(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.focus(this._windowId);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
  }

  async close(): Promise<void> {
    await this._browserAPI.windowAPI.remove(this._windowId);
  }

  async minimize(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.minimize(this._windowId);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
  }

  async maximize(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.maximize(this._windowId);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
  }

  async restore(): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.restore(this._windowId);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
  }

  async fullscreen(toggle: boolean = true): Promise<WindowInfo> {
    const window = await this._browserAPI.windowAPI.fullscreen(this._windowId, toggle);
    const windowInfo = Utils.deepClone(window);
    return windowInfo;
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
      let parentRtid = RtidUtils.getBrowserRtid();
      return parentRtid;
    }

    const window = await this.windowInfo();
    if (propName === 'rect') {
      if (Utils.isNullOrUndefined(window.left) || Utils.isNullOrUndefined(window.top)
        || Utils.isNullOrUndefined(window.width) || Utils.isNullOrUndefined(window.height)) {
        throw new Error('The window rect is not available.')
      }
      let rect = { left: window.left, top: window.top, width: window.width, height: window.height };
      rect = Utils.fixRectangle(rect);
      return rect;
    }
    else if (propName === 'screen_rect') {
      if (Utils.isNullOrUndefined(window.left) || Utils.isNullOrUndefined(window.top)
        || Utils.isNullOrUndefined(window.width) || Utils.isNullOrUndefined(window.height)) {
        throw new Error('The window rect is not available.')
      }
      if (Utils.isNullOrUndefined(this._deviceScaleFactor)) {
        this._deviceScaleFactor = await this._queryActiveTabProperty('device_scale_factor') as number;
      }
      const deviceScaleFactor = this._deviceScaleFactor ?? 1;
      let rect = {
        left: window.left * deviceScaleFactor,
        top: window.top * deviceScaleFactor,
        width: window.width * deviceScaleFactor,
        height: window.height * deviceScaleFactor
      };
      rect = Utils.fixRectangle(rect);
      return rect;
    }
    else {
      if (propName in window) {
        const propValue = (window as any)[propName];
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
    // window.pages({ url: 'https://*/*', active: true, title: 'xxx', index: 1})
    if (desc.type === 'tab') {
      const tabs = await this._queryTabs(desc);
      return tabs;
    }
    throw new Error(`Unknown description type - ${desc.type}`);
  }

  /**
   * query tabs
   * @param desc description for objects
   * @returns automation objects
   */
  private async _queryTabs(desc: AODesc): Promise<AutomationObject[]> {

    let candidates: TabInfo[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      const window = await this._browserAPI.windowAPI.get(this._windowId, true);
      const tabs = window.tabs?.map(t => Utils.deepClone(t)) || [];
      for (const rtid of desc.rtids) {
        const tab = tabs.find(tab => tab.id === rtid.tab);
        if (tab) {
          candidates.push(tab);
        }
      }
    }
    else if (desc.queryInfo) {
      const queryResult = await LocatorUtils.queryObjectsAsync(async (selectors) => {
        let tabs = await this._queryTabsWithSelectors(selectors);
        return tabs.filter(t => t.windowId === this._windowId);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      const window = await this._browserAPI.windowAPI.get(this._windowId, true);
      candidates = window.tabs || [];
      usedQueryInfo = undefined;
    }

    candidates = candidates.filter(tab => !Utils.isNullOrUndefined(tab.id));
    const objects = candidates.map((tab) => {
      return {
        type: "tab" as const,
        name: tab.title || tab.url?.slice(0, 10) || 'tab_' + tab.index,
        rtid: RtidUtils.getTabRtid(tab.id!, -1),
        runtimeInfo: { ...Utils.deepClone(tab) },
        metaData: usedQueryInfo ? { used: usedQueryInfo } : undefined
      };
    });
    return objects;
  }

  /** query tabs with selectors */
  private async _queryTabsWithSelectors(selectors: Selector[]): Promise<TabInfo[]> {
    // window.pages({ url: 'https://*/*', active: true, lastFocusedWindow: true, title: 'xxx', index: 1})
    let active = false;
    let lastFocusedWindow = false;
    let querySelectors: Selector[] = [];
    for (const selector of selectors) {
      const key = selector.name;
      if (key === 'active') {
        active = selector.value === true;
      }
      else if (key === 'lastFocusedWindow') {
        lastFocusedWindow = selector.value === true;
      }
      querySelectors.push(selector);
    }

    const candidates: TabInfo[] = [];
    // if select active tab in lastFocusedWindow, then return it directly
    if (active && lastFocusedWindow && querySelectors.length === 2) {
      const window = await this._browserAPI.windowAPI.getLastFocused(true);
      const tabs = window.tabs?.filter(tab => tab.active && tab.windowId == this._windowId).map(tab => Utils.deepClone(tab));
      if (tabs) {
        candidates.push(...tabs);
      }
      return candidates;
    }
    else if (active && querySelectors.length === 1) {
      const window = await this._browserAPI.windowAPI.get(this._windowId, true);
      const tabs = window.tabs?.filter(tab => tab.active).map(tab => Utils.deepClone(tab));
      if (tabs) {
        candidates.push(...tabs);
      }
    }
    else if (lastFocusedWindow && querySelectors.length === 1) {
      const window = await this._browserAPI.windowAPI.getLastFocused(true);
      if (window.id !== this._windowId) {
        return [];
      }
      const tabs = window.tabs?.map(tab => Utils.deepClone(tab));
      if (tabs) {
        candidates.push(...tabs);
      }
      return candidates;
    }

    // query all tabs with the selectors
    const queryInfo: Record<string, unknown> = { windowId: this._windowId };
    const filters: Selector[] = [];
    for (const selector of querySelectors) {
      if (selector.match === 'exact') {
        queryInfo[selector.name] = selector.value;
      }
      else {
        filters.push(selector);
      }
    }
    // chrome.tabs.query does not support regex well, so we first query with exact matched filters, and then filter the tabs
    let tabs = await this._browserAPI.tabAPI.queryTab(queryInfo);
    tabs = LocatorUtils.filterObjects(tabs, filters);
    return tabs.map(tab => Utils.deepClone(tab));
  }

  /**
   * query the property value from the active tab in this window
   * @param propName property name
   * @returns property value
   */
  private async _queryActiveTabProperty(propName: string): Promise<unknown> {
    const activeTab = await this.activeTab();
    const activeTabId = activeTab?.id;
    if (Utils.isNullOrUndefined(activeTabId)) {
      throw new Error('Cannot find active tab');
    }
    const rtid = Utils.deepClone(this.rtid);
    rtid.window = -1;
    rtid.tab = activeTabId;
    const reqMsgData = MsgUtils.createMessageData('query', rtid, { name: 'query_property', params: { name: propName } });
    const resMsgData = await BackgroundUtils.sendRequest(reqMsgData);
    const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
    return propValue;
  }

}
