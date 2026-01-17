/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file index.ts
 * @description 
 * Main entry point for the shared package
 */

// Export all shared utilities
export * as Utils from './Utils';
export * as RtidUtils from './RtidUtils';
export * as MsgUtils from './MsgUtils';
export * as BrowserUtils from './BrowserUtils';
export type { BrowserInfo } from './BrowserUtils';
export * as StorageUtils from './StorageUtils';
export * as CryptoUtil from './CryptoUtil';
export * as LocatorUtils from './LocatorUtils';
export * as DOMPathUtils from './DOMPathUtils';
export * as KeyDefinitionUtils from './KeyDefinitionUtils';
export type { KeyboardModifier } from './KeyDefinitionUtils';
// Export all shared class utilities
export * from './Logger';
export * from './DOMNode';
export * from './EventEmitter';
export * from './SettingUtils';

// Export messaging utilities
export * from './Messaging/ChannelBase';
export * from './Messaging/Dispatcher';
export * from './Messaging/MsgDataHandler';

// Export types
export type {
  LocatorOptions,
  LocatorFilterOption,
  Expect,
  Locator,
  BrowserLocatorOptions,
  BrowserLocatorMethods,
  BrowserProperties,
  BrowserMethods,
  BrowserEvents,
  Browser,
  BrowserLocator,
  WindowLocatorOptions,
  WindowLocatorMethods,
  WindowProperties,
  WindowMethods,
  WindowEvents,
  Window,
  WindowLocator,
  PageLocatorOptions,
  PageLocatorMethods,
  PageProperties,
  PageMethods,
  PageEvents,
  Page,
  PageLocator,
  FrameLocatorOptions,
  FrameLocatorMethods,
  FrameProperties,
  FrameMethods,
  Frame,
  FrameLocator,
  NodeProperties,
  NodeMethods,
  MouseActions,
  TouchActions,
  KeyboardActions,
  ElementLocatorOptions,
  ElementLocatorMethods,
  ElementProperties,
  ElementMethods,
  Element,
  ElementLocator,
  TextLocatorOptions,
  Text,
  TextLocator,
  JSObject,
  Mouse,
  Keyboard,
  ActionOptions,
  ClickOptions,
  TextInputOptions,
  Dialog,
  Point,
  RectInfo,
  Cookie,
  AIClient
} from './types/types';

export type {
  ContextType,
  Rtid,
  MessageType,
  Message,
  MessageData,
  MessageDataType,
  AOType,
  AutomationObjectType,
  AO,
  AutomationObject,
  Action,
  AutomationAction,
  InvokeAction,
  configActionName,
  queryActionName,
  commandActionName,
  recordActionName,
  ActionName,
  AODesc,
  AutomationObjectDescription,
  QueryInfo,
  Selector,
  RegExpSpec,
  OrdinalSelector,
  DOMElementDescription,
  TabDescription,
  ElementInfo,
  RecordedStep
} from './types/protocol';