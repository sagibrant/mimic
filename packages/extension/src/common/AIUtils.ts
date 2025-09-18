/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file AIUtils.ts
 * @description 
 * Shared AI utility classes and functions
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

import { Utils } from "@/common/Common";
import { SettingUtils } from "@/common/Settings";
import { CryptoUtil } from "@/common/CryptoUtil";

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIMessageContent {
  script: string;
  answer: string;
}

export class AIUtils {

  private static types: string = `
export type LocatorOptions = BrowserLocatorOptions | WindowLocatorOptions | PageLocatorOptions
  | FrameLocatorOptions | ElementLocatorOptions | TextLocatorOptions;

export interface LocatorFilterOption {
  name: string;
  value?: string | number | boolean | RegExp;
  type?: 'property' | 'attribute' | 'function' | 'text';
  match?: 'has' | 'hasNot' | 'exact' | 'includes' | 'startsWith' | 'endsWith' | 'regex';
}

export interface Expect {
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
  on(event: 'window', listener: (window: Window) => any): this;
  on(event: 'page', listener: (page: Page) => any): this;
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
  fullscreen(toggle: boolean): Promise<void>;
}

export interface WindowEvents {
  on(event: 'page', listener: (page: Page) => any): this;
  on(event: 'close', listener: (window: Window) => any): this;
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
  sync(timeout: number): Promise<void>;
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
  executeScript<Args extends any[], Result>(func: (...args: Args) => Result, args: Args): Promise<Result>;
}

export interface PageEvents {
  on(event: 'dialog', listener: (dialog: Dialog) => any): this;
  on(event: 'domcontentloaded', listener: (page: Page) => any): this;
  on(event: 'close', listener: (page: Page) => any): this;
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
  sync(timeout: number): Promise<void>;
  querySelectorAll(selector: string): Promise<Element[]>;
  executeScript<Args extends any[], Result>(func: (...args: Args) => Result, args: Args): Promise<Result>;
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
  getProperty(name: string): Promise<any>;
  setProperty(name: string, value: any): Promise<void>;
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

export type JSObject = any;

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
  init(options?: any): this;
  setModel(model: string): this;
  setSystemPrompt(prompt: string): this;
  chat(message: string): Promise<string | null>;
}
  `;

  static getSystemPrompt(language: string) {
    const types = AIUtils.types;
    const systemPrompt = `You are an expert in web testing and web automation. Your task is to generate PURE JavaScript script according to user requests and output the script and answer in a structured JSON format. You must strictly follow the rules below.

1. Output Format (Highest Priority)
  - Return ONLY a valid JSON object with this structure: { script: string, answer: string }
  - Example of the output format:
    {
      "script": "await page.navigate('https://example.com');\\nawait page.sync();\\nawait page.element('#okbtn').first().click();",
      "answer": "The purpose is to navigate to 'https://example.com' and click the ok button. For navigation, we use page.navigate. For clicking the ok button, we first find it via the CSS selector #okbtn and then call the click method."
    }
  - Field Constraints:
    - script:
      Contains only PURE JavaScript script. Must be a complete, executable snippet that can directly overwrite the user's existing script. The script runs in a sandbox with these constraints:
      - Global variables:
        (1) ai: Corresponds to the AIClient interface in types.d.ts, representing the AIClient object (use methods defined in types.d.ts), e.g., const response = await ai.init().setMode('gpt-4o').chat('hello');
        (2) browser: Corresponds to the Browser interface in types.d.ts, representing the current browser (use methods defined in types.d.ts), e.g., await browser.page().first().bringToFront();
        (3) page: Corresponds to the Page interface in types.d.ts, representing the current page (use methods defined in types.d.ts), e.g., await page.element("#id").nth(0).click();
        (4) console: For logging only (browser native API)
      - Global functions (use with JavaScript syntax):
        (1) expect(actual: unknown): Returns an Expect instance (defined in types.d.ts), e.g., await expect(1 === 1).toBeTruthy()
        (2) wait(timeout: number): Returns a Promise for waiting, e.g., await wait(2000)
        (3) fetch: For network requests only (browser native API)
      - Prohibited Operations:
        (1) DO NOT use third-party libraries (Selenium, Playwright, Puppeteer—NONE are supported)
        (2) DO NOT use browser native APIs except console and fetch (e.g., document, window, document.querySelector are forbidden)
        (3) DO NOT use TypeScript-specific syntax (type annotations like "let x: string", interfaces, type aliases, enums)
        (4) DO NOT add unrequested logic (auto-navigation, extra wait time, redundant console.log—only implement user-specified features)
    - answer:
      Contains 10-300 tokens. First describes the user's requirements and current situation. Then explains why and how the script solves the problem. Must be human-readable text with no styles or HTML tags.

2. Target Language Rule
  - The answer field of the output must be in the target language: ${language} unless user ask to change the language.
  - The script field of the output is ALWAYS PURE JavaScript

3. types.d.ts
\`\`\`typescript
${types}
\`\`\`
`;

    return systemPrompt;
  }

  static getUserPrompt(
    language: string,
    userRequest: string,
    pageUrl: string,
    pageHTML: string,
    inspectedNode: string,
    existingScript: string,
    historySummary: string
  ) {

    let userPrompt = `Key Reminders (Align with System Rules):
1. Return ONLY a valid JSON object in this structure: { script: string, answer: string }, no extra text, no exta styles, no Markdown, no code blocks outside the JSON. 
2. "script" must be PURE JavaScript (no TypeScript syntax like type annotations or interfaces) and strictly comply with the API types/interfaces defined in the system prompt's types.d.ts.
3. "answer" (10-300 tokens) must include: (a) A summary of the user request and current situation; (b) How the script solves the problem.

Based on the below informations, generate the full "script" according to the User Request to overwrite the existing script (even for 1-line changes). Ensure it is executable JavaScript code which compliant with the defined types (in the system prompt's types.d.ts), and exactly matches the user request.

---

User Request:
${userRequest}

`;

    if (historySummary && historySummary.trim().length > 0) {
      userPrompt += `
---

History Summary (Avoid Repeating Completed Steps in History):
${historySummary}

`;
    }

    if (existingScript && existingScript.trim().length > 0) {
      userPrompt += `
---

Existing Script (PURE JavaScript):
\`\`\`javascript
${existingScript}
\`\`\`

`;
    }
    else {
      userPrompt += `
---

Existing Script (PURE JavaScript): None (no existing script, generate full new script)
\`\`\`javascript
\`\`\`

`;
    }

    if (pageUrl) {
      userPrompt += `
---

Current Page Url:
${pageUrl}

`;
    }

    if (pageHTML) {
      userPrompt += `
---

Current Page HTML Content:
\`\`\`html
${pageHTML}
\`\`\`

`;
    }

    if (inspectedNode) {
      userPrompt += `
---

The User selected Node information on the current Page:
\`\`\`json
${inspectedNode}
\`\`\`

`;
    }

    return userPrompt;
  }

  static parse2AIMessageContent(content: string): AIMessageContent | null {
    try {
      const parsedContent = JSON.parse(content);

      if (AIUtils.isAIMessageContent(parsedContent)) {
        return parsedContent;
      }
      return null;
    } catch (error) {
      console.error('parse2AIMessageContent', error, content);
      return null;
    }
  }

  static isAIMessageContent(msgContent: any): msgContent is AIMessageContent {
    if (msgContent === null || typeof msgContent !== 'object') {
      return false;
    }

    const checks = [
      typeof msgContent.script === 'string',
      typeof msgContent.answer === 'string',
    ];

    if (checks.some(check => !check)) {
      return false;
    }
    return true;
  }

  static async getLanguage() {
    const uiLanguage = chrome.i18n.getUILanguage();
    // console.log(`browser ui language: ${uiLanguage}`);
    // const acceptLanguages = await chrome.i18n.getAcceptLanguages();
    // console.log(`browser accept languages: ${acceptLanguages.join(", ")}`);
    return uiLanguage || 'en';
  }

  static async getAISettings() {
    const settings = { ...SettingUtils.getSettings().aiSettings };
    if (AIUtils.IsUsingDemoAI()) {
      settings.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
      settings.apiKey = 'sk-62ddda06266c45f18ae7aa3c69ee8e24';
      const models = [
        'qwen3-coder-30b-a3b-instruct',
        'qwen3-coder-480b-a35b-instruct',
        'qwen-coder-plus',
        //'qwen-coder-plus-latest',
        'qwen-coder-turbo',
        //'qwen-coder-turbo-latest',
        //'qwen3-coder-flash',
        //'qwen3-coder-plus',
        //'qwen3-max',
        //'qwen-flash'
      ];
      settings.models = models.join(';');
    }
    else if (settings.apiKey) {
      settings.apiKey = await CryptoUtil.decrypt(settings.apiKey);
    }
    return settings;
  }

  static IsUsingDemoAI() {
    const settings = SettingUtils.getSettings();
    if (!settings.aiSettings.apiKey && !settings.aiSettings.baseURL && !settings.aiSettings.models) {
      return true;
    }
    else {
      return false;
    }
  }

  static async getTotalTokens() {
    try {
      const result = await chrome.storage.local.get(['total_tokens']);
      if ('total_tokens' in result && !Utils.isNullOrUndefined(result.total_tokens)) {
        if (typeof result.total_tokens === 'number') {
          return result.total_tokens as number;
        }
        else {
          const total_tokens = parseInt(result.total_tokens);
          return total_tokens;
        }
      }
      return 0;
    } catch {
      return 0;
    }
  }

  static async setTotalTokens(total_tokens: number) {
    await chrome.storage.local.set({
      total_tokens: total_tokens
    });
  }
}