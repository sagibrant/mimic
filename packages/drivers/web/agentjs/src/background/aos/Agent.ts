/**
 * Agent.ts
 * Support the general automation actions which not in a specific browser tab
 * Author: Zhang Jie
 */

import { Rtid, Utils } from "../../common/Common";
import { MessageData } from "../../common/Messaging/Message";
import { MsgDataHandlerBase, ResultCallback } from "../../common/Messaging/MsgDataHandlerBase";
import { ChromiumExtensionAPI } from "../app/ChromiumExtensionAPI";
import { Tab } from "./Tab";

export class Agent extends MsgDataHandlerBase {
    private readonly _browserAPI: ChromiumExtensionAPI;
    private readonly _tabs: Record<number, Tab>;
    private _autoAttachCDP: boolean = false;
    private _activeTabId: number = -1;
    private _activeWindowId: number = -1;

    get ActiveTab(): Tab | undefined {
        if (this._activeTabId > 0 && this._activeWindowId > 0) {
            return this._tabs[this._activeTabId];
        }
        return undefined;
    }

    constructor(browserAPI: ChromiumExtensionAPI) {
        super(Rtid.getAgentRtid());

        this._browserAPI = browserAPI;
        this._tabs = {};
        this._init();
    }

    handle(data: MessageData, resultCallback?: ResultCallback): boolean {
        for (const tab of Object.values(this._tabs)) {
            if (tab.handle(data, resultCallback)) {
                return true;
            }
        }
        if (this._handle(data, resultCallback)) {
            return true;
        }
        return false;
    }

    /** ================================================================== */
    /** ========================= Helper methods ========================= */
    /** ================================================================== */

    private _handle(_data: MessageData, _resultCallback?: ResultCallback): boolean {
        // todo: handle agent messages such as set configration, etc
        throw new Error("Method not implemented.");
    }

    /**
     * init the agent
     * start listening on the window, tab and cdp events
     */
    private _init(): void {
        this._updateKnownTabs().then(() => {
            this._registerListeners();
            if (this._autoAttachCDP) {
                this._browserAPI.cdpAPI.attachAllTabs();
            }
        });
    }

    private _registerListeners(): void {
        // tab events
        this._browserAPI.tabAPI.on('onCreated', ({ tab }) => {
            if (Utils.isNullOrUndefined(tab.id)) {
                this.logger.warn('onCreated: unexpected tab created with no id ', tab);
                return;
            }
            const newTab = this._addNewTab(tab);
            if (newTab) {
                this.logger.info(`onCreated: add the tab[${tab.id}] with details: ${JSON.stringify(tab)}`);
                if (this._autoAttachCDP) {
                    this._browserAPI.cdpAPI.attachTab(tab.id);
                }
            }
        });

        this._browserAPI.tabAPI.on('onUpdated', ({ tabId, changeInfo }) => {
            if (Utils.isNullOrUndefined(tabId) || Utils.isNullOrUndefined(this._tabs[tabId])) {
                this.logger.warn('onUpdated: unexpected tab updated with tabId ', tabId);
                return;
            }
            const tab = this._tabs[tabId];
            tab.status = !Utils.isNullOrUndefined(changeInfo.status) ? changeInfo.status : tab.status;
            tab.title = !Utils.isNullOrUndefined(changeInfo.title) ? changeInfo.title : tab.title;
            tab.url = !Utils.isNullOrUndefined(changeInfo.url) ? changeInfo.url : tab.url;
            tab.favIconUrl = !Utils.isNullOrUndefined(changeInfo.favIconUrl) ? changeInfo.favIconUrl : tab.favIconUrl;
            this.logger.info(`onUpdated: update the tab[${tabId}] with properties: ${JSON.stringify(changeInfo)}`);
        });

        this._browserAPI.tabAPI.on('onActivated', ({ activeInfo }) => {
            if (Utils.isNullOrUndefined(activeInfo)) {
                this.logger.warn(`onActivated: unexpected activeInfo`);
                return;
            }
            this._activeTabId = activeInfo.tabId;
            this._activeWindowId = activeInfo.windowId;
            this.logger.info(`onActivated: update the activated tab to ${JSON.stringify(activeInfo)}`);
        });

        this._browserAPI.tabAPI.on('onRemoved', ({ tabId }) => {
            if (Utils.isNullOrUndefined(tabId) || Utils.isNullOrUndefined(this._tabs[tabId])) {
                return;
            }
            delete this._tabs[tabId];
            this.logger.info(`onRemoved: remove the tab[${tabId}]`);
        });

        this._browserAPI.tabAPI.on('onZoomChange', ({ zoomChangeInfo }) => {
            if (Utils.isNullOrUndefined(zoomChangeInfo)) {
                this.logger.warn(`onZoomChange: unexpected zoomChangeInfo`);
                return;
            }
            const tab = this._tabs[zoomChangeInfo.tabId];
            if (Utils.isNullOrUndefined(tab)) {
                this.logger.warn(`onZoomChange: unexpected tabId[${zoomChangeInfo.tabId}] in zoomChangeInfo`);
                return;
            }
            tab.zoomFactor = zoomChangeInfo.newZoomFactor;
            this.logger.info(`onZoomChange: update the tab[${zoomChangeInfo.tabId}] with zoomFactor: ${zoomChangeInfo.newZoomFactor}`);
        });

        // window events
        this._browserAPI.windowAPI.on('onFocusChanged', ({ windowId }) => {
            // if focus on the DevTool, then then windowId = -1
            if (Utils.isNullOrUndefined(windowId) || windowId < 0) {
                return;
            }
            this._activeWindowId = windowId;
            this.logger.info(`onFocusChanged: Update the focused window - ${windowId}`);
        });
    }

    private async _updateKnownTabs(): Promise<void> {
        const windows = await this._browserAPI.windowAPI.getAll(true);
        const tabIds = Object.keys(this._tabs);
        for (const tabId of tabIds) {
            delete this._tabs[Number(tabId)];
        }
        for (const window of windows) {
            for (const tab of window.tabs || []) {
                const newTab = this._addNewTab(tab);
                if (newTab) {
                    this.logger.info(`_updateKnownTabs: add the tab[${tab.id}] with details: ${JSON.stringify(tab)}`);
                    if (tab.highlighted) {
                        this._activeTabId = tab.id!;
                        this._activeWindowId = tab.windowId;
                        this.logger.info(`_updateKnownTabs: set the active tab to (tabId: ${this._activeTabId}, windowId: ${this._activeWindowId})`);
                    }
                }
            }
        }
    }

    private _addNewTab(tab: chrome.tabs.Tab): Tab | undefined {
        if (Utils.isNullOrUndefined(tab.id)) {
            return;
        }
        const newTab = new Tab(tab.id, this._browserAPI);
        newTab.windowId = tab.windowId;
        newTab.index = tab.index;
        newTab.url = tab.url || tab.pendingUrl;
        newTab.title = tab.title;
        newTab.favIconUrl = tab.favIconUrl;
        newTab.status = tab.status;

        this._tabs[tab.id] = newTab;

        this._browserAPI.cdpAPI.addTab(tab.id);

        return newTab;
    }
}