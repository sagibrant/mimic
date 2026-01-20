/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ChromeWindowAPI.ts
 * @description 
 * Provide Chrome Window APIs
 * We wrap the known APIs again so that old version APIs can be used with promises
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
 * Aggregates all non-deprecated events from the chrome.window API into a TypeScript interface, 
 * intended for event emission in web extensions.
 */
export interface WindowAPIEvents extends Record<string, unknown> {
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
 * The browser window API wrapper for chrome browsers
 * Wraps Chrome's callback-based window APIs into promise-based methods and forwards events via EventEmitter
 */
export class ChromeWindowAPI extends EventEmitter<WindowAPIEvents> {
  /**
   * Initialize the ChromeWindowAPI instance
   * Sets up event listeners for Chrome window events and forwards them through the EventEmitter
   */
  constructor() {
    super();
    this._init();
  }

  /**
   * Internal initialization method to set up Chrome window event listeners
   * Forwards Chrome's native window events to the EventEmitter for consistent event handling
   */
  private _init(): void {
    chrome.windows.onCreated.addListener((window) => {
      this.emit('onCreated', { window: window });
    });
    chrome.windows.onRemoved.addListener((windowId) => {
      this.emit('onRemoved', { windowId });
    });
    chrome.windows.onFocusChanged.addListener((windowId) => {
      this.emit('onFocusChanged', { windowId });
    });
    chrome.windows.onBoundsChanged.addListener((window) => {
      this.emit('onBoundsChanged', { window: window });
    });
  }

  /**
   * Creates a new window.
   * @param url - String or array of strings. A URL or array of URLs to open as tabs in the window. 
   * @param tabId - If included, moves a tab of the specified ID from an existing window into the new window.
   * @param incognito - Whether the new window should be an incognito (private) window.
   * @returns Promise resolving to the created window object, or undefined on failure
   */
  async create(url?: string | string[], tabId?: number, incognito?: boolean): Promise<chrome.windows.Window | undefined> {
    return new Promise((resolve, reject) => {
      chrome.windows.create({ url: url, tabId, incognito, focused: true }, (window) => {
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
   * Gets details about a window, given its ID.
   * @param windowId - The ID of the window object to retrieve
   * @param populate - If true, the window object will include a `tabs` property with tab details (url, title, favIconUrl)
   * @returns Promise resolving to the requested window object
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
   * Gets information about all open windows.
   * @param populate - If true, each window object will include a `tabs` property with tab details
   * @returns Promise resolving to an array of all open window objects
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
   * Gets the current browser window (context-dependent).
   * - From background scripts: returns the currently focused window
   * - From document-associated scripts (e.g., sidebars): returns the window containing the document
   * @param populate - If true, the window object will include a `tabs` property with tab details
   * @returns Promise resolving to the current window object
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
   * Gets the most recently focused window (typically the topmost window).
   * @param populate - If true, the window object will include a `tabs` property with tab details
   * @returns Promise resolving to the last focused window object
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
   * Closes a window and all its tabs.
   * @param windowId - ID of the window to close
   * @returns Promise resolving when the window is closed
   */
  async remove(windowId: number): Promise<void> {
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
   * Updates a window's properties (position, size, focus, state, etc.).
   * @param windowId - ID of the window to update
   * @param updateInfo - Object containing properties to update (e.g., state, bounds, focused)
   * @returns Promise resolving to the updated window object
   */
  async update(windowId: number, updateInfo: chrome.windows.UpdateInfo): Promise<chrome.windows.Window> {
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
  /**
   * Focus a window.
   * @param windowId - ID of the window to minimize
   * @param focused - if the window should be focused
   * @returns Promise resolving to the updated window object (minimized state)
   * @note Does nothing if the window is already focused as expected
   */
  async focus(windowId: number, focused: boolean = true): Promise<chrome.windows.Window> {
    let window = await this.get(windowId);
    if (window.focused === focused) {
      return window; // Already focused
    }
    window = await this.update(windowId, { focused: focused });
    return window;
  }

  /**
   * Minimizes a window.
   * @param windowId - ID of the window to minimize
   * @returns Promise resolving to the updated window object (minimized state)
   * @note Does nothing if the window is already minimized
   */
  async minimize(windowId: number): Promise<chrome.windows.Window> {
    let window = await this.get(windowId);
    if (window.state === chrome.windows.WindowState.MINIMIZED) {
      return window; // Already minimized
    }
    // Update state to minimized
    window = await this.update(windowId, { state: chrome.windows.WindowState.MINIMIZED });
    return window;
  }

  /**
   * Maximizes a window.
   * @param windowId - ID of the window to maximize
   * @returns Promise resolving to the updated window object (maximized state)
   * @note If the window is minimized, it will be focused before maximizing
   */
  async maximize(windowId: number): Promise<chrome.windows.Window> {
    let window = await this.get(windowId);
    if (window.state === chrome.windows.WindowState.MAXIMIZED) {
      return window; // Already maximized
    }
    // Handle minimized state by focusing first
    if (window.state === chrome.windows.WindowState.MINIMIZED) {
      window = await this.update(windowId, { state: chrome.windows.WindowState.MAXIMIZED, focused: true });
    } else {
      window = await this.update(windowId, { state: chrome.windows.WindowState.MAXIMIZED });
    }
    return window;
  }

  /**
   * Restores a window to its normal (non-minimized, non-maximized) state.
   * @param windowId - ID of the window to restore
   * @returns Promise resolving to the updated window object (normal state)
   * @note If the window is minimized, it will be focused before restoring
   */
  async restore(windowId: number): Promise<chrome.windows.Window> {
    let window = await this.get(windowId);
    if (window.state === chrome.windows.WindowState.NORMAL) {
      return window; // Already in normal state
    }
    // Handle minimized state by focusing first
    if (window.state === chrome.windows.WindowState.MINIMIZED) {
      window = await this.update(windowId, { state: chrome.windows.WindowState.NORMAL, focused: true });
    } else {
      window = await this.update(windowId, { state: chrome.windows.WindowState.NORMAL });
    }
    return window;
  }

  /**
   * Toggles or sets a window's fullscreen state.
   * @param windowId - ID of the window to modify
   * @param toggle - If true, toggles fullscreen state; if false, forces fullscreen on
   * @returns Promise resolving to the updated window object (fullscreen or normal state)
   * @note If the window is minimized, it will be focused before changing state
   */
  async fullscreen(windowId: number, toggle: boolean = true): Promise<chrome.windows.Window> {
    let targetState = chrome.windows.WindowState.FULLSCREEN;
    const currentWindow = await this.get(windowId);

    // Determine target state based on toggle and current state
    if (toggle) {
      targetState = currentWindow.state === chrome.windows.WindowState.FULLSCREEN
        ? chrome.windows.WindowState.NORMAL
        : chrome.windows.WindowState.FULLSCREEN;
    }

    // Exit early if already in target state
    if (currentWindow.state === targetState) {
      return currentWindow;
    }

    // Update state, focusing first if minimized
    const updateOptions = {
      state: targetState,
      ...(currentWindow.state === chrome.windows.WindowState.MINIMIZED && { focused: true })
    };
    const updatedWindow = await this.update(windowId, updateOptions);
    return updatedWindow;
  }
}
