/**
 * ChromiumTabAPI.ts
 * Provide Chromium Tab APIs
 * We wrapper the known apis again so that old version apis can be used with promise
 * Author: Zhang Jie
 */
import { Utils } from '../../common/Common';
import { EventEmitter } from '../../common/EventEmitter';

/**
 * Aggregates all non-deprecated events from the chrome.tabs API into a TypeScript interface, 
 * intended for event emission in web extensions.
 */
export interface TabAPIEvents {
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
   * Fired when a tab is closed.
   * @property tabId - The ID of the closed tab.
   * @property removeInfo - Object containing closure details.
   */
  onRemoved: {
    tabId: number;
    removeInfo: chrome.tabs.OnRemovedInfo;
  };

  /**
   * Fired when the active tab in a window changes.
   * @property activeInfo - Object containing active details.
   */
  onActivated: {
    activeInfo: chrome.tabs.OnActivatedInfo;
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
 * The browser tab api wrapper on chromium based browsers
 */
export class ChromiumTabAPI extends EventEmitter<TabAPIEvents> {

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

  async active(tabId: number): Promise<void> {
    try {
      let tab = await this.getTab(tabId);
      const windowId = tab.windowId;

      if (Utils.isNullOrUndefined(windowId)) {
        this.logger.error('active: Tab does not belong to any window');
        return;
      }

      const window = await this.getWindow(windowId);

      if (!window.focused) {
        await this.updateWindow(windowId, { focused: true });
        tab = await this.getTab(tabId); //get tab again
      }

      if (!tab.active) {
        await this.udpateTab(tabId, { active: true });
        this.logger.info(`active: Tab ${tabId} activated successfully`);
      }
      else {
        this.logger.info(`active: Tab ${tabId} is already active`);
      }

    }
    catch (error) {
      this.logger.error(`activate: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async navigate(tabId: number, url: string): Promise<void> {
    try {
      await this.udpateTab(tabId, { url: url });
    }
    catch (error) {
      this.logger.error(`navigate: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async refresh(tabId: number, bypassCache: boolean = false): Promise<void> {
    try {
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
    catch (error) {
      this.logger.error(`refresh: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async openNewTab(tabId: number, url?: string): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        chrome.tabs.create({ active: true, url: url }, (_tab) => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(new Error(`tabs.create failed: ${error.message}`));
          }
          else {
            resolve();
          }
        });
      });
    }
    catch (error) {
      this.logger.error(`openNewTab: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async close(tabId: number): Promise<void> {
    try {
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
    catch (error) {
      this.logger.error(`close: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async capturePage(tabId: number): Promise<string | undefined> {
    try {
      let tab = await this.getTab(tabId);
      const windowId = tab.windowId;

      if (Utils.isNullOrUndefined(windowId)) {
        this.logger.error('capturePage: Tab does not belong to any window');
        return undefined;
      }

      return new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(tab.windowId, (dataUrl) => {
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
    catch (error) {
      this.logger.error(`capturePage: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async zoom(tabId: number, zoomFactor: number): Promise<void> {
    try {
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
    catch (error) {
      this.logger.error(`zoom: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async goBack(tabId: number): Promise<void> {
    try {
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
    catch (error) {
      this.logger.error(`goBack: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async goForward(tabId: number): Promise<void> {
    try {
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
    catch (error) {
      this.logger.error(`goForward: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async minimize(tabId: number): Promise<void> {
    try {
      let tab = await this.getTab(tabId);
      const windowId = tab.windowId;

      if (Utils.isNullOrUndefined(windowId)) {
        this.logger.error('minimize: Tab does not belong to any window');
        return;
      }

      await this.updateWindow(windowId, { state: chrome.windows.WindowState.MINIMIZED });
    }
    catch (error) {
      this.logger.error(`minimize: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async maximize(tabId: number): Promise<void> {
    try {
      let tab = await this.getTab(tabId);
      const windowId = tab.windowId;

      if (Utils.isNullOrUndefined(windowId)) {
        this.logger.error('minimize: Tab does not belong to any window');
        return;
      }

      await this.updateWindow(windowId, { state: chrome.windows.WindowState.MAXIMIZED });
    }
    catch (error) {
      this.logger.error(`maximize: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async restore(tabId: number): Promise<void> {
    try {
      let tab = await this.getTab(tabId);
      const windowId = tab.windowId;

      if (Utils.isNullOrUndefined(windowId)) {
        this.logger.error('restore: Tab does not belong to any window');
        return;
      }

      await this.updateWindow(windowId, { state: chrome.windows.WindowState.NORMAL });
    }
    catch (error) {
      this.logger.error(`restore: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async fullscreen(tabId: number, toggle: boolean = true): Promise<void> {
    try {
      let tab = await this.getTab(tabId);
      const windowId = tab.windowId;

      if (Utils.isNullOrUndefined(windowId)) {
        this.logger.error('fullscreen: Tab does not belong to any window');
        return;
      }

      let state = chrome.windows.WindowState.FULLSCREEN;
      if (toggle == true) {
        const window = await this.getWindow(windowId);
        if (window.state === chrome.windows.WindowState.FULLSCREEN) {
          state = chrome.windows.WindowState.NORMAL;
        }
        else {
          state = chrome.windows.WindowState.FULLSCREEN;
        }
      }

      await this.updateWindow(windowId, { state: state });
    }
    catch (error) {
      this.logger.error(`fullscreen: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async getAllTabsInWindow(tabId: number): Promise<chrome.tabs.Tab[] | undefined> {
    try {
      let tab = await this.getTab(tabId);
      const windowId = tab.windowId;

      if (Utils.isNullOrUndefined(windowId)) {
        this.logger.error('getAllTabsInWindow: Tab does not belong to any window');
        return;
      }

      return new Promise((resolve, reject) => {
        chrome.tabs.query({ windowId: windowId }, (result) => {
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
    catch (error) {
      this.logger.error(`getAllTabsInWindow: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  async moveToWindow(tabId: number, windowId: number, index: number = -1): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        chrome.tabs.move(tabId, { index: index, windowId: windowId }, () => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(new Error(`tabs.move failed: ${error.message}`));
          }
          else {
            resolve();
          }
        });
      });
    }
    catch (error) {
      this.logger.error(`moveToWindow: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  /** ================================================================== */
  /** ========================= Helper methods ========================= */
  /** ================================================================== */

  private getTab(tabId: number): Promise<chrome.tabs.Tab> {
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

  private udpateTab(tabId: number, updateInfo: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab | undefined> {
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

  private getWindow(windowId: number): Promise<chrome.windows.Window> {
    return new Promise((resolve, reject) => {
      chrome.windows.get(windowId, (window) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`windows.get failed: ${error.message}`));
        }
        else if (!window) {
          reject(new Error(`Window ${windowId} does not exist`));
        }
        else {
          resolve(window);
        }
      });
    });
  }

  private updateWindow(windowId: number, updateInfo: chrome.windows.UpdateInfo): Promise<chrome.windows.Window> {
    return new Promise((resolve, reject) => {
      chrome.windows.update(windowId, updateInfo, (window) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`windows.update failed: ${error.message}`));
        }
        else {
          resolve(window);
        }
      });
    });
  }

}