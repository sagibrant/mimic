/**
 * Tab.ts
 * Support the automation actions on a specific Tab
 * Author: Zhang Jie
 */

import { Rtid } from "../../common/Common";
import { MessageData } from "../../common/Messaging/Message";
import { MsgDataHandlerBase, ResultCallback } from "../../common/Messaging/MsgDataHandlerBase";
import { ChromiumExtensionAPI } from "../app/ChromiumExtensionAPI";
import { ChromiumTabAPI } from "../app/ChromiumTabAPI";

export class Tab extends MsgDataHandlerBase {
  private readonly _tabId: number;
  private readonly _browserAPI: ChromiumExtensionAPI;
  private get _tabAPI(): ChromiumTabAPI {
    return this._browserAPI.tabAPI;
  }
  get tabId(): number {
    return this._tabId;
  }
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
  zoomFactor?: number;

  constructor(tabId: number, browserAPI: ChromiumExtensionAPI) {
    const rtid = new Rtid();
    rtid.context = 'background';
    rtid.page = tabId;
    super(rtid);
    this._tabId = tabId;
    this._browserAPI = browserAPI;
  }

  handle(_data: MessageData, _resultCallback?: ResultCallback): boolean {
    throw new Error("Method not implemented.");
  }

  active(): void {
    this._tabAPI.active(this._tabId);
  }

  navigate(url: string): void {
    this._tabAPI.navigate(this._tabId, url);
  }

  refresh(bypassCache: boolean = false): void {
    this._tabAPI.refresh(this._tabId, bypassCache);
  }

  openNewTab(url?: string): void {
    this._tabAPI.openNewTab(this._tabId, url);
  }

  close(): void {
    this._tabAPI.close(this._tabId);
  }

  capturePage(resultCallback: (result: string | undefined) => {}): void {
    this._tabAPI.capturePage(this._tabId).then((imageDataUrl) => {
      if (resultCallback) {
        resultCallback(imageDataUrl);
      }
    }).catch((_error) => {
      if (resultCallback) {
        resultCallback(undefined);
      }
    });
  }

  zoom(zoomFactor: number): void {
    this._tabAPI.zoom(this._tabId, zoomFactor);
  }

  goBack(): void {
    this._tabAPI.goBack(this._tabId);
  }

  goForward(): void {
    this._tabAPI.goForward(this._tabId);
  }

  minimize(): void {
    this._tabAPI.minimize(this._tabId);
  }

  maximize(): void {
    this._tabAPI.maximize(this._tabId);
  }

  restore(): void {
    this._tabAPI.restore(this._tabId);
  }

  fullscreen(toggle: boolean = true): void {
    this._tabAPI.fullscreen(this._tabId, toggle);
  }

  getAllTabCountInWindow(resultCallback: (result: number | undefined) => {}): void {
    this._tabAPI.getAllTabsInWindow(this._tabId).then((result) => {
      if (resultCallback) {
        resultCallback(result?.length);
      }
    }).catch((_error) => {
      if (resultCallback) {
        resultCallback(undefined);
      }
    });
  }

  moveToWindow(windowId: number, index: number = -1): void {
    this._tabAPI.moveToWindow(this._tabId, windowId, index);
  }
}