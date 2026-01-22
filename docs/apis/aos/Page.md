# Page

Page (tab) automation object.

## Properties

---
### url

`url(): Promise<string>`

Returns the current page URL.

#### Usage

```js
const url = await page.url();
expect(url).toMatch(/^https?:\\/\\//);
```

#### Arguments

- None

#### Returns

- `Promise<string>`

---
### title

`title(): Promise<string>`

Returns the page title.

#### Usage

```js
const title = await page.title();
expect(typeof title === 'string').toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<string>`

---
### content

`content(): Promise<string>`

Returns the full HTML content.

#### Usage

```js
const html = await page.content();
expect(html.length > 0).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<string>`

---
### status

`status(): Promise<'unloaded' | 'loading' | 'complete'>`

Returns the loading status.

#### Usage

```js
await page.sync();
expect(await page.status()).toBe('complete');
```

#### Arguments

- None

#### Returns

- `Promise<'unloaded' | 'loading' | 'complete'>`

---
### active

`active(): Promise<boolean>`

Returns whether the page is active.

#### Usage

```js
expect(await page.active()).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<boolean>`

---
### closed

`closed(): Promise<boolean>`

Returns whether the page is closed.

#### Usage

```js
expect(await page.closed()).toBeFalsy();
```

#### Arguments

- None

#### Returns

- `Promise<boolean>`

## Methods

---
### frame

`frame(selector?: FrameLocatorOptions | string): FrameLocator`

Creates a frame locator for this page.

#### Usage

```js
const frame = await page.frame({ url: /example/ }).get();
await frame.element('button').first().click();
```

#### Arguments

- `selector?` `<FrameLocatorOptions | string>`: frame selector options or a selector string.

#### Returns

- `FrameLocator`

---
### element

`element(selector?: ElementLocatorOptions | string): ElementLocator`

Creates an element locator for this page.

#### Usage

```js
await page.element('#btn_click').click();
```

#### Arguments

- `selector?` `<ElementLocatorOptions | string>`: element locator options or CSS selector string.

#### Returns

- `ElementLocator`

---
### text

`text(selector?: TextLocatorOptions | string | RegExp): TextLocator`

Creates a text locator for this page.

#### Usage

```js
await page.text(/Welcome/).first().highlight();
```

#### Arguments

- `selector?` `<TextLocatorOptions | string | RegExp>`

#### Returns

- `TextLocator`

---
### activate

`activate(): Promise<void>`

Activates the page (brings it to the front).

#### Usage

```js
await page.activate();
expect(await page.active()).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<void>`

---
### bringToFront

`bringToFront(): Promise<void>`

Brings the page to the front.

#### Usage

```js
await page.bringToFront();
```

#### Arguments

- None

#### Returns

- `Promise<void>`

---
### sync

`sync(timeout?: number): Promise<void>`

Waits for the page to finish loading.

#### Usage

```js
await page.navigate('https://sagibrant.github.io/mimic/aut/mouse.html');
await page.sync(5000);
expect(await page.status()).toBe('complete');
```

#### Arguments

- `timeout?` `<number>`: timeout in milliseconds.

#### Returns

- `Promise<void>`

---
### openNewPage

`openNewPage(url?: string): Promise<Page>`

Opens a new page in the same window.

#### Usage

```js
const newPage = await page.openNewPage('https://sagibrant.github.io/mimic/aut/keyboard.html');
await newPage.sync();
```

#### Arguments

- `url?` `<string>`

#### Returns

- `Promise<Page>`

---
### navigate

`navigate(url?: string): Promise<void>`

Navigates to `url`.

#### Usage

```js
await page.navigate('https://sagibrant.github.io/mimic/aut/index.html');
await page.sync();
```

#### Arguments

- `url?` `<string>`

#### Returns

- `Promise<void>`

---
### refresh

`refresh(bypassCache?: boolean): Promise<void>`

Refreshes the page.

#### Usage

```js
await page.refresh();
await page.sync();
expect(await page.status()).toBe('complete');
```

#### Arguments

- `bypassCache?` `<boolean>`

#### Returns

- `Promise<void>`

---
### back

`back(): Promise<void>`

Navigates back in history.

#### Usage

```js
await browser.attachDebugger();
await page.navigate('https://cn.bing.com/');
await page.sync();
await page.navigate('https://sagibrant.github.io/mimic/aut/mouse.html');
await page.sync();
await page.back();
await page.sync();
await browser.detachDebugger();
```

#### Arguments

- None

#### Returns

- `Promise<void>`

---
### forward

`forward(): Promise<void>`

Navigates forward in history.

#### Usage

```js
await browser.attachDebugger();
await page.forward();
await page.sync();
await browser.detachDebugger();
```

#### Arguments

- None

#### Returns

- `Promise<void>`

---
### close

`close(): Promise<void>`

Closes the page.

#### Usage

```js
await page.close();
expect(await page.closed()).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<void>`

---
### zoom

`zoom(zoomFactor: number): Promise<void>`

Sets the page zoom factor.

#### Usage

```js
await page.zoom(1.5);
await page.zoom(1);
```

#### Arguments

- `zoomFactor` `<number>`

#### Returns

- `Promise<void>`

---
### moveToWindow

`moveToWindow(window: Window, index?: number): Promise<void>`

Moves the page into another window.

#### Usage

```js
const windows = await browser.windows();
await page.moveToWindow(windows[0], 0);
```

#### Arguments

- `window` `<Window>`
- `index?` `<number>`

#### Returns

- `Promise<void>`

---
### captureScreenshot

`captureScreenshot(): Promise<string>`

Captures a screenshot of the page.

#### Usage

```js
const data = await page.captureScreenshot();
expect(data.length > 0).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<string>`

---
### querySelectorAll

`querySelectorAll(selector: string): Promise<Element[]>`

Returns all elements matching `selector` in the main frame.

#### Usage

```js
await page.sync();
const divs = await page.querySelectorAll('div');
expect(divs.length >= 0).toBeTruthy();
```

#### Arguments

- `selector` `<string>`

#### Returns

- `Promise<Element[]>`

---
### executeScript

`executeScript<Args extends unknown[], Result>(func: (...args: Args) => Result, args?: Args): Promise<Result>`

Executes a function in the page context.

#### Usage

```js
const result = await page.executeScript((a, b, c) => ({ a, b, c }), [1, 'msg', { d: 3 }]);
expect(result).toEqual({ a: 1, b: 'msg', c: { d: 3 } });
```

#### Arguments

- `func` `<(...args: Args) => Result>`
- `args?` `<Args>`

#### Returns

- `Promise<Result>`

---
### window

`window(): Promise<Window | null>`

Returns the window that owns this page, or `null`.

#### Usage

```js
const win = await page.window();
expect(win).toBeDefined();
```

#### Arguments

- None

#### Returns

- `Promise<Window | null>`

---
### mainFrame

`mainFrame(): Promise<Frame | null>`

Returns the main frame, or `null`.

#### Usage

```js
const frame = await page.mainFrame();
expect(frame).toBeDefined();
```

#### Arguments

- None

#### Returns

- `Promise<Frame | null>`

---
### frames

`frames(): Promise<Frame[]>`

Returns all frames in the page.

#### Usage

```js
const frames = await page.frames();
expect(frames.length > 0).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<Frame[]>`

---
### mouse

`mouse(): Mouse`

Returns the mouse controller.

#### Usage

```js
const mouse = page.mouse();
await mouse.move(100, 100);
```

#### Arguments

- None

#### Returns

- `Mouse`

---
### keyboard

`keyboard(): Keyboard`

Returns the keyboard controller.

#### Usage

```js
const keyboard = page.keyboard();
await keyboard.type('Hello', { delayBetweenChar: 50 });
```

#### Arguments

- None

#### Returns

- `Keyboard`

---
### dialog

`dialog(): Dialog`

Returns the current dialog handler object.

#### Usage

```js
const dialog = page.dialog();
expect(await dialog.opened()).toBeFalsy();
```

#### Arguments

- None

#### Returns

- `Dialog`

## Events

---
### on

`on(event: 'dialog', listener: (dialog: Dialog) => (unknown | Promise<unknown>)): this`     
`on(event: 'domcontentloaded' | 'close', listener: (page: Page) => (unknown | Promise<unknown>)): this`

Registers a page event listener.

#### Usage

```js
const onDialog = async (dialog) => {
  expect(await dialog.opened()).toBeTruthy();
  await dialog.accept();
  page.off('dialog', onDialog);
};
page.on('dialog', onDialog);
```

#### Arguments

- `event` `<'dialog' | 'domcontentloaded' | 'close'>`
- `listener` `<(dialog: Dialog) => unknown | Promise<unknown>>` or `<(page: Page) => unknown | Promise<unknown>>`

#### Returns

- `this`

---
### off

`off(event: 'dialog', listener: (dialog: Dialog) => (unknown | Promise<unknown>)): this`     
`off(event: 'domcontentloaded' | 'close', listener: (page: Page) => (unknown | Promise<unknown>)): this`

Removes a specific page event listener.

#### Usage

```js
const onClose = () => console.log('closed');
page.on('close', onClose);
page.off('close', onClose);
```

#### Arguments

- `event` `<'dialog' | 'domcontentloaded' | 'close'>`
- `listener` `<(dialog: Dialog) => unknown | Promise<unknown>>` or `<(page: Page) => unknown | Promise<unknown>>`

#### Returns

- `this`
