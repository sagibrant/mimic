/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file index.ts
 * @description 
 * Browser SDK public entry point
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

export { RuntimeUtils } from './RuntimeUtils';

export { Browser } from './aos/Browser';
export { Window } from './aos/Window';
export { Page } from './aos/Page';
export { Frame } from './aos/Frame';
export { Element } from './aos/Element';
export { Text } from './aos/Text';

export { AIClient } from './aos/AIClient';
export { Mouse } from './aos/Mouse';
export { Keyboard } from './aos/Keyboard';
export { Dialog } from './aos/Dialog';

export { Locator } from './locators/Locator';
export { BrowserLocator } from './locators/BrowserLocator';
export { WindowLocator } from './locators/WindowLocator';
export { PageLocator } from './locators/PageLocator';
export { FrameLocator } from './locators/FrameLocator';
export { ElementLocator } from './locators/ElementLocator';
export { TextLocator } from './locators/TextLocator';

export { expect } from './Expect';

export type {
  LocatorOptions,
  LocatorFilterOption,
  Expect,
  BrowserLocatorOptions,
  BrowserLocatorMethods,
  BrowserProperties,
  BrowserMethods,
  BrowserEvents,
  WindowLocatorOptions,
  WindowLocatorMethods,
  WindowProperties,
  WindowMethods,
  WindowEvents,
  PageLocatorOptions,
  PageLocatorMethods,
  PageProperties,
  PageMethods,
  PageEvents,
  FrameLocatorOptions,
  FrameLocatorMethods,
  FrameProperties,
  FrameMethods,
  NodeProperties,
  NodeMethods,
  MouseActions,
  TouchActions,
  KeyboardActions,
  ElementLocatorOptions,
  ElementLocatorMethods,
  ElementProperties,
  ElementMethods,
  TextLocatorOptions,
  JSObject,
  ActionOptions,
  ClickOptions,
  TextInputOptions,
  Point,
  RectInfo,
  Cookie
} from '@mimic-sdk/core';
