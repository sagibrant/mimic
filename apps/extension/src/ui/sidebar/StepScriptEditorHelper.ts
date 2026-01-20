/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file StepScriptEditorHelper.ts
 * @description 
 * The help utilities for step script editor
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

import { Utils } from "@mimic-sdk/core";


export interface MethodDefinition {
  name: string;
  params: string[];
  returnType: string;
}
export interface PropertyDefinition {
  name: string;
  type: string;
  optional: boolean;
}
export interface TypeDefinition {
  methods?: MethodDefinition[];
  properties?: PropertyDefinition[];
  extends?: string[];
}

export class StepScriptEditorHelper {

  static TypeDefinitions: { [key: string]: TypeDefinition } = {
    // basic types - properties only
    LocatorFilterOption: {
      properties: [
        { name: "name", type: "string", optional: false },
        { name: "value", type: "string | number | boolean | RegExp", optional: true },
        { name: "type", type: "'property' | 'attribute' | 'function' | 'text'", optional: true },
        { name: "match", type: "'has' | 'hasNot' | 'exact' | 'includes' | 'startsWith' | 'endsWith' | 'regex'", optional: true }
      ]
    },

    BrowserLocatorOptions: {
      properties: [
        { name: "name", type: "string", optional: true },
        { name: "version", type: "string", optional: true },
        { name: "processId", type: "number", optional: true }
      ]
    },

    WindowLocatorOptions: {
      properties: [
        { name: "lastFocused", type: "boolean", optional: true }
      ]
    },

    PageLocatorOptions: {
      properties: [
        { name: "url", type: "string | RegExp", optional: true },
        { name: "title", type: "string | RegExp", optional: true },
        { name: "active", type: "boolean", optional: true },
        { name: "lastFocusedWindow", type: "boolean", optional: true },
        { name: "index", type: "number", optional: true }
      ]
    },

    FrameLocatorOptions: {
      properties: [
        { name: "url", type: "string | RegExp", optional: true },
        { name: "selector", type: "string", optional: true }
      ]
    },

    ElementLocatorOptions: {
      properties: [
        { name: "selector", type: "string", optional: true },
        { name: "xpath", type: "string", optional: true }
      ]
    },

    TextLocatorOptions: {
      properties: [
        { name: "text", type: "string | RegExp", optional: true }
      ]
    },

    Point: {
      properties: [
        { name: "x", type: "number", optional: false },
        { name: "y", type: "number", optional: false }
      ]
    },

    RectInfo: {
      properties: [
        { name: "left", type: "number", optional: false },
        { name: "top", type: "number", optional: false },
        { name: "right", type: "number", optional: false },
        { name: "bottom", type: "number", optional: false },
        { name: "width", type: "number", optional: false },
        { name: "height", type: "number", optional: false },
        { name: "x", type: "number", optional: false },
        { name: "y", type: "number", optional: false }
      ]
    },

    ActionOptions: {
      properties: [
        { name: "mode", type: "'event' | 'cdp'", optional: true },
        { name: "force", type: "boolean", optional: true }
      ]
    },

    ClickOptions: {
      properties: [
        { name: "button", type: "'left' | 'right' | 'middle'", optional: true },
        { name: "clickCount", type: "number", optional: true },
        { name: "position", type: "Point", optional: true },
        { name: "modifiers", type: "Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>", optional: true },
        { name: "delayBetweenDownUp", type: "number", optional: true },
        { name: "delayBetweenClick", type: "number", optional: true }
      ]
    },

    TextInputOptions: {
      properties: [
        { name: "delayBetweenDownUp", type: "number", optional: true },
        { name: "delayBetweenChar", type: "number", optional: true }
      ]
    },

    Cookie: {
      properties: [
        { name: "name", type: "string", optional: false },
        { name: "value", type: "string", optional: false },
        { name: "domain", type: "string", optional: true },
        { name: "path", type: "string", optional: true },
        { name: "expires", type: "number", optional: true },
        { name: "httpOnly", type: "boolean", optional: true },
        { name: "secure", type: "boolean", optional: true },
        { name: "session", type: "boolean", optional: true },
        { name: "sameSite", type: "'Strict' | 'Lax' | 'None'", optional: true },
        { name: "partitionKey", type: "string", optional: true },
      ]
    },

    // core types - with methods
    Expect: {
      properties: [
        { name: "not", type: "Expect", optional: false }
      ],
      methods: [
        { name: "toBe", params: ["expected: unknown"], returnType: "void" },
        { name: "toEqual", params: ["expected: unknown"], returnType: "void" },
        { name: "toBeTruthy", params: [], returnType: "void" },
        { name: "toBeFalsy", params: [], returnType: "void" },
        { name: "toBeNaN", params: [], returnType: "void" },
        { name: "toBeNull", params: [], returnType: "void" },
        { name: "toBeUndefined", params: [], returnType: "void" },
        { name: "toBeDefined", params: [], returnType: "void" },
        { name: "toBeNullOrUndefined", params: [], returnType: "void" },
        { name: "toHaveLength", params: ["expected: number"], returnType: "void" },
        { name: "toContain", params: ["expected: unknown"], returnType: "void" },
        { name: "toMatch", params: ["expected: RegExp | string"], returnType: "void" },
        { name: "toThrow", params: ["expectedErrorMsg?: string"], returnType: "void" }
      ]
    },

    Locator: {
      methods: [
        { name: "filter", params: ["options?: LocatorFilterOption | LocatorFilterOption[]"], returnType: "Locator<T>" },
        { name: "prefer", params: ["options?: LocatorFilterOption | LocatorFilterOption[]"], returnType: "Locator<T>" },
        { name: "get", params: [], returnType: "Promise<T>" },
        { name: "count", params: [], returnType: "Promise<number>" },
        { name: "all", params: [], returnType: "Promise<Locator<T>[]>" },
        { name: "nth", params: ["index: number"], returnType: "Locator<T>" },
        { name: "first", params: [], returnType: "Locator<T>" },
        { name: "last", params: [], returnType: "Locator<T>" }
      ]
    },

    BrowserLocator: {
      extends: ["Locator<Browser>", "Browser"],
      methods: []
    },

    BrowserLocatorMethods: {
      methods: [
        { name: "window", params: ["selector?: WindowLocatorOptions"], returnType: "WindowLocator" },
        { name: "page", params: ["selector?: PageLocatorOptions"], returnType: "PageLocator" }
      ]
    },

    BrowserProperties: {
      methods: [
        { name: "name", params: [], returnType: "string" },
        { name: "version", params: [], returnType: "string" },
        { name: "majorVersion", params: [], returnType: "number" }
      ]
    },

    BrowserMethods: {
      methods: [
        { name: "attachDebugger", params: [], returnType: "Promise<void>" },
        { name: "detachDebugger", params: [], returnType: "Promise<void>" },
        { name: "setDefaultTimeout", params: ["timeout: number"], returnType: "Promise<void>" },
        { name: "cookies", params: ["urls?: string | string[]"], returnType: "Promise<Cookie[]>" },
        { name: "addCookies", params: ["cookies: (Cookie & { url?: string }) | (Cookie & { url?: string })[]"], returnType: "Promise<void>" },
        { name: "clearCookies", params: ["options?: { name?: string | RegExp, domain?: string | RegExp, path?: string | RegExp }"], returnType: "Promise<void>" },
        { name: "openNewWindow", params: ["url?: string"], returnType: "Promise<Window>" },
        { name: "openNewPage", params: ["url?: string"], returnType: "Promise<Page>" },
        { name: "close", params: [], returnType: "Promise<void>" }
      ]
    },

    BrowserEvents: {
      methods: [
        { name: "on", params: ["event: 'window'", "listener: (window: Window) => (unknown | Promise<unknown>)"], returnType: "Browser" },
        { name: "on", params: ["event: 'page'", "listener: (page: Page) => (unknown | Promise<unknown>)"], returnType: "Browser" }
      ]
    },

    Browser: {
      extends: ["BrowserProperties", "BrowserMethods", "BrowserLocatorMethods", "BrowserEvents"],
      methods: [
        { name: "windows", params: [], returnType: "Promise<Window[]>" },
        { name: "pages", params: [], returnType: "Promise<Page[]>" },
        { name: "lastFocusedWindow", params: [], returnType: "Promise<Window>" },
        { name: "lastActivePage", params: [], returnType: "Promise<Page>" }
      ]
    },

    WindowLocator: {
      extends: ["Locator<Window>", "Window"],
      methods: []
    },

    WindowLocatorMethods: {
      methods: [
        { name: "page", params: ["selector?: PageLocatorOptions"], returnType: "PageLocator" }
      ]
    },

    WindowProperties: {
      methods: [
        { name: "state", params: [], returnType: "Promise<'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen'>" },
        { name: "focused", params: [], returnType: "Promise<boolean>" },
        { name: "incognito", params: [], returnType: "Promise<boolean>" },
        { name: "closed", params: [], returnType: "Promise<boolean>" }
      ]
    },

    WindowMethods: {
      methods: [
        { name: "openNewPage", params: ["url?: string"], returnType: "Promise<Page>" },
        { name: "focus", params: [], returnType: "Promise<void>" },
        { name: "close", params: [], returnType: "Promise<void>" },
        { name: "minimize", params: [], returnType: "Promise<void>" },
        { name: "maximize", params: [], returnType: "Promise<void>" },
        { name: "restore", params: [], returnType: "Promise<void>" },
        { name: "fullscreen", params: ["toggle?: boolean"], returnType: "Promise<void>" }
      ]
    },

    WindowEvents: {
      methods: [
        { name: "on", params: ["event: 'page'", "listener: (page: Page) => (unknown | Promise<unknown>)"], returnType: "Window" },
        { name: "on", params: ["event: 'close'", "listener: (window: Window) => (unknown | Promise<unknown>)"], returnType: "Window" }
      ]
    },

    Window: {
      extends: ["WindowProperties", "WindowMethods", "WindowLocatorMethods", "WindowEvents"],
      methods: [
        { name: "browser", params: [], returnType: "Promise<Browser>" },
        { name: "pages", params: [], returnType: "Promise<Page[]>" },
        { name: "activePage", params: [], returnType: "Promise<Page>" }
      ]
    },

    PageLocator: {
      extends: ["Locator<Page>", "Page"],
      methods: []
    },

    PageLocatorMethods: {
      methods: [
        { name: "frame", params: ["selector?: FrameLocatorOptions | string"], returnType: "FrameLocator" },
        { name: "element", params: ["selector?: ElementLocatorOptions | string"], returnType: "ElementLocator" },
        { name: "text", params: ["selector?: TextLocatorOptions | string"], returnType: "TextLocator" }
      ]
    },

    PageProperties: {
      methods: [
        { name: "url", params: [], returnType: "Promise<string>" },
        { name: "title", params: [], returnType: "Promise<string>" },
        { name: "content", params: [], returnType: "Promise<string>" },
        { name: "status", params: [], returnType: "Promise<'unloaded' | 'loading' | 'complete'>" },
        { name: "active", params: [], returnType: "Promise<boolean>" },
        { name: "closed", params: [], returnType: "Promise<boolean>" }
      ]
    },

    PageMethods: {
      methods: [
        { name: "activate", params: [], returnType: "Promise<void>" },
        { name: "bringToFront", params: [], returnType: "Promise<void>" },
        { name: "sync", params: ["timeout?: number"], returnType: "Promise<void>" },
        { name: "openNewPage", params: ["url?: string"], returnType: "Promise<Page>" },
        { name: "navigate", params: ["url?: string"], returnType: "Promise<void>" },
        { name: "refresh", params: ["bypassCache?: boolean"], returnType: "Promise<void>" },
        { name: "back", params: [], returnType: "Promise<void>" },
        { name: "forward", params: [], returnType: "Promise<void>" },
        { name: "close", params: [], returnType: "Promise<void>" },
        { name: "zoom", params: ["zoomFactor: number"], returnType: "Promise<void>" },
        { name: "moveToWindow", params: ["window: Window", "index?: number"], returnType: "Promise<void>" },
        { name: "captureScreenshot", params: [], returnType: "Promise<string>" },
        { name: "querySelectorAll", params: ["selector: string"], returnType: "Promise<Element[]>" },
        { name: "executeScript", params: ["func: (...args: Args) => Result", "args?: Args"], returnType: "Promise<Result>" }
      ]
    },

    PageEvents: {
      methods: [
        { name: "on", params: ["event: 'dialog'", "listener: (dialog: Dialog) => (unknown | Promise<unknown>)"], returnType: "Page" },
        { name: "on", params: ["event: 'domcontentloaded' | 'close'", "listener: (page: Page) => (unknown | Promise<unknown>)"], returnType: "Page" }
      ]
    },

    Page: {
      extends: ["PageProperties", "PageMethods", "PageLocatorMethods", "PageEvents"],
      methods: [
        { name: "window", params: [], returnType: "Promise<Window | null>" },
        { name: "mainFrame", params: [], returnType: "Promise<Frame | null>" },
        { name: "frames", params: [], returnType: "Promise<Frame[]>" },
        { name: "mouse", params: [], returnType: "Mouse" },
        { name: "keyboard", params: [], returnType: "Keyboard" },
        { name: "dialog", params: [], returnType: "Dialog" }
      ]
    },

    FrameLocator: {
      extends: ["Locator<Frame>", "Frame"],
      methods: []
    },

    FrameLocatorMethods: {
      methods: [
        { name: "element", params: ["selector?: ElementLocatorOptions | string"], returnType: "ElementLocator" },
        { name: "text", params: ["selector?: TextLocatorOptions | string"], returnType: "TextLocator" }
      ]
    },

    FrameProperties: {
      methods: [
        { name: "url", params: [], returnType: "Promise<string>" },
        { name: "status", params: [], returnType: "Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'>" },
        { name: "readyState", params: [], returnType: "Promise<'loading' | 'interactive' | 'complete'>" },
        { name: "content", params: [], returnType: "Promise<string>" }
      ]
    },

    FrameMethods: {
      methods: [
        { name: "sync", params: ["timeout?: number"], returnType: "Promise<void>" },
        { name: "querySelectorAll", params: ["selector: string"], returnType: "Promise<Element[]>" },
        { name: "executeScript", params: ["func: (...args: Args) => Result", "args?: Args"], returnType: "Promise<Result>" }
      ]
    },

    Frame: {
      extends: ["FrameProperties", "FrameMethods", "FrameLocatorMethods"],
      methods: [
        { name: "page", params: [], returnType: "Promise<Page>" },
        { name: "parentFrame", params: [], returnType: "Promise<Frame | null>" },
        { name: "childFrames", params: [], returnType: "Promise<Frame[]>" },
        { name: "ownerElement", params: [], returnType: "Promise<Element | null>" }
      ]
    },

    NodeProperties: {
      methods: [
        { name: "nodeName", params: [], returnType: "Promise<string>" },
        { name: "nodeType", params: [], returnType: "Promise<number>" },
        { name: "nodeValue", params: [], returnType: "Promise<string>" },
        { name: "isConnected", params: [], returnType: "Promise<boolean>" },
        { name: "textContent", params: [], returnType: "Promise<string>" },
        { name: "boundingBox", params: [], returnType: "Promise<RectInfo | null>" }
      ]
    },

    NodeMethods: {
      methods: [
        { name: "highlight", params: [], returnType: "Promise<void>" },
        { name: "getProperty", params: ["name: string"], returnType: "Promise<unknown>" },
        { name: "setProperty", params: ["name: string", "value: unknown"], returnType: "Promise<void>" },
        { name: "getBoundingClientRect", params: [], returnType: "Promise<RectInfo>" },
        { name: "dispatchEvent", params: ["type: string", "options?: object"], returnType: "Promise<void>" },
        { name: "sendCDPCommand", params: ["method: string", "commandParams?: { [key: string]: unknown }"], returnType: "Promise<void>" }
      ]
    },

    ElementLocator: {
      extends: ["Locator<Element>", "Element"],
      methods: []
    },

    ElementLocatorMethods: {
      methods: [
        { name: "element", params: ["selector?: ElementLocatorOptions | string"], returnType: "ElementLocator" },
        { name: "text", params: ["selector?: TextLocatorOptions | string"], returnType: "TextLocator" }
      ]
    },

    ElementProperties: {
      extends: ["NodeProperties"],
      methods: [
        { name: "tagName", params: [], returnType: "Promise<string>" },
        { name: "id", params: [], returnType: "Promise<string>" },
        { name: "innerHTML", params: [], returnType: "Promise<string>" },
        { name: "outerHTML", params: [], returnType: "Promise<string>" },
        { name: "innerText", params: [], returnType: "Promise<string>" },
        { name: "outerText", params: [], returnType: "Promise<string>" },
        { name: "title", params: [], returnType: "Promise<string>" },
        { name: "accessKey", params: [], returnType: "Promise<string>" },
        { name: "hidden", params: [], returnType: "Promise<boolean>" },
        { name: "name", params: [], returnType: "Promise<string>" },
        { name: "value", params: [], returnType: "Promise<string>" },
        { name: "type", params: [], returnType: "Promise<string>" },
        { name: "alt", params: [], returnType: "Promise<string>" },
        { name: "accept", params: [], returnType: "Promise<string>" },
        { name: "placeholder", params: [], returnType: "Promise<string>" },
        { name: "src", params: [], returnType: "Promise<string>" },
        { name: "disabled", params: [], returnType: "Promise<boolean>" },
        { name: "readOnly", params: [], returnType: "Promise<boolean>" },
        { name: "required", params: [], returnType: "Promise<boolean>" },
        { name: "checked", params: [], returnType: "Promise<boolean>" },
        { name: "label", params: [], returnType: "Promise<string>" },
        { name: "selected", params: [], returnType: "Promise<boolean>" },
        { name: "multiple", params: [], returnType: "Promise<boolean>" },
        { name: "options", params: [], returnType: "Promise<Element[]>" },
        { name: "selectedIndex", params: [], returnType: "Promise<number>" },
        { name: "selectedOptions", params: [], returnType: "Promise<Element[]>" },
        { name: "visible", params: [], returnType: "Promise<boolean>" }
      ]
    },

    ElementMethods: {
      extends: ["NodeMethods"],
      methods: [
        { name: "getAttribute", params: ["name: string"], returnType: "Promise<string | null>" },
        { name: "getAttributes", params: [], returnType: "Promise<Record<string, unknown>>" },
        { name: "setAttribute", params: ["name: string", "value: string"], returnType: "Promise<void>" },
        { name: "hasAttribute", params: ["name: string"], returnType: "Promise<boolean>" },
        { name: "toggleAttribute", params: ["name: string", "force?: boolean"], returnType: "Promise<boolean>" },
        { name: "querySelectorAll", params: ["selector: string"], returnType: "Promise<Element[]>" },
        { name: "checkValidity", params: [], returnType: "Promise<boolean>" },
        { name: "checkVisibility", params: ["options?: object"], returnType: "Promise<boolean>" },
        { name: "focus", params: [], returnType: "Promise<void>" },
        { name: "blur", params: [], returnType: "Promise<void>" },
        { name: "scrollIntoViewIfNeeded", params: [], returnType: "Promise<void>" },
        { name: "check", params: ["options?: ActionOptions"], returnType: "Promise<void>" },
        { name: "uncheck", params: ["options?: ActionOptions"], returnType: "Promise<void>" },
        { name: "selectOption", params: ["values: string | string[] | number | number[] | Element | Element[]"], returnType: "Promise<void>" },
        { name: "setFileInputFiles", params: ["files: string | string[]"], returnType: "Promise<void>" }
      ]
    },

    MouseActions: {
      methods: [
        { name: "hover", params: ["options?: { position?: Point } & ActionOptions"], returnType: "Promise<void>" },
        { name: "click", params: ["options?: ClickOptions & ActionOptions"], returnType: "Promise<void>" },
        { name: "dblclick", params: ["options?: Omit<ClickOptions, 'clickCount'> & ActionOptions"], returnType: "Promise<void>" },
        { name: "wheel", params: ["options?: { deltaX?: number, deltaY?: number } & ActionOptions"], returnType: "Promise<void>" },
        { name: "dragTo", params: ["target: Element | Text", "options?: { sourcePosition?: Point, targetPosition?: Point, steps?: number } & ActionOptions"], returnType: "Promise<void>" }
      ]
    },

    TouchActions: {
      methods: [
        { name: "tap", params: ["options?: { position?: Point } & ActionOptions"], returnType: "Promise<void>" }
      ]
    },

    KeyboardActions: {
      methods: [
        { name: "fill", params: ["text: string", "options?: TextInputOptions & ActionOptions"], returnType: "Promise<void>" },
        { name: "clear", params: ["options?: ActionOptions"], returnType: "Promise<void>" },
        { name: "press", params: ["keys: string | string[]", "options?: { delayBetweenDownUp?: number } & ActionOptions"], returnType: "Promise<void>" }
      ]
    },

    Element: {
      extends: ["ElementProperties", "ElementMethods", "ElementLocatorMethods", "MouseActions", "KeyboardActions", "TouchActions"],
      methods: [
        { name: "ownerFrame", params: [], returnType: "Promise<Frame>" },
        { name: "contentFrame", params: [], returnType: "Promise<Frame | null>" }
      ]
    },

    TextLocator: {
      extends: ["Locator<Text>", "Text"],
      methods: []
    },

    Text: {
      extends: ["NodeProperties", "NodeMethods", "MouseActions", "TouchActions"],
      methods: [
        { name: "ownerFrame", params: [], returnType: "Promise<Frame>" },
        { name: "ownerElement", params: [], returnType: "Promise<Element | null>" }
      ]
    },

    Mouse: {
      methods: [
        { name: "click", params: ["x: number", "y: number", "options?: Omit<ClickOptions, 'position'>"], returnType: "Promise<void>" },
        { name: "down", params: ["options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number; }"], returnType: "Promise<void>" },
        { name: "up", params: ["options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number; }"], returnType: "Promise<void>" },
        { name: "move", params: ["x: number", "y: number", "options?: { steps?: number }"], returnType: "Promise<void>" },
        { name: "wheel", params: ["deltaX: number", "deltaY: number"], returnType: "Promise<void>" }
      ]
    },

    Keyboard: {
      methods: [
        { name: "type", params: ["text: string", "options?: TextInputOptions"], returnType: "Promise<void>" },
        { name: "down", params: ["key: string"], returnType: "Promise<void>" },
        { name: "up", params: ["key: string"], returnType: "Promise<void>" },
        { name: "press", params: ["keys: string | string[]", "options?: { delayBetweenDownUp?: number }"], returnType: "Promise<void>" }
      ]
    },

    Dialog: {
      methods: [
        { name: "page", params: [], returnType: "Promise<Page>" },
        { name: "opened", params: [], returnType: "Promise<boolean>" },
        { name: "type", params: [], returnType: "Promise<'alert' | 'confirm' | 'prompt' | 'beforeunload'>" },
        { name: "defaultValue", params: [], returnType: "Promise<string>" },
        { name: "message", params: [], returnType: "Promise<string>" },
        { name: "accept", params: ["promptText?: string"], returnType: "Promise<void>" },
        { name: "dismiss", params: [], returnType: "Promise<void>" }
      ]
    },

    AIClient: {
      methods: [
        { name: "init", params: ["options?: any"], returnType: "AIClient" },
        { name: "setModel", params: ["model: string"], returnType: "AIClient" },
        { name: "setSystemPrompt", params: ["prompt: string"], returnType: "AIClient" },
        { name: "chat", params: ["message: string"], returnType: "Promise<string | null>" }
      ]
    },

    // global variables and methods
    Console: {
      methods: [
        { name: "log", params: ["...args: unknown[]"], returnType: "void" },
        { name: "error", params: ["...args: unknown[]"], returnType: "void" },
        { name: "warn", params: ["...args: unknown[]"], returnType: "void" },
        { name: "info", params: ["...args: unknown[]"], returnType: "void" },
        { name: "debug", params: ["...args: unknown[]"], returnType: "void" },
        { name: "dir", params: ["item: unknown, options?: object"], returnType: "void" },
        { name: "table", params: ["data: unknown, columns?: string[]"], returnType: "void" },
        { name: "clear", params: [], returnType: "void" },
        { name: "assert", params: ["condition: boolean, ...args: unknown[]"], returnType: "void" },
        { name: "time", params: ["label?: string"], returnType: "void" },
        { name: "timeEnd", params: ["label?: string"], returnType: "void" }
      ]
    }

  };

  static getTypeMethods(typeName: string): Array<MethodDefinition> {
    if (!StepScriptEditorHelper.TypeDefinitions[typeName]) return [];

    const type = Utils.deepClone(StepScriptEditorHelper.TypeDefinitions[typeName]);
    let methods = [...(type.methods || [])];

    if (type.extends) {
      for (const baseType of type.extends) {
        const baseTypeName = baseType.split('<')[0];
        const runtimeType = (baseType.includes('<') && baseType.includes('>')) ? baseType.split('<')[1].split('>')[0] : undefined;
        const extendedMethods = Utils.deepClone(StepScriptEditorHelper.getTypeMethods(baseTypeName));
        if (runtimeType) {
          for (const extendedMethod of extendedMethods) {
            if (extendedMethod.returnType.includes('<T>')) {
              extendedMethod.returnType = extendedMethod.returnType.replace('<T>', `<${runtimeType}>`);
            }
          }
        }
        methods = [...methods, ...extendedMethods];
      }
    }

    return methods;
  }

  static getTypeProperties(typeName: string): Array<PropertyDefinition> {
    if (!StepScriptEditorHelper.TypeDefinitions[typeName]) return [];

    const type = Utils.deepClone(StepScriptEditorHelper.TypeDefinitions[typeName]);
    let properties = [...(type.properties || [])];

    if (type.extends) {
      for (const baseType of type.extends) {
        const baseTypeName = baseType.split('<')[0];
        const extendedProperties = Utils.deepClone(StepScriptEditorHelper.getTypeProperties(baseTypeName));
        properties = [...properties, ...extendedProperties];
      }
    }

    return properties;
  }

  static getGlobalVariableType(expr: string, variableTypes: Map<string, string>): string | null {
    if (variableTypes.has(expr)) {
      return variableTypes.get(expr) || null;
    }
    // expect('xxxx).
    const methodName = expr.replace(/\([^)]*\)/g, '').trim();
    if (methodName === 'expect') {
      return 'Expect';
    }
    return null;
  }

  static getExpressionType(expr: string, variableTypes: Map<string, string>): string | null {
    // expr format: page.a().b().c()
    const parts = StepScriptEditorHelper.splitExpression(expr);
    if (parts.length === 1) {
      // page. , browser. , console. , expect().
      const currentType = StepScriptEditorHelper.getGlobalVariableType(parts[0], variableTypes);
      if (currentType) return currentType;
    }
    else if (parts.length > 1) {
      // the parts[0] should be either console, page, browser, or expect(xxx)
      let currentType = StepScriptEditorHelper.getGlobalVariableType(parts[0], variableTypes);
      if (!currentType) return null;

      for (let i = 1; i < parts.length; i++) {
        // remove (,),params e.g. nth(0)、frame('#id')
        const currentExpr = parts[i];
        const bracketIndex = currentExpr.indexOf('(');
        const methodName = bracketIndex > 0 ? currentExpr.slice(0, bracketIndex) : currentExpr;
        const methods = StepScriptEditorHelper.getTypeMethods(currentType);
        const method = methods.find(m => m.name === methodName);

        let returnType: string;
        if (method) {
          returnType = method.returnType;
        }
        else {
          const properties = StepScriptEditorHelper.getTypeProperties(currentType);
          const property = properties.find(p => p.name === methodName);
          if (!property) return null;
          returnType = property.type;
        }

        // handle promise e.g. from Promise<Page> -> Page, from Promise<Locator<Page>> -> Locator<Page>
        if (returnType.startsWith('Promise<')) {
          returnType = returnType.replace(/^Promise<(.+)>$/, '$1');
        }
        // handle <> e.g. from Locator<Element> -> ElementLocator
        if (returnType.includes('<') && returnType.includes('>')) {
          const baseTypeName = returnType.split('<')[0];
          const runtimeTypeT = returnType.split('<')[1].split('>')[0];
          if (baseTypeName === 'Locator') {
            const objectLocatorType = `${runtimeTypeT}Locator`;
            if (StepScriptEditorHelper.TypeDefinitions[objectLocatorType]) {
              returnType = returnType.replace(`Locator<${runtimeTypeT}>`, objectLocatorType);
            }
          }
          else if (!['Record', 'Map', 'Set'].includes(baseTypeName)) {
            // unknown <T> types
            console.warn('Unexpected returnType:', returnType, currentExpr, expr);
          }
        }

        currentType = returnType;
        if (!StepScriptEditorHelper.TypeDefinitions[currentType]) {
          break;
        }
      }

      return currentType;
    }

    return null;
  }

  /**
   * Manually split an expression, ignoring dots inside parentheses and strings
   * @param expr the expression to split
   * @returns the array of split parts
   */
  static splitExpression(expr: string): string[] {
    const parts: string[] = [];
    let currentPart = '';
    let bracketDepth = 0; // Bracket nesting depth
    let inSingleQuote = false; // Whether inside a single-quoted string
    let inDoubleQuote = false; // Whether inside a double-quoted string
    let prevChar = ''; // Previous character, used for handling escapes

    for (const char of expr) {
      // Handle escape characters (only valid inside strings)
      if (char === '\\' && (inSingleQuote || inDoubleQuote)) {
        currentPart += char;
        prevChar = char;
        continue;
      }

      // Handle quotes
      if (char === "'" && !inDoubleQuote && prevChar !== '\\') {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && !inSingleQuote && prevChar !== '\\') {
        inDoubleQuote = !inDoubleQuote;
      }

      // Handle parentheses
      if (char === '(' && !inSingleQuote && !inDoubleQuote) {
        bracketDepth++;
      } else if (char === ')' && !inSingleQuote && !inDoubleQuote && bracketDepth > 0) {
        bracketDepth--;
      }

      // Split when encountering a dot that's not inside parentheses or strings
      if (char === '.' && bracketDepth === 0 && !inSingleQuote && !inDoubleQuote) {
        if (currentPart.trim()) {
          parts.push(currentPart);
        }
        currentPart = '';
      } else {
        currentPart += char;
      }

      prevChar = char;
    }

    // Add the last part
    if (currentPart.trim()) {
      parts.push(currentPart);
    }

    return parts;
  }
}
