/**
 * ChromiumWindowAPI.ts
 * Provide Chromium Window APIs
 * We wrapper the known apis again so that old version apis can be used with promise
 * Author: Zhang Jie
 */
import { EventEmitter } from '../../common/EventEmitter';

/**
 * Aggregates all non-deprecated events from the chrome.window API into a TypeScript interface, 
 * intended for event emission in web extensions.
 */
export interface WindowAPIEvents {
  /**
   * Fired when a window is created.
   * @property window - Details of the newly created window.
   */
  onCreated: {
    window: chrome.windows.Window;
  };

  /**
   * Fired when a window is closed.
   * @property windowId - The ID of the closed window.
   */
  onRemoved: {
    windowId: number;
  };

  /**
   * Fired when the currently focused window changes. Will be windows.WINDOW_ID_NONE if all browser windows have lost focus.
   * Note: In Windows and some Linux window managers, WINDOW_ID_NONE will always be sent immediately preceding a switch from one browser window to another.
   * @property windowId - ID of the newly focused window.
   */
  onFocusChanged: {
    windowId: number;
  };

  /**
   * Fired when a window is resized or moved. This event is fired when the new bounds are committed. It doesn't fire for in-progress changes.
   * @property window - A windows.Window object containing details of the window that was resized or moved.
   */
  onBoundsChanged: {
    window: chrome.windows.Window;
  };
}

/**
 * The browser window api wrapper on chromium based browsers
 */
export class ChromiumWindowAPI extends EventEmitter<WindowAPIEvents> {
  constructor() {
    super();

    this._init();
  }

  private _init(): void {
    // chrome.windows.onCreated.addListener((window) => {
    //   this.emit('onCreated', { window: window });
    // });
    // chrome.windows.onRemoved.addListener((windowId) => {
    //   this.emit('onRemoved', { windowId });
    // });
    chrome.windows.onFocusChanged.addListener((windowId) => {
      this.emit('onFocusChanged', { windowId });
    });
    // chrome.windows.onBoundsChanged.addListener((window) => {
    //   this.emit('onBoundsChanged', { window: window });
    // });
  }

  /**
   * Creates a new window.
   * @param url string or array of strings. A URL or array of URLs to open as tabs in the window. 
   * @param tabId If included, moves a tab of the specified ID from an existing window into the new window.
   * @param incognito Whether the new window should be an incognito (private) window.
   * @returns 
   */
  async create(url?: string | string[], tabId?: number, incognito?: boolean): Promise<chrome.windows.Window | undefined> {
    return new Promise((resolve, reject) => {
      chrome.windows.create({ url: url, tabId, incognito }, (window) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`windows.create failed: ${error.message}`));
        }
        else {
          resolve(window);
        }
      });
    });
  }

  /**
   * Gets details about a window, given its ID. The details are passed into a callback
   * @param windowId The ID of the window object you want returned.
   * @param populate If true, the windows.Window object will have a tabs property and tab contain the url, title and favIconUrl properties
   * @returns 
   */
  async get(windowId: number, populate?: boolean): Promise<chrome.windows.Window> {
    return new Promise((resolve, reject) => {
      chrome.windows.get(windowId, { populate }, (window) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`windows.get failed: ${error.message}`));
        }
        else {
          resolve(window);
        }
      });
    });
  }

  /**
   * Gets information about all open windows, passing them into a callback.
   * @param populate If true, the windows.Window object will have a tabs property and tab contain the url, title and favIconUrl properties
   * @returns 
   */
  async getAll(populate?: boolean): Promise<chrome.windows.Window[]> {
    return new Promise((resolve, reject) => {
      chrome.windows.getAll({ populate }, (windows) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`windows.getAll failed: ${error.message}`));
        }
        else {
          resolve(windows);
        }
      });
    });
  }

  /**
   * Gets the current browser window, passing its details into a callback.
   * The "current" window is not necessarily the same as the currently focused window. 
   * If this function is called from a background script, then it returns the currently focused window. 
   * But if it is called from a script whose document is associated with a particular browser window, then it returns that browser window. 
   * For example, if the browser is displaying a sidebar, then every browser window has its own instance of the sidebar document. 
   * If a script running in the sidebar document calls getCurrent(), then it will return that sidebar document's window.
   * @param populate If true, the windows.Window object will have a tabs property and tab contain the url, title and favIconUrl properties
   * @returns 
   */
  async getCurrent(populate?: boolean): Promise<chrome.windows.Window> {
    return new Promise((resolve, reject) => {
      chrome.windows.getCurrent({ populate }, (window) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`windows.getCurrent failed: ${error.message}`));
        }
        else {
          resolve(window);
        }
      });
    });
  }

  /**
   * Gets the window that was most recently focused — typically the window 'on top'.
   * @param populate If true, the windows.Window object will have a tabs property and tab contain the url, title and favIconUrl properties
   * @returns 
   */
  async getLastFocused(populate?: boolean): Promise<chrome.windows.Window> {
    return new Promise((resolve, reject) => {
      chrome.windows.getLastFocused({ populate }, (window) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`windows.getLastFocused failed: ${error.message}`));
        }
        else {
          resolve(window);
        }
      });
    });
  }

  /**
   * Closes a window and all the tabs inside it, given the window's ID.
   * @param windowId ID of the window to close.
   * @returns 
   */
  remove(windowId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.windows.remove(windowId, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`windows.remove failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  /**
   * Updates the properties of a window. Use this to move, resize, and (un)focus a window, etc.
   * @param windowId ID of the window to update.
   * @param updateInfo Object containing the properties to update.
   * @returns 
   */
  update(windowId: number, updateInfo: chrome.windows.UpdateInfo): Promise<chrome.windows.Window> {
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