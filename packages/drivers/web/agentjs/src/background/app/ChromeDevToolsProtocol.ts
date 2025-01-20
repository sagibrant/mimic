/**
 * ChromeDevToolsProtocol.ts
 * Provide Chrome DevTool Protocol APIs
 * Author: Zhang Jie
 */
import { Utils } from "../../common/Common";
import { Logger } from "../../common/Logger";


/** 
 * Represents a CDP debugger debuggee wrapper for chrome._debugger.Debuggee
 * Debuggee identifier. Either tabId, extensionId or targetId must be specified 
 * */
export interface CDPDebuggee {
  /** The id of the tab which you intend to debug. */
  tabId?: number;
  /** The id of the extension which you intend to debug. Attaching to an extension background page is only possible when the `--silent-debugger-extension-api` command-line switch is used. */
  extensionId?: string;
  /** The opaque id of the debug target. */
  targetId?: string;
};

/**
 * Represents a CDP debugger session wrapper for chrome._debugger.DebuggerSession
 * Debugger session identifier. One of tabId, extensionId or targetId must be specified. Additionally, an optional sessionId can be provided. If sessionId is specified for arguments sent from {@link onEvent}, it means the event is coming from a child protocol session within the root debuggee session. If sessionId is specified when passed to {@link sendCommand}, it targets a child protocol session within the root debuggee session.
 * Used to manage connections to Chrome DevTools Protocol targets.
 */
export interface CDPDebuggerSession {
  /** The id of the extension which you intend to debug. Attaching to an extension background page is only possible when the `--silent-debugger-extension-api` command-line switch is used.*/
  extensionId?: string;
  /** The opaque id of the Chrome DevTools Protocol session. Identifies a child session within the root session identified by tabId, extensionId or targetId. */
  sessionId?: string;
  /** The id of the tab which you intend to debug. */
  tabId?: number;
  /** The opaque id of the debug target. */
  targetId?: string;
};


/**
 * 'tab' | 'page' | 'iframe' | 'other' | 'worker' | 'shared_worker' | 'service_worker' | 'worklet' | 'browser' | 'webview' | 'auction_worklet'
 * chrome._debugger.TargetInfoType
 */
export type CDPTargetInfoType = 'tab' | 'page' | 'iframe' | 'other' | 'worker' | 'shared_worker' | 'service_worker' | 'worklet' | 'browser' | 'webview' | 'auction_worklet';

/**
 * Represents a CDP target (debuggable entity like tab, iframe, or worker) with metadata.
 * Wrapper for chrome._debugger.TargetInfo
 * Extends raw target info from chrome.debugger.getTargets() with normalized IDs.
 */
export class CDPTargetInfo {
  /** Target type. */
  type: CDPTargetInfoType = 'page';
  /** Target id. */
  id?: string;
  /** The tab id, defined if type == 'page'. */
  tabId?: number;
  /** The extension id, defined if type = 'background_page'. */
  extensionId?: string;
  /** True if debugger is already attached. */
  attached: boolean = false;
  /** Target page title. */
  title?: string;
  /** Target URL. */
  url?: string;
  /** Target favicon URL.  */
  faviconUrl?: string;

  /** Target id. (when created from Target.attachedToTarget if cross origin iframe attached) */
  targetId?: string;

  openerId?: string;
  canAccessOpener: boolean = false;
  openerFrameId?: string;
  browserContextId?: string;
  subtype?: string;
  /**
   * Normalize and initialize target info from raw target data.
   * @param targetInfoObj - Raw target info from chrome.debugger.getTargets()
   */
  constructor(targetInfoObj: Partial<CDPTargetInfo>) {
    Object.assign(this, targetInfoObj);
    const targetId = this.targetId || this.id;
    this.id = targetId;
    this.targetId = targetId;
  }
};

/**
 * Represents a CDP Execution Context AuxData with metadata.
 * We use this metadata to know the frameId and if it is the default ExecutionContext
 */
export interface CDPExecutionContextAuxData {
  frameId: string;
  isDefault: boolean;
  type: 'isolate' | 'default';
}

/**
 * Contains information about a CDP execution context (JavaScript environment) within a frame.
 * Should be created by Runtime.executionContextCreated event
 * Tracks context ID, origin, and associated session.
 */
export class CDPExecutionContextInfo {
  id: number;
  name?: string;
  uniqueId: string;
  origin?: string;
  auxData?: CDPExecutionContextAuxData;

  source: CDPDebuggerSession;

  /**
   * Create execution context info from source session and context data.
   * @param source - Session associated with this context
   * @param context - CDP context data from Runtime.executionContextCreated event
   */
  constructor(source: CDPDebuggerSession, context: Partial<CDPExecutionContextInfo>) {
    // Validate required fields exist
    if (Utils.isNullOrUndefined(context.id)
      || Utils.isNullOrUndefined(context.uniqueId)) {
      throw new Error('CDPExecutionContextInfo creation missing the valid id & uniqueId.');
    }
    Object.assign(this, context);
    this.source = source;

    // Type assertion to ensure TypeScript recognizes required fields are set
    this.id = context.id;
    this.uniqueId = context.uniqueId;
  }
};


/**
 * Combines a debugger session with its associated target info.
 * Serves as a container for managing active target connections.
 */
export class CDPTargetSession {
  id: string;
  session: CDPDebuggerSession;
  targetInfo: CDPTargetInfo;
  /**
   * the source session (the parent Debuggee or DebuggerSession)
   */
  source?: CDPDebuggerSession;
  /**
   * Create a target session from a debugger session and target info.
   * @param session - Debugger session for the target
   * @param targetInfo - Metadata about the target
   */
  constructor(session: CDPDebuggerSession, targetInfo: CDPTargetInfo) {
    this.session = session;
    this.targetInfo = targetInfo;
    this.id = `${this.session.sessionId}_${this.session.tabId}_${this.session.targetId}_${this.session.extensionId}`;
  }
};

/**
 * Represents a frame in the page with its execution contexts and child frames.
 * Manages frame hierarchy and associated JavaScript contexts.
 */
export class CDPFrameInfo {
  id: string;
  parentId?: string;
  contexts: CDPExecutionContextInfo[];
  defaultContext?: CDPExecutionContextInfo;
  contentContext?: CDPExecutionContextInfo;
  childFrames: CDPFrameInfo[];
  frameInfo: unknown;
  session?: CDPDebuggerSession;
  attached: boolean = true;

  /**
   * Initialize frame info with frame data and associated session.
   * @param frameInfo - Raw frame data from CDP Page.getFrameTree
   * @param session - Debugger session associated with this frame
   */
  constructor(frameInfo: unknown, session?: CDPDebuggerSession) {
    this.frameInfo = frameInfo;
    this.session = session;
    this.id = (frameInfo as { id: string }).id;
    this.parentId = (frameInfo as { parentId?: string }).parentId || undefined;
    this.contexts = [];
    this.defaultContext = undefined;
    this.contentContext = undefined;
    this.childFrames = [];
  }
};

export interface CDPJavascriptDialog {
  url: string;
  message: string;
  type: string;
  hasBrowserHandler: boolean;
  defaultPrompt?: string;
}

/**
 * Manages CDP-related state for a single browser tab.
 * Tracks execution contexts, target sessions, frames, and dialogs.
 */
export class CDPTabInfo {
  attached: boolean;
  id: number;
  frameId?: string;
  targetId?: string;
  javascriptDialog?: CDPJavascriptDialog;
  emulationSettings?: {
    userAgent: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
    mobile: boolean;
    touch: boolean;
  }; // Device emulation configuration
  executionContexts: Record<string, CDPExecutionContextInfo>; // Key: context.uniqueId
  targetSessions: Record<string, CDPTargetSession>; // Key: session.id
  root?: CDPFrameInfo;
  frames?: CDPFrameInfo[];

  /**
   * Create a tab info instance for tracking CDP state.
   * @param tabId - The browser tab ID
   */
  constructor(tabId: number) {
    this.attached = false;
    this.id = tabId;
    this.frameId = undefined;
    this.targetId = undefined;
    this.javascriptDialog = undefined;
    this.emulationSettings = undefined;

    this.executionContexts = {};
    this.targetSessions = {};
  }

  /**
   * Add a new execution context to the tab.
   * @param source - Session that created the context
   * @param executionContext - Context data from CDP event
   */
  addExecutionContext(source: CDPDebuggerSession, executionContext: Partial<CDPExecutionContextInfo>): void {
    const contextInfo = new CDPExecutionContextInfo(source, executionContext);
    this.executionContexts[contextInfo.uniqueId] = contextInfo;
  }

  /**
   * Remove execution contexts matching the given criteria.
   * @param source - Associated session
   * @param executionContextId - Numeric context ID (optional)
   * @param executionContextUniqueId - Unique context ID (optional)
   */
  removeExecutionContext(
    source: CDPDebuggerSession,
    executionContextId?: number,
    executionContextUniqueId?: string
  ): void {
    const contextIds = Object.keys(this.executionContexts).filter(contextUniqueId => {
      if (!Utils.isNullOrUndefined(executionContextUniqueId) && executionContextUniqueId !== contextUniqueId) {
        return false;
      }
      const context = this.executionContexts[contextUniqueId];
      if (Utils.isNullOrUndefined(context)) {
        return false;
      }
      if (!Utils.isNullOrUndefined(executionContextId) && executionContextId !== context.id) {
        return false;
      }
      if (!Utils.isNullOrUndefined(source)) {
        const contextSourceSession = this.findTargetSession(context.source);
        const sourceSession = this.findTargetSession(source);
        if (contextSourceSession === sourceSession) {
          return true;
        }
      }
      return false;
    });

    if (Array.isArray(contextIds) && contextIds.length > 0) {
      contextIds.forEach(contextUniqueId => {
        delete this.executionContexts[contextUniqueId];
      });
    }
  }

  /**
   * Clear execution contexts associated with a source session.
   * @param source - Session to clear contexts for
   */
  clearExecutionContext(source: CDPDebuggerSession): void {
    if (Utils.isNullOrUndefined(source)) return;

    if (!Utils.isNullOrUndefined(source.tabId) && source.tabId === this.id &&
      Utils.isNullOrUndefined(source.targetId) && Utils.isNullOrUndefined(source.sessionId)) {
      this.executionContexts = {};
    } else {
      this.removeExecutionContext(source);
    }
  }

  /**
   * Add a new target session to the tab.
   * @param debuggerSession - Debugger session for the target
   * @param targetInfo - Target metadata
   * @param source - Parent session
   */
  addTargetSession(debuggerSession: CDPDebuggerSession, targetInfo: CDPTargetInfo, source?: CDPDebuggerSession): void {
    const targetSession = new CDPTargetSession(debuggerSession, targetInfo);
    targetSession.source = source || undefined;
    this.targetSessions[targetSession.id] = targetSession;
  }

  /**
   * Remove a target session from the tab.
   * @param source - Parent session
   * @param debuggerSession - Session to remove
   */
  removeTargetSession(_source: CDPDebuggerSession, debuggerSession: CDPDebuggerSession): void {
    const targetSession = this.findTargetSession(debuggerSession);
    if (!Utils.isNullOrUndefined(targetSession)) {
      delete this.targetSessions[targetSession.id];
    }
    else {
      // console.warn("removeTargetSession failed", _source, debuggerSession);
    }
  }

  /**
     * Find a target session matching the given debugger session criteria.
     * @param debuggerSession - Session criteria to match
     * @returns Matching session or undefined
     */
  findTargetSession(debuggerSession: CDPDebuggerSession): CDPTargetSession | undefined {
    if (Utils.isNullOrUndefined(debuggerSession)) return undefined;

    const sessionKey = Object.keys(this.targetSessions).find(id => {
      const targetSession = this.targetSessions[id];

      if (!Utils.isNullOrUndefined(debuggerSession.tabId)) {
        if (targetSession.session.tabId !== debuggerSession.tabId) return false;
      }

      if (!Utils.isNullOrUndefined(debuggerSession.sessionId)) {
        return targetSession.session.sessionId === debuggerSession.sessionId;
      }

      if (!Utils.isNullOrUndefined(debuggerSession.targetId)) {
        return (
          targetSession.session.targetId === debuggerSession.targetId ||
          targetSession.targetInfo.targetId === debuggerSession.targetId
        );
      }

      // TODO: unexpected extension session
      if (!Utils.isNullOrUndefined(debuggerSession.extensionId)) {
        return targetSession.session.extensionId === debuggerSession.extensionId;
      }

      return true;
    });

    return sessionKey ? this.targetSessions[sessionKey] : undefined;
  }

  /**
   * Clear target sessions associated with a source, preserving tab-level sessions.
   * @param source - Session to clear
   */
  clearTargetSession(source: CDPDebuggerSession): void {
    const normalizedSource = source || { tabId: this.id } as CDPDebuggerSession;

    if (!Utils.isNullOrUndefined(normalizedSource.tabId) && normalizedSource.tabId === this.id &&
      Utils.isNullOrUndefined(normalizedSource.targetId)) {
      const tabSession = this.findTargetSession(normalizedSource);
      if (!Utils.isNullOrUndefined(tabSession)) {
        this.targetSessions = { [tabSession.id]: tabSession };
      }
    } else {
      this.removeTargetSession(normalizedSource, normalizedSource);
    }
  }

  /**
   * Build a hierarchical frame tree from raw frame data, linking child frames and contexts.
   * @param frameTrees - Raw frame tree data from CDP Page.getFrameTree
   * @returns Root frame of the tree
   */
  buildFrameTree(frameTrees: Array<{ frameTree: unknown; session: CDPDebuggerSession }>): CDPFrameInfo | undefined {
    let root: CDPFrameInfo | undefined = undefined;
    const frames: CDPFrameInfo[] = [];
    const extensionId = chrome.runtime && chrome.runtime.id;

    // Recursively create CDPFrameInfo instances from frame trees
    const createCDPFrameInfoFunc = (frameTree: unknown, session: CDPDebuggerSession) => {
      if (Utils.isNullOrUndefined(frameTree)) return;

      const frame = (frameTree as { frame?: unknown }).frame;
      if (!Utils.isNullOrUndefined(frame)) {
        frames.push(new CDPFrameInfo(frame, session));
      }

      const childFrames = (frameTree as { childFrames?: unknown[] }).childFrames;
      if (Array.isArray(childFrames) && childFrames.length > 0) {
        childFrames.forEach(childFrameTree => {
          createCDPFrameInfoFunc(childFrameTree, session);
        });
      }
    };

    frameTrees.forEach(frameTreeObj => {
      createCDPFrameInfoFunc(frameTreeObj.frameTree, frameTreeObj.session);
    });

    // Link frames to parents and populate contexts
    frames.forEach(frameInfo => {
      // Link to parent frame
      if (!Utils.isNullOrUndefined(frameInfo.parentId)) {
        const parentFrame = frames.find(frame => frame.id === frameInfo.parentId);
        if (!Utils.isNullOrUndefined(parentFrame)) {
          parentFrame.childFrames.push(frameInfo);
        }
      } else {
        root = frameInfo;
      }

      // Associate execution contexts with this frame
      Object.keys(this.executionContexts).forEach(contextId => {
        const contextInfo = this.executionContexts[contextId];
        if (contextInfo?.auxData?.frameId !== frameInfo.id) return;

        if (contextInfo.auxData.isDefault) {
          frameInfo.defaultContext = contextInfo;
        }

        // Identify content context (extension-specific)
        if (
          contextInfo.name === "Gogogo" &&
          extensionId && contextInfo?.origin &&
          contextInfo.origin.indexOf(extensionId) >= 0
        ) {
          frameInfo.contentContext = contextInfo;
        }

        frameInfo.contexts.push(contextInfo);
        if (!Utils.isNullOrUndefined(frameInfo.contentContext)) {
          frameInfo.attached = true;
        }
      });
    });

    this.root = root;
    this.frames = frames;
    return root;
  }
};

/**
 * Main class for interacting with Chrome DevTools Protocol (CDP) in a Chrome extension.
 * Manages tab attachments, target sessions, and CDP command execution.
 * We wrapper the known apis again so that old version apis can be used with promise
 */
export class ChromeDevToolsProtocol {
  private _logger: Logger;
  private _debbuggerEvents: Record<string, (source: CDPDebuggerSession, method: string, params: unknown) => void>;
  private _tabs: Record<number, CDPTabInfo>; // Key: tabId

  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "ChromeDevToolsProtocol" : this.constructor?.name;
    this._logger = new Logger(prefix);
    this._tabs = {};
    this._debbuggerEvents = this._initializeDebuggerEvents();

    chrome.debugger.onEvent.addListener((source: chrome._debugger.DebuggerSession, method: string, params?: object) => {
      const source_session = source as CDPDebuggerSession;
      this._debbuggerEvent(source_session, method, params);
    });
    chrome.debugger.onDetach.addListener((source: chrome._debugger.Debuggee, reason: `${chrome._debugger.DetachReason}`) => {
      const source_session = source as CDPDebuggerSession;
      this._debbuggerDetached(source_session, reason);
    });
  }

  /**
   * Add a tab to track and manage with CDP.
   * @param tabId - Tab ID to track
   */
  addTab(tabId: number): void {
    if (Utils.isNullOrUndefined(this._tabs[tabId])) {
      this._tabs[tabId] = new CDPTabInfo(tabId);
      this._tabs[tabId].attached = false;
    }
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
   * Attach to all tracked tabs.
   */
  async attachAllTabs(): Promise<void> {
    const tabIds = Object.keys(this._tabs).map(id => Number(id));
    // await Promise.all(
    //   tabIds.map(tabId => this.attachTab(this._tabs[tabId].id))
    // );
    for (const tabId of tabIds) {
      const tab = this._tabs[tabId];
      await this.attachTab(tab.id);
    }
  }

  /**
   * Detach from all tracked tabs.
   */
  async detachAllTabs(): Promise<void> {
    const tabIds = Object.keys(this._tabs).map(id => Number(id));
    // await Promise.all(
    //   tabIds.map(tabId => this.detachTab(this._tabs[tabId].id))
    // );
    for (const tabId of tabIds) {
      const tab = this._tabs[tabId];
      await this.detachTab(tab.id);
    }
  }

  /**
    * Attach CDP debugger to a tab.
    * @param tabId - Tab ID to attach to
    */
  async attachTab(tabId: number): Promise<void> {
    if (!Utils.isNullOrUndefined(this._tabs[tabId]) && this._tabs[tabId].attached) {
      return Promise.resolve();
    }
    if (Utils.isNullOrUndefined(this._tabs[tabId])) {
      this.addTab(tabId);
    }
    await this._attachTargetIfNeeded(tabId);
  }

  /**
   * Detach CDP debugger from a tab.
   * @param tabId - Tab ID to detach from
   */
  async detachTab(tabId: number): Promise<void> {
    if (this._tabs[tabId] && !this._tabs[tabId].attached) {
      return Promise.resolve();
    }
    const target = this._getDebuggee(tabId);
    await this._detachTarget(target).then(() => {
      if (this._tabs[tabId]) {
        const tab = this._tabs[tabId];
        tab.attached = false;
        const session = target as CDPDebuggerSession;
        tab.clearExecutionContext(session);
        tab.clearTargetSession(session);
      }
    });
  }

  /**
   * Check if a tab is currently attached to CDP.
   * @param tabId - Tab ID to check
   * @returns True if attached, false otherwise
   */
  isTabAttached(tabId: number): boolean {
    return !!(this._tabs[tabId]?.attached);
  }

  /**
   * Get a debuggee object for a tab/target.
   * @param tabId - Tab ID
   * @param targetId - Optional target ID within the tab
   * @returns Debuggee session
   */
  private _getDebuggee(tabId?: number, targetId?: string): CDPDebuggee {
    return { tabId, targetId } as CDPDebuggee;
  }

  /**
   * Get the CDPTabInfo instance for a given source session.
   * @param source - Session to find associated tab for
   * @returns Tab info or undefined
   */
  private _getTab(source: CDPDebuggerSession): CDPTabInfo | undefined {
    if (!Utils.isNullOrUndefined(source.tabId)) {
      return this._tabs[source.tabId];
    }

    const tabId = Object.keys(this._tabs).find(tabIdStr => {
      const tab = this._tabs[Number(tabIdStr)];
      const session = tab.findTargetSession(source);
      return !Utils.isNullOrUndefined(session);
    });

    return tabId ? this._tabs[Number(tabId)] : undefined;
  }

  /**
   * Attach to a target (tab/iframe) if it's not already attached.
   * @param tabId - Tab ID containing the target
   * @param targetId - Optional specific target ID
   */
  private async _attachTargetIfNeeded(
    tabId: number,
    targetId?: string
  ): Promise<void> {
    try {
      const targets = await this._getTargets();

      const targetObj = targets.find(target => {
        if (target.attached) return false;
        // target is iframe
        if (!Utils.isNullOrUndefined(targetId) && target.id === targetId) return true;
        // target is page
        if (Utils.isNullOrUndefined(targetId) && !Utils.isNullOrUndefined(tabId) && target.type === "page" && target.tabId === tabId) {
          return true;
        }
        return false;
      });

      if (Utils.isNullOrUndefined(targetObj)) {
        return;
      }

      const target = this._getDebuggee(tabId, targetId);
      await this._attachTarget(target);

      targetObj.attached = true;
      const tab = this._getTab(target as CDPDebuggerSession);
      if (tab && targetObj.type === "page" && targetObj.tabId === tab.id) {
        tab.targetId = targetObj.id;
        tab.frameId = targetObj.id;
        tab.attached = true;
      }

      const session = target as CDPDebuggerSession;
      const targetInfo = new CDPTargetInfo(targetObj);
      tab?.addTargetSession(session, targetInfo, undefined);
      await this._initTarget(target as CDPDebuggerSession);
      this._logger.info(`_attachTargetIfNeeded: attached on tab[${tabId}]`);
    }
    catch (error) {
      this._logger.error(`_attachTargetIfNeeded: failed on tab ${tabId}:`, error instanceof Error ? error.message : error);
    }
  }

  /**
   * Get all available CDP targets.
   * @returns Promise<CDPTargetInfo[]> - Promise that succeeded
   * @throws Throws error when failed
   */
  private async _getTargets(): Promise<CDPTargetInfo[]> {
    return new Promise((resolve, reject) => {
      chrome.debugger.getTargets((result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`debugger.getTargets failed: ${error.message}`));
        }
        else {
          const ret = result.map((item) => new CDPTargetInfo({ ...item } as Partial<CDPTargetInfo>));
          resolve(ret);
        }
      });
    });
  }

  /**
   * Attach to a CDP target.
   * @param target - Target to attach to
   */
  private async _attachTarget(
    target: CDPDebuggee
  ): Promise<void> {
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
  private _detachTarget(
    target: CDPDebuggee
  ): Promise<void> {
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
  private async _sendCommand(
    target: CDPDebuggerSession,
    method: string,
    commandParams?: unknown
  ): Promise<object | undefined> {
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand(target, method, commandParams as { [key: string]: unknown }, (result) => {
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

  /**
   * Initialize target and enable required CDP domains (Page, Runtime, etc.).
   * @param target - Target to initialize
   */
  private async _initTarget(target: CDPDebuggerSession): Promise<void> {
    const cdpFeatures = [
      { method: "Page.enable", param: undefined, optional: false },
      { method: "Page.setBypassCSP", param: { "enabled": true }, optional: false },
      { method: "Runtime.enable", param: undefined, optional: false },
      { method: "DOM.enable", param: undefined, optional: false },
      { method: "Overlay.enable", param: undefined, optional: false },
      { method: "DOMSnapshot.enable", param: undefined, optional: true },
      { method: "Inspector.enable", param: undefined, optional: true },
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
        // Wrap _sendCommand method in a Promise
        await this._sendCommand(target, feature.method, feature.param);
      } catch (error) {
        // Throw error if non-optional command fails
        if (!feature.optional) {
          this._logger.error(`Failed to initialize CDP command: ${feature.method}`, error);
          throw error;
        }
        // Only log warning for failed optional commands
        this._logger.warn(`Optional CDP command failed: ${feature.method}`, error);
      }
    }
  }


  /**
   * Handle incoming CDP debugger events.
   * @param source - Session that received the event
   * @param method - Event method name
   * @param params - Event parameters
   */
  private _debbuggerEvent(source: CDPDebuggerSession, method: string, params?: object): void {
    // if(method === "Runtime.consoleAPICalled" || method === "DOM.setChildNodes") {
    //     return;
    // }
    // console.log("_debbuggerEvent", source, method, params);
    const source_session = source as CDPDebuggerSession;
    if (this._debbuggerEvents[method]) {
      this._debbuggerEvents[method].call(this, source_session, method, params);
    }
  }

  /**
   * Initialize handlers for specific CDP events.
   * @returns Event handler map
   */
  private _initializeDebuggerEvents(): Record<string, (source: CDPDebuggerSession, method: string, params: unknown) => void> {
    return {
      "Page.javascriptDialogOpening": (source, _method, params) => {
        if (Utils.isNullOrUndefined(source.tabId)) return;

        const tabId = source.tabId;
        const dialogParams = params as CDPJavascriptDialog;

        this._tabs[tabId].javascriptDialog = dialogParams;
      },

      "Page.javascriptDialogClosed": (source) => {
        if (Utils.isNullOrUndefined(source.tabId)) return;
        this._tabs[source.tabId].javascriptDialog = undefined;
      },

      "Runtime.executionContextCreated": (source, _method, params) => {
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
         *      origin: "http://mama.swinfra.net",
         *      uniqueId: "7854474203346722172.-5914632085921131557"
         *  }
         * }
         */
        const contextParams = params as {
          context: Partial<CDPExecutionContextInfo>
        };

        if (Utils.isNullOrUndefined(contextParams?.context?.auxData)) return;

        const tab = this._getTab(source);
        tab?.addExecutionContext(source, contextParams.context);
      },

      "Runtime.executionContextDestroyed": (source, _method, params) => {
        /**
         * {executionContextId: 12, executionContextUniqueId: '7594043499172353467.1643448933116185657'}
         */
        const destroyParams = params as {
          executionContextId: number;
          executionContextUniqueId?: string;
        };

        if (Utils.isNullOrUndefined(destroyParams?.executionContextId)) return;

        const tab = this._getTab(source);
        tab?.removeExecutionContext(
          source,
          destroyParams.executionContextId,
          destroyParams.executionContextUniqueId
        );
      },

      "Runtime.executionContextsCleared": (source) => {
        // TODO: check if this event will come from cross origin frame
        if (Utils.isNullOrUndefined(source)) return;

        const tab = this._getTab(source);
        tab?.clearExecutionContext(source);
        tab?.clearTargetSession(source);
      },

      "Target.attachedToTarget": (source, _method, params) => {
        /**
         * {
         *  sessionId: "2A4A4915D7D60148E71F7E07114F9091",
         *  targetInfo: {
         *      attached: true,
         *      browserContextId: "E78150A8298B205119DA74A13A7E2C95",
         *      canAccessOpener: false,
         *      targetId: "9402047E45B1745F42A98167EDBE25B4",
         *      title: ""
         *      type: "iframe"
         *      url: ""
         *  },
         *  waitingForDebugger: false
         * }
         */
        const attachParams = params as {
          sessionId: string;
          targetInfo: CDPTargetInfo;
          waitingForDebugger: boolean;
        };

        const session = source as CDPDebuggerSession;
        session.sessionId = attachParams.sessionId;
        this._initTarget(session).then(() => {
          const tab = this._getTab(source);
          const targetInfo = new CDPTargetInfo(attachParams.targetInfo);
          tab?.addTargetSession(session, targetInfo, source);
        });
      },

      "Target.detachedFromTarget": (source, _method, params) => {
        /**
         * {sessionId: '2A4A4915D7D60148E71F7E07114F9091', targetId: '9402047E45B1745F42A98167EDBE25B4'}
         */
        const detachParams = params as { sessionId: string; targetId: string };
        const tab = this._getTab(source);
        tab?.removeTargetSession(source, detachParams as unknown as CDPDebuggerSession);
      },

      // Unhandled frame events (for debugging)
      "Page.frameNavigated": (_source, _method, _params) => {
        /**
         * {
         *  frame: { 
         *      adFrameStatus: {adFrameType: 'none'},
         *      crossOriginIsolatedContextType: "NotIsolated",
         *      domainAndRegistry: "swinfra.net",
         *      gatedAPIFeatures: [],
         *      id: "9402047E45B1745F42A98167EDBE25B4",
         *      loaderId: "6EE0314E5EE7AB62595024AC07FC4E5C",
         *      mimeType: "text/html",
         *      name: "frame"
         *      parentId: "57784D671172321996AB58ECE63F0DE2"
         *      secureContextType: "InsecureScheme",
         *      securityOrigin: "http://mama.swinfra.net",
         *      url: "http://mama.swinfra.net/war/web_aut/Frames/frame_cross_origin.html" 
         *  },
         *  type: "Navigation"
         * }
         */
      },
      "Page.frameStartedLoading": (_source, _method, _params) => {
        /**
         * {frameId: '9402047E45B1745F42A98167EDBE25B4'}
         */
      },
      "Page.frameStoppedLoading": (_source, _method, _params) => {
        /**
         * {frameId: '9402047E45B1745F42A98167EDBE25B4'}
         */
      },
      "Page.frameAttached": (_source, _method, _params) => {
        /**
         * { frameId: "9402047E45B1745F42A98167EDBE25B4", parentFrameId: "57784D671172321996AB58ECE63F0DE2" }
         */
      },
      "Page.frameDetached": (_source, _method, _params) => {
        /**
         * {frameId: '9402047E45B1745F42A98167EDBE25B4', reason: 'swap'}
         * {frameId: '2C4A99026FD8219425644D1A1FC00D96', reason: 'remove'}
         */
      }
    };
  }

  /**
   * Handle debugger detachment event.
   * @param source - Session that was detached
   * @param reason - Reason for detachment
   */
  private _debbuggerDetached(source: CDPDebuggerSession, reason: string): void {
    this._logger.info("Debugger was detached from ", source, ": ", reason);

    if (this._tabs[source.tabId!]) {
      this._tabs[source.tabId!].attached = false;
      // if canceled by user by mistake, try to re-attach (canceled_by_user | target_closed)
      if (reason === "canceled_by_user") {
        this.attachTab(source.tabId!);
      }
    }
  }


  /**
   * Update target session metadata with latest target info.
   * @param tabId - Tab ID to update
   */
  private async _updateTargetSessions(
    tabId: number
  ): Promise<void> {
    const tab = this._tabs[tabId];
    if (!tab) return;

    const targetSessions = Object.values(tab.targetSessions);
    let targets = await this._getTargets();
    targetSessions.forEach(targetSession => {
      const target = targets.find(t =>
        t.id === targetSession.targetInfo.id || t.id === targetSession.targetInfo.targetId
      );
      if (target) {
        Object.assign(targetSession.targetInfo, target);
        targetSession.targetInfo.targetId = target.id;
      }
    });
  }

  /**
   * Build frame tree for a tab by querying all target sessions.
   * @param tabId - Tab ID to build frame tree for
   * @returns Promise<CDPFrameInfo | undefined> - Promise that succeeded
   * @throws Throws error when failed
   */
  private async _buildFrameTree(
    tabId: number
  ): Promise<CDPFrameInfo | undefined> {
    const tab = this._tabs[tabId];
    if (!tab) return;

    const frameTrees: Array<{ frameTree: unknown; session: CDPDebuggerSession }> = [];
    const targetSessions = Object.values(tab.targetSessions);

    // Process each target session sequentially
    for (let index = 0; index < targetSessions.length; index++) {
      const targetSession = targetSessions[index];
      try {
        // Wrap _sendCommand in a promise
        const result = await this._sendCommand(targetSession.session, "Page.getFrameTree", {});
        // Check if we received a valid frame tree
        if (result && (result as { frameTree?: unknown }).frameTree) {
          frameTrees.push({
            frameTree: (result as { frameTree: unknown }).frameTree,
            session: targetSession.session
          });
        }
      } catch (error) {
        this._logger.warn("Page.getFrameTree failed for session", targetSession.session, "error:", error);
        // Re-throw the error to be handled by the caller
        throw error as Error;
      }
    }

    // Build and return the root frame tree
    const root = tab.buildFrameTree(frameTrees);
    return root;
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
    const tab = this._getTab({ tabId } as CDPDebuggerSession);
    if (!tab) {
      throw new Error(`evaluateScript failed due to unknown tabId ${tabId}`);
    }
    await this._updateTargetSessions(tabId);
    const root = await this._buildFrameTree(tabId);

    if (!root) {
      throw new Error('evaluateScript failed due to unknown frame tree root');
    }

    const targetFrameId = frameId || root.id;
    const frame = tab.frames?.find(f => f.id === targetFrameId);
    if (!frame) {
      throw new Error(`evaluateScript failed due to unknown frameId ${targetFrameId}`);
    }

    const targetSession = frame.session || this._getDebuggee(tabId);
    const scriptOption = Object.assign(options as any, { expression: script });
    const context = contextType === "MAIN" ? frame.defaultContext : frame.contentContext;

    if (context?.uniqueId) {
      (scriptOption as Record<string, unknown>).uniqueContextId = context.uniqueId;
    } else if (context?.id) {
      (scriptOption as Record<string, unknown>).contextId = context.id;
    }

    const result = await this._sendCommand(targetSession, "Runtime.evaluate", scriptOption);
    return result;
  }

  /**
   * Navigate a tab to a URL via CDP.
   * @param tabId - Tab ID to navigate
   * @param url - URL to navigate to
   */
  async pageNavigate(
    tabId: number,
    url: string
  ): Promise<void> {
    const target = this._getDebuggee(tabId);
    await this._sendCommand(target, "Page.navigate", { "url": url });
  }

  /**
   * Check if a JavaScript dialog is open in a tab.
   * @param tabId - Tab ID to check
   */
  isJavascriptDialogOpened(
    tabId: number
  ): boolean {
    if (this._tabs[tabId]?.attached) {
      return !!this._tabs[tabId].javascriptDialog;
    } else {
      throw new Error(`the tab[${tabId}] is not attached`);
    }
  }

  /**
   * Handle a JavaScript dialog (accept/cancel).
   * @param tabId - Tab ID with dialog
   * @param accept - True to accept, false to cancel
   * @param text - Text to enter for prompt dialogs
   */
  async handleJavaScriptDialog(
    tabId: number,
    accept: boolean,
    text: string
  ): Promise<void> {
    const params = { accept, promptText: text };
    const target = this._getDebuggee(tabId);
    await this._sendCommand(target, "Page.handleJavaScriptDialog", params);
  }

  /**
   * Get the message from an open JavaScript dialog.
   * @param tabId - Tab ID with dialog
   */
  getJavaScriptDialogText(
    tabId: number
  ): string | undefined {
    if (this._tabs[tabId]?.attached) {
      return this._tabs[tabId].javascriptDialog?.message;
    } else {
      throw new Error(`the tab[${tabId}] is not attached`);
    }
  }

  /**
   * Emulate a device (screen size, user agent, etc.) for a tab.
   * @param tabId - Tab ID to emulate
   * @param emulationSettings - Device emulation configuration
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async emulateDevice(
    tabId: number,
    emulationSettings: {
      userAgent: string;
      width: number;
      height: number;
      deviceScaleFactor: number;
      mobile: boolean;
      touch: boolean;
    }
  ): Promise<void> {
    if (!this.isTabAttached(tabId)) {
      throw new Error(`tabId[${tabId}] is invalid`);
    }

    const chromeInfo = Utils.getBrowserInfo();
    const useNewInstruction = chromeInfo.majorVersion > 60;
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
      const touchMethod = useNewInstruction
        ? "Emulation.setTouchEmulationEnabled"
        : "Page.setTouchEmulationEnabled";
      const mouseTouchMethod = useNewInstruction
        ? "Emulation.setEmitTouchEventsForMouse"
        : "Page.setEmitTouchEventsForMouse";

      await this._sendCommand(target, touchMethod, touchParams);
      await this._sendCommand(target, mouseTouchMethod, touchParams);
    }

    this._tabs[tabId].emulationSettings = emulationSettings;

  }

  /**
   * Dispatch a mouse event via CDP.
   * @param tabId - Tab ID to dispatch event to
   * @param options - Mouse event options
   */
  async dispatchMouseEvent(
    tabId: number,
    options: CDPMouseEventOption,
  ): Promise<void> {
    const target = this._getDebuggee(tabId);
    const eventParams = Utils.deepClone(options);
    await this._sendCommand(target, "Input.dispatchMouseEvent", eventParams);
  }

  /**
   * Dispatch a keyboard event via CDP.
   * @param tabId - Tab ID to dispatch event to
   * @param options - Keyboard event options
   */
  async dispatchKeyEvent(
    tabId: number,
    options: CDPKeyEventOption
  ): Promise<void> {
    const target = this._getDebuggee(tabId);
    const eventParams = Utils.deepClone(options);
    await this._sendCommand(target, "Input.dispatchKeyEvent", eventParams);
  }

  /**
   * Send a custom CDP command to a tab.
   * @param tabId - Tab ID to send command to
   * @param command - CDP command name
   * @param options - Command options
   * @returns Promise<object | undefined> - Promise that succeeded
   * @throws Throws error when failed
   */
  async sendCommand(
    tabId: number,
    command: string,
    options: unknown
  ): Promise<object | undefined> {
    const target = this._getDebuggee(tabId);
    const commandParams = Utils.deepClone(options);
    return await this._sendCommand(target, command, commandParams);
  }
};

export type CDPMouseEventType = 'mousePressed' | 'mouseReleased' | 'mouseMoved' | 'mouseWheel';

export enum CDPModifiers {
  None = 0,
  Alt = 1,
  Ctrl = 2,
  Meta_Command = 4,
  Shift = 8
};

export type CDPMouseButton = 'none' | 'left' | 'middle' | 'right' | 'back' | 'forward';

/**
 * Options for configuring a CDP mouse event.
 * Used with Input.dispatchMouseEvent.
 */
export class CDPMouseEventOption {
  /** 
   * Type of the mouse event. 
   * Allowed Values: mousePressed, mouseReleased, mouseMoved, mouseWheel
   */
  type: CDPMouseEventType = 'mouseMoved';
  /**
   * X coordinate of the event relative to the main frame's viewport in CSS pixels.
   */
  x: number;
  /**
   * Y coordinate of the event relative to the main frame's viewport in CSS pixels. 0 refers to the top of the viewport and Y increases as it proceeds towards the bottom of the viewport.
   */
  y: number;
  /**
   * Bit field representing pressed modifier keys. 
   * Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0).
   * @defaultValue 0
   */
  modifiers?: CDPModifiers = CDPModifiers.None;
  /**
   * Mouse button (default: "none"). 
   * Allowed Values: none, left, middle, right, back, forward
   * @defaultValue "none"
   */
  button: CDPMouseButton = 'none';
  /**
   * A number indicating which buttons are pressed on the mouse when a mouse event is triggered. 
   * Left=1, Right=2, Middle=4, Back=8, Forward=16, None=0.
   */
  buttons?: number = 0;
  /**
   * Number of times the mouse button was clicked (default: 0).
   * @defaultValue 0
   */
  clickCount: number = 0;
  /**
   * X delta in CSS pixels for mouse wheel event (default: 0).
   * @defaultValue 0
   */
  deltaX?: number;
  /**
   * Y delta in CSS pixels for mouse wheel event (default: 0).
   * @defaultValue 0
   */
  deltaY?: number;
  /**
   * Pointer type (default: "mouse"). Allowed Values: mouse, pen
   * @defaultValue "mouse"
   */
  pointerType: 'mouse' | 'pen' = 'mouse';

  /**
   * Create mouse event options.
   * @param type - Type of mouse event
   * @param x - X coordinate (CSS pixels)
   * @param y - Y coordinate (CSS pixels)
   */
  constructor(type: CDPMouseEventType, x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;
  }
};

/**
 * Wrapper for CDP mouse operations.
 * Provides high-level methods for simulating mouse input.
 */
export class CDPMouse {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create a mouse controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }

  /**
   * Reset mouse position to (0,0).
   */
  async reset(): Promise<void> {
    await this.move(0, 0);
  }

  /**
   * Move the mouse to coordinates.
   * @param x - Target X coordinate
   * @param y - Target Y coordinate
   */
  async move(x: number, y: number): Promise<void> {
    const options = new CDPMouseEventOption("mouseMoved", x, y);
    await this.dispatchEvent(options);
  }

  /**
   * Simulate mouse down event.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param button - Mouse button
   * @param clickCount - Number of clicks
   */
  async down(
    x: number,
    y: number,
    button: CDPMouseButton,
    clickCount: number
  ): Promise<void> {
    const options = new CDPMouseEventOption("mousePressed", x, y);
    options.button = button;
    options.clickCount = clickCount;
    await this.dispatchEvent(options);
  }

  /**
   * Simulate mouse up event.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param button - Mouse button
   * @param clickCount - Number of clicks
   */
  async up(
    x: number,
    y: number,
    button: CDPMouseButton,
    clickCount: number
  ): Promise<void> {
    const options = new CDPMouseEventOption("mouseReleased", x, y);
    options.button = button;
    options.clickCount = clickCount;
    await this.dispatchEvent(options);
  }

  /**
   * Simulate a complete mouse click (down + up).
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param button - Mouse button
   * @param clickCount - Number of clicks
   * @param duration - Delay between down and up (ms)
   */
  async click(
    x: number,
    y: number,
    button: CDPMouseButton,
    clickCount: number,
    duration: number = 0
  ): Promise<void> {
    await this.move(x, y);
    await this.down(x, y, button, clickCount);
    const delay = duration || 0;
    if (delay > 0) {
      setTimeout(async () => {
        await this.up(x, y, button, clickCount);
      }, delay);
    } else {
      await this.up(x, y, button, clickCount);
    }
  }

  /**
   * Simulate mouse wheel event.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param deltaX - Horizontal scroll delta
   * @param deltaY - Vertical scroll delta
   */
  async wheel(
    x: number,
    y: number,
    deltaX: number,
    deltaY: number
  ): Promise<void> {
    const options = new CDPMouseEventOption("mouseWheel", x, y);
    options.button = "middle";
    options.deltaX = deltaX;
    options.deltaY = deltaY;
    await this.dispatchEvent(options);
  }

  /**
   * Dispatch a raw mouse event via CDP.
   * @param options - Mouse event options
   */
  async dispatchEvent(
    options: CDPMouseEventOption
  ): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    await this._cdp.dispatchMouseEvent(this._tabId, options);
  }
};


type CDPKeyEventType = 'keyDown' | 'keyUp' | 'rawKeyDown' | 'char';
/**
 * Options for configuring a CDP keyboard event.
 * Used with Input.dispatchKeyEvent.
 */
export class CDPKeyEventOption {
  /**
   * Type of the key event.  
   * Allowed Values: keyDown, keyUp, rawKeyDown, char
   */
  type: CDPKeyEventType;
  /**
   * Bit field representing pressed modifier keys. 
   * Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0).
   * @defaultValue 0
   */
  modifiers?: CDPModifiers = CDPModifiers.None;
  /**
   * Text as generated by processing a virtual key code with a keyboard layout. 
   * Not needed for for keyUp and rawKeyDown events (default: "")
   * @defaultValue ""
   */
  text: string = '';
  /**
   * Text that would have been generated by the keyboard if no modifiers were pressed (except for shift). 
   * Useful for shortcut (accelerator) key handling (default: "").
   * @defaultValue ""
   */
  unmodifiedText: string = '';
  /**
   * Unique key identifier (e.g., 'U+0041') (default: "").
   */
  keyIdentifier?: string = '';
  /**
   * Unique DOM defined string value for each physical key (e.g., 'KeyA') (default: "").
   * @defaultValue ""
   */
  code?: string = '';
  /**
   * Unique DOM defined string value describing the meaning of the key in the context of active modifiers, keyboard layout, etc (e.g., 'AltGr') (default: "").
   * @defaultValue ""
   */
  key?: string = '';
  /**
   * Windows virtual key code (default: 0).
   * @defaultValue 0
   */
  windowsVirtualKeyCode?: number = 0;
  /**
   * Native virtual key code (default: 0).
   * @defaultValue 0
   */
  nativeVirtualKeyCode?: number = 0;
  /**
   * Whether the event was generated from auto repeat (default: false).
   * @defaultValue false
   */
  autoRepeat?: boolean = false;
  /**
   * Whether the event was generated from the keypad (default: false).
   * @defaultValue false
   */
  isKeypad?: boolean = false;
  /**
   * Whether the event was a system key event (default: false).
   * @defaultValue false
   */
  isSystemKey?: boolean = false;
  /**
   * Whether the event was from the left or right side of the keyboard. 
   * 1=Left, 2=Right (default: 0).
   * @defaultValue 0
   */
  location?: number = 0;

  /**
   * Create keyboard event options.
   * @param type - Type of key event
   */
  constructor(type: CDPKeyEventType) {
    this.type = type;
  }
};

const KeyDefinitions = {
  '0': { 'keyCode': 48, 'key': '0', 'code': 'Digit0' },
  '1': { 'keyCode': 49, 'key': '1', 'code': 'Digit1' },
  '2': { 'keyCode': 50, 'key': '2', 'code': 'Digit2' },
  '3': { 'keyCode': 51, 'key': '3', 'code': 'Digit3' },
  '4': { 'keyCode': 52, 'key': '4', 'code': 'Digit4' },
  '5': { 'keyCode': 53, 'key': '5', 'code': 'Digit5' },
  '6': { 'keyCode': 54, 'key': '6', 'code': 'Digit6' },
  '7': { 'keyCode': 55, 'key': '7', 'code': 'Digit7' },
  '8': { 'keyCode': 56, 'key': '8', 'code': 'Digit8' },
  '9': { 'keyCode': 57, 'key': '9', 'code': 'Digit9' },
  'Power': { 'key': 'Power', 'code': 'Power' },
  'Eject': { 'key': 'Eject', 'code': 'Eject' },
  'Abort': { 'keyCode': 3, 'code': 'Abort', 'key': 'Cancel' },
  'Help': { 'keyCode': 6, 'code': 'Help', 'key': 'Help' },
  'Backspace': { 'keyCode': 8, 'code': 'Backspace', 'key': 'Backspace' },
  'Tab': { 'keyCode': 9, 'code': 'Tab', 'key': 'Tab' },
  'Numpad5': { 'keyCode': 12, 'shiftKeyCode': 101, 'key': 'Clear', 'code': 'Numpad5', 'shiftKey': '5', 'location': 3 },
  'NumpadEnter': { 'keyCode': 13, 'code': 'NumpadEnter', 'key': 'Enter', 'text': '\r', 'location': 3 },
  'Enter': { 'keyCode': 13, 'code': 'Enter', 'key': 'Enter', 'text': '\r' },
  '\r': { 'keyCode': 13, 'code': 'Enter', 'key': 'Enter', 'text': '\r' },
  '\n': { 'keyCode': 13, 'code': 'Enter', 'key': 'Enter', 'text': '\r' },
  'ShiftLeft': { 'keyCode': 16, 'code': 'ShiftLeft', 'key': 'Shift', 'location': 1 },
  'ShiftRight': { 'keyCode': 16, 'code': 'ShiftRight', 'key': 'Shift', 'location': 2 },
  'ControlLeft': { 'keyCode': 17, 'code': 'ControlLeft', 'key': 'Control', 'location': 1 },
  'ControlRight': { 'keyCode': 17, 'code': 'ControlRight', 'key': 'Control', 'location': 2 },
  'AltLeft': { 'keyCode': 18, 'code': 'AltLeft', 'key': 'Alt', 'location': 1 },
  'AltRight': { 'keyCode': 18, 'code': 'AltRight', 'key': 'Alt', 'location': 2 },
  'Pause': { 'keyCode': 19, 'code': 'Pause', 'key': 'Pause' },
  'CapsLock': { 'keyCode': 20, 'code': 'CapsLock', 'key': 'CapsLock' },
  'Escape': { 'keyCode': 27, 'code': 'Escape', 'key': 'Escape' },
  'Convert': { 'keyCode': 28, 'code': 'Convert', 'key': 'Convert' },
  'NonConvert': { 'keyCode': 29, 'code': 'NonConvert', 'key': 'NonConvert' },
  'Space': { 'keyCode': 32, 'code': 'Space', 'key': ' ' },
  'Numpad9': { 'keyCode': 33, 'shiftKeyCode': 105, 'key': 'PageUp', 'code': 'Numpad9', 'shiftKey': '9', 'location': 3 },
  'PageUp': { 'keyCode': 33, 'code': 'PageUp', 'key': 'PageUp' },
  'Numpad3': { 'keyCode': 34, 'shiftKeyCode': 99, 'key': 'PageDown', 'code': 'Numpad3', 'shiftKey': '3', 'location': 3 },
  'PageDown': { 'keyCode': 34, 'code': 'PageDown', 'key': 'PageDown' },
  'End': { 'keyCode': 35, 'code': 'End', 'key': 'End' },
  'Numpad1': { 'keyCode': 35, 'shiftKeyCode': 97, 'key': 'End', 'code': 'Numpad1', 'shiftKey': '1', 'location': 3 },
  'Home': { 'keyCode': 36, 'code': 'Home', 'key': 'Home' },
  'Numpad7': { 'keyCode': 36, 'shiftKeyCode': 103, 'key': 'Home', 'code': 'Numpad7', 'shiftKey': '7', 'location': 3 },
  'ArrowLeft': { 'keyCode': 37, 'code': 'ArrowLeft', 'key': 'ArrowLeft' },
  'Numpad4': { 'keyCode': 37, 'shiftKeyCode': 100, 'key': 'ArrowLeft', 'code': 'Numpad4', 'shiftKey': '4', 'location': 3 },
  'Numpad8': { 'keyCode': 38, 'shiftKeyCode': 104, 'key': 'ArrowUp', 'code': 'Numpad8', 'shiftKey': '8', 'location': 3 },
  'ArrowUp': { 'keyCode': 38, 'code': 'ArrowUp', 'key': 'ArrowUp' },
  'ArrowRight': { 'keyCode': 39, 'code': 'ArrowRight', 'key': 'ArrowRight' },
  'Numpad6': { 'keyCode': 39, 'shiftKeyCode': 102, 'key': 'ArrowRight', 'code': 'Numpad6', 'shiftKey': '6', 'location': 3 },
  'Numpad2': { 'keyCode': 40, 'shiftKeyCode': 98, 'key': 'ArrowDown', 'code': 'Numpad2', 'shiftKey': '2', 'location': 3 },
  'ArrowDown': { 'keyCode': 40, 'code': 'ArrowDown', 'key': 'ArrowDown' },
  'Select': { 'keyCode': 41, 'code': 'Select', 'key': 'Select' },
  'Open': { 'keyCode': 43, 'code': 'Open', 'key': 'Execute' },
  'PrintScreen': { 'keyCode': 44, 'code': 'PrintScreen', 'key': 'PrintScreen' },
  'Insert': { 'keyCode': 45, 'code': 'Insert', 'key': 'Insert' },
  'Numpad0': { 'keyCode': 45, 'shiftKeyCode': 96, 'key': 'Insert', 'code': 'Numpad0', 'shiftKey': '0', 'location': 3 },
  'Delete': { 'keyCode': 46, 'code': 'Delete', 'key': 'Delete' },
  'NumpadDecimal': { 'keyCode': 46, 'shiftKeyCode': 110, 'code': 'NumpadDecimal', 'key': '\u0000', 'shiftKey': '.', 'location': 3 },
  'Digit0': { 'keyCode': 48, 'code': 'Digit0', 'shiftKey': ')', 'key': '0' },
  'Digit1': { 'keyCode': 49, 'code': 'Digit1', 'shiftKey': '!', 'key': '1' },
  'Digit2': { 'keyCode': 50, 'code': 'Digit2', 'shiftKey': '@', 'key': '2' },
  'Digit3': { 'keyCode': 51, 'code': 'Digit3', 'shiftKey': '#', 'key': '3' },
  'Digit4': { 'keyCode': 52, 'code': 'Digit4', 'shiftKey': '$', 'key': '4' },
  'Digit5': { 'keyCode': 53, 'code': 'Digit5', 'shiftKey': '%', 'key': '5' },
  'Digit6': { 'keyCode': 54, 'code': 'Digit6', 'shiftKey': '^', 'key': '6' },
  'Digit7': { 'keyCode': 55, 'code': 'Digit7', 'shiftKey': '&', 'key': '7' },
  'Digit8': { 'keyCode': 56, 'code': 'Digit8', 'shiftKey': '*', 'key': '8' },
  'Digit9': { 'keyCode': 57, 'code': 'Digit9', 'shiftKey': '\(', 'key': '9' },
  'KeyA': { 'keyCode': 65, 'code': 'KeyA', 'shiftKey': 'A', 'key': 'a' },
  'KeyB': { 'keyCode': 66, 'code': 'KeyB', 'shiftKey': 'B', 'key': 'b' },
  'KeyC': { 'keyCode': 67, 'code': 'KeyC', 'shiftKey': 'C', 'key': 'c' },
  'KeyD': { 'keyCode': 68, 'code': 'KeyD', 'shiftKey': 'D', 'key': 'd' },
  'KeyE': { 'keyCode': 69, 'code': 'KeyE', 'shiftKey': 'E', 'key': 'e' },
  'KeyF': { 'keyCode': 70, 'code': 'KeyF', 'shiftKey': 'F', 'key': 'f' },
  'KeyG': { 'keyCode': 71, 'code': 'KeyG', 'shiftKey': 'G', 'key': 'g' },
  'KeyH': { 'keyCode': 72, 'code': 'KeyH', 'shiftKey': 'H', 'key': 'h' },
  'KeyI': { 'keyCode': 73, 'code': 'KeyI', 'shiftKey': 'I', 'key': 'i' },
  'KeyJ': { 'keyCode': 74, 'code': 'KeyJ', 'shiftKey': 'J', 'key': 'j' },
  'KeyK': { 'keyCode': 75, 'code': 'KeyK', 'shiftKey': 'K', 'key': 'k' },
  'KeyL': { 'keyCode': 76, 'code': 'KeyL', 'shiftKey': 'L', 'key': 'l' },
  'KeyM': { 'keyCode': 77, 'code': 'KeyM', 'shiftKey': 'M', 'key': 'm' },
  'KeyN': { 'keyCode': 78, 'code': 'KeyN', 'shiftKey': 'N', 'key': 'n' },
  'KeyO': { 'keyCode': 79, 'code': 'KeyO', 'shiftKey': 'O', 'key': 'o' },
  'KeyP': { 'keyCode': 80, 'code': 'KeyP', 'shiftKey': 'P', 'key': 'p' },
  'KeyQ': { 'keyCode': 81, 'code': 'KeyQ', 'shiftKey': 'Q', 'key': 'q' },
  'KeyR': { 'keyCode': 82, 'code': 'KeyR', 'shiftKey': 'R', 'key': 'r' },
  'KeyS': { 'keyCode': 83, 'code': 'KeyS', 'shiftKey': 'S', 'key': 's' },
  'KeyT': { 'keyCode': 84, 'code': 'KeyT', 'shiftKey': 'T', 'key': 't' },
  'KeyU': { 'keyCode': 85, 'code': 'KeyU', 'shiftKey': 'U', 'key': 'u' },
  'KeyV': { 'keyCode': 86, 'code': 'KeyV', 'shiftKey': 'V', 'key': 'v' },
  'KeyW': { 'keyCode': 87, 'code': 'KeyW', 'shiftKey': 'W', 'key': 'w' },
  'KeyX': { 'keyCode': 88, 'code': 'KeyX', 'shiftKey': 'X', 'key': 'x' },
  'KeyY': { 'keyCode': 89, 'code': 'KeyY', 'shiftKey': 'Y', 'key': 'y' },
  'KeyZ': { 'keyCode': 90, 'code': 'KeyZ', 'shiftKey': 'Z', 'key': 'z' },
  'MetaLeft': { 'keyCode': 91, 'code': 'MetaLeft', 'key': 'Meta', 'location': 1 },
  'MetaRight': { 'keyCode': 92, 'code': 'MetaRight', 'key': 'Meta', 'location': 2 },
  'ContextMenu': { 'keyCode': 93, 'code': 'ContextMenu', 'key': 'ContextMenu' },
  'NumpadMultiply': { 'keyCode': 106, 'code': 'NumpadMultiply', 'key': '*', 'location': 3 },
  'NumpadAdd': { 'keyCode': 107, 'code': 'NumpadAdd', 'key': '+', 'location': 3 },
  'NumpadSubtract': { 'keyCode': 109, 'code': 'NumpadSubtract', 'key': '-', 'location': 3 },
  'NumpadDivide': { 'keyCode': 111, 'code': 'NumpadDivide', 'key': '/', 'location': 3 },
  'F1': { 'keyCode': 112, 'code': 'F1', 'key': 'F1' },
  'F2': { 'keyCode': 113, 'code': 'F2', 'key': 'F2' },
  'F3': { 'keyCode': 114, 'code': 'F3', 'key': 'F3' },
  'F4': { 'keyCode': 115, 'code': 'F4', 'key': 'F4' },
  'F5': { 'keyCode': 116, 'code': 'F5', 'key': 'F5' },
  'F6': { 'keyCode': 117, 'code': 'F6', 'key': 'F6' },
  'F7': { 'keyCode': 118, 'code': 'F7', 'key': 'F7' },
  'F8': { 'keyCode': 119, 'code': 'F8', 'key': 'F8' },
  'F9': { 'keyCode': 120, 'code': 'F9', 'key': 'F9' },
  'F10': { 'keyCode': 121, 'code': 'F10', 'key': 'F10' },
  'F11': { 'keyCode': 122, 'code': 'F11', 'key': 'F11' },
  'F12': { 'keyCode': 123, 'code': 'F12', 'key': 'F12' },
  'F13': { 'keyCode': 124, 'code': 'F13', 'key': 'F13' },
  'F14': { 'keyCode': 125, 'code': 'F14', 'key': 'F14' },
  'F15': { 'keyCode': 126, 'code': 'F15', 'key': 'F15' },
  'F16': { 'keyCode': 127, 'code': 'F16', 'key': 'F16' },
  'F17': { 'keyCode': 128, 'code': 'F17', 'key': 'F17' },
  'F18': { 'keyCode': 129, 'code': 'F18', 'key': 'F18' },
  'F19': { 'keyCode': 130, 'code': 'F19', 'key': 'F19' },
  'F20': { 'keyCode': 131, 'code': 'F20', 'key': 'F20' },
  'F21': { 'keyCode': 132, 'code': 'F21', 'key': 'F21' },
  'F22': { 'keyCode': 133, 'code': 'F22', 'key': 'F22' },
  'F23': { 'keyCode': 134, 'code': 'F23', 'key': 'F23' },
  'F24': { 'keyCode': 135, 'code': 'F24', 'key': 'F24' },
  'NumLock': { 'keyCode': 144, 'code': 'NumLock', 'key': 'NumLock' },
  'ScrollLock': { 'keyCode': 145, 'code': 'ScrollLock', 'key': 'ScrollLock' },
  'AudioVolumeMute': { 'keyCode': 173, 'code': 'AudioVolumeMute', 'key': 'AudioVolumeMute' },
  'AudioVolumeDown': { 'keyCode': 174, 'code': 'AudioVolumeDown', 'key': 'AudioVolumeDown' },
  'AudioVolumeUp': { 'keyCode': 175, 'code': 'AudioVolumeUp', 'key': 'AudioVolumeUp' },
  'MediaTrackNext': { 'keyCode': 176, 'code': 'MediaTrackNext', 'key': 'MediaTrackNext' },
  'MediaTrackPrevious': { 'keyCode': 177, 'code': 'MediaTrackPrevious', 'key': 'MediaTrackPrevious' },
  'MediaStop': { 'keyCode': 178, 'code': 'MediaStop', 'key': 'MediaStop' },
  'MediaPlayPause': { 'keyCode': 179, 'code': 'MediaPlayPause', 'key': 'MediaPlayPause' },
  'Semicolon': { 'keyCode': 186, 'code': 'Semicolon', 'shiftKey': ':', 'key': ';' },
  'Equal': { 'keyCode': 187, 'code': 'Equal', 'shiftKey': '+', 'key': '=' },
  'NumpadEqual': { 'keyCode': 187, 'code': 'NumpadEqual', 'key': '=', 'location': 3 },
  'Comma': { 'keyCode': 188, 'code': 'Comma', 'shiftKey': '\<', 'key': ',' },
  'Minus': { 'keyCode': 189, 'code': 'Minus', 'shiftKey': '_', 'key': '-' },
  'Period': { 'keyCode': 190, 'code': 'Period', 'shiftKey': '>', 'key': '.' },
  'Slash': { 'keyCode': 191, 'code': 'Slash', 'shiftKey': '?', 'key': '/' },
  'Backquote': { 'keyCode': 192, 'code': 'Backquote', 'shiftKey': '~', 'key': '`' },
  'BracketLeft': { 'keyCode': 219, 'code': 'BracketLeft', 'shiftKey': '{', 'key': '[' },
  'Backslash': { 'keyCode': 220, 'code': 'Backslash', 'shiftKey': '|', 'key': '\\' },
  'BracketRight': { 'keyCode': 221, 'code': 'BracketRight', 'shiftKey': '}', 'key': ']' },
  'Quote': { 'keyCode': 222, 'code': 'Quote', 'shiftKey': '"', 'key': '\'' },
  'AltGraph': { 'keyCode': 225, 'code': 'AltGraph', 'key': 'AltGraph' },
  'Props': { 'keyCode': 247, 'code': 'Props', 'key': 'CrSel' },
  'Cancel': { 'keyCode': 3, 'key': 'Cancel', 'code': 'Abort' },
  'Clear': { 'keyCode': 12, 'key': 'Clear', 'code': 'Numpad5', 'location': 3 },
  'Shift': { 'keyCode': 16, 'key': 'Shift', 'code': 'ShiftLeft', 'location': 1 },
  'Control': { 'keyCode': 17, 'key': 'Control', 'code': 'ControlLeft', 'location': 1 },
  'Alt': { 'keyCode': 18, 'key': 'Alt', 'code': 'AltLeft', 'location': 1 },
  'Accept': { 'keyCode': 30, 'key': 'Accept' },
  'ModeChange': { 'keyCode': 31, 'key': 'ModeChange' },
  ' ': { 'keyCode': 32, 'key': ' ', 'code': 'Space' },
  'Print': { 'keyCode': 42, 'key': 'Print' },
  'Execute': { 'keyCode': 43, 'key': 'Execute', 'code': 'Open' },
  '\u0000': { 'keyCode': 46, 'key': '\u0000', 'code': 'NumpadDecimal', 'location': 3 },
  'a': { 'keyCode': 65, 'key': 'a', 'code': 'KeyA' },
  'b': { 'keyCode': 66, 'key': 'b', 'code': 'KeyB' },
  'c': { 'keyCode': 67, 'key': 'c', 'code': 'KeyC' },
  'd': { 'keyCode': 68, 'key': 'd', 'code': 'KeyD' },
  'e': { 'keyCode': 69, 'key': 'e', 'code': 'KeyE' },
  'f': { 'keyCode': 70, 'key': 'f', 'code': 'KeyF' },
  'g': { 'keyCode': 71, 'key': 'g', 'code': 'KeyG' },
  'h': { 'keyCode': 72, 'key': 'h', 'code': 'KeyH' },
  'i': { 'keyCode': 73, 'key': 'i', 'code': 'KeyI' },
  'j': { 'keyCode': 74, 'key': 'j', 'code': 'KeyJ' },
  'k': { 'keyCode': 75, 'key': 'k', 'code': 'KeyK' },
  'l': { 'keyCode': 76, 'key': 'l', 'code': 'KeyL' },
  'm': { 'keyCode': 77, 'key': 'm', 'code': 'KeyM' },
  'n': { 'keyCode': 78, 'key': 'n', 'code': 'KeyN' },
  'o': { 'keyCode': 79, 'key': 'o', 'code': 'KeyO' },
  'p': { 'keyCode': 80, 'key': 'p', 'code': 'KeyP' },
  'q': { 'keyCode': 81, 'key': 'q', 'code': 'KeyQ' },
  'r': { 'keyCode': 82, 'key': 'r', 'code': 'KeyR' },
  's': { 'keyCode': 83, 'key': 's', 'code': 'KeyS' },
  't': { 'keyCode': 84, 'key': 't', 'code': 'KeyT' },
  'u': { 'keyCode': 85, 'key': 'u', 'code': 'KeyU' },
  'v': { 'keyCode': 86, 'key': 'v', 'code': 'KeyV' },
  'w': { 'keyCode': 87, 'key': 'w', 'code': 'KeyW' },
  'x': { 'keyCode': 88, 'key': 'x', 'code': 'KeyX' },
  'y': { 'keyCode': 89, 'key': 'y', 'code': 'KeyY' },
  'z': { 'keyCode': 90, 'key': 'z', 'code': 'KeyZ' },
  'Meta': { 'keyCode': 91, 'key': 'Meta', 'code': 'MetaLeft', 'location': 1 },
  '*': { 'keyCode': 106, 'key': '*', 'code': 'NumpadMultiply', 'location': 3 },
  '+': { 'keyCode': 107, 'key': '+', 'code': 'NumpadAdd', 'location': 3 },
  '-': { 'keyCode': 109, 'key': '-', 'code': 'NumpadSubtract', 'location': 3 },
  '/': { 'keyCode': 111, 'key': '/', 'code': 'NumpadDivide', 'location': 3 },
  ';': { 'keyCode': 186, 'key': ';', 'code': 'Semicolon' },
  '=': { 'keyCode': 187, 'key': '=', 'code': 'Equal' },
  ',': { 'keyCode': 188, 'key': ',', 'code': 'Comma' },
  '.': { 'keyCode': 190, 'key': '.', 'code': 'Period' },
  '`': { 'keyCode': 192, 'key': '`', 'code': 'Backquote' },
  '[': { 'keyCode': 219, 'key': '[', 'code': 'BracketLeft' },
  '\\': { 'keyCode': 220, 'key': '\\', 'code': 'Backslash' },
  ']': { 'keyCode': 221, 'key': ']', 'code': 'BracketRight' },
  '\'': { 'keyCode': 222, 'key': '\'', 'code': 'Quote' },
  'Attn': { 'keyCode': 246, 'key': 'Attn' },
  'CrSel': { 'keyCode': 247, 'key': 'CrSel', 'code': 'Props' },
  'ExSel': { 'keyCode': 248, 'key': 'ExSel' },
  'EraseEof': { 'keyCode': 249, 'key': 'EraseEof' },
  'Play': { 'keyCode': 250, 'key': 'Play' },
  'ZoomOut': { 'keyCode': 251, 'key': 'ZoomOut' },
  ')': { 'keyCode': 48, 'key': ')', 'code': 'Digit0' },
  '!': { 'keyCode': 49, 'key': '!', 'code': 'Digit1' },
  '@': { 'keyCode': 50, 'key': '@', 'code': 'Digit2' },
  '#': { 'keyCode': 51, 'key': '#', 'code': 'Digit3' },
  '$': { 'keyCode': 52, 'key': '$', 'code': 'Digit4' },
  '%': { 'keyCode': 53, 'key': '%', 'code': 'Digit5' },
  '^': { 'keyCode': 54, 'key': '^', 'code': 'Digit6' },
  '&': { 'keyCode': 55, 'key': '&', 'code': 'Digit7' },
  '(': { 'keyCode': 57, 'key': '\(', 'code': 'Digit9' },
  'A': { 'keyCode': 65, 'key': 'A', 'code': 'KeyA' },
  'B': { 'keyCode': 66, 'key': 'B', 'code': 'KeyB' },
  'C': { 'keyCode': 67, 'key': 'C', 'code': 'KeyC' },
  'D': { 'keyCode': 68, 'key': 'D', 'code': 'KeyD' },
  'E': { 'keyCode': 69, 'key': 'E', 'code': 'KeyE' },
  'F': { 'keyCode': 70, 'key': 'F', 'code': 'KeyF' },
  'G': { 'keyCode': 71, 'key': 'G', 'code': 'KeyG' },
  'H': { 'keyCode': 72, 'key': 'H', 'code': 'KeyH' },
  'I': { 'keyCode': 73, 'key': 'I', 'code': 'KeyI' },
  'J': { 'keyCode': 74, 'key': 'J', 'code': 'KeyJ' },
  'K': { 'keyCode': 75, 'key': 'K', 'code': 'KeyK' },
  'L': { 'keyCode': 76, 'key': 'L', 'code': 'KeyL' },
  'M': { 'keyCode': 77, 'key': 'M', 'code': 'KeyM' },
  'N': { 'keyCode': 78, 'key': 'N', 'code': 'KeyN' },
  'O': { 'keyCode': 79, 'key': 'O', 'code': 'KeyO' },
  'P': { 'keyCode': 80, 'key': 'P', 'code': 'KeyP' },
  'Q': { 'keyCode': 81, 'key': 'Q', 'code': 'KeyQ' },
  'R': { 'keyCode': 82, 'key': 'R', 'code': 'KeyR' },
  'S': { 'keyCode': 83, 'key': 'S', 'code': 'KeyS' },
  'T': { 'keyCode': 84, 'key': 'T', 'code': 'KeyT' },
  'U': { 'keyCode': 85, 'key': 'U', 'code': 'KeyU' },
  'V': { 'keyCode': 86, 'key': 'V', 'code': 'KeyV' },
  'W': { 'keyCode': 87, 'key': 'W', 'code': 'KeyW' },
  'X': { 'keyCode': 88, 'key': 'X', 'code': 'KeyX' },
  'Y': { 'keyCode': 89, 'key': 'Y', 'code': 'KeyY' },
  'Z': { 'keyCode': 90, 'key': 'Z', 'code': 'KeyZ' },
  ':': { 'keyCode': 186, 'key': ':', 'code': 'Semicolon' },
  '<': { 'keyCode': 188, 'key': '\<', 'code': 'Comma' },
  '_': { 'keyCode': 189, 'key': '_', 'code': 'Minus' },
  '>': { 'keyCode': 190, 'key': '>', 'code': 'Period' },
  '?': { 'keyCode': 191, 'key': '?', 'code': 'Slash' },
  '~': { 'keyCode': 192, 'key': '~', 'code': 'Backquote' },
  '{': { 'keyCode': 219, 'key': '{', 'code': 'BracketLeft' },
  '|': { 'keyCode': 220, 'key': '|', 'code': 'Backslash' },
  '}': { 'keyCode': 221, 'key': '}', 'code': 'BracketRight' },
  '"': { 'keyCode': 222, 'key': '"', 'code': 'Quote' }
};

/**
 * Wrapper for CDP keyboard operations.
 * Provides high-level methods for simulating keyboard input.
 */
export class CDPKeyboard {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create a keyboard controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }

  /**
   * Input text into the active element.
   * @param text - Text to input
   * @param clearTextBefore - Clear existing text first
   * @param performCommit - Press Enter after input
   */
  async setText(
    text: string,
    clearTextBefore: boolean,
    performCommit: boolean,
  ): Promise<void> {
    if (Utils.isNullOrUndefined(this._cdp) || typeof KeyDefinitions === "undefined") {
      return;
    }

    // Clear text using Ctrl+A + Delete
    const clearTextFunc = async () => {
      await this._dispatchKeyEvent("rawKeyDown", "a", false, true, false, false);
      await this._dispatchKeyEvent("keyUp", "a", false, true, false, false);
      await this._dispatchKeyEvent("rawKeyDown", "Delete", false, false, false, false);
      await this._dispatchKeyEvent("keyUp", "Delete", false, false, false, false,);
    };

    // Move cursor to end with End key
    const setCursorToTextEndFunc = async () => {
      await this._dispatchKeyEvent("rawKeyDown", "End", false, false, false, false);
      await this._dispatchKeyEvent("keyUp", "End", false, false, false, false);
    };

    // Type each character sequentially
    const pressKeyFunc = async (keys: string[], index: number) => {
      if (index >= keys.length || Utils.isNullOrUndefined(keys[index])) {
        return Promise.resolve();
      }
      await this._dispatchKeyEvent("char", keys[index], false, false, false, false);
      await pressKeyFunc(keys, index + 1);
    };

    // Main text input logic
    const setTextFunc = async (inputText: string) => {
      const keys = inputText.split('');
      for (const textChar of keys) {
        await this._dispatchKeyEvent("char", textChar, false, false, false, false);
      }
      if (performCommit) {
        await this._dispatchKeyEvent("rawKeyDown", "Enter", false, false, false, false);
        await this._dispatchKeyEvent("keyUp", "Enter", false, false, false, false);
      }
    };

    if (clearTextBefore) {
      await clearTextFunc();
      await setTextFunc(text);
    } else {
      await setCursorToTextEndFunc();
      await setTextFunc(text);
    }
  }

  /**
   * Dispatch a keyboard event with modifiers.
   * @param event - Event type
   * @param key - Key name (from KeyDefinitions)
   * @param alt - Alt modifier
   * @param ctrl - Ctrl modifier
   * @param cmd - Meta/Command modifier
   * @param shift - Shift modifier
   */
  private async _dispatchKeyEvent(
    event: string,
    key: string,
    alt: boolean,
    ctrl: boolean,
    cmd: boolean,
    shift: boolean
  ): Promise<void> {
    if (
      Utils.isNullOrUndefined(this._cdp) ||
      Utils.isNullOrUndefined(event) ||
      Utils.isNullOrUndefined(key) ||
      typeof KeyDefinitions === "undefined"
    ) {
      return Promise.reject(new Error('Invalid arguments or environment.'));
    }

    const keyInfo = (KeyDefinitions as any)[key];
    if (Utils.isNullOrUndefined(keyInfo)) {
      return Promise.reject(new Error(`Invalid KeyDefinition - ${key}`));
    }

    const normalizedEvent = event.toLowerCase();
    const eventTypeMapping: Record<string, CDPKeyEventType> = {
      "keyup": "keyUp",
      "keydown": "keyDown",
      "rawkeydown": "rawKeyDown",
      "char": "char"
    };

    const type = eventTypeMapping[normalizedEvent] || "char";
    let text: string | undefined = key;
    if (type === "keyUp" || type === "rawKeyDown") {
      text = undefined;
    }

    let modifiers = 0;
    if (alt) modifiers += 1;
    if (ctrl) modifiers += 2;
    if (cmd) modifiers += 4;
    if (shift) modifiers += 8;

    const options = new CDPKeyEventOption(type);
    if (modifiers > 0) options.modifiers = modifiers;
    if (text) options.text = text;
    if (keyInfo.code) options.code = keyInfo.code;
    if (keyInfo.key) options.key = keyInfo.key;
    if (keyInfo.keyCode) options.windowsVirtualKeyCode = keyInfo.keyCode;
    if (keyInfo.location) options.location = keyInfo.location;

    await this.dispatchEvent(options);
  }

  /**
   * Dispatch a raw keyboard event via CDP.
   * @param options - Keyboard event options
   */
  async dispatchEvent(
    options: CDPKeyEventOption
  ): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    await this._cdp.dispatchKeyEvent(this._tabId, options);
  }
};

/**
 * Wrapper for CDP DOM operations.
 * Provides methods for highlighting DOM elements.
 */
export class CDPDOM {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create a DOM controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }


  /**
   * Highlight a rectangle on the page.
   * @param rect - Rectangle coordinates and style
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async highlightRect(
    rect: unknown,
  ): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    const rectWithDefaults = {
      outlineColor: { r: 18, g: 110, b: 198, a: 0 },
      color: { r: 18, g: 110, b: 198, a: 0.4 },
      ...(rect as any)
    };
    await this._cdp.sendCommand(this._tabId, "DOM.highlightRect", rectWithDefaults);
  }

  /**
   * Hide any active DOM highlight.
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async hideHighlight(): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    await this._cdp.sendCommand(this._tabId, "DOM.hideHighlight", undefined);
  }
};

/**
 * Wrapper for CDP Overlay operations.
 * Provides methods for visual overlays (e.g., highlighting).
 */
export class CDPOverlay {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create an overlay controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }

  /**
   * Highlight a rectangle using the Overlay domain.
   * @param rect - Rectangle coordinates and style
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async highlightRect(
    rect: unknown
  ): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    // default color picked from chrome:
    // Formula for foreground color: 
    // c_final = (1-a)*c_background + a*c_forground
    // c_background = #FFFFFF = rgb(255, 255, 255)
    // c_forground = (c_final - (1-a)*c_background)/a
    // 1. inspected item:c_final = #A0C5E8 rgb(160, 197, 232), c_forground = rgba(18, 110, 198, 0.4)
    // 2: padding: c_final = #C4DDB8 rgb(196, 221, 184), c_forground = rgba(108, 170, 78, 0.4)
    // 3: border: c_final = #FFEDBC rgb(255, 237, 188) , c_forground = rgba(255, 210, 88, 0.4)
    // 4: marging: c_final = #F9CB9D rgb(249, 203, 157), c_forground = rgba(240, 125, 10, 0.4)
    const rectWithDefaults = {
      outlineColor: { r: 18, g: 110, b: 198, a: 0 },
      color: { r: 18, g: 110, b: 198, a: 0.4 },
      ...rect as any
    };
    await this._cdp.sendCommand(this._tabId, "Overlay.highlightRect", rectWithDefaults);
  }

  /**
   * Hide any active overlay highlight.
   * @param successCallback - Called on success
   * @param failCallback - Called on error
   */
  async hideHighlight(): Promise<void> {
    await this._cdp.attachTab(this._tabId);
    await this._cdp.sendCommand(this._tabId, "Overlay.hideHighlight", undefined);
  }
};