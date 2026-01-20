/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file protocol.d.ts
 * @description 
 * Protocol definition
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

/** ==================================================================================================================== */
/** ================================================= Rtid Definition ================================================== */
/** ==================================================================================================================== */

/**
 * context type
 *   MAIN : The web page execution environment (MAIN WORLD)
 *   content : the content context (frame, element, text)
 *   background : the background context (agent, browser, window, tab, action_popup, options_page, sidebar_page)
 *   external : the external extensions, native app, server
 */
export type ContextType = 'MAIN' | 'content' | 'background' | 'external';

/**
 * the runtime id for a specified runtime object
 */
export interface Rtid {
  /**
   * the context type
   */
  context?: ContextType;
  /**
   * the external id used for connection. e.g. external extension id, native app name, server ip, sidebar id, etc
   */
  external?: string;
  /**
   * the browser id, equals to app id in cross app automation environments
   * -1: do not known
   * 0 : current browser
   */
  browser: number;
  /**
   * the window id, equals to window.id (starts from 1 in extension). 
   * can be changed for a tab, so we can set it to -1 when it is not required for usage.
   * -1: do not known
   * 0 : last focused window
   */
  window: number;
  /**
   * the page id, equals to the tab.id (starts from 1 in extension)
   * -1: do not known
   * 0 : last active tab
   */
  tab: number;
  /**
   * the frame id, equals to the frameId in port.sender:MessageSender (starts from 0 in extension)
   * 0 means the top frame (The main frame of that tab has frameId: 0; an iframe inside it would have frameId: 1, and so on.)
   * -1: do not known
   * 0 : the top frame
   */
  frame: number;
  /**
   * the object id
   */
  object: number;

};

/** ==================================================================================================================== */
/** ================================================ Message Definition ================================================ */
/** ==================================================================================================================== */

/** message type */
export type MessageType = 'event' | 'request' | 'response';

/**
 * Defines the message
 */
export interface Message {
  type: MessageType;
  uid: string;
  timestamp: number;
  data: MessageData;
  syncId?: string; // for request - response
  correlationId?: string; // placeholder for further integration
}

/** ==================================================================================================================== */
/** ============================================== MessageData Definition ============================================== */
/** ==================================================================================================================== */

/** message data type */
export type MessageDataType = 'query' | 'record' | 'command' | 'config';

/**
 * Defines the message data: the handler of the 'dest' will perform the action on 'target'
 */
export interface MessageData {
  /** the message data type */
  type: MessageDataType;
  /** the message data destination */
  dest: Rtid;

  /** the action to perform */
  action: Action;
  /** the description of target object to perform action on*/
  target?: AODesc;

  // response
  /** the objects which perform action on */
  objects?: AO[];
  /** status of the message handle result */
  status?: 'OK' | 'ERROR';
  /** error message if the message handle failed */
  error?: string;
  /** the handle result */
  result?: Record<string, unknown> | unknown;
}

/** ==================================================================================================================== */
/** =========================================== Automation Object Definition =========================================== */
/** ==================================================================================================================== */

export type AOType = AutomationObjectType;

export type AutomationObjectType = 'agent' | 'browser' | 'window' | 'tab' | 'frame' | 'shadow_root' | 'element' | 'text';

/**
 * use short name AO for AutomationObject
 */
export type AO = AutomationObject;

/**
 * Interface representing an automation object
 */
export interface AutomationObject {
  type: AOType;
  name?: string;
  rtid: Rtid;
  runtimeInfo: Record<string, unknown>;
  metaData?: Record<string, unknown>;
}

/** ==================================================================================================================== */
/** =========================================== Automation Action Definition =========================================== */
/** ==================================================================================================================== */

/**
 * use short name Action for AutomationAction
 */
export type Action = AutomationAction;

/**
 * Type definitions for Automation Action
 */
export interface AutomationAction {
  name: ActionName;
  params?: Record<string, unknown>;
}

export interface InvokeAction extends AutomationAction {
  name: 'invoke';
  params: {
    name: string;
    args?: unknown[];
  }
}

/**
 * config:
 *  get => get settings on target
 *  set => set settings on target
 * 
 * query:
 *  query_objects => query objects with queryInfo
 *  query_object => query one object with queryInfo
 *  query_property => query one property
 *  query_properties => query multiple properties
 * 
 * execute:
 *  invoke => invoke the AO method with args
 * 
 * record:
 *  record => record AO actions into structured steps
 * 
 */

/**
 * Type definitions for config
 */
export type configActionName = 'set' | 'get';

/**
 * Type definitions for query
 */
export type queryActionName = 'query_objects' | 'query_object' | 'query_property' | 'query_properties';

/**
 * Type definitions for command
 */
export type commandActionName = 'invoke';

/**
 * Type definitions for record/inspect
 */
export type recordActionName = 'record_step' | 'inspect_object';

/**
 * Type definitions for all action names
 */
export type ActionName = configActionName | queryActionName | commandActionName | recordActionName;

/**
 * use short name
 */
export type AODesc = AutomationObjectDescription;

/**
 * Defines the description/query data for a collection of Automation Object
 * 1. if rtids exist, use rtids to get the cached AO directly
 * 2. if rtids not exist, query object using queryInfo under the parent rtid context
 */
export interface AutomationObjectDescription {
  type: AOType;
  rtids?: Rtid[];
  queryInfo?: QueryInfo;
  parent?: Rtid;
}

/**
 * Defines the query information for locating automation objects
 * 1. primary: the primary query to get candidate objects
 * 2. mandatory: the mandatory conditions that must be satisfied
 * 3. assistive: the assistive conditions that can be used to resolve the tie if multiple objects are found after mandatory filtering
 * 4. ordinal: the ordinal position to pick one object if multiple objects are still there after assistive filtering
 * 5. if no assistive and ordinal provided, return multiple objects found by primary and mandatory filtering
 */
export interface QueryInfo {

  /** 
   * Selectors used for the **primary query** to find candidate objects.
   * These are your primary locators, e.g.:
   * - window: lastFocused: boolean
   * - tab: lastFocusedWindow: boolean, active : boolean
   * - frame: url: string | Regex
   * - element: xpath: string, css: string
   * Example: [{ name: "xpath", value: "//button" }, ... ]
   * make sure only pass necessary selectors here to locate the candidates, filters should be in mandatory field
   */
  primary?: Selector[];

  /** 
   * Selectors that **must all be satisfied** by a candidate element to be considered a match.
   * Even if an element is found via `predictional` selectors, it’s rejected if it fails any `mandatory` check.
   * Example: [{ name: "tagName", value: "BUTTON", type: "property", match: "exact" }, ... ]
   */
  mandatory?: Selector[];

  /** 
   * Selectors used to **resolve ties** when multiple objects pass the `mandatory` checks and we want to pick the best match.
   * The element with the most `assistive` matches is chosen.
   * Example: [{ name: "class", value: "primary", type: "attribute", match: "contains" }, ...]
   */
  assistive?: Selector[];

  /** 
   * Fallback position to pick an element when:
   * - Multiple objects pass `mandatory` checks AND
   * - No `assistive` selectors break the tie.
   * Uses 0-based index (defined by the type).
   * Example: 
   * - {index: 0, type: "default"} (pick first)
   * - {index: 1, type: "creation_time"} (pick second most recently created)
   * - {index: 2, type: "location"} (pick third in view order from top-left to bottom-right)
   */
  ordinal?: OrdinalSelector; // for backward compatibility, number means default index
}

/**
 * Interface representing a way to locate an object 
 */
export interface Selector {
  name: string;
  value?: string | number | boolean | RegExpSpec;
  type: 'property' | 'attribute' | 'function' | 'text';
  match: 'has' | 'hasNot' | 'exact' | 'includes' | 'startsWith' | 'endsWith' | 'regex';
}

/**
 * A specification for reconstructing a RegExp
 */
export interface RegExpSpec {
  pattern: string;
  flags?: string;
}

/**
 * Defines the ordinal selector to pick one object from multiple candidates
 * - index: the index to pick
 * - type: the index type
 */
export interface OrdinalSelector {
  type: 'default' | 'location';
  index: number;
  reverse: boolean;
}

/**
 * Defines the DOM Element description
 */
export interface DOMElementDescription {
  nodeType: number; //'ELEMENT_NODE' = 1 | 'TEXT_NODE' = 3;
  nodeName?: string;
  nodeValue?: string | null;
  textContent?: string;
  localName?: string;
  tagName?: string;
  attributes?: Record<string, string>;

  selector?: string;
  xPath?: string;
  fullXPath?: string;
  jsPath?: string;
  scriptPath?: string;

  frameUrl?: string;
  isInSubFrame?: boolean;

  isInShadowRoot?: boolean;
  shadowRootMode?: 'open' | 'closed';
}

/**
 * Defines the Tab description
 */
export interface TabDescription {
  title: string;
  url: string;
  index: number;
}

/**
 * Defines the element info with locator scripts
 */
export interface ElementInfo {
  browserScript?: string;
  pageScript?: string;
  frameScript?: string;
  elementScript?: string;

  element?: DOMElementDescription;
  elementRtid?: Rtid;
}

/**
 * Defines the recorded step
 */
export interface RecordedStep {
  await: boolean;

  browserScript?: string;
  pageScript?: string;
  frameScript?: string;
  elementScript?: string;
  actionScript?: string;

  element?: DOMElementDescription;
  elementRtid?: Rtid;
}
/** ==================================================================================================================== */
/** =================================================== End of file ==================================================== */
/** ==================================================================================================================== */