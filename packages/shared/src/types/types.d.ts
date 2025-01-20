/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file types.d.ts
 * @description 
 * Shared types which observable to end users
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
export type LocatorOptions = BrowserLocatorOptions | WindowLocatorOptions | PageLocatorOptions
  | FrameLocatorOptions | ElementLocatorOptions | TextLocatorOptions;

export interface LocatorFilterOption {
  name: string;
  value?: string | number | boolean | RegExp;
  type?: 'property' | 'attribute' | 'function' | 'text';
  match?: 'has' | 'hasNot' | 'exact' | 'includes' | 'startsWith' | 'endsWith' | 'regex';
}

export interface Expect {
  not: Expect;
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNaN(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeNullOrUndefined(): void;
  toHaveLength(expected: number): void;
  toContain(expected: unknown): void;
  toMatch(expected: RegExp | string): void;
  toThrow(expectedErrorMsg?: string): void;
}

export function expect(actual: unknown): Expect;

export interface Locator<T> {
  filter(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<T>;
  prefer(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<T>;

  get(): Promise<T>;
  count(): Promise<number>;
  all(): Promise<Locator<T>[]>;
  nth(index: number): Locator<T>;
  first(): Locator<T>;
  last(): Locator<T>;
}

export interface BrowserLocatorOptions {
  name?: string;
  version?: string;
  processId?: number;
}

export interface BrowserLocatorMethods {
  window(selector?: WindowLocatorOptions): WindowLocator;
  page(selector?: PageLocatorOptions): PageLocator;
}

export interface BrowserProperties {
  name(): string;
  version(): string;
  majorVersion(): number;
}

export interface BrowserMethods {
  attachDebugger(): Promise<void>;
  detachDebugger(): Promise<void>;
  setDefaultTimeout(timeout: number): Promise<void>;

  cookies(urls?: string | string[]): Promise<Cookie[]>;
  addCookies(cookies: (Cookie & { url?: string }) | (Cookie & { url?: string })[]): Promise<void>;
  clearCookies(options?: { name?: string | RegExp, domain?: string | RegExp, path?: string | RegExp }): Promise<void>;

  openNewWindow(url?: string): Promise<Window>;
  openNewPage(url?: string): Promise<Page>;
  close(): Promise<void>;
}

export interface BrowserEvents {
  on(event: 'window', listener: (window: Window) => (unknown | Promise<unknown>)): this;
  on(event: 'page', listener: (page: Page) => (unknown | Promise<unknown>)): this;
}

export interface Browser extends BrowserProperties, BrowserMethods, BrowserLocatorMethods, BrowserEvents {
  windows(): Promise<Window[]>;
  pages(): Promise<Page[]>;
  lastFocusedWindow(): Promise<Window>;
  lastActivePage(): Promise<Page>;
}

export interface BrowserLocator extends Locator<Browser>, Browser { }

export interface WindowLocatorOptions {
  lastFocused?: boolean;
}

export interface WindowLocatorMethods {
  page(selector?: PageLocatorOptions): PageLocator;
}

export interface WindowProperties {
  state(): Promise<'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen'>;
  focused(): Promise<boolean>;
  incognito(): Promise<boolean>;
  closed(): Promise<boolean>;
}

export interface WindowMethods {
  openNewPage(url?: string): Promise<Page>;
  focus(): Promise<void>;
  close(): Promise<void>;
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  restore(): Promise<void>;
  fullscreen(toggle?: boolean): Promise<void>;
}

export interface WindowEvents {
  on(event: 'page', listener: (page: Page) => (unknown | Promise<unknown>)): this;
  on(event: 'close', listener: (window: Window) => (unknown | Promise<unknown>)): this;
}

export interface Window extends WindowProperties, WindowMethods, WindowLocatorMethods, WindowEvents {
  browser(): Promise<Browser>;
  pages(): Promise<Page[]>
  activePage(): Promise<Page>;
}

export interface WindowLocator extends Locator<Window>, Window { }

export interface PageLocatorOptions {
  url?: string | RegExp;
  title?: string | RegExp;
  active?: boolean;
  lastFocusedWindow?: boolean;
  index?: number;
}

export interface PageLocatorMethods {
  frame(selector?: FrameLocatorOptions | string): FrameLocator;
  element(selector?: ElementLocatorOptions | string): ElementLocator;
  text(selector?: TextLocatorOptions | string | RegExp): TextLocator;
}

export interface PageProperties {
  url(): Promise<string>;
  title(): Promise<string>;
  content(): Promise<string>;
  status(): Promise<'unloaded' | 'loading' | 'complete'>;
  active(): Promise<boolean>
  closed(): Promise<boolean>;
}

export interface PageMethods {
  activate(): Promise<void>;
  bringToFront(): Promise<void>;
  sync(timeout?: number): Promise<void>;
  openNewPage(url?: string): Promise<Page>;
  navigate(url?: string): Promise<void>;
  refresh(bypassCache?: boolean): Promise<void>;
  back(): Promise<void>;
  forward(): Promise<void>;
  close(): Promise<void>;
  zoom(zoomFactor: number): Promise<void>;
  moveToWindow(window: Window, index?: number): Promise<void>;
  captureScreenshot(): Promise<string>;

  querySelectorAll(selector: string): Promise<Element[]>;
  executeScript<Args extends unknown[], Result>(func: (...args: Args) => Result, args?: Args): Promise<Result>;
}

export interface PageEvents {
  on(event: 'dialog', listener: (dialog: Dialog) => (unknown | Promise<unknown>)): this;
  on(event: 'domcontentloaded' | 'close', listener: (page: Page) => (unknown | Promise<unknown>)): this;
}

export interface Page extends PageProperties, PageMethods, PageLocatorMethods, PageEvents {
  window(): Promise<Window | null>;
  mainFrame(): Promise<Frame | null>;
  frames(): Promise<Frame[]>;

  mouse(): Mouse;
  keyboard(): Keyboard;
  dialog(): Dialog;
}

export interface PageLocator extends Locator<Page>, Page { }

export interface FrameLocatorOptions {
  url?: string | RegExp;
  selector?: string;
}

export interface FrameLocatorMethods {
  element(selector?: ElementLocatorOptions | string): ElementLocator;
  text(selector?: TextLocatorOptions | string | RegExp): TextLocator;
}

export interface FrameProperties {
  url(): Promise<string>;
  status(): Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'>;
  readyState(): Promise<'loading' | 'interactive' | 'complete'>;
  content(): Promise<string>;
}

export interface FrameMethods {
  sync(timeout?: number): Promise<void>;
  querySelectorAll(selector: string): Promise<Element[]>;
  executeScript<Args extends unknown[], Result>(func: (...args: Args) => Result, args?: Args): Promise<Result>;
}

export interface Frame extends FrameProperties, FrameMethods, FrameLocatorMethods {
  page(): Promise<Page>;
  parentFrame(): Promise<Frame | null>;
  childFrames(): Promise<Frame[]>;
  ownerElement(): Promise<Element | null>;
}

export interface FrameLocator extends Locator<Frame>, Frame { }

export interface NodeProperties {
  nodeName(): Promise<string>;
  nodeType(): Promise<number>;
  nodeValue(): Promise<string>;
  isConnected(): Promise<boolean>;
  textContent(): Promise<string>;
  boundingBox(): Promise<RectInfo | null>;
}

export interface NodeMethods {
  highlight(): Promise<void>;
  getProperty(name: string): Promise<unknown>;
  setProperty(name: string, value: unknown): Promise<void>;
  getBoundingClientRect(): Promise<RectInfo>;
  dispatchEvent(type: string, options?: object): Promise<void>;
  sendCDPCommand(method: string, commandParams?: { [key: string]: unknown }): Promise<void>;
}

export interface MouseActions {
  hover(options?: { position?: Point } & ActionOptions): Promise<void>;
  click(options?: ClickOptions & ActionOptions): Promise<void>;
  dblclick(options?: Omit<ClickOptions, 'clickCount'> & ActionOptions): Promise<void>;
  wheel(options?: { deltaX?: number, deltaY?: number } & ActionOptions): Promise<void>;
  dragTo(target: Element | Text, options?: { sourcePosition?: Point, targetPosition?: Point, steps?: number } & ActionOptions): Promise<void>;
}

export interface TouchActions {
  tap(options?: { position?: Point } & ActionOptions): Promise<void>;
}

export interface KeyboardActions {
  fill(text: string, options?: TextInputOptions & ActionOptions): Promise<void>;
  clear(options?: ActionOptions): Promise<void>;
  press(keys: string | string[], options?: { delayBetweenDownUp?: number } & ActionOptions): Promise<void>;
}

export interface ElementLocatorOptions {
  selector?: string;
  xpath?: string;
}

export interface ElementLocatorMethods {
  element(selector?: ElementLocatorOptions | string): ElementLocator;
  text(selector?: TextLocatorOptions | string | RegExp): TextLocator;
}

export interface ElementProperties extends NodeProperties {
  tagName(): Promise<string>;
  id(): Promise<string>;
  innerHTML(): Promise<string>;
  outerHTML(): Promise<string>;
  innerText(): Promise<string>;
  outerText(): Promise<string>;
  title(): Promise<string>;
  accessKey(): Promise<string>;
  hidden(): Promise<boolean>;

  name(): Promise<string>;
  value(): Promise<string>;
  type(): Promise<string>;
  alt(): Promise<string>;
  accept(): Promise<string>;
  placeholder(): Promise<string>;
  src(): Promise<string>;
  disabled(): Promise<boolean>;
  readOnly(): Promise<boolean>;
  required(): Promise<boolean>;
  checked(): Promise<boolean>;

  label(): Promise<string>;
  selected(): Promise<boolean>;

  multiple(): Promise<boolean>;
  options(): Promise<Element[]>;
  selectedIndex(): Promise<number>;
  selectedOptions(): Promise<Element[]>;

  visible(): Promise<boolean>;
}

export interface ElementMethods extends NodeMethods {
  getAttribute(name: string): Promise<string | null>;
  getAttributes(): Promise<Record<string, unknown>>;
  setAttribute(name: string, value: string): Promise<void>;
  hasAttribute(name: string): Promise<boolean>;
  toggleAttribute(name: string, force?: boolean): Promise<boolean>;
  querySelectorAll(selector: string): Promise<Element[]>;
  checkValidity(): Promise<boolean>;
  checkVisibility(options?: object): Promise<boolean>;

  focus(): Promise<void>;
  blur(): Promise<void>;
  scrollIntoViewIfNeeded(): Promise<void>;
  check(options?: ActionOptions): Promise<void>;
  uncheck(options?: ActionOptions): Promise<void>;
  selectOption(values: string | string[] | number | number[] | Element | Element[]): Promise<void>;
  setFileInputFiles(files: string | string[]): Promise<void>;
}

export interface Element extends ElementProperties, ElementMethods, ElementLocatorMethods, MouseActions, KeyboardActions, TouchActions {
  ownerFrame(): Promise<Frame>;
  contentFrame(): Promise<Frame | null>;
}

export interface ElementLocator extends Locator<Element>, Element { }

export interface TextLocatorOptions {
  text?: string | RegExp;
}

export interface Text extends NodeProperties, NodeMethods, MouseActions, TouchActions {
  ownerFrame(): Promise<Frame>;
  ownerElement(): Promise<Element | null>;
}

export interface TextLocator extends Locator<Text>, Text { }

export type JSObject = Record<string, unknown>;

export interface Mouse {
  click(x: number, y: number, options?: Omit<ClickOptions, 'position'>): Promise<void>;

  down(options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number; }): Promise<void>;
  up(options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number; }): Promise<void>;
  move(x: number, y: number, options?: { steps?: number }): Promise<void>;
  wheel(deltaX: number, deltaY: number): Promise<void>;
}

export interface Keyboard {
  type(text: string, options?: TextInputOptions): Promise<void>;

  down(key: string): Promise<void>;
  up(key: string): Promise<void>;
  press(keys: string | string[], options?: { delayBetweenDownUp?: number }): Promise<void>;
}

export interface ActionOptions {
  mode?: 'event' | 'cdp';
  force?: boolean;
}

export interface ClickOptions {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  position?: Point;
  modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>;
  delayBetweenDownUp?: number;
  delayBetweenClick?: number;
}

export interface TextInputOptions {
  delayBetweenDownUp?: number;
  delayBetweenChar?: number;
}

export interface Dialog {
  page(): Promise<Page>;
  opened(): Promise<boolean>;
  type(): Promise<'alert' | 'confirm' | 'prompt' | 'beforeunload'>;
  defaultValue(): Promise<string>;
  message(): Promise<string>;
  accept(promptText?: string): Promise<void>;
  dismiss(): Promise<void>;
}

export interface Point {
  x: number;
  y: number;
}

export interface RectInfo {
  left: number;
  top: number;
  right: number;
  bottom: number;

  width: number;
  height: number;
  x: number;
  y: number;
}

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  session?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  partitionKey?: string;
}

export interface AIClient {
  init(options?: Record<string, unknown>): this;
  setModel(model: string): this;
  setSystemPrompt(prompt: string): this;
  chat(message: string): Promise<string | null>;
}
