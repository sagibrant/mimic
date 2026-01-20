# Mimic API Documentation

## Introduction

This page is the API documentation for Mimic, a lightweight web testing and automation tool. Mimic can be easily used by simply downloading the Chrome/Edge extension, without the need to install complex local software. It also integrates AI capabilities to help you easily complete web automation tasks.

## Global Variables and Methods

- `ai: AIClient`  
  Corresponds to the AIClient interface in types.d.ts, representing the AIClient object (use methods defined in types.d.ts).  
  Example: 
```javascript
const response = await ai.init().setModel('gpt-4o').chat('Hello, how to automate form submission?');
```

- `browser: Browser`  
  Corresponds to the Browser interface in types.d.ts, representing the current browser (use methods defined in types.d.ts).  
  Example: 
```javascript
await browser.page().first().bringToFront();
```

- `page: Page`  
  Corresponds to the Page interface in types.d.ts, representing the current page (use methods defined in types.d.ts).  
  Example: 
```javascript
await page.element("#submit-btn").nth(0).click();
```

- `expect(actual: unknown) => Expect`  
  Returns an Expect instance (defined in types.d.ts).  
  Example: 
```javascript
const url = await page.url(); await expect(url).toMatch(/example\.com/);
```

- `wait(timeout: number) => Promise<void>`  
  Returns a Promise for waiting for a specified duration (in milliseconds).  
  Example: 
```javascript
await wait(2000); // Wait for 2 seconds
```

## Interfaces

### Expect

- `toBe(expected: unknown): void`  
  Asserts that the actual value is strictly equal to the expected value.  
  Example: 
```javascript
await expect(2 + 2).toBe(4);
```

- `toEqual(expected: unknown): void`  
  Asserts that the actual value is deeply equal to the expected value.  
  Example: 
```javascript
await expect([1, 2]).toEqual([1, 2]);
```

- `toBeTruthy(): void`  
  Asserts that the actual value is truthy.  
  Example: 
```javascript
await expect(1).toBeTruthy();
```

- `toBeFalsy(): void`  
  Asserts that the actual value is falsy.  
  Example: 
```javascript
await expect(0).toBeFalsy();
```

- `toBeNaN(): void`  
  Asserts that the actual value is NaN.  
  Example: 
```javascript
await expect(Number('invalid')).toBeNaN();
```

- `toBeNull(): void`  
  Asserts that the actual value is null.  
  Example: 
```javascript
await expect(null).toBeNull();
```

- `toBeUndefined(): void`  
  Asserts that the actual value is undefined.  
  Example: 
```javascript
await expect(undefined).toBeUndefined();
```

- `toBeDefined(): void`  
  Asserts that the actual value is defined (not undefined).  
  Example: 
```javascript
await expect('hello').toBeDefined();
```

- `toBeNullOrUndefined(): void`  
  Asserts that the actual value is either null or undefined.  
  Example: 
```javascript
await expect(null).toBeNullOrUndefined();
```

- `toHaveLength(expected: number): void`  
  Asserts that the actual value has a length equal to the expected number.  
  Example: 
```javascript
await expect([1, 2, 3]).toHaveLength(3);
```

- `toContain(expected: unknown): void`  
  Asserts that the actual value contains the expected value (for arrays or strings).  
  Example: 
```javascript
await expect([1, 2, 3]).toContain(2);
```

- `toMatch(expected: RegExp | string): void`  
  Asserts that the actual string matches the expected regex or string.  
  Example: 
```javascript
await expect('hello world').toMatch(/world/);
```

- `toThrow(expectedErrorMsg?: string): void`  
  Asserts that the function throws an error (optionally with a specific message).  
  Example: 
```javascript
await expect(() => { throw new Error('oops'); }).toThrow('oops');
```

### Locator<T>

- `filter(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<T>`  
  Filters the locator results based on the provided options.  
  Example: 
```javascript
const enabledButtons = page.element('button').filter({ name: 'disabled', value: false, type: 'property' });
```

- `prefer(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<T>`  
  Prioritizes elements that match the provided options when multiple elements are found.  
  Example: 
```javascript
const mainLink = page.element('a').prefer({ name: 'href', value: /^https/, type: 'attribute' });
```

- `get(): Promise<T>`  
  Retrieves the first matching element.  
  Example: 
```javascript
const firstButton = await page.element('button').get();
```

- `count(): Promise<number>`  
  Returns the number of matching elements.  
  Example: 
```javascript
const buttonCount = await page.element('button').count();
```

- `all(): Promise<Locator<T>[]>`  
  Retrieves all matching elements as an array of locators.  
  Example: 
```javascript
const allLinks = await page.element('a').all();
```

- `nth(index: number): Locator<T>`  
  Selects the nth matching element (0-based index).  
  Example: 
```javascript
const secondInput = page.element('input').nth(1);
```

- `first(): Locator<T>`  
  Selects the first matching element.  
  Example: 
```javascript
const firstParagraph = page.element('p').first();
```

- `last(): Locator<T>`  
  Selects the last matching element.  
  Example: 
```javascript
const lastListItem = page.element('li').last();
```

### LocatorFilterOption

- `name: string`  
  The name of the property, attribute, or function to filter by.  
  Example: 
```javascript
{ name: 'class', value: 'active' }
```

- `value?: string | number | boolean | RegExp`  
  The value to match against the specified name.  
  Example: 
```javascript
{ name: 'text', value: /welcome/, type: 'text' }
```

- `type?: 'property' | 'attribute' | 'function' | 'text'`  
  The type of the value being filtered (property, attribute, etc.).  
  Example: 
```javascript
{ name: 'disabled', value: true, type: 'property' }
```

- `match?: 'has' | 'hasNot' | 'exact' | 'includes' | 'startsWith' | 'endsWith' | 'regex'`  
  The matching strategy to use.  
  Example: 
```javascript
{ name: 'href', value: 'example.com', match: 'includes' }
```

### BrowserLocatorOptions

- `name?: string`  
  The name of the browser (e.g., 'chrome', 'edge').  
  Example: 
```javascript
{ name: 'chrome' }
```

- `version?: string`  
  The version of the browser.  
  Example: 
```javascript
{ version: '120.0' }
```

- `processId?: number`  
  The process ID of the browser.  
  Example: 
```javascript
{ processId: 12345 }
```

### BrowserLocatorMethods

- `window(selector?: WindowLocatorOptions): WindowLocator`  
  Creates a locator for windows matching the selector.  
  Example: 
```javascript
const lastFocusedWindow = browser.window({ lastFocused: true });
```

- `page(selector?: PageLocatorOptions): PageLocator`  
  Creates a locator for pages matching the selector.  
  Example: 
```javascript
const examplePage = browser.page({ url: /example\.com/ });
```

### BrowserProperties

- `name(): string`  
  Returns the name of the browser.  
  Example: 
```javascript
const browserName = await browser.name(); // 'chrome'
```

- `version(): string`  
  Returns the full version string of the browser.  
  Example: 
```javascript
const browserVersion = await browser.version(); // '120.0.6099.109'
```

- `majorVersion(): number`  
  Returns the major version number of the browser.  
  Example: 
```javascript
const majorVersion = await browser.majorVersion(); // 120
```

### BrowserMethods

- `attachDebugger(): Promise<void>`  
  Attaches a debugger to the browser.  
  Example: 
```javascript
await browser.attachDebugger();
```

- `detachDebugger(): Promise<void>`  
  Detaches the debugger from the browser.  
  Example: 
```javascript
await browser.detachDebugger();
```

- `setDefaultTimeout(timeout: number): Promise<void>`  
  Sets the default timeout for browser operations (in milliseconds).  
  Example: 
```javascript
await browser.setDefaultTimeout(5000);
```

- `cookies(urls?: string | string[]): Promise<Cookie[]>`  
  Retrieves cookies for the specified URLs (all cookies if no URLs provided).  
  Example: 
```javascript
const allCookies = await browser.cookies();
```  
  Example: 
```javascript
const exampleCookies = await browser.cookies('https://example.com');
```

- `addCookies(cookies: (Cookie & { url?: string }) | (Cookie & { url?: string })[]): Promise<void>`  
  Adds one or more cookies to the browser. The `url` property specifies the target URL (required for cookies without explicit domain).  
  Example:  
  ```javascript
  await browser.addCookies({ name: 'theme', value: 'dark', url: 'https://example.com' });
  ```

- `clearCookies(options?: { name?: string | RegExp, domain?: string | RegExp, path?: string | RegExp }): Promise<void>`
  Clears cookies matching the specified filter options (all cookies if no options provided).
  Example: 
```javascript
await browser.clearCookies({ domain: /example\.com/ });
```
  Example: 
```javascript
await browser.clearCookies({ name: 'sessionId' });
```

- `openNewWindow(url?: string): Promise<Window>`  
  Opens a new browser window, optionally navigating to the specified URL.  
  Example: 
```javascript
const newWindow = await browser.openNewWindow('https://example.com');
```

- `openNewPage(url?: string): Promise<Page>`  
  Opens a new page in the browser, optionally navigating to the specified URL.  
  Example: 
```javascript
const newPage = await browser.openNewPage('https://google.com');
```

- `close(): Promise<void>`  
  Closes the browser.  
  Example: 
```javascript
await browser.close();
```

### BrowserEvents

- `on(event: 'window', listener: (window: Window) => any): this`  
  Registers a listener for when a new window is opened.  
  Example: 
```javascript
browser.on('window', (window) => console.log('New window opened'));
```

- `on(event: 'page', listener: (page: Page) => any): this`  
  Registers a listener for when a new page is opened.  
  Example: 
```javascript
browser.on('page', (page) => console.log('New page opened'));
```

### Browser

Inherits from `BrowserProperties`, `BrowserMethods`, `BrowserLocatorMethods`, and `BrowserEvents`.

- `windows(): Promise<Window[]>`  
  Returns all open windows in the browser.  
  Example: 
```javascript
const allWindows = await browser.windows();
```

- `pages(): Promise<Page[]>`  
  Returns all open pages in the browser.  
  Example: 
```javascript
const allPages = await browser.pages();
```

- `lastFocusedWindow(): Promise<Window>`  
  Returns the last focused window.  
  Example: 
```javascript
const lastWindow = await browser.lastFocusedWindow();
```

- `lastActivePage(): Promise<Page>`  
  Returns the last active page.  
  Example: 
```javascript
const lastPage = await browser.lastActivePage();
```

### BrowserLocator

Inherits from `Locator<Browser>` and `Browser`.

### WindowLocatorOptions

- `lastFocused?: boolean`  
  If true, targets the last focused window.  
  Example: 
```javascript
{ lastFocused: true }
```

### WindowLocatorMethods

- `page(selector?: PageLocatorOptions): PageLocator`  
  Creates a locator for pages within the window that match the selector.  
  Example: 
```javascript
const windowPages = window.locator.page({ active: true });
```

### WindowProperties

- `state(): Promise<'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen'>`  
  Returns the current state of the window.  
  Example: 
```javascript
const windowState = await window.state(); // 'maximized'
```

- `focused(): Promise<boolean>`  
  Returns true if the window is focused.  
  Example: 
```javascript
const isFocused = await window.focused();
```

- `incognito(): Promise<boolean>`  
  Returns true if the window is in incognito/private mode.  
  Example: 
```javascript
const isIncognito = await window.incognito();
```

- `closed(): Promise<boolean>`  
  Returns true if the window is closed.  
  Example: 
```javascript
const isClosed = await window.closed();
```

### WindowMethods

- `openNewPage(url?: string): Promise<Page>`  
  Opens a new page in the window, optionally navigating to the specified URL.  
  Example: 
```javascript
const page = await window.openNewPage('https://github.com');
```

- `focus(): Promise<void>`  
  Brings the window into focus.  
  Example: 
```javascript
await window.focus();
```

- `close(): Promise<void>`  
  Closes the window.  
  Example: 
```javascript
await window.close();
```

- `minimize(): Promise<void>`  
  Minimizes the window.  
  Example: 
```javascript
await window.minimize();
```

- `maximize(): Promise<void>`  
  Maximizes the window.  
  Example: 
```javascript
await window.maximize();
```

- `restore(): Promise<void>`  
  Restores the window to its normal state (from minimized/maximized).  
  Example: 
```javascript
await window.restore();
```

- `fullscreen(toggle: boolean): Promise<void>`  
  Toggles the window's fullscreen mode (true to use toggle mode).  
  Example: 
```javascript
await window.fullscreen(true);
```

### WindowEvents

- `on(event: 'page', listener: (page: Page) => any): this`  
  Registers a listener for when a new page is opened in the window.  
  Example: 
```javascript
window.on('page', (page) => console.log('New page in window'));
```

- `on(event: 'close', listener: (window: Window) => any): this`  
  Registers a listener for when the window is closed.  
  Example: 
```javascript
window.on('close', () => console.log('Window closed'));
```

### Window

Inherits from `WindowProperties`, `WindowMethods`, `WindowLocatorMethods`, and `WindowEvents`.

- `browser(): Promise<Browser>`  
  Returns the browser that owns the window.  
  Example: 
```javascript
const parentBrowser = await window.browser();
```

- `pages(): Promise<Page[]>`  
  Returns all pages in the window.  
  Example: 
```javascript
const windowPages = await window.pages();
```

- `activePage(): Promise<Page>`  
  Returns the currently active page in the window.  
  Example: 
```javascript
const activePage = await window.activePage();
```

### WindowLocator

Inherits from `Locator<Window>` and `Window`.

### PageLocatorOptions

- `url?: string | RegExp`  
  Filters pages by URL (exact string or regex match).  
  Example: 
```javascript
{ url: 'https://example.com' }
```

- `title?: string | RegExp`  
  Filters pages by title (exact string or regex match).  
  Example: 
```javascript
{ title: /Example Site/ }
```

- `active?: boolean`  
  If true, targets the active page.  
  Example: 
```javascript
{ active: true }
```

- `lastFocusedWindow?: boolean`  
  If true, targets pages in the last focused window.  
  Example: 
```javascript
{ lastFocusedWindow: true }
```

- `index?: number`  
  Targets the page at the specified index (0-based).  
  Example: 
```javascript
{ index: 0 }
```

### PageLocatorMethods

- `frame(selector?: FrameLocatorOptions | string): FrameLocator`  
  Creates a locator for frames matching the selector.  
  Example: 
```javascript
const mainFrame = page.locator.frame({ selector: '#main-frame' });
```

- `element(selector?: ElementLocatorOptions | string): ElementLocator`  
  Creates a locator for elements matching the selector (CSS selector if string).  
  Example: 
```javascript
const buttons = page.locator.element('button');
```

- `text(selector?: TextLocatorOptions | string | RegExp): TextLocator`  
  Creates a locator for text nodes matching the selector.  
  Example: 
```javascript
const headings = page.locator.text(/Welcome/);
```

### PageProperties

- `url(): Promise<string>`  
  Returns the current URL of the page.  
  Example: 
```javascript
const currentUrl = await page.url();
```

- `title(): Promise<string>`  
  Returns the title of the page.  
  Example: 
```javascript
const pageTitle = await page.title();
```

- `content(): Promise<string>`  
  Returns the full HTML content of the page.  
  Example: 
```javascript
const htmlContent = await page.content();
```

- `status(): Promise<'unloaded' | 'loading' | 'complete'>`  
  Returns the loading status of the page.  
  Example: 
```javascript
const loadStatus = await page.status(); // 'complete'
```

- `active(): Promise<boolean>`  
  Returns true if the page is active.  
  Example: 
```javascript
const isActive = await page.active();
```

- `closed(): Promise<boolean>`  
  Returns true if the page is closed.  
  Example: 
```javascript
const isClosed = await page.closed();
```

### PageMethods

- `activate(): Promise<void>`  
  Activates the page (brings it to the front).  
  Example: 
```javascript
await page.activate();
```

- `bringToFront(): Promise<void>`  
  Brings the page to the front.  
  Example: 
```javascript
await page.bringToFront();
```

- `sync(timeout: number): Promise<void>`  
  Waits for the page to finish loading, up to the specified timeout (ms).  
  Example: 
```javascript
await page.sync(5000);
```

- `openNewPage(url?: string): Promise<Page>`  
  Opens a new page in the same window, optionally navigating to the URL.  
  Example: 
```javascript
const newTab = await page.openNewPage('https://bing.com');
```

- `navigate(url?: string): Promise<void>`  
  Navigates the page to the specified URL.  
  Example: 
```javascript
await page.navigate('https://example.com');
```

- `refresh(bypassCache?: boolean): Promise<void>`  
  Refreshes the page, optionally bypassing the cache.  
  Example: 
```javascript
await page.refresh(true);
```

- `back(): Promise<void>`  
  Navigates the page back in history.  
  Example: 
```javascript
await page.back();
```

- `forward(): Promise<void>`  
  Navigates the page forward in history.  
  Example: 
```javascript
await page.forward();
```

- `close(): Promise<void>`  
  Closes the page.  
  Example: 
```javascript
await page.close();
```

- `zoom(zoomFactor: number): Promise<void>`  
  Sets the page's zoom factor (1.0 is 100%).  
  Example: 
```javascript
await page.zoom(1.5); // 150% zoom
```

- `moveToWindow(window: Window, index?: number): Promise<void>`  
  Moves the page to the specified window, at the optional index.  
  Example: 
```javascript
await page.moveToWindow(newWindow, 0);
```

- `captureScreenshot(): Promise<string>`  
  Captures a screenshot and returns it as a base64-encoded string.  
  Example: 
```javascript
const screenshot = await page.captureScreenshot();
```

- `querySelectorAll(selector: string): Promise<Element[]>`  
  Returns all elements matching the CSS selector.  
  Example: 
```javascript
const allDivs = await page.querySelectorAll('div');
```

- `executeScript<Args extends any[], Result>(func: (...args: Args) => Result, args: Args): Promise<Result>`  
  Executes a script in the page's context with the provided arguments.  
  Example: 
```javascript
const result = await page.executeScript((a, b) => a + b, [2, 3]); // 5
```

### PageEvents

- `on(event: 'dialog', listener: (dialog: Dialog) => any): this`  
  Registers a listener for dialogs (alerts, confirms, etc.) on the page.  
  Example: 
```javascript
page.on('dialog', (dialog) => dialog.accept());
```

- `on(event: 'domcontentloaded', listener: (page: Page) => any): this`  
  Registers a listener for when the page's DOM content is loaded.  
  Example: 
```javascript
page.on('domcontentloaded', () => console.log('DOM loaded'));
```

- `on(event: 'close', listener: (page: Page) => any): this`  
  Registers a listener for when the page is closed.  
  Example: 
```javascript
page.on('close', () => console.log('Page closed'));
```

### Page

Inherits from `PageProperties`, `PageMethods`, `PageLocatorMethods`, and `PageEvents`.

- `window(): Promise<Window | null>`  
  Returns the window that owns the page, or null if closed.  
  Example: 
```javascript
const pageWindow = await page.window();
```

- `mainFrame(): Promise<Frame | null>`  
  Returns the main frame of the page.  
  Example: 
```javascript
const mainFrame = await page.mainFrame();
```

- `frames(): Promise<Frame[]>`  
  Returns all frames in the page.  
  Example: 
```javascript
const allFrames = await page.frames();
```

- `mouse(): Mouse`  
  Returns the mouse controller for the page.  
  Example: 
```javascript
const mouse = page.mouse();
```

- `keyboard(): Keyboard`  
  Returns the keyboard controller for the page.  
  Example: 
```javascript
const keyboard = page.keyboard();
```

- `dialog(): Dialog`  
  Returns the most recent dialog on the page.  
  Example: 
```javascript
const currentDialog = page.dialog();
```

### PageLocator

Inherits from `Locator<Page>` and `Page`.

### FrameLocatorOptions

- `url?: string | RegExp`  
  Filters frames by URL (exact string or regex match).  
  Example: 
```javascript
{ url: /frame-content\.html/ }
```

- `selector?: string`  
  Filters frames by CSS selector of their owner element.  
  Example: 
```javascript
{ selector: 'iframe[name="ads"]' }
```

### FrameLocatorMethods

- `element(selector?: ElementLocatorOptions | string): ElementLocator`  
  Creates a locator for elements within the frame matching the selector.  
  Example: 
```javascript
const frameInputs = frame.locator.element('input');
```

- `text(selector?: TextLocatorOptions | string | RegExp): TextLocator`  
  Creates a locator for text nodes within the frame matching the selector.  
  Example: 
```javascript
const frameText = frame.locator.text('Submit');
```

### FrameProperties

- `url(): Promise<string>`  
  Returns the current URL of the frame.  
  Example: 
```javascript
const frameUrl = await frame.url();
```

- `status(): Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'>`  
  Returns the loading status of the frame.  
  Example: 
```javascript
const frameStatus = await frame.status(); // 'Completed'
```

- `readyState(): Promise<'loading' | 'interactive' | 'complete'>`  
  Returns the ready state of the frame's document.  
  Example: 
```javascript
const readyState = await frame.readyState(); // 'complete'
```

- `content(): Promise<string>`  
  Returns the full HTML content of the frame.  
  Example: 
```javascript
const frameHtml = await frame.content();
```

### FrameMethods

- `sync(timeout: number): Promise<void>`  
  Waits for the frame to finish loading, up to the specified timeout (ms).  
  Example: 
```javascript
await frame.sync(3000);
```

- `querySelectorAll(selector: string): Promise<Element[]>`  
  Returns all elements in the frame matching the CSS selector.  
  Example: 
```javascript
const frameLinks = await frame.querySelectorAll('a');
```

- `executeScript<Args extends any[], Result>(func: (...args: Args) => Result, args: Args): Promise<Result>`  
  Executes a script in the frame's context with the provided arguments.  
  Example: 
```javascript
const frameResult = await frame.executeScript(() => document.title, []);
```

### Frame

Inherits from `FrameProperties`, `FrameMethods`, and `FrameLocatorMethods`.

- `page(): Promise<Page>`  
  Returns the page that contains the frame.  
  Example: 
```javascript
const parentPage = await frame.page();
```

- `parentFrame(): Promise<Frame | null>`  
  Returns the parent frame, or null if this is a top-level frame.  
  Example: 
```javascript
const parentFrame = await frame.parentFrame();
```

- `childFrames(): Promise<Frame[]>`  
  Returns all child frames of this frame.  
  Example: 
```javascript
const childFrames = await frame.childFrames();
```

- `ownerElement(): Promise<Element | null>`  
  Returns the DOM element that owns the frame (e.g., `iframe`), or null.  
  Example: 
```javascript
const iframeElement = await frame.ownerElement();
```

### FrameLocator

Inherits from `Locator<Frame>` and `Frame`.

### NodeProperties

- `nodeName(): Promise<string>`  
  Returns the name of the node (e.g., 'DIV' for a div element).  
  Example: 
```javascript
const nodeName = await element.nodeName(); // 'INPUT'
```

- `nodeType(): Promise<number>`  
  Returns the type of the node (1 for element, 3 for text, etc.).  
  Example: 
```javascript
const nodeType = await textNode.nodeType(); // 3
```

- `nodeValue(): Promise<string>`  
  Returns the value of the node (e.g., text content for text nodes).  
  Example: 
```javascript
const nodeValue = await textNode.nodeValue(); // 'Hello'
```

- `isConnected(): Promise<boolean>`  
  Returns true if the node is connected to the DOM.  
  Example: 
```javascript
const isConnected = await element.isConnected();
```

- `textContent(): Promise<string>`  
  Returns the text content of the node and its descendants.  
  Example: 
```javascript
const text = await element.textContent();
```

- `boundingBox(): Promise<RectInfo | null>`  
  Returns the bounding box of the node (position and size), or null if not visible.  
  Example: 
```javascript
const box = await element.boundingBox(); // { x: 10, y: 20, width: 100, ... }
```

### NodeMethods

- `highlight(): Promise<void>`
  Highlights the node visually on the page (useful for debugging/automation validation).
  Example: 
```javascript
await buttonElement.highlight();
```

- `getProperty(name: string): Promise<any>`  
  Returns the value of the node's property (e.g., 'value' for input elements).  
  Example: 
```javascript
const inputValue = await inputElement.getProperty('value');
```

- `setProperty(name: string, value: any): Promise<void>`  
  Sets the value of the node's property.  
  Example: 
```javascript
await inputElement.setProperty('value', 'new text');
```

- `getBoundingClientRect(): Promise<RectInfo>`  
  Returns the bounding client rect of the node relative to the viewport.  
  Example: 
```javascript
const rect = await element.getBoundingClientRect();
```

- `dispatchEvent(type: string, options?: object): Promise<void>`  
  Dispatches an event of the specified type on the node.  
  Example: 
```javascript
await buttonElement.dispatchEvent('click');
```

- `sendCDPCommand(method: string, commandParams?: { [key: string]: unknown }): Promise<void>`  
  Sends a Chrome DevTools Protocol command to the node.  
  Example: 
```javascript
await element.sendCDPCommand('DOM.highlightElement');
```

### MouseActions

- `hover(options?: { position?: Point } & InputMode): Promise<void>`  
  Hovers the mouse over the element at the specified position (default: center).  
  Example: 
```javascript
await element.hover({ position: { x: 10, y: 10 } });
```

- `click(options?: ClickOptions & InputMode): Promise<void>`  
  Clicks the element with the specified options (button, click count, etc.).  
  Example: 
```javascript
await buttonElement.click({ button: 'right', clickCount: 1 });
```

- `dblclick(options?: Omit<ClickOptions, 'clickCount'> & InputMode): Promise<void>`  
  Double-clicks the element.  
  Example: 
```javascript
await linkElement.dblclick();
```

- `wheel(options?: { deltaX?: number, deltaY?: number } & InputMode): Promise<void>`  
  Scrolls the mouse wheel over the element with the specified delta.  
  Example: 
```javascript
await element.wheel({ deltaY: 100 }); // Scroll down
```

- `dragTo(target: Element | Text, options?: { sourcePosition?: Point, targetPosition?: Point, steps?: number } & InputMode): Promise<void>`  
  Drags the element to the target element with the specified options.  
  Example: 
```javascript
await dragElement.dragTo(dropTarget, { steps: 10 });
```

### TouchActions

- `tap(options?: { position?: Point } & InputMode): Promise<void>`  
  Simulates a touch tap on the element at the specified position.  
  Example: 
```javascript
await buttonElement.tap({ position: { x: 5, y: 5 } });
```

### KeyboardActions

- `fill(text: string, options?: TextInputOptions & InputMode): Promise<void>`  
  Fills the element with the specified text (e.g., input fields).  
  Example: 
```javascript
await inputElement.fill('hello@example.com');
```

- `clear(options?: InputMode): Promise<void>`  
  Clears the content of the element (e.g., input fields).  
  Example: 
```javascript
await inputElement.clear();
```

- `press(keys: string | string[], options?: { delayBetweenDownUp?: number } & InputMode): Promise<void>`  
  Presses the specified keys (single key or array of keys).  
  Example: 
```javascript
await inputElement.press(['Enter']);
```

### ElementLocatorOptions

- `selector?: string`  
  A CSS selector to match the element.  
  Example: 
```javascript
{ selector: '.login-button' }
```

- `xpath?: string`  
  An XPath expression to match the element.  
  Example: 
```javascript
{ xpath: '//input[@name="username"]' }
```

### ElementLocatorMethods

- `element(selector?: ElementLocatorOptions | string): ElementLocator`  
  Creates a locator for child elements matching the selector.  
  Example: 
```javascript
const listItems = listElement.locator.element('li');
```

- `text(selector?: TextLocatorOptions | string | RegExp): TextLocator`  
  Creates a locator for text nodes within the element matching the selector.  
  Example: 
```javascript
const itemTexts = listElement.locator.text(/Item \d+/);
```

### ElementProperties

Inherits from `NodeProperties`.

- `tagName(): Promise<string>`  
  Returns the tag name of the element (e.g., 'DIV', 'INPUT').  
  Example: 
```javascript
const tag = await element.tagName(); // 'BUTTON'
```

- `id(): Promise<string>`  
  Returns the value of the element's 'id' attribute.  
  Example: 
```javascript
const id = await element.id(); // 'submit-btn'
```

- `innerHTML(): Promise<string>`  
  Returns the HTML content of the element's descendants.  
  Example: 
```javascript
const innerHtml = await element.innerHTML();
```

- `outerHTML(): Promise<string>`  
  Returns the HTML content of the element, including the element itself.  
  Example: 
```javascript
const outerHtml = await element.outerHTML();
```

- `innerText(): Promise<string>`  
  Returns the rendered text content of the element.  
  Example: 
```javascript
const innerText = await element.innerText();
```

- `outerText(): Promise<string>`  
  Returns the rendered text content of the element, including its descendants.  
  Example: 
```javascript
const outerText = await element.outerText();
```

- `title(): Promise<string>`  
  Returns the value of the element's 'title' attribute.  
  Example: 
```javascript
const title = await element.title(); // 'Submit form'
```

- `accessKey(): Promise<string>`  
  Returns the value of the element's 'accesskey' attribute.  
  Example: 
```javascript
const accessKey = await element.accessKey(); // 's'
```

- `hidden(): Promise<boolean>`  
  Returns true if the element is hidden (via 'hidden' attribute).  
  Example: 
```javascript
const isHidden = await element.hidden();
```

- `name(): Promise<string>`  
  Returns the value of the element's 'name' attribute (for form elements).  
  Example: 
```javascript
const name = await inputElement.name(); // 'email'
```

- `value(): Promise<string>`  
  Returns the current value of the element (for form elements).  
  Example: 
```javascript
const value = await inputElement.value(); // 'user@example.com'
```

- `type(): Promise<string>`  
  Returns the type of the input element (e.g., 'text', 'checkbox').  
  Example: 
```javascript
const type = await inputElement.type(); // 'password'
```

- `alt(): Promise<string>`  
  Returns the value of the 'alt' attribute (for images).  
  Example: 
```javascript
const altText = await imageElement.alt(); // 'Logo'
```

- `accept(): Promise<string>`  
  Returns the value of the 'accept' attribute (for file inputs).  
  Example: 
```javascript
const accept = await fileInput.accept(); // 'image/*'
```

- `placeholder(): Promise<string>`  
  Returns the value of the 'placeholder' attribute.  
  Example: 
```javascript
const placeholder = await inputElement.placeholder(); // 'Enter email'
```

- `src(): Promise<string>`  
  Returns the value of the 'src' attribute (for images, scripts, etc.).  
  Example: 
```javascript
const src = await imageElement.src(); // 'logo.png'
```

- `disabled(): Promise<boolean>`  
  Returns true if the element is disabled.  
  Example: 
```javascript
const isDisabled = await buttonElement.disabled();
```

- `readOnly(): Promise<boolean>`  
  Returns true if the element is read-only.  
  Example: 
```javascript
const isReadOnly = await inputElement.readOnly();
```

- `required(): Promise<boolean>`  
  Returns true if the element is required (for form elements).  
  Example: 
```javascript
const isRequired = await inputElement.required();
```

- `checked(): Promise<boolean>`  
  Returns true if the element is checked (for checkboxes/radio buttons).  
  Example: 
```javascript
const isChecked = await checkboxElement.checked();
```

- `label(): Promise<string>`  
  Returns the text content of the associated label element.  
  Example: 
```javascript
const labelText = await inputElement.label(); // 'Username'
```

- `selected(): Promise<boolean>`  
  Returns true if the element is selected (for options in a select element).  
  Example: 
```javascript
const isSelected = await optionElement.selected();
```

- `multiple(): Promise<boolean>`  
  Returns true if the select element allows multiple selections.  
  Example: 
```javascript
const isMultiple = await selectElement.multiple();
```

- `options(): Promise<Element[]>`  
  Returns all option elements within a select element.  
  Example: 
```javascript
const options = await selectElement.options();
```

- `selectedIndex(): Promise<number>`  
  Returns the index of the selected option in a select element.  
  Example: 
```javascript
const index = await selectElement.selectedIndex(); // 2
```

- `selectedOptions(): Promise<Element[]>`  
  Returns the selected option elements in a select element.  
  Example: 
```javascript
const selected = await selectElement.selectedOptions();
```

- `visible(): Promise<boolean>`  
  Returns true if the element is visible on the page.  
  Example: 
```javascript
const isVisible = await element.visible();
```

### ElementMethods

Inherits from `NodeMethods`.

- `getAttribute(name: string): Promise<string | null>`  
  Returns the value of the specified attribute, or null if not present.  
  Example: 
```javascript
const className = await element.getAttribute('class');
```

- `getAttributes(): Promise<Record<string, unknown>>`  
  Returns all attributes of the element as a key-value object.  
  Example: 
```javascript
const attrs = await element.getAttributes(); // { id: 'btn', class: 'active' }
```

- `setAttribute(name: string, value: string): Promise<void>`  
  Sets the value of the specified attribute.  
  Example: 
```javascript
await element.setAttribute('disabled', 'true');
```

- `hasAttribute(name: string): Promise<boolean>`  
  Returns true if the element has the specified attribute.  
  Example: 
```javascript
const hasClass = await element.hasAttribute('class');
```

- `toggleAttribute(name: string, force?: boolean): Promise<boolean>`  
  Toggles the presence of the specified attribute (force to explicitly set).  
  Example: 
```javascript
await element.toggleAttribute('disabled');
```

- `querySelectorAll(selector: string): Promise<Element[]>`  
  Returns all child elements matching the CSS selector.  
  Example: 
```javascript
const childSpans = await element.querySelectorAll('span');
```

- `checkValidity(): Promise<boolean>`  
  Returns true if the element's value is valid (for form elements).  
  Example: 
```javascript
const isValid = await inputElement.checkValidity();
```

- `checkVisibility(options?: object): Promise<boolean>`  
  Checks if the element is visible, considering optional options.  
  Example: 
```javascript
const isVisible = await element.checkVisibility();
```

- `focus(): Promise<void>`  
  Sets focus on the element.  
  Example: 
```javascript
await inputElement.focus();
```

- `blur(): Promise<void>`  
  Removes focus from the element.  
  Example: 
```javascript
await inputElement.blur();
```

- `scrollIntoViewIfNeeded(): Promise<void>`  
  Scrolls the element into view if it is not already visible.  
  Example: 
```javascript
await buttonElement.scrollIntoViewIfNeeded();
```

- `check(options?: InputMode): Promise<void>`  
  Checks a checkbox or radio button.  
  Example: 
```javascript
await checkboxElement.check();
```

- `uncheck(options?: InputMode): Promise<void>`  
  Unchecks a checkbox.  
  Example: 
```javascript
await checkboxElement.uncheck();
```

- `selectOption(values: string | string[] | number | number[] | Element | Element[]): Promise<void>`  
  Selects options in a select element by value, index, or element.  
  Example: 
```javascript
await selectElement.selectOption(['option1', 'option2']);
```

### Element

Inherits from `ElementProperties`, `ElementMethods`, `ElementLocatorMethods`, `MouseActions`, `KeyboardActions`, and `TouchActions`.

- `ownerFrame(): Promise<Frame>`  
  Returns the frame that contains the element.  
  Example: 
```javascript
const frame = await element.ownerFrame();
```

- `contentFrame(): Promise<Frame | null>`  
  Returns the frame contained within the element (e.g., for `iframe`), or null.  
  Example: 
```javascript
const iframeFrame = await iframeElement.contentFrame();
```

### ElementLocator

Inherits from `Locator<Element>` and `Element`.

### TextLocatorOptions

- `text?: string | RegExp`  
  The text content to match (exact string or regex).  
  Example: 
```javascript
{ text: 'Sign In' }
```

### Text

Inherits from `NodeProperties`, `NodeMethods`, `MouseActions`, and `TouchActions`.

- `ownerFrame(): Promise<Frame>`  
  Returns the frame that contains the text node.  
  Example: 
```javascript
const frame = await textNode.ownerFrame();
```

- `ownerElement(): Promise<Element | null>`  
  Returns the element that contains the text node, or null.  
  Example: 
```javascript
const parentElement = await textNode.ownerElement();
```

### TextLocator

Inherits from `Locator<Text>` and `Text`.

### Mouse

- `click(x: number, y: number, options?: Omit<ClickOptions, 'position'>): Promise<void>`  
  Clicks at the specified (x, y) coordinates on the page.  
  Example: 
```javascript
await mouse.click(100, 200, { button: 'left' });
```

- `down(options?: { button?: "left" | "right" | "middle"; clickCount?: number; }): Promise<void>`  
  Presses down the specified mouse button.  
  Example: 
```javascript
await mouse.down({ button: 'left' });
```

- `up(options?: { button?: "left" | "right" | "middle"; clickCount?: number; }): Promise<void>`  
  Releases the specified mouse button.  
  Example: 
```javascript
await mouse.up({ button: 'left' });
```

- `move(x: number, y: number, options?: { steps?: number }): Promise<void>`  
  Moves the mouse to the specified (x, y) coordinates, with optional steps.  
  Example: 
```javascript
await mouse.move(300, 400, { steps: 10 });
```

- `wheel(deltaX: number, deltaY: number): Promise<void>`  
  Scrolls the mouse wheel by the specified delta values.  
  Example: 
```javascript
await mouse.wheel(0, 500); // Scroll down
```

### Keyboard

- `type(text: string, options?: TextInputOptions): Promise<void>`  
  Types the specified text into the focused element.  
  Example: 
```javascript
await keyboard.type('Hello World', { delayBetweenChar: 100 });
```

- `down(key: string): Promise<void>`  
  Presses down the specified key (e.g., 'Shift', 'A').  
  Example: 
```javascript
await keyboard.down('Shift');
```

- `up(key: string): Promise<void>`  
  Releases the specified key.  
  Example: 
```javascript
await keyboard.up('Shift');
```

- `press(keys: string | string[], options?: { delayBetweenDownUp?: number }): Promise<void>`  
  Presses and releases the specified key(s).  
  Example: 
```javascript
await keyboard.press(['Control', 'C']);
```

### InputMode

- `mode?: 'event' | 'cdp'`  
  The input mode: 'event' simulates user events, 'cdp' uses DevTools protocol.  
  Example: 
```javascript
{ mode: 'cdp' }
```

### ClickOptions

- `button?: "left" | "right" | "middle"`  
  The mouse button to use (default: 'left').  
  Example: 
```javascript
{ button: 'right' }
```

- `clickCount?: number`  
  The number of clicks (1 for single, 2 for double, etc.).  
  Example: 
```javascript
{ clickCount: 2 }
```

- `position?: Point`  
  The position within the element to click (x, y coordinates).  
  Example: 
```javascript
{ position: { x: 5, y: 5 } }
```

- `modifiers?: Array<"Alt" | "Control" | "ControlOrMeta" | "Meta" | "Shift">`  
  Modifier keys to hold during the click.  
  Example: 
```javascript
{ modifiers: ['Shift'] }
```

- `delayBetweenDownUp?: number`  
  Delay between pressing and releasing the button (ms).  
  Example: 
```javascript
{ delayBetweenDownUp: 100 }
```

- `delayBetweenClick?: number`  
  Delay between multiple clicks (ms).  
  Example: 
```javascript
{ delayBetweenClick: 200 }
```

### TextInputOptions

- `delayBetweenDownUp?: number`  
  Delay between pressing and releasing each key (ms).  
  Example: 
```javascript
{ delayBetweenDownUp: 50 }
```

- `delayBetweenChar?: number`  
  Delay between typing each character (ms).  
  Example: 
```javascript
{ delayBetweenChar: 100 }
```

### Dialog

- `page(): Promise<Page>`  
  Returns the page that triggered the dialog.  
  Example: 
```javascript
const dialogPage = await dialog.page();
```

- `opened(): Promise<boolean>`  
  Returns true if the dialog is currently open.  
  Example: 
```javascript
const isOpen = await dialog.opened();
```

- `type(): Promise<'alert' | 'confirm' | 'prompt' | 'beforeunload'>`  
  Returns the type of the dialog.  
  Example: 
```javascript
const dialogType = await dialog.type(); // 'alert'
```

- `defaultValue(): Promise<string>`  
  Returns the default value of the dialog (for prompts).  
  Example: 
```javascript
const defaultValue = await dialog.defaultValue(); // 'default'
```

- `message(): Promise<string>`  
  Returns the message displayed in the dialog.  
  Example: 
```javascript
const message = await dialog.message(); // 'Are you sure?'
```

- `accept(promptText?: string): Promise<void>`  
  Accepts the dialog, optionally with text for prompts.  
  Example: 
```javascript
await dialog.accept('user input');
```

- `dismiss(): Promise<void>`  
  Dismisses the dialog.  
  Example: 
```javascript
await dialog.dismiss();
```

### Point

- `x: number`  
  The x-coordinate.  
  Example: 
```javascript
{ x: 150, y: 300 }
```

- `y: number`  
  The y-coordinate.  
  Example: 
```javascript
{ x: 150, y: 300 }
```

### RectInfo

- `left: number`  
  The left position of the rectangle.  
  Example: 
```javascript
{ left: 10, top: 20, ... }
```

- `top: number`  
  The top position of the rectangle.  
  Example: 
```javascript
{ left: 10, top: 20, ... }
```

- `right: number`  
  The right position of the rectangle.  
  Example: 
```javascript
{ right: 210, bottom: 120, ... }
```

- `bottom: number`  
  The bottom position of the rectangle.  
  Example: 
```javascript
{ right: 210, bottom: 120, ... }
```

- `width: number`  
  The width of the rectangle.  
  Example: 
```javascript
{ width: 200, height: 100, ... }
```

- `height: number`  
  The height of the rectangle.  
  Example: 
```javascript
{ width: 200, height: 100, ... }
```

- `x: number`  
  The x-coordinate of the rectangle's origin.  
  Example: 
```javascript
{ x: 10, y: 20, ... }
```

- `y: number`  
  The y-coordinate of the rectangle's origin.  
  Example: 
```javascript
{ x: 10, y: 20, ... }
```

### Cookie

- `name: string`  
  The name of the cookie.  
  Example: 
```javascript
{ name: 'sessionId' }
```

- `value: string`  
  The value of the cookie.  
  Example: 
```javascript
{ value: 'abc123xyz' }
```

- `domain?: string`  
  The domain the cookie is associated with.  
  Example: 
```javascript
{ domain: 'example.com' }
```

- `path?: string`  
  The path the cookie applies to.  
  Example: 
```javascript
{ path: '/admin' }
```

- `expires?: number`  
  The expiration time of the cookie (Unix timestamp in seconds).  
  Example: 
```javascript
{ expires: 1717267200 }
```

- `httpOnly?: boolean`  
  Indicates if the cookie is HTTP-only (not accessible via JavaScript).  
  Example: 
```javascript
{ httpOnly: true }
```

- `secure?: boolean`  
  Indicates if the cookie is only sent over HTTPS.  
  Example: 
```javascript
{ secure: true }
```

- `session?: boolean`  
  Indicates if the cookie is a session cookie (expires when browser closes).  
  Example: 
```javascript
{ session: false }
```

- `sameSite?: 'Strict' | 'Lax' | 'None'`  
  The SameSite policy of the cookie.  
  Example: 
```javascript
{ sameSite: 'Lax' }
```

- `partitionKey?: string`  
  The partition key for the cookie (for partitioned storage).  
  Example: 
```javascript
{ partitionKey: 'partition1' }
```

### AIClient

- `init(options?: any): this`  
  Initializes the AI client with optional configuration.  
  Example: 
```javascript
ai.init({ baseURL: 'xxx', apiKey: 'xxx' });
```

- `setModel(model: string): this`  
  Sets the AI model to use.  
  Example: 
```javascript
ai.setModel('gpt-4');
```

- `setSystemPrompt(prompt: string): this`  
  Sets the system prompt for the AI.  
  Example: 
```javascript
ai.setSystemPrompt('You are a web automation assistant');
```

- `chat(message: string): Promise<string | null>`  
  Sends a message to the AI and returns the response.  
  Example: 
```javascript
const response = await ai.init({ baseURL: 'xxx', apiKey: 'xxx' }).setModel('gpt-4').setSystemPrompt('You are a web automation assistant').chat('How to click a button?');
```