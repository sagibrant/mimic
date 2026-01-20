/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ChromeTabAPI.ts
 * @description 
 * Provide Chrome Tab APIs
 * We wrapper the known apis again so that old version apis can be used with promise
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

import { EventEmitter } from "@mimic-sdk/core";

/**
 * Aggregates all non-deprecated events from the chrome.tabs API into a TypeScript interface, 
 * intended for event emission in web extensions.
 */
export interface TabAPIEvents extends Record<string, unknown> {
  /**
   * Fired when a new tab is created. Note: The tab's URL may not be set yet.
   * @property tab - Details of the newly created tab.
   */
  onCreated: {
    tab: chrome.tabs.Tab;
  };

  /**
   * Fired when a tab is updated (e.g., URL changes, loading status updates).
   * @property tabId - The ID of the updated tab.
   * @property changeInfo - Object containing details of what changed.
   * @property tab - Full details of the tab after the update.
   */
  onUpdated: {
    tabId: number;
    changeInfo: chrome.tabs.OnUpdatedInfo;
    tab: chrome.tabs.Tab;
  };

  /**
   * Fired when the active tab in a window changes.
   * @property activeInfo - Object containing active details.
   */
  onActivated: {
    activeInfo: chrome.tabs.OnActivatedInfo;
  };

  /**
   * Fired when a tab is closed.
   * @property tabId - The ID of the closed tab.
   * @property removeInfo - Object containing closure details.
   */
  onRemoved: {
    tabId: number;
    removeInfo: chrome.tabs.OnRemovedInfo;
  };

  /**
   * Fired when a tab is attached to a window (e.g., moved from one window to another).
   * @property tabId - The ID of the tab being attached.
   * @property attachInfo - Object containing attachment details.
   */
  onAttached: {
    tabId: number;
    attachInfo: chrome.tabs.OnAttachedInfo;
  };

  /**
   * Fired when a tab is detached from a window (e.g., moved to another window).
   * @property tabId - The ID of the tab being detached.
   * @property detachInfo - Object containing detachment details.
   */
  onDetached: {
    tabId: number;
    detachInfo: chrome.tabs.OnDetachedInfo;
  };

  /**
   * Fired when the highlighted/selected tabs in a window change.
   * @property highlightInfo - Object containing highlighting details.
   */
  onHighlighted: {
    highlightInfo: chrome.tabs.OnHighlightedInfo;
  };

  /**
   * Fired when a tab is moved within its window.
   * @property tabId - The ID of the tab being moved.
   * @property moveInfo - Object containing movement details.
   */
  onMoved: {
    tabId: number;
    moveInfo: chrome.tabs.OnMovedInfo;
  };

  /**
   * Fired when a tab is replaced by a prerendered tab.
   * @property addedTabId - The ID of the new (prerendered) tab.
   * @property removedTabId - The ID of the tab being replaced.
   */
  onReplaced: {
    addedTabId: number;
    removedTabId: number;
  };

  /**
   * Fired when a tab's zoom level changes.
   * @property zoomChangeInfo - Object containing zoom change details.
   */
  onZoomChange: {
    zoomChangeInfo: chrome.tabs.OnZoomChangeInfo;
  };
}

/**
 * The browser tab api wrapper on chrome based browsers
 */
export class ChromeTabAPI extends EventEmitter<TabAPIEvents> {

  constructor() {
    super();
    this._init();
  }

  private _init(): void {
    chrome.tabs.onCreated.addListener((tab) => {
      this.emit('onCreated', { tab: tab });
    });
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.emit('onUpdated', { tabId, changeInfo: changeInfo, tab });
    });
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.emit('onActivated', { activeInfo });
    });
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      this.emit('onRemoved', { tabId: tabId, removeInfo: removeInfo });
    });
    chrome.tabs.onZoomChange.addListener((zoomChangeInfo) => {
      this.emit('onZoomChange', { zoomChangeInfo: zoomChangeInfo });
    });
  }

  async get(tabId: number): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.get failed: ${error.message}`));
        }
        else if (!tab) {
          reject(new Error(`Tab ${tabId} does not exist`));
        }
        else {
          resolve(tab);
        }
      });
    });
  }

  async activate(tabId: number): Promise<chrome.tabs.Tab> {
    let tab = await this.get(tabId);
    if (!tab.active) {
      const newTab = await this.updateTab(tabId, { active: true });
      tab = newTab ? newTab : await this.get(tabId);
    }
    return tab;
  }

  async updateTab(tabId: number, updateInfo: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab | undefined> {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, updateInfo, (tab) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.update failed: ${error.message}`));
        }
        else {
          resolve(tab);
        }
      });
    });
  }

  async navigate(tabId: number, url: string): Promise<chrome.tabs.Tab | undefined> {
    const tab = await this.updateTab(tabId, { url: url });
    return tab;
  }

  async reload(tabId: number, bypassCache: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.reload(tabId, { bypassCache: bypassCache }, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.reload failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  async openNewTab(url?: string, windowId?: number, openerTabId?: number): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, reject) => {
      chrome.tabs.create({ active: true, url: url, windowId, openerTabId }, (tab) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.create failed: ${error.message}`));
        }
        else {
          resolve(tab);
        }
      });
    });
  }

  async close(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.remove(tabId, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.remove failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  async capturePage(tabId: number): Promise<string> {
    let tab = await this.get(tabId);
    return new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 80 }, (dataUrl) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.captureVisibleTab failed: ${error.message}`));
        }
        else {
          resolve(dataUrl);
        }
      });
    });
  }

  async zoom(tabId: number, zoomFactor: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.setZoom(tabId, zoomFactor, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.setZoom failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  async goBack(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.goBack(tabId, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.goBack failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  async goForward(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.goForward(tabId, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.goForward failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  async moveToWindow(tabId: number, windowId: number, index: number = -1): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, reject) => {
      chrome.tabs.move(tabId, { index: index, windowId: windowId }, (tab) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.move failed: ${error.message}`));
        }
        else {
          resolve(tab);
        }
      });
    });
  }

  async queryTab(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query(queryInfo, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`tabs.query failed: ${error.message}`));
        }
        else {
          resolve(result);
        }
      });
    });
  }

  /** @deprecated not really working, seems it will fail at dev mode */
  async queryLastFocusedTab(): Promise<chrome.tabs.Tab> {
    const tabs = await this.queryTab({ lastFocusedWindow: true, active: true });
    if (tabs.length !== 1) {
      throw new Error(`Find ${tabs.length} tabs for LastFocusedTab`);
    }
    return tabs[0];
  }

}