/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file BrowserHandler.ts
 * @description 
 * Support the general automation actions for Browser
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

import { BrowserInfo, BrowserUtils, RtidUtils, Utils, SettingUtils, AODesc, AutomationObject, QueryInfo, RecordedStep, RegExpSpec, Selector, LocatorUtils, MsgDataHandlerBase, Cookie } from "@mimic-sdk/core";
import { ChromeExtensionAPI } from "../api/ChromeExtensionAPI";
import { TabInfo, WindowInfo } from '../api/BrowserWrapperTypes'
import { WindowHandler } from "./WindowHandler";
import { TabHandler } from "./TabHandler";
import { BackgroundUtils } from "../BackgroundUtils";

interface BrowserEvents extends Record<string, unknown> {
  windowCreated: { window: WindowHandler };
  windowRemoved: { window: WindowHandler };
  tabCreated: { tab: TabHandler };
  tabRemoved: { tab: TabHandler };
}

interface BrowserConfig {
  attachDebugger: boolean;
  isRecording: boolean;
}

export class BrowserHandler extends MsgDataHandlerBase<BrowserEvents> {
  private readonly _browserAPI: ChromeExtensionAPI;
  private readonly _windows: Record<number, WindowHandler>;
  private readonly _tabs: Record<number, TabHandler>;
  private _activeTabId: number = -1;
  private _activeWindowId: number = -1;
  readonly config: Record<string, unknown> & BrowserConfig;
  private _recordingTabId?: number;

  constructor(browserAPI: ChromeExtensionAPI) {
    const rtid = RtidUtils.getBrowserRtid();
    super(rtid);
    this._browserAPI = browserAPI;
    this._windows = {};
    this._tabs = {};
    this.config = { attachDebugger: false, isRecording: false };
    this._browserAPI.cdpAPI.on('javascriptDialogOpening', async ({ source, params }) => {
      const { tabId } = source;
      if (Utils.isNullOrUndefined(tabId)) {
        return;
      }
      // notify the dialogOpened to sidebar
      await BackgroundUtils.dispatchEvent('dialogOpened', { ...(params as any), tabId: tabId });
    });
    this._browserAPI.cdpAPI.on('javascriptDialogClosed', async ({ source }) => {
      const { tabId } = source;
      if (Utils.isNullOrUndefined(tabId)) {
        return;
      }
      // notify the dialogClosed to sidebar
      await BackgroundUtils.dispatchEvent('dialogClosed', tabId);
    });
    this._browserAPI.cdpAPI.on('inspectNodeRequested', async ({ source, params }) => {
      const { backendNodeId } = params as any;
      const tabInfo = this._browserAPI.cdpAPI.getTabInfo(source);
      if (Utils.isNullOrUndefined(tabInfo) || Utils.isNullOrUndefined(backendNodeId) || typeof backendNodeId !== 'number') {
        return;
      }
      const tab = this._tabs[tabInfo.id];
      await tab.handleInspectNodeRequested(source, backendNodeId);
    });
  }

  /**
   * init the agent
   * start listening on the window, tab and cdp events
   */
  async init(): Promise<void> {
    await this.loadConfig();
    await this._updateWindowTabs();
    this._registerListeners();
    if (this.config.attachDebugger) {
      await this.attachDebugger();
    }
    if (this.config.isRecording) {
      await this.startRecording();
    }
  }

  async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['browser_config']);
      if (typeof result.browser_config === 'string' && result.browser_config) {
        const config = JSON.parse(result.browser_config) ?? this.config;
        this.config.attachDebugger = typeof config.attachDebugger === 'boolean' ? config.attachDebugger : false;
        this.config.isRecording = typeof config.isRecording === 'boolean' ? config.isRecording : false;
      }
    } catch (error) {
      this.logger.error('load Error:', error);
    }
  }

  async saveConfig(): Promise<void> {
    try {
      const strValue = JSON.stringify(this.config, null, 2);
      await chrome.storage.local.set({
        browser_config: strValue
      });
    } catch (error) {
      this.logger.error('save Error:', error);
    }
  }

  /** ==================================================================================================================== */
  /** ===================================================== methods ====================================================== */
  /** ==================================================================================================================== */

  /** current browser version */
  get browserInfo(): BrowserInfo {
    const browserVersion = BrowserUtils.getBrowserInfo();
    return browserVersion;
  }

  /** all windows */
  get windows(): WindowHandler[] {
    let windows: WindowHandler[] = [];
    for (const [_windowId, window] of Object.entries(this._windows)) {
      windows.push(window);
    }
    return windows;
  }

  /** all tabs */
  get tabs(): TabHandler[] {
    let tabs: TabHandler[] = [];
    for (const [_tabId, tab] of Object.entries(this._tabs)) {
      tabs.push(tab);
    }
    tabs.sort((a, b) => {
      return (a.index ?? 0) - (b.index ?? 0);
    });
    return tabs;
  }

  async lastFocusedWindow(): Promise<any> {
    const window = await this._browserAPI.windowAPI.getLastFocused(true);
    return window;
  }

  async lastActivePage(): Promise<any> {
    const window = await this._browserAPI.windowAPI.getLastFocused(true);
    const tabs = window.tabs?.filter(tab => tab.active).map(tab => Utils.deepClone(tab));
    if (tabs && tabs.length === 1) {
      return tabs[0];
    }
    return null;
  }

  get autoAttachDebugger(): boolean {
    return this.config.attachDebugger;
  }

  get isRecording(): boolean {
    return this.config.isRecording;
  }

  async startRecording(): Promise<void> {
    this.config.isRecording = true;
    const tabs = this.tabs;
    for (const tab of tabs) {
      try {
        await tab.startRecording();
      } catch (error) {
        this.logger.error(error);
      }
    }
    await this.saveConfig();
    const tab = await this.lastActivePage();
    if (tab) {
      this._recordingTabId = tab.id;
    }
  }

  async stopRecording(): Promise<void> {
    this.config.isRecording = false;
    const tabs = this.tabs;
    for (const tab of tabs) {
      try {
        await tab.stopRecording();
      } catch (error) {
        this.logger.error(error);
      }
    }
    await this.saveConfig();
    this._recordingTabId = undefined;
  }

  private _registerListeners(): void {
    // window events
    this._browserAPI.windowAPI.on('onCreated', async ({ window }) => {
      this.logger.debug('onCreated: window -', window);
      // if the DevTool created, then then windowId = -1
      if (Utils.isNullOrUndefined(window.id) || window.id < 0) {
        return;
      }
      this._addNewWindow(window);

      // notify the new window to sidebar
      await BackgroundUtils.dispatchEvent('windowCreated', window);
    });

    this._browserAPI.windowAPI.on('onFocusChanged', async ({ windowId }) => {
      this.logger.debug('onFocusChanged: windowId -', windowId);
      // if focus on the DevTool, then then windowId = -1
      if (Utils.isNullOrUndefined(windowId) || windowId < 0) {
        return;
      }
      this._activeWindowId = windowId;
    });

    this._browserAPI.windowAPI.on('onRemoved', async ({ windowId }) => {
      this.logger.debug('onRemoved: windowId -', windowId);
      if (Utils.isNullOrUndefined(windowId) || Utils.isNullOrUndefined(this._windows[windowId])) {
        return;
      }
      const window = this._windows[windowId];
      delete this._windows[windowId];
      this.emit('windowRemoved', { window: window });

      // notify the window close to sidebar
      await BackgroundUtils.dispatchEvent('windowRemoved', windowId);
    });

    this._browserAPI.windowAPI.on('onBoundsChanged', async ({ }) => {
    });

    // tab events
    this._browserAPI.tabAPI.on('onCreated', async ({ tab }) => {
      this.logger.debug('onCreated: tab -', tab);
      if (Utils.isNullOrUndefined(tab.id)) {
        return;
      }
      this._addNewTab(tab);

      // notify the new page to sidebar
      await BackgroundUtils.dispatchEvent('pageCreated', tab);

      if (this.config.isRecording
        && SettingUtils.getRecordSettings().recordNavigation
        && ['chrome://newtab/', 'edge://newtab/'].includes(tab.url || tab.pendingUrl || '')) {
        const step = { await: true, browserScript: 'browser', actionScript: `openNewPage()` };
        await this.recordStep(step);
        if (this._recordingTabId !== tab.id) {
          const lastActivePage = await this.lastActivePage();
          if (lastActivePage.id === tab.id) {
            this._recordingTabId = tab.id;
            const reset_page_step = {
              await: false,
              pageScript: 'page = await browser.lastActivePage()',
            };
            await this.recordStep(reset_page_step);
          }
        }
      }
    });

    this._browserAPI.tabAPI.on('onUpdated', async ({ tabId, changeInfo }) => {
      this.logger.debug('onUpdated: tabId -', tabId, ' changeInfo - ', changeInfo);
      if (Utils.isNullOrUndefined(tabId) || Utils.isNullOrUndefined(this._tabs[tabId])) {
        return;
      }
      const tab = this._tabs[tabId];
      tab.status = !Utils.isNullOrUndefined(changeInfo.status) ? changeInfo.status : tab.status;
      tab.title = !Utils.isNullOrUndefined(changeInfo.title) ? changeInfo.title : tab.title;
      tab.url = !Utils.isNullOrUndefined(changeInfo.url) ? changeInfo.url : tab.url;
      tab.favIconUrl = !Utils.isNullOrUndefined(changeInfo.favIconUrl) ? changeInfo.favIconUrl : tab.favIconUrl;
    });

    this._browserAPI.tabAPI.on('onActivated', async ({ activeInfo }) => {
      this.logger.debug('onActivated: activeInfo -', activeInfo);
      if (Utils.isNullOrUndefined(activeInfo)) {
        return;
      }
      // _activeTabId is updated after _activeWindowId (windows.onFocusChanged)
      if (this._activeWindowId !== activeInfo.windowId) {
        return;
      }
      this._activeTabId = activeInfo.tabId;
    });

    this._browserAPI.tabAPI.on('onRemoved', async ({ tabId }) => {
      this.logger.debug('onRemoved: tabId -', tabId);
      if (Utils.isNullOrUndefined(tabId) || Utils.isNullOrUndefined(this._tabs[tabId])) {
        return;
      }
      const tab = this._tabs[tabId];
      delete this._tabs[tabId];
      this._browserAPI.cdpAPI.removeTab(tabId);
      this.emit('tabRemoved', { tab: tab });

      // notify the page close to sidebar
      await BackgroundUtils.dispatchEvent('pageRemoved', tabId);
    });

    this._browserAPI.tabAPI.on('onZoomChange', async ({ zoomChangeInfo }) => {
      this.logger.debug('onZoomChange: zoomChangeInfo -', zoomChangeInfo);
      if (Utils.isNullOrUndefined(zoomChangeInfo)) {
        return;
      }
      const tab = this._tabs[zoomChangeInfo.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.zoomFactor = zoomChangeInfo.newZoomFactor;
    });

    // webNavigation events
    this._browserAPI.webNavigationAPI.on('onErrorOccurred', async (ev) => {
      this.logger.debug('onErrorOccurred -', ev);
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'ErrorOccurred', ev: ev });
    });
    this._browserAPI.webNavigationAPI.on('onBeforeNavigate', async (ev) => {
      this.logger.debug('onBeforeNavigate -', ev);
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'BeforeNavigate', ev: ev });
    });
    this._browserAPI.webNavigationAPI.on('onCommitted', async (ev) => {
      this.logger.debug('onCommitted -', ev);
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'Committed', ev: ev });

      if (this.config.isRecording
        && SettingUtils.getRecordSettings().recordNavigation
        && ev.transitionQualifiers && ev.transitionQualifiers.includes('from_address_bar')
        && ev.url) {
        const step = { await: true, pageScript: 'page', actionScript: `navigate('${ev.url}')` };
        await this.recordStep(step);
      }
    });
    this._browserAPI.webNavigationAPI.on('onDOMContentLoaded', async (ev) => {
      this.logger.debug('onDOMContentLoaded -', ev);
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'DOMContentLoaded', ev: ev });

      // notify the page DOMContentLoaded to sidebar
      if (ev.frameId === 0) {
        await BackgroundUtils.dispatchEvent('pageDOMContentLoaded', ev.tabId);
      }
    });
    this._browserAPI.webNavigationAPI.on('onCompleted', async (ev) => {
      this.logger.debug('onCompleted -', ev);
      const tab = this._tabs[ev.tabId];
      if (Utils.isNullOrUndefined(tab)) {
        return;
      }
      tab.updateFrameDetails(ev.frameId, { status: 'Completed', ev: ev });

      if (tab && this.config.attachDebugger && ev.frameId === 0) {
        Utils.wait(500).then(async () => {
          await this.attachDebuggerToTab(ev.tabId);
        });
      }
    });
  }

  private async _updateWindowTabs(): Promise<void> {
    const windows = await this._browserAPI.windowAPI.getAll(true);
    // clean the cache
    const windowIds = Object.keys(this._windows);
    for (const windowId of windowIds) {
      delete this._windows[Number(windowId)];
    }
    const tabIds = Object.keys(this._tabs);
    for (const tabId of tabIds) {
      delete this._tabs[Number(tabId)];
    }

    for (const window of windows) {
      this._addNewWindow(window);
      for (const tab of window.tabs || []) {
        const newTab = this._addNewTab(tab);
        if (newTab && tab.highlighted) {
          this._activeTabId = tab.id!;
          this._activeWindowId = tab.windowId;
        }
      }
    }
  }

  private _addNewWindow(window: chrome.windows.Window): WindowHandler | undefined {
    if (Utils.isNullOrUndefined(window.id)) {
      return;
    }
    const newWindow = new WindowHandler(window.id, this._browserAPI);
    this._windows[window.id] = newWindow;

    this.emit('windowCreated', { window: newWindow });
    return newWindow;
  }

  private _addNewTab(tab: chrome.tabs.Tab): TabHandler | undefined {
    if (Utils.isNullOrUndefined(tab.id)) {
      return;
    }
    const newTab = new TabHandler(tab.id, this._browserAPI);
    newTab.windowId = tab.windowId;
    newTab.index = tab.index;
    newTab.url = tab.url || tab.pendingUrl;
    newTab.title = tab.title;
    newTab.favIconUrl = tab.favIconUrl;
    newTab.status = tab.status;

    this._tabs[tab.id] = newTab;

    this._browserAPI.cdpAPI.addTab(tab.id);

    this.emit('tabCreated', { tab: newTab });
    return newTab;
  }

  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/

  async cookies(urls: string[] = []): Promise<Cookie[]> {
    const allCookies = await this._browserAPI.cookiesAPI.getAll({});
    const parsedURLs: URL[] = [];
    for (const s of urls) {
      parsedURLs.push(new URL(s));
    }

    const filteredCookies = allCookies.filter(c => {
      if (!parsedURLs.length)
        return true;
      for (const parsedURL of parsedURLs) {
        let domain = c.domain;
        if (!domain.startsWith('.'))
          domain = '.' + domain;
        if (!('.' + parsedURL.hostname).endsWith(domain))
          continue;
        if (!parsedURL.pathname.startsWith(c.path))
          continue;
        if (parsedURL.protocol !== 'https:' && !(parsedURL.hostname === 'localhost' || parsedURL.hostname.endsWith('.localhost')) && c.secure)
          continue;
        return true;
      }
      return false;
    });

    const toCookieObj = (obj: chrome.cookies.Cookie) => {
      const cookie: Cookie = {
        name: obj.name,
        value: obj.value,
        domain: obj.domain,
        path: obj.path,
        expires: obj.expirationDate || -1,
        httpOnly: obj.httpOnly,
        secure: obj.secure,
        session: obj.session,
        sameSite: undefined,
        partitionKey: undefined
      };
      if (obj.sameSite === 'lax') {
        cookie.sameSite = 'Lax';
      }
      else if (obj.sameSite === 'strict') {
        cookie.sameSite = 'Strict';
      }
      else if (obj.sameSite === 'no_restriction') {
        cookie.sameSite = 'None';
      }
      else if (obj.sameSite === 'unspecified') {
        cookie.sameSite = undefined;
      }
      if (obj.partitionKey) {
        cookie.partitionKey = obj.partitionKey.topLevelSite;
      }
      return cookie;
    };
    const results: Cookie[] = filteredCookies.map(c => toCookieObj(c));
    return results;
  }

  async addCookies(cookies: (Cookie & { url?: string })[]): Promise<void> {
    // first make sure the url or domain+path is valid
    for (const cookie of cookies) {
      if (!cookie.url) {
        if (!cookie.domain || !cookie.path) {
          throw new Error('Cookie must have url or domain+path');
        }
      }
    }
    const toSetDetail = (cookie: Cookie & { url?: string }) => {
      const detail: chrome.cookies.SetDetails = {
        name: cookie.name,
        value: cookie.value,
        url: cookie.url || '',
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        expirationDate: cookie.expires ?? undefined,
        httpOnly: cookie.httpOnly ?? undefined,
        sameSite: undefined,
        partitionKey: undefined,
      };

      if (cookie.url) {
        const url = new URL(cookie.url);
        detail.url = url.href;
        detail.domain = url.hostname;
        detail.path = url.pathname;
        detail.secure = url.protocol === 'https:';
      }

      if (!Utils.isNullOrUndefined(cookie.domain) && !Utils.isNullOrUndefined(cookie.path)) {
        if (!cookie.url) {
          const protocol = cookie.secure ? 'https:' : 'http:';
          const hostname = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
          let path = cookie.path ?? '/';
          if (!path.startsWith('/')) {
            path = `/${path}`; // Prepend "/" if missing (e.g., "admin" → "/admin")
          }
          detail.url = `${protocol}//${hostname}${path}`;
          detail.secure = protocol === 'https:';
        }
        detail.domain = cookie.domain;
        detail.path = cookie.path;
        if (!Utils.isNullOrUndefined(cookie.secure)) {
          detail.secure = cookie.secure;
        }
      }

      if (cookie.sameSite === 'Lax') {
        detail.sameSite = 'lax';
      }
      else if (cookie.sameSite === 'Strict') {
        detail.sameSite = 'strict';
      }
      else if (cookie.sameSite === 'None') {
        detail.sameSite = 'no_restriction';
      }
      else {
        detail.sameSite = 'unspecified';
      }

      if (cookie.partitionKey) {
        detail.partitionKey = { topLevelSite: cookie.partitionKey };
      }

      return detail;
    };

    for (const cookie of cookies) {
      const detail = toSetDetail(cookie);
      await this._browserAPI.cookiesAPI.set(detail);
    }
  }

  async clearCookies(options?: { name?: string | RegExpSpec, domain?: string | RegExpSpec, path?: string | RegExpSpec }): Promise<void> {
    const allCookies = await this._browserAPI.cookiesAPI.getAll({});
    const filteredCookies = allCookies.filter(c => {
      if (!options)
        return true;
      const props = ['name', 'domain', 'path'];
      for (const prop of props) {
        if (!(prop in options) || Utils.isNullOrUndefined((options as any)[prop])) {
          continue;
        }
        const optionValue = (options as any)[prop];
        const cookeValue = (c as any)[prop];
        if (typeof optionValue === 'string') {
          if (cookeValue !== optionValue) {
            return false;
          }
        }
        else if (Utils.isRegExpSpec(optionValue)) {
          const regExp = new RegExp(optionValue.pattern, optionValue.flags);
          if (!regExp.test(cookeValue)) {
            return false;
          }
        }
      }
      return true;
    });

    for (const cookie of filteredCookies) {
      const detail: chrome.cookies.CookieDetails = {
        name: cookie.name,
        url: '',
        partitionKey: cookie.partitionKey,
        storeId: cookie.storeId
      };
      const protocol = cookie.secure ? 'https:' : 'http:';
      const hostname = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
      let path = cookie.path ?? '/';
      if (!path.startsWith('/')) {
        path = `/${path}`; // Prepend "/" if missing (e.g., "admin" → "/admin")
      }
      detail.url = `${protocol}//${hostname}${path}`;
      await this._browserAPI.cookiesAPI.remove(detail);
    }
  }

  /**
   * Creates a new window.
   * @param url - String or array of strings. A URL or array of URLs to open as tabs in the window. 
   * @param tabId - If included, moves a tab of the specified ID from an existing window into the new window.
   * @param incognito - Whether the new window should be an incognito (private) window.
   * @returns Promise resolving to the created window object, or undefined on failure
   */
  async openNewWindow(url?: string | string[], _tabId?: number, incognito?: boolean): Promise<WindowInfo | undefined> {
    const window = await this._browserAPI.windowAPI.create(url, undefined, incognito);
    return Utils.deepClone(window);
  }

  /**
   * close the current browser
   */
  async close(): Promise<void> {
    const windows = await this._browserAPI.windowAPI.getAll();
    for (const window of windows) {
      if (window.id) {
        await this._browserAPI.windowAPI.remove(window.id);
      }
    }
  }

  /**
   * enable the cdp debugger, all tabs will be auto attached
   */
  async attachDebugger(): Promise<void> {
    this.config.attachDebugger = true;
    for (const tab of Object.values(this._tabs)) {
      await this.attachDebuggerToTab(tab.tabId);
    }
    await this.saveConfig();
  }

  /**
   * disable the cdp debugger, all tabs will be detached
   */
  async detachDebugger(): Promise<void> {
    this.config.attachDebugger = false;
    for (const tab of Object.values(this._tabs)) {
      const tabId = tab.tabId;
      try {
        await this._browserAPI.cdpAPI.detachTab(tabId);
      } catch (error) {
        this.logger.error(`detachTab: failed on tabId:${tabId}`, error);
      }
    }
    await this.saveConfig();
  }

  /**
   * attach the cdp debugger to the tab
   * @param tabId - Tab Id for attach
   */
  async attachDebuggerToTab(tabId: number): Promise<void> {
    try {
      await this._browserAPI.cdpAPI.attachTab(tabId);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : error;
      // debugger.attach failed: Cannot access chrome:// and edge:// URLs
      if (typeof errorMsg === 'string' && (errorMsg.includes('chrome://') || errorMsg.includes('edge://'))) {
        this.logger.debug(`attachDebuggerToTab: failed on tabId:${tabId}`, error);
      }
      else {
        this.logger.error(`attachDebuggerToTab: failed on tabId:${tabId}`, error);
      }
    }
  }

  /**
   * check if the window is closed
   * @param windowId - Window Id
   * @returns 
   */
  async isWindowClosed(windowId: number): Promise<boolean> {
    if (Utils.isNullOrUndefined(this._windows[windowId])) {
      return true;
    }
    return false;
  }

  /**
   * check if the tab is closed
   * @param tabId - Tab Id
   * @returns 
   */
  async isTabClosed(tabId: number): Promise<boolean> {
    if (Utils.isNullOrUndefined(this._tabs[tabId])) {
      return true;
    }
    return false;
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
    else if (propName === 'name') {
      const browserInfo = await this.browserInfo;
      return browserInfo.name
    }
    else if (propName === 'version') {
      const browserInfo = await this.browserInfo;
      return browserInfo.version
    }
    else if (propName === 'major_version') {
      const browserInfo = await this.browserInfo;
      return browserInfo.majorVersion
    }
    throw new Error(`Unknown property name - ${propName}`);
  }

  /**
   * query automation objects
   * @param desc description for objects
   * @returns automation objects
   */
  protected override async queryObjects(desc: AODesc): Promise<AutomationObject[]> {
    // browser.window({ lastFocused: true})
    if (desc.type === 'window') {
      return await this._queryWindows(desc);
    }
    // browser.page({ url: 'https://*/*', active: true, lastFocusedWindow: true, title: 'xxx', index: 1})
    if (desc.type === 'tab') {
      return await this._queryTabs(desc);
    }
    throw new Error(`Unknown description type - ${desc.type}`);
  }

  /** query windows */
  private async _queryWindows(desc: AODesc): Promise<AutomationObject[]> {

    let candidates: WindowInfo[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      for (const rtid of desc.rtids) {
        try {
          const window = await this._browserAPI.windowAPI.get(rtid.window);
          if (window) {
            candidates.push(window);
          }
        } catch (error) {
          this.logger.warn(`Get Window failed - ${rtid.window}`, error);
        }
      }
    }
    else if (desc.queryInfo) {
      // has assistive or ordinal, try to query one object
      const queryResult = await LocatorUtils.queryObjectsAsync(async (selectors) => {
        return await this._queryWindowsWithSelectors(selectors);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      candidates = await this._browserAPI.windowAPI.getAll();
    }

    candidates = candidates.filter(win => !Utils.isNullOrUndefined(win.id));

    const objects = candidates.map((win, index) => {
      return {
        type: "window" as const,
        name: 'window_' + index,
        rtid: RtidUtils.getWindowRtid(win.id!),
        runtimeInfo: { ...Utils.deepClone(win) },
        metaData: usedQueryInfo ? { used: usedQueryInfo } : undefined
      };
    });
    return objects;
  }

  /** query windows with selectors */
  private async _queryWindowsWithSelectors(selectors: Selector[]): Promise<WindowInfo[]> {
    // browser.window({ lastFocused: true})
    let lastFocused = false;
    let querySelectors: Selector[] = [];
    for (const selector of selectors) {
      const key = selector.name;
      if (key === 'lastFocused') {
        lastFocused = selector.value === true; //lastFocused is not a valid WindowInfo property
      }
      else {
        querySelectors.push(selector);
      }
    }

    const candidates: WindowInfo[] = [];
    // if select focused window, then return it directly
    if (lastFocused && querySelectors.length === 0) {
      const window = await this._browserAPI.windowAPI.getLastFocused();
      if (window?.id !== this._activeWindowId) {
        this.logger.warn(`window cache mismatch: _activeWindowId: ${this._activeWindowId}, lastFocusedWindowId: ${window.id}`);
      }
      if (window) {
        candidates.push(Utils.deepClone(window));
      }
      return candidates;;
    }

    let windows = await this._browserAPI.windowAPI.getAll(false);
    windows = windows.map(v => Utils.deepClone(v));
    if (querySelectors.length > 0) {
      return LocatorUtils.filterObjects(windows, querySelectors);
    }
    else {
      return windows;
    }
  }

  /** query tabs */
  private async _queryTabs(desc: AODesc): Promise<AutomationObject[]> {

    let candidates: TabInfo[] = [];
    let usedQueryInfo: QueryInfo | undefined = undefined;

    if (desc.rtids && desc.rtids.length > 0) {
      for (const rtid of desc.rtids) {
        try {
          const tab = await this._browserAPI.tabAPI.get(rtid.tab);
          if (tab) {
            candidates.push(tab);
          }
        } catch (error) {
          this.logger.warn(`Get Tab failed - ${rtid.tab}`, error);
        }
      }
    }
    else if (desc.queryInfo) {
      const queryResult = await LocatorUtils.queryObjectsAsync(async (selectors) => {
        return await this._queryTabsWithSelectors(selectors);
      }, desc.queryInfo);
      candidates = queryResult?.objects || [];
      usedQueryInfo = queryResult?.queryInfo;
    }
    else {
      candidates = await this._browserAPI.tabAPI.queryTab({}) || [];
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
    // browser.pages({ url: 'https://*/*', active: true, lastFocusedWindow: true, title: 'xxx', index: 1})
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
    // query with {active: true, lastFocusedWindow: true} does not always return correct tab especially in debugging
    if (active && lastFocusedWindow && querySelectors.length === 2) {
      const window = await this._browserAPI.windowAPI.getLastFocused(true);
      if (window.id !== this._activeWindowId) {
        this.logger.debug(`window cache mismatch: _activeWindowId: ${this._activeWindowId}, lastFocusedWindowId: ${window.id}`);
      }
      const tabs = window.tabs?.filter(tab => tab.active).map(tab => Utils.deepClone(tab));
      if (tabs && tabs.length > 0 && (tabs[0].id !== this._activeTabId)) {
        this.logger.debug(`tab cache mismatch: _activeTabId: ${this._activeTabId}, activeTabId: ${tabs[0].id}`);
      }
      if (tabs) {
        candidates.push(...tabs);
      }
      return candidates;
    }
    else if (lastFocusedWindow && querySelectors.length === 1) {
      const window = await this._browserAPI.windowAPI.getLastFocused(true);
      if (window.id !== this._activeWindowId) {
        this.logger.warn(`window cache mismatch: _activeWindowId: ${this._activeWindowId}, lastFocusedWindowId: ${window.id}`);
      }
      const tabs = window.tabs?.map(tab => Utils.deepClone(tab));
      if (tabs) {
        candidates.push(...tabs);
      }
      return candidates;
    }

    // query all tabs with the selectors
    const queryInfo: Record<string, unknown> = {};
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

  /** record the step with page & frame information */
  protected override async recordStep(step: RecordedStep): Promise<void> {
    if (step.elementRtid) {
      const tabId = step.elementRtid.tab;
      if (tabId !== this._recordingTabId) {
        const tab = await this.lastActivePage();
        if (tabId === tab.id) {
          this._recordingTabId = tabId;
          const reset_page_step = {
            await: false,
            pageScript: 'page = await browser.lastActivePage()',
          };
          await BackgroundUtils.dispatchEvent('stepRecorded', reset_page_step);
        }
      }
    }
    // send record event to sidebar
    await BackgroundUtils.dispatchEvent('stepRecorded', step);
  }

}