/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ChromeWebNavigationAPI.ts
 * @description 
 * Provide Chrome webNavigation APIs
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

import { Utils, EventEmitter } from "@gogogo/shared";

/**
 * Wrapper for WebNavigationEvent in chrome.webNavigation
 */
export interface WebNavigationEventDetails {
  /** The ID of the process runs the renderer for this tab. */
  processId?: number;
  /** The URL for navigation. */
  url: string;
  /** The ID of the tab in which the navigation is about to occur. */
  tabId: number;
  /** 0 indicates the navigation happens in the tab content window; a positive value indicates navigation in a subframe. Frame IDs are unique for a given tab and process. */
  frameId: number;
  /** The type of frame the navigation occurred in. */
  frameType?: FrameType;
  /** ID of frame that wraps the frame. Set to -1 of no parent frame exists. */
  parentFrameId?: number;
  /** A UUID of the document loaded. (This is not set for onBeforeNavigate callbacks.) */
  documentId?: string;
  /** A UUID of the parent document owning this frame. This is not set if there is no parent. */
  parentDocumentId?: string;
  /**
   * Cause of the navigation.
   * One of: "link", "typed", "auto_bookmark", "auto_subframe", "manual_subframe", "generated", "start_page", "form_submit", "reload", "keyword", or "keyword_generated"
  */
  transitionType?: string;
  /**
   * A list of transition qualifiers.
   * Each element one of: "client_redirect", "server_redirect", "forward_back", or "from_address_bar"
   */
  transitionQualifiers?: string[];
  /** The time when the browser was about to start the navigation, in milliseconds since the epoch. */
  timeStamp: number;
  /** The error description. */
  error?: string;
}

/**
 * Wrapper for GetAllFrameResultDetails in chrome.webNavigation
 */
export interface FrameResult {
  /** The ID of the process runs the renderer for this tab. */
  processId?: number;
  /** The URL for navigation. */
  url: string;
  /** The ID of the tab in which the navigation is about to occur. */
  tabId: number;
  /** 0 indicates the navigation happens in the tab content window; a positive value indicates navigation in a subframe. Frame IDs are unique for a given tab and process. */
  frameId: number;
  /** The type of frame the navigation occurred in. */
  frameType?: FrameType;
  /** ID of frame that wraps the frame. Set to -1 of no parent frame exists. */
  parentFrameId?: number;
  /** A UUID of the document loaded. (This is not set for onBeforeNavigate callbacks.) */
  documentId?: string;
  /** A UUID of the parent document owning this frame. This is not set if there is no parent. */
  parentDocumentId?: string;
  /** True if the last navigation in this frame was interrupted by an error, i.e. the onErrorOccurred event fired. */
  errorOccurred?: boolean;
}

/**
 * Aggregates all non-deprecated events from the chrome.webNavigation API into a TypeScript interface, 
 * intended for event emission in web extensions.
 */
export interface WebNavigationEvents extends Record<string, unknown> {
  /** Fired when a navigation is about to occur. */
  onBeforeNavigate: WebNavigationEventDetails;
  /** Fired when a navigation is committed. The document (and the resources it refers to, such as images and subframes) might still be downloading, but at least part of the document has been received from the server and the browser has decided to switch to the new document. */
  onCommitted: WebNavigationEventDetails;
  /** Fired when the page's DOM is fully constructed, but the referenced resources may not finish loading. */
  onDOMContentLoaded: WebNavigationEventDetails;
  /** Fired when a document, including the resources it refers to, is completely loaded and initialized. */
  onCompleted: WebNavigationEventDetails;
  /** Fired when an error occurs and the navigation is aborted. This can happen if either a network error occurred, or the user aborted the navigation. */
  onErrorOccurred: WebNavigationEventDetails;
}

/**
 * The webNavigation api wrapper on chrome based browsers
 */
export class ChromeWebNavigationAPI extends EventEmitter<WebNavigationEvents> {
  constructor() {
    super();
    this._init();
  }

  private _init(): void {
    chrome.webNavigation.onErrorOccurred.addListener((details) => {
      if (!this.hasListeners('onErrorOccurred')) {
        return;
      }
      this.emit('onErrorOccurred', {
        processId: details.processId,
        url: details.url,
        tabId: details.tabId,
        frameId: details.frameId,
        frameType: details.frameType,
        documentId: details.documentId,
        parentDocumentId: details.parentDocumentId,
        timeStamp: details.timeStamp,
        error: details.error
      });
    });
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (!this.hasListeners('onBeforeNavigate')) {
        return;
      }
      this.emit('onBeforeNavigate', {
        processId: details.processId,
        url: details.url,
        tabId: details.tabId,
        frameId: details.frameId,
        frameType: details.frameType,
        parentFrameId: details.parentFrameId,
        documentId: (details as any).documentId,
        parentDocumentId: details.parentDocumentId,
        timeStamp: details.timeStamp
      });
    });
    chrome.webNavigation.onCommitted.addListener((details) => {
      if (!this.hasListeners('onCommitted')) {
        return;
      }
      this.emit('onCommitted', {
        processId: details.processId,
        url: details.url,
        tabId: details.tabId,
        frameId: details.frameId,
        frameType: details.frameType,
        documentId: details.documentId,
        parentDocumentId: details.parentDocumentId,
        timeStamp: details.timeStamp,
        transitionQualifiers: details.transitionQualifiers
      });
    });
    chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
      if (!this.hasListeners('onDOMContentLoaded')) {
        return;
      }
      this.emit('onDOMContentLoaded', {
        processId: details.processId,
        url: details.url,
        tabId: details.tabId,
        frameId: details.frameId,
        frameType: details.frameType,
        documentId: details.documentId,
        parentDocumentId: details.parentDocumentId,
        timeStamp: details.timeStamp
      });
    });
    chrome.webNavigation.onCompleted.addListener((details) => {
      if (!this.hasListeners('onCompleted')) {
        return;
      }
      this.emit('onCompleted', {
        processId: details.processId,
        url: details.url,
        tabId: details.tabId,
        frameId: details.frameId,
        frameType: details.frameType,
        documentId: details.documentId,
        parentDocumentId: details.parentDocumentId,
        timeStamp: details.timeStamp
      });
    });
  }

  async getAllFrames(tabId: number): Promise<FrameResult[]> {
    return new Promise((resolve, reject) => {
      chrome.webNavigation.getAllFrames({ tabId: tabId }, (frames) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`chrome.webNavigation.getAllFrames failed: ${error.message}`));
        }
        else if (Utils.isNullOrUndefined(frames)) {
          reject(new Error(`chrome.webNavigation.getAllFrames failed: find null frames, maybe the tab[${tabId}] is invalid`));
        }
        else {
          const result: FrameResult[] = frames.map((frame) => {
            const frameResult: FrameResult = { tabId: tabId, ...frame };
            return frameResult;
          });
          resolve(result);
        }
      });
    });
  }
}

/**
 * The type of frame.
 * @since Chrome 106
 */
export type FrameType = "outermost_frame" | "fenced_frame" | "sub_frame";