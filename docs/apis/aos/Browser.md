# Browser

Browser automation object.

## name

`name(): string`

Returns the browser name.

### Usage

```js
const name = browser.name();
expect(['edge', 'chrome']).toContain(name);
```

### Arguments

- None

### Returns

- `string`

## version

`version(): string`

Returns the browser version.

### Usage

```js
const version = browser.version();
expect(version).toBeDefined();
```

### Arguments

- None

### Returns

- `string`

## majorVersion

`majorVersion(): number`

Returns the major browser version.

### Usage

```js
const major = browser.majorVersion();
expect(major > 0).toBeTruthy();
```

### Arguments

- None

### Returns

- `number`

## window

`window(selector?: WindowLocatorOptions): WindowLocator`

Creates a window locator.

### Usage

```js
const win = await browser.window({ lastFocused: true }).get();
await win.focus();
```

### Arguments

- `selector?` `<WindowLocatorOptions>`

### Returns

- `WindowLocator`

## page

`page(selector?: PageLocatorOptions): PageLocator`

Creates a page locator.

### Usage

```js
const page = await browser.page({ active: true, lastFocusedWindow: true }).get();
await page.bringToFront();
```

### Arguments

- `selector?` `<PageLocatorOptions>`

### Returns

- `PageLocator`

## windows

`windows(): Promise<Window[]>`

Returns all open windows.

### Usage

```js
const windows = await browser.windows();
expect(windows.length > 0).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<Window[]>`

## pages

`pages(): Promise<Page[]>`

Returns all open pages.

### Usage

```js
const pages = await browser.pages();
expect(pages.length > 0).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<Page[]>`

## lastFocusedWindow

`lastFocusedWindow(): Promise<Window>`

Returns the last focused window.

### Usage

```js
const win = await browser.lastFocusedWindow();
await win.focus();
```

### Arguments

- None

### Returns

- `Promise<Window>`

## lastActivePage

`lastActivePage(): Promise<Page>`

Returns the last active page.

### Usage

```js
const page = await browser.lastActivePage();
await page.bringToFront();
```

### Arguments

- None

### Returns

- `Promise<Page>`

## attachDebugger

`attachDebugger(): Promise<void>`

Attaches the DevTools debugger (required by some CDP-powered actions).

### Usage

```js
await browser.attachDebugger();
await page.element('#btn_click').click({ mode: 'cdp' });
```

### Arguments

- None

### Returns

- `Promise<void>`

## detachDebugger

`detachDebugger(): Promise<void>`

Detaches the DevTools debugger.

### Usage

```js
await browser.detachDebugger();
```

### Arguments

- None

### Returns

- `Promise<void>`

## setDefaultTimeout

`setDefaultTimeout(timeout: number): Promise<void>`

Sets the default timeout (ms) used by locator resolution and actions.

### Usage

```js
await browser.setDefaultTimeout(5000);
```

### Arguments

- `timeout` `<number>`: timeout in milliseconds.

### Returns

- `Promise<void>`

## cookies

`cookies(urls?: string | string[]): Promise<Cookie[]>`

Returns cookies for the given URL(s). If omitted, returns available cookies.

### Usage

```js
const all = await browser.cookies();
expect(all.length >= 0).toBeTruthy();

const urlCookies = await browser.cookies('https://juejin.cn/');
expect(urlCookies.length >= 0).toBeTruthy();
```

### Arguments

- `urls?` `<string | string[]>`

### Returns

- `Promise<Cookie[]>`

## addCookies

`addCookies(cookies: (Cookie & { url?: string }) | (Cookie & { url?: string })[]): Promise<void>`

Adds one or more cookies.

### Usage

```js
await browser.addCookies({ name: 'test_cookie', value: '1', url: 'https://juejin.cn/' });
```

### Arguments

- `cookies` `<(Cookie & { url?: string }) | (Cookie & { url?: string })[]>`

### Returns

- `Promise<void>`

## clearCookies

`clearCookies(options?: { name?: string | RegExp, domain?: string | RegExp, path?: string | RegExp }): Promise<void>`

Clears cookies matching the filter.

### Usage

```js
await browser.clearCookies({ name: /^test_cookie/ });
```

### Arguments

- `options?` `<{ name?: string | RegExp, domain?: string | RegExp, path?: string | RegExp }>`

### Returns

- `Promise<void>`

## openNewWindow

`openNewWindow(url?: string): Promise<Window>`

Opens a new window.

### Usage

```js
const win = await browser.openNewWindow('https://sagibrant.github.io/mimic/aut/mouse.html');
await win.focus();
```

### Arguments

- `url?` `<string>`

### Returns

- `Promise<Window>`

## openNewPage

`openNewPage(url?: string): Promise<Page>`

Opens a new page in the last focused window.

### Usage

```js
const newPage = await browser.openNewPage('https://sagibrant.github.io/mimic/aut/keyboard.html');
await newPage.sync();
```

### Arguments

- `url?` `<string>`

### Returns

- `Promise<Page>`

## close

`close(): Promise<void>`

Closes the browser (where supported by the environment).

### Usage

```js
await browser.close();
```

### Arguments

- None

### Returns

- `Promise<void>`

## on

`on(event: 'window', listener: (window: Window) => (unknown | Promise<unknown>)): this`     
`on(event: 'page', listener: (page: Page) => (unknown | Promise<unknown>)): this`

Registers an event listener.

### Usage

```js
const onPage = (p) => console.log('new page', p);
browser.on('page', onPage);
```

### Arguments

- `event` `<'window' | 'page'>`
- `listener` `<(window: Window) => unknown | Promise<unknown>>` or `<(page: Page) => unknown | Promise<unknown>>`

### Returns

- `this`

## off

`off(event: 'window', listener: (window: Window) => (unknown | Promise<unknown>)): this`   
`off(event: 'page', listener: (page: Page) => (unknown | Promise<unknown>)): this`

Removes a specific event listener.

### Usage

```js
const onPage = (p) => console.log('new page', p);
browser.on('page', onPage);
browser.off('page', onPage);
```

### Arguments

- `event` `<'window' | 'page'>`
- `listener` `<(window: Window) => unknown | Promise<unknown>>` or `<(page: Page) => unknown | Promise<unknown>>`

### Returns

- `this`
