/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file CDPTypes.ts
 * @description 
 * Provide the wrapper types for Chrome DevTool Protocol APIs
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


/** 
 * Represents a debugger debuggee wrapper for chrome._debugger.Debuggee
 * Debuggee identifier. Either tabId, extensionId or targetId must be specified 
 * */
export interface Debuggee extends chrome._debugger.Debuggee {
  /** The id of the tab which you intend to debug. */
  tabId?: number;
  /** The id of the extension which you intend to debug. Attaching to an extension background page is only possible when the `--silent-debugger-extension-api` command-line switch is used. */
  extensionId?: string;
  /** The opaque id of the debug target. */
  targetId?: string;
};

/**
 * Represents a debugger session wrapper for chrome._debugger.DebuggerSession
 * Debugger session identifier. One of tabId, extensionId or targetId must be specified. Additionally, an optional sessionId can be provided. If sessionId is specified for arguments sent from {@link onEvent}, it means the event is coming from a child protocol session within the root debuggee session. If sessionId is specified when passed to {@link sendCommand}, it targets a child protocol session within the root debuggee session.
 * Used to manage connections to Chrome DevTools Protocol targets.
 */
export interface DebuggerSession extends chrome._debugger.DebuggerSession {
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
 * Represents a CDP debugger session which extends the DebuggerSession
 */
export interface CDPDebuggerSession extends DebuggerSession {
  source?: DebuggerSession;
}

/**
 * 'tab' | 'page' | 'background_page' | 'iframe' | 'other' | 'worker' | 'shared_worker' | 'service_worker' | 'worklet' | 'browser' | 'webview' | 'auction_worklet'
 * chrome._debugger.TargetInfoType ('page' | 'background_page' | 'worker' | 'other')
 */
export type TargetInfoType = 'tab' | 'page' | 'background_page' | 'iframe' | 'other' | 'worker' | 'shared_worker' | 'service_worker' | 'worklet' | 'browser' | 'webview' | 'auction_worklet';

/**
 * Represents a target with metadata.
 * Wrapper for chrome._debugger.TargetInfo
 * Extends raw target info from chrome._debugger.getTargets() with normalized IDs.
 */
export interface TargetInfo {
  /** True if debugger is already attached. */
  attached?: boolean;
  /** The extension id, defined if type = 'background_page'. */
  extensionId?: string;
  /** Target favicon URL.  */
  faviconUrl?: string;
  /** Target id. */
  id?: string;
  /** The tab id, defined if type == 'page'. */
  tabId?: number;
  /** Target page title. */
  title?: string;
  /** Target type. */
  type: TargetInfoType;
  /** Target URL. */
  url?: string;
};

/**
 * Represents a CDP target which extends the TargetInfo
 */
export interface CDPTargetInfo extends TargetInfo {
  /** properties from cdp events, e.g. Target.attachedToTarget */
  browserContextId?: string;
  canAccessOpener?: boolean;
  parentFrameId?: string;
  pid?: number;
  targetId?: string;

  session?: CDPDebuggerSession;

  openerId?: string;
  openerFrameId?: string;
  subtype?: string;
}

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
export interface CDPExecutionContextInfo {
  id: number;
  name?: string;
  uniqueId: string;
  origin?: string;
  auxData?: CDPExecutionContextAuxData;

  source?: DebuggerSession;
};

/**
 * Represents a CDP Javascript Dialog wrapper type.
 * We use this struct to know the type and message of the popup dialog
 */
export interface CDPJavascriptDialog {
  url: string;
  message: string;
  type: string;
  hasBrowserHandler: boolean;
  defaultPrompt?: string;
}

/**
 * Represents a CDP Emulation Setting
 */
export interface CDPEmulationSettings {
  userAgent: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: boolean;
  touch: boolean;
}

/**
 * Represents a CDP tab with meta data
 */
export interface CDPTabInfo {
  attached: boolean;
  id: number;

  frameId?: string;
  targetId?: string;

  executionContexts: CDPExecutionContextInfo[];
  targets: CDPTargetInfo[];
  sessions: CDPDebuggerSession[];

  javascriptDialog?: CDPJavascriptDialog;
  emulationSettings?: CDPEmulationSettings;
}

/**
 * Represents a CDP frame with meta data
 * Wrapper for Page.Frame in CDP
 */
export interface CDPFrameInfo {
  id: string;
  parentId?: string;
  name?: string;
  url?: string;
  urlFragment?: string;
  securityOrigin?: string;
  mimeType?: string;

  childFrames: CDPFrameInfo[];

  session?: CDPDebuggerSession;
}
/**
 * Represents a CDP frame tree with meta data
 * Wrapper for Page.FrameTree in CDP
 */
export interface CDPFrameTree {
  frame: CDPFrameInfo;
  childFrames?: CDPFrameInfo[];
}
