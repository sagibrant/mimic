/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ChromeDevToolsProtocol.ts
 * @description 
 * Provide Chrome DevTool Protocol APIs
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

import { EventEmitter, BrowserUtils, Utils } from "@gogogo/shared";
import { Debuggee, DebuggerSession, CDPDebuggerSession, TargetInfo, CDPTargetInfo, CDPExecutionContextInfo, CDPFrameInfo, CDPJavascriptDialog, CDPTabInfo, CDPEmulationSettings, CDPFrameTree } from "./CDPTypes";

interface CDPEvents extends Record<string, unknown> {
  javascriptDialogOpening: { source: DebuggerSession, method: string, params: unknown };
  javascriptDialogClosed: { source: DebuggerSession, method: string, params: unknown };
  inspectNodeRequested: { source: DebuggerSession, method: string, params: unknown };
}

/**
 * Main class for interacting with Chrome DevTools Protocol (CDP) in a Chrome extension.
 * Manages tab attachments, target sessions, and CDP command execution.
 * We wrapper the known apis again so that old version apis can be used with promise
 */
export class ChromeDevToolsProtocol extends EventEmitter<CDPEvents> {
  private _debuggerEvents: Record<string, (source: DebuggerSession, method: string, params: unknown) => Promise<void>>;
  private _tabs: Record<number, CDPTabInfo>; // Key: tabId

  constructor() {
    super();
    this._tabs = {};
    this._debuggerEvents = this._initializeDebuggerEvents();

    chrome.debugger.onEvent.addListener(async (source: chrome._debugger.DebuggerSession, method: string, params?: object) => {
      await this._debuggerEvent(source, method, params);
    });
    chrome.debugger.onDetach.addListener(async (source: chrome._debugger.Debuggee, reason: `${chrome._debugger.DetachReason}`) => {
      await this._debuggerDetached(source, reason);
    });
  }

  /**
   * Add a tab to track and manage with CDP.
   * @param tabId - Tab ID to track
   */
  addTab(tabId: number): void {
    if (!Utils.isNullOrUndefined(this._tabs[tabId])) return;

    const tab: CDPTabInfo = {
      attached: false,
      id: tabId,
      frameId: undefined,
      targetId: undefined,
      executionContexts: [],
      targets: [],
      sessions: [],
      javascriptDialog: undefined,
      emulationSettings: undefined
    };

    this._tabs[tabId] = tab;
  }

  /**
   * Stop tracking a tab and clean up its resources.
   * @param tabId - Tab ID to remove
   */
  removeTab(tabId: number): void {
    if (!Utils.isNullOrUndefined(this._tabs[tabId])) {
      delete this._tabs[tabId];
    }
  }

  /**
    * Attach CDP debugger to a tab.
    * @param tabId - Tab ID to attach to
    */
  async attachTab(tabId: number): Promise<void> {
    if (Utils.isNullOrUndefined(this._tabs[tabId])) {
      this.addTab(tabId);
    }
    const tab = this._tabs[tabId];
    if (tab && tab.attached) return;

    await this._attachTargetIfNeeded(tabId);
  }

  /**
   * Detach CDP debugger from a tab.
   * @param tabId - Tab ID to detach from
   */
  async detachTab(tabId: number): Promise<void> {
    const tab = this._tabs[tabId];
    if (!tab || !tab.attached) return;

    const debuggee = this._getDebuggee(tabId);
    await this._detachTarget(debuggee);
    tab.attached = false;
    tab.frameId = undefined;
    tab.targetId = undefined;

    tab.executionContexts = [];
    tab.targets = [];
    tab.sessions = [];

    tab.javascriptDialog = undefined;
    tab.emulationSettings = undefined;
  }

  /**
   * Check if a tab is currently attached to CDP by us
   * @param tabId - Tab ID to check
   * @returns True if attached, false otherwise
   */
  isTabAttached(tabId: number): boolean {
    return !!(this._tabs[tabId]?.attached);
  }

  /**
   * Check if a tab is currently attached to CDP by other tools (e.g. DevTools Panel, testing tools like playwright, puppteer, selenium, etc)
   * @param tabId - Tab ID to check
   * @returns True if attached by others, false otherwise
   */
  async isTabAttachedByOthers(tabId: number): Promise<boolean> {
    const targets = await this._getTargets();
    const target = targets.find(t => t.tabId === tabId && t.type === 'page');
    const isAttachedByUs = this.isTabAttached(tabId);
    return target?.attached === true && !isAttachedByUs;
  }

  /**
   * get the targets (filter by tabId)
   * @param tabId tabId
   * @returns 
   */
  async getTargets(tabId?: number): Promise<CDPTargetInfo[]> {
    if (!Utils.isNullOrUndefined(tabId)) {
      const tab = this._tabs[tabId];
      return tab.targets;
    }
    else {
      const targets = await this._getTargets();
      return targets;
    }
  }

  /**
   * Get the CDPTabInfo instance for a given source session.
   * @param session - Session to find associated tab for
   * @returns CDPTabInfo or null
   */
  getTabInfo(session: DebuggerSession): CDPTabInfo | null {
    if (!Utils.isNullOrUndefined(session.tabId)) {
      return this._tabs[session.tabId];
    }
    const tabId = Object.keys(this._tabs).find(tabIdStr => {
      const tab = this._tabs[Number(tabIdStr)];
      if (!Utils.isNullOrUndefined(session.sessionId)) {
        const index = tab.sessions.findIndex(s => s.sessionId === session.sessionId);
        if (index >= 0) {
          return true;
        }
      }
      else if (!Utils.isNullOrUndefined(session.targetId)) {
        const index = tab.targets.findIndex(s => s.id === session.targetId);
        if (index >= 0) {
          return true;
        }
      }
      return false;
    });

    if (!Utils.isNullOrUndefined(tabId)) {
      return this._tabs[Number(tabId)];
    }
    else {
      return null;
    }
  }

  /**
   * Send a custom CDP command to a tab.
   * @param target - Tab ID or debuggerSession to send command to
   * @param command - CDP command name
   * @param options - Command options
   * @returns Promise<object | undefined> - Promise that succeeded
   * @throws Throws error when failed
   */
  async sendCommand(target: number | DebuggerSession, command: string, options: unknown): Promise<object | undefined> {
    const targetSession = typeof target === 'number' ? { tabId: target } : target;
    const commandParams = options === undefined ? undefined : (Utils.deepClone(options) as { [key: string]: unknown } | undefined);
    return await this._sendCommand(targetSession, command, commandParams);
  }

  /**
   * Navigate a tab to a URL via CDP.
   * @param tabId - Tab ID to navigate
   * @param url - URL to navigate to
   */
  async pageNavigate(tabId: number, url: string): Promise<void> {
    const target = this._getDebuggee(tabId);
    await this._sendCommand(target, "Page.navigate", { "url": url });
  }

  /**
   * Close the tab
   * @param tabId - Tab ID to close
   */
  async pageClose(tabId: number): Promise<void> {
    const target = this._getDebuggee(tabId);
    await this._sendCommand(target, "Page.close");
  }

  /**
   * Get the JavaScript dialog info
   * @param tabId - Tab Id to check
   * @returns 
   */
  getJavascriptDialog(tabId: number): CDPJavascriptDialog | undefined {
    if (this._tabs[tabId]?.attached) {
      return this._tabs[tabId].javascriptDialog;
    } else {
      return undefined;
    }
  }

  /**
   * Handle a JavaScript dialog (accept/cancel).
   * @param tabId - Tab ID with dialog
   * @param accept - True to accept, false to cancel
   * @param text - Text to enter for prompt dialogs
   */
  async handleJavaScriptDialog(tabId: number, accept: boolean, promptText?: string): Promise<void> {
    const params = promptText === undefined ? { accept } : { accept, promptText };
    const target = this._getDebuggee(tabId);
    await this._sendCommand(target, "Page.handleJavaScriptDialog", params);
  }

  /**
   * Evaluate a script in a specific frame/context of a tab.
   * @param tabId - Tab ID
   * @param frameId - Frame ID to evaluate in
   * @param contextType - Context type ("MAIN" or other), @defaultvalue = 'MAIN'
   * @param script - Script to evaluate
   * @param options - Evaluation options
   * @returns Promise<object | undefined> - Promise that succeeded
   * @throws Throws error when failed
   */
  async evaluateScript(
    tabId: number,
    frameId?: string,
    contextType: string = 'MAIN',
    script?: string,
    options: unknown = {}
  ): Promise<object | undefined> {
    const tab = this.getTabInfo({ tabId });
    if (!tab) {
      throw new Error(`Tab not found - ${tabId}`);
    }
    const allframes = await this._buildFrameTree(tabId);
    const root = allframes[0];
    frameId = frameId ?? root.id;
    const frames = [root];
    let targetFrame = undefined;
    while (frames.length > 0) {
      const frame = frames.shift();
      if (!frame) continue;
      if (frame.id === frameId) {
        targetFrame = frame;
        break;
      }
      frames.push(...frame.childFrames);
    }
    if (!targetFrame) {
      throw new Error(`Frame not found - ${frameId}`);
    }

    const session = targetFrame.session || this._getDebuggee(tabId);
    const scriptOption = Object.assign(options as any, { expression: script });
    const frameContexts = tab.executionContexts.filter(c => c.auxData?.frameId === targetFrame.id);
    const extensionId = chrome.runtime.id;
    const context = contextType === "MAIN" ? frameContexts.find(c => c.auxData?.isDefault === true) : frameContexts.find(c => c.origin && c.origin.includes(extensionId));
    if (context?.uniqueId) {
      (scriptOption as Record<string, unknown>).uniqueContextId = context.uniqueId;
    } else if (context?.id) {
      (scriptOption as Record<string, unknown>).contextId = context.id;
    }

    const result = await this._sendCommand(session, "Runtime.evaluate", scriptOption);
    return result;
  }

  async getRuntimeElement(tabId: number): Promise<any> {
    const tab = this.getTabInfo({ tabId });
    if (!tab) {
      throw new Error(`Tab not found - ${tabId}`);
    }
    const script = `(function() {
      if(window.gogogo && window.gogogo.runtimeElement) {
        return window.gogogo.runtimeElement;
      }
      else {
        return undefined;
      }
    })()`;
    const frames = await this._buildFrameTree(tabId);
    for (const frame of frames) {
      const session = frame.session || this._getDebuggee(tabId);
      const scriptOption = Object.assign({}, { expression: script, allowUnsafeEvalBlockedByCSP: true });
      const frameContexts = tab.executionContexts.filter(c => c.auxData?.frameId === frame.id);
      const context = frameContexts.find(c => c.auxData?.isDefault === true);
      if (context?.uniqueId) {
        (scriptOption as Record<string, unknown>).uniqueContextId = context.uniqueId;
      } else if (context?.id) {
        (scriptOption as Record<string, unknown>).contextId = context.id;
      }
      const returnObj = await this._sendCommand(session, "Runtime.evaluate", scriptOption);
      if (returnObj && 'result' in returnObj) {
        const { result } = returnObj as any;
        if (result.type === 'object' && result.objectId) {
          return { objectId: result.objectId as string, session: session };
        }
      }
    }
    return null;
  }

  /**
   * call function on object
   * @param target target session
   * @param functionDeclaration function string
   * @param objectId RemoteObjectId
   * @param returnByValue if return by value
   * @param awaitPromise if await promise
   * @returns function result
   */
  async callFunctionOn(
    target: DebuggerSession,
    functionDeclaration: string,
    objectId?: string,
    args?: any[],
    returnByValue: boolean = true,
    awaitPromise: boolean = true
  ): Promise<any> {
    const options = Object.assign(
      {
        functionDeclaration,
        returnByValue: returnByValue,
        awaitPromise: awaitPromise
      },
      Utils.isNullOrUndefined(objectId) ? {} : { objectId: objectId },
      Utils.isNullOrUndefined(args) ? {} : { arguments: args }
    );
    const result = await this._sendCommand(target, 'Runtime.callFunctionOn', options);
    return result;
  }

  /**
   * Emulate a device (screen size, user agent, etc.) for a tab.
   * @param tabId - Tab ID to emulate
   * @param emulationSettings - Device emulation configuration
   */
  async emulateDevice(tabId: number, emulationSettings: CDPEmulationSettings): Promise<void> {
    const tab = this.getTabInfo({ tabId });
    if (!tab) {
      throw new Error(`Tab not found - ${tabId}`);
    }
    tab.emulationSettings = emulationSettings;

    const browserInfo = BrowserUtils.getBrowserInfo();
    const useNewInstruction = browserInfo.majorVersion > 60;
    const target = this._getDebuggee(tabId);
    await this._sendCommand(target, "Network.enable", {});
    await this._sendCommand(target, "Network.setUserAgentOverride", { userAgent: emulationSettings.userAgent });

    const method = useNewInstruction ? "Emulation.setDeviceMetricsOverride" : "Page.setDeviceMetricsOverride";
    const params = {
      width: emulationSettings.width,
      height: emulationSettings.height,
      deviceScaleFactor: emulationSettings.deviceScaleFactor,
      mobile: emulationSettings.mobile,
      fitWindow: false
    };
    await this._sendCommand(target, method, params);
    if (emulationSettings.touch) {
      const touchParams = { enabled: true };
      const touchMethod = useNewInstruction ? "Emulation.setTouchEmulationEnabled" : "Page.setTouchEmulationEnabled";
      const mouseTouchMethod = useNewInstruction ? "Emulation.setEmitTouchEventsForMouse" : "Page.setEmitTouchEventsForMouse";

      await this._sendCommand(target, touchMethod, touchParams);
      await this._sendCommand(target, mouseTouchMethod, touchParams);
    }
  }

  /** ==================================================================================================================== */
  /** =================================================== help methods =================================================== */
  /** ==================================================================================================================== */

  /**
   * Get a debuggee object for a tab/target.
   * @param tabId - Tab ID
   * @param targetId - Optional target ID within the tab
   * @returns Debuggee session
   */
  private _getDebuggee(tabId?: number, targetId?: string): Debuggee {
    return { tabId, targetId };
  }

  /**
   * Attach to a target (tab/iframe) if it's not already attached.
   * @param tabId - Tab ID containing the target
   * @param targetId - target ID
   */
  private async _attachTargetIfNeeded(tabId?: number, targetId?: string): Promise<void> {
    const targets = await this._getTargets();
    const targetObj = targets.find(target => {
      // target is iframe
      if (!Utils.isNullOrUndefined(targetId) && target.id === targetId) return true;
      // target is page
      if (Utils.isNullOrUndefined(targetId) && !Utils.isNullOrUndefined(tabId) && target.type === "page" && target.tabId === tabId) {
        return true;
      }
      return false;
    });
    if (!targetObj) {
      this.logger.warn(`_attachTargetIfNeeded: Fail to find the target for { tabId:${tabId}, targetId:${targetId}) }`, targets);
      return;
    }
    if (targetObj.attached) {
      return;
    }

    const isTargetPage = !Utils.isNullOrUndefined(targetObj.tabId) && targetObj.type === "page";
    const debugee = this._getDebuggee(tabId, targetId);
    const tab = this.getTabInfo(debugee as DebuggerSession);
    if (!tab) {
      this.logger.error(`_attachTargetIfNeeded: Cannot find the tab object for { tabId:${tabId}, targetId:${targetId}) }`);
      return;
    }
    // try attach
    await this._attachTarget(debugee);
    this.logger.debug(`_attachTargetIfNeeded: attached on { tabId:${tabId}, targetId:${targetId}) }`);
    // update the tab/target info
    targetObj.attached = true;
    if (isTargetPage) {
      tab.attached = true;
      tab.targetId = targetObj.id;
      tab.frameId = targetObj.id;
      const session: CDPDebuggerSession = { tabId: tabId };
      tab.sessions.push(session);
      const targetInfo: CDPTargetInfo = { ...targetObj, session: session };
      targetInfo.targetId = targetObj.id;
      tab.targets.push(targetInfo);
    }
    else {
      // we do not create session for frame targets, session will be created by events
      this.logger.error('_attachTargetIfNeeded: Unexpected attach behavior - non-page target should be auto attached', targetObj, debugee);
    }
    await this._initTarget(debugee as DebuggerSession);
    this.logger.debug(`_attachTargetIfNeeded: initTarget passed on { tabId:${tabId}, targetId:${targetId}) }`);
  }

  /**
   * Initialize target and enable required CDP domains (Page, Runtime, etc.).
   * @param target - Target to initialize
   */
  private async _initTarget(session: DebuggerSession): Promise<void> {
    const cdpFeatures = [
      { method: "Page.enable", param: undefined, optional: false },
      { method: "Page.setBypassCSP", param: { "enabled": true }, optional: false },
      { method: "Runtime.enable", param: undefined, optional: false },
      { method: "DOM.enable", param: undefined, optional: false },
      { method: "Overlay.enable", param: undefined, optional: false },
      { method: "Inspector.enable", param: undefined, optional: true },
      { method: "DOMSnapshot.enable", param: undefined, optional: true },
      {
        method: "Target.setAutoAttach",
        param: {
          autoAttach: true,
          waitForDebuggerOnStart: false,
          flatten: true,
          filter: [{ type: "iframe", exclude: false }]
        },
        optional: true
      }
    ];

    // Execute CDP commands one by one
    for (const feature of cdpFeatures) {
      try {
        await this._sendCommand(session, feature.method, feature.param);
      } catch (error) {
        // log and throw error if non-optional command fails
        if (!feature.optional) {
          this.logger.error(`Required CDP command failed: ${feature.method}`, session, error);
          throw error;
        }
        else {
          // log warning if optional command fails
          this.logger.warn(`Optional CDP command failed: ${feature.method}`, session, error);
        }
      }
    }
  }

  /**
   * Handle incoming CDP debugger events.
   * @param source - Session that received the event
   * @param method - Event method name
   * @param params - Event parameters
   */
  private async _debuggerEvent(source: DebuggerSession, method: string, params?: object): Promise<void> {
    if (method === "Runtime.consoleAPICalled" || method === "DOM.setChildNodes") {
      return;
    }
    this.logger.debug("_debuggerEvent", source, method, params);
    if (this._debuggerEvents[method]) {
      await this._debuggerEvents[method].call(this, source, method, params);
    }
  }

  /**
   * Initialize handlers for specific CDP events.
   * @returns Event handler map
   */
  private _initializeDebuggerEvents(): Record<string, (source: DebuggerSession, method: string, params: unknown) => Promise<void>> {
    return {
      "Page.javascriptDialogOpening": async (source, method, params) => {
        if (Utils.isNullOrUndefined(source.tabId)) return;
        const tab = this.getTabInfo(source);
        if (!tab) return;

        const dialogParams = params as CDPJavascriptDialog;
        tab.javascriptDialog = dialogParams;

        this.emit('javascriptDialogOpening', { source, method, params });
      },

      "Page.javascriptDialogClosed": async (source, method, params) => {
        if (Utils.isNullOrUndefined(source.tabId)) return;
        const tab = this.getTabInfo(source);
        if (!tab) return;

        tab.javascriptDialog = undefined;

        this.emit('javascriptDialogClosed', { source, method, params });
      },

      "Runtime.executionContextCreated": async (source, _method, params) => {
        /**
         * {
         *  context: {
         *      auxData: {
         *          frameId: "57784D671172321996AB58ECE63F0DE2",
         *          isDefault: true,
         *          type: "default"
         *      },
         *      id: 12,
         *      name: "",
         *      origin: "http://demo.example.net",
         *      uniqueId: "7854474203346722172.-5914632085921131557"
         *  }
         * }
         */
        const tab = this.getTabInfo(source);
        if (!tab) return;

        const { context } = params as { context: CDPExecutionContextInfo };
        if (!context?.auxData) return;

        context.source = source;
        tab.executionContexts.push(context);
      },

      "Runtime.executionContextDestroyed": async (source, _method, params) => {
        /**
         * {executionContextId: 12, executionContextUniqueId: '7594043499172353467.1643448933116185657'}
         */
        const tab = this.getTabInfo(source);
        if (!tab) return;

        const { executionContextId, executionContextUniqueId } = params as {
          executionContextId?: number;
          executionContextUniqueId?: string;
        };

        if (!Utils.isNullOrUndefined(executionContextId)) {
          const index = tab.executionContexts.findIndex(e => e.id === executionContextId);
          if (index >= 0) {
            tab.executionContexts.splice(index, 1);
          }
        }
        else if (!Utils.isNullOrUndefined(executionContextUniqueId)) {
          const index = tab.executionContexts.findIndex(e => e.uniqueId === executionContextUniqueId);
          if (index >= 0) {
            tab.executionContexts.splice(index, 1);
          }
        }
      },

      "Runtime.executionContextsCleared": async (source) => {
        const tab = this.getTabInfo(source);
        if (!tab) return;

        tab.executionContexts.splice(0);
      },

      "Target.attachedToTarget": async (source, _method, params) => {
        /**
         * {
         *  sessionId: "2A4A4915D7D60148E71F7E07114F9091",
         *  targetInfo: {
         *      attached: true,
         *      browserContextId: "E78150A8298B205119DA74A13A7E2C95",
         *      canAccessOpener: false,
         *      parentFrameId: "DDE284F0D818AEA81715FECF4DC0CC99"
         *      pid: 11922
         *      targetId: "9402047E45B1745F42A98167EDBE25B4",
         *      title: ""
         *      type: "iframe"
         *      url: ""
         *  },
         *  waitingForDebugger: false
         * }
         */
        const tab = this.getTabInfo(source);
        if (!tab) return;

        const { sessionId, targetInfo } = params as {
          sessionId: string;
          targetInfo: CDPTargetInfo;
          waitingForDebugger: boolean;
        };

        if (!targetInfo.attached) {
          this.logger.warn('Target.attachedToTarget: Unexpected target with attached = false', params);
          return;
        }

        const session: CDPDebuggerSession = { sessionId: sessionId, tabId: tab.id };
        await this._initTarget(session);
        // bind the relations
        session.source = source;
        targetInfo.session = session;


        targetInfo.tabId = tab.id;
        const targetId = targetInfo.id ?? targetInfo.targetId;
        targetInfo.id = targetId;
        targetInfo.targetId = targetId;

        tab.targets.push(targetInfo);
        const index = tab.sessions.findIndex(s => s.sessionId === sessionId);
        if (index < 0) {
          tab.sessions.push(session);
        }
      },

      "Target.detachedFromTarget": async (source, _method, params) => {
        /**
         * {sessionId: '2A4A4915D7D60148E71F7E07114F9091', targetId: '9402047E45B1745F42A98167EDBE25B4'}
         */
        const tab = this.getTabInfo(source);
        if (!tab) return;

        const { sessionId, targetId } = params as { sessionId: string; targetId: string };

        if (!Utils.isNullOrUndefined(targetId)) {
          let index = tab.targets.findIndex(t => t.id === targetId);
          if (index >= 0) {
            tab.targets.splice(index, 1);
          }
        }
        if (!Utils.isNullOrUndefined(sessionId)) {
          let index = tab.targets.findIndex(t => t.session?.sessionId === sessionId);
          if (index < 0) {
            index = tab.sessions.findIndex(s => s.sessionId === sessionId);
            if (index >= 0) {
              tab.sessions.splice(index, 1);
            }
          }
        }
      },

      // Unhandled frame events (for debugging)
      "Page.frameNavigated": async (_source, _method, _params) => {
        /**
         * {
         *  frame: { 
         *      adFrameStatus: {adFrameType: 'none'},
         *      crossOriginIsolatedContextType: "NotIsolated",
         *      domainAndRegistry: "example.net",
         *      gatedAPIFeatures: [],
         *      id: "9402047E45B1745F42A98167EDBE25B4",
         *      loaderId: "6EE0314E5EE7AB62595024AC07FC4E5C",
         *      mimeType: "text/html",
         *      name: "frame"
         *      parentId: "57784D671172321996AB58ECE63F0DE2"
         *      secureContextType: "InsecureScheme",
         *      securityOrigin: "http://demo.example.net",
         *      url: "http://demo.example.net/war/web_aut/Frames/frame_cross_origin.html" 
         *  },
         *  type: "Navigation"
         * }
         */
      },
      "Page.frameStartedLoading": async (_source, _method, _params) => {
        /**
         * {frameId: '9402047E45B1745F42A98167EDBE25B4'}
         */
      },
      "Page.frameStoppedLoading": async (_source, _method, _params) => {
        /**
         * {frameId: '9402047E45B1745F42A98167EDBE25B4'}
         */
      },
      "Page.frameAttached": async (_source, _method, _params) => {
        /**
         * { frameId: "9402047E45B1745F42A98167EDBE25B4", parentFrameId: "57784D671172321996AB58ECE63F0DE2" }
         */
      },
      "Page.frameDetached": async (_source, _method, _params) => {
        /**
         * {frameId: '9402047E45B1745F42A98167EDBE25B4', reason: 'swap'}
         * {frameId: '2C4A99026FD8219425644D1A1FC00D96', reason: 'remove'}
         */
      },
      "Overlay.inspectNodeRequested": async (source, method, params) => {
        this.emit('inspectNodeRequested', { source, method, params });
      },
      "Overlay.nodeHighlightRequested": async (_source, _method, _params) => {
      }
    };
  }

  /**
   * Handle debugger detachment event.
   * @param source - Session that was detached
   * @param reason - Reason for detachment (canceled_by_user | target_closed)
   */
  private async _debuggerDetached(source: Debuggee, reason: string): Promise<void> {
    this.logger.debug("_debuggerDetached: Debugger was detached from ", source, ": ", reason);

    const tab = this.getTabInfo(source);
    if (!tab) return;

    if (!Utils.isNullOrUndefined(source.targetId) && source.targetId !== tab.targetId) {
      this.logger.warn("_debuggerDetached: Debugger was detached (not tab) from ", source, ": ", reason);
      return;
    }

    tab.attached = false;
    // if canceled by user by mistake, try to re-attach 
    if (reason === "canceled_by_user") {
      try {
        await this.attachTab(tab.id);
      } catch (error) {
        this.logger.warn(`_debuggerDetached: Re-attachTab failed - ${tab.id}`, error);
      }
    }
  }

  /**
   * Build frame tree for a tab by querying all target sessions.
   * @param tabId - Tab ID to build frame tree for
   * @returns Promise<CDPFrameInfo[]> - the FrameInfo list
   * @throws Throws error when failed
   */
  private async _buildFrameTree(tabId: number): Promise<CDPFrameInfo[]> {
    const tab = this._tabs[tabId];
    if (!tab) {
      throw new Error(`Tab not found - ${tabId}`);
    }

    const frames: CDPFrameInfo[] = [];
    // get all frames
    const sessions = tab.sessions;
    for (const session of sessions) {
      const result = await this._sendCommand(session, "Page.getFrameTree", {});
      const { frameTree } = result as { frameTree?: CDPFrameTree };
      if (frameTree && frameTree.frame) {
        const frame = frameTree.frame;
        frame.session = session;
        frame.childFrames = frameTree.childFrames ?? [];
        frames.push(frame);
      }
    }
    const stack = [...frames];
    frames.splice(0);
    while (stack.length > 0) {
      const frame = stack.shift();
      if (!frame) continue;
      // adjust the structure
      if (frame.childFrames && frame.childFrames.length > 0) {
        frame.childFrames = frame.childFrames.map((f) => {
          if ('frame' in f && typeof f.frame === 'object') {
            return f.frame as CDPFrameInfo;
          }
          else {
            return f as CDPFrameInfo;
          }
        });
      }
      const childFrames = frame.childFrames ?? [];
      childFrames.forEach(f => { f.parentId = f.parentId ?? frame.id; f.session = f.session ?? frame.session });
      stack.push(...childFrames);
      frames.push(frame);
    }
    for (const frame of frames) {
      const childFrames = frames.filter(f => f.parentId === frame.id);
      frame.childFrames = [];
      frame.childFrames.push(...childFrames);
    }
    const root = frames.find(f => Utils.isNullOrUndefined(f.parentId));
    if (!root) {
      throw new Error('FrameTree root not found');
    }
    const index = frames.findIndex(f => f === root);
    if (index > 0) {
      frames.splice(index, 1);
      frames.splice(0, 0, root);
    }
    return frames;
  }

  /** ==================================================================================================================== */
  /** ================================================= wrapper methods ================================================== */
  /** ==================================================================================================================== */

  /**
   * Get all available CDP targets.
   * @returns Promise<TargetInfo[]> - Promise that succeeded
   * @throws Throws error when failed
   */
  private async _getTargets(): Promise<TargetInfo[]> {
    return new Promise((resolve, reject) => {
      chrome.debugger.getTargets((result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`debugger.getTargets failed: ${error.message}`));
        }
        else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Attach to a CDP target.
   * @param target - Target to attach to
   */
  private async _attachTarget(target: Debuggee): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.debugger.attach(target, "1.3", () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`debugger.attach failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  /**
   * Detach from a CDP target.
   * @param target - Target to detach from
   */
  private _detachTarget(target: Debuggee): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.debugger.detach(target, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`debugger.detach failed: ${error.message}`));
        }
        else {
          resolve();
        }
      });
    });
  }

  /**
   * Send a CDP command to a target.
   * @param target - Target to send command to
   * @param method - CDP method name (e.g., "Runtime.evaluate")
   * @param commandParams - Parameters for the command
   * @returns Promise<object | undefined> - Promise that succeeded
   * @throws Throws error when failed
   */
  private async _sendCommand(target: DebuggerSession, method: string, commandParams?: { [key: string]: unknown }): Promise<object | undefined> {
    const targetSession: DebuggerSession = {};
    // to remove the unnecessary properties like source, etc
    const fields = ['extensionId', 'sessionId', 'tabId', 'targetId'];
    for (const field of fields) {
      if (!Utils.isNullOrUndefined((target as any)[field])) {
        (targetSession as any)[field] = (target as any)[field];
      }
    }
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand(targetSession, method, commandParams, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`debugger.sendCommand failed: ${error.message}`));
        }
        else {
          resolve(result);
        }
      });
    });
  }

};


