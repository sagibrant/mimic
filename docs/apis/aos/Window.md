# Window

Window automation object.

## page

`page(selector?: PageLocatorOptions): PageLocator`

Creates a page locator scoped to this window.

### Usage

```js
const active = await window.page({ active: true }).get();
await active.bringToFront();
```

### Arguments

- `selector?` `<PageLocatorOptions>`

### Returns

- `PageLocator`

## state

`state(): Promise<'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen'>`

Returns the current window state.

### Usage

```js
const state = await window.state();
expect(['normal', 'minimized', 'maximized', 'fullscreen', 'locked-fullscreen']).toContain(state);
```

### Arguments

- None

### Returns

- `Promise<'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'locked-fullscreen'>`

## focused

`focused(): Promise<boolean>`

Returns whether the window is focused.

### Usage

```js
expect(await window.focused()).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<boolean>`

## incognito

`incognito(): Promise<boolean>`

Returns whether the window is incognito/private.

### Usage

```js
const incognito = await window.incognito();
expect(typeof incognito === 'boolean').toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<boolean>`

## closed

`closed(): Promise<boolean>`

Returns whether the window is closed.

### Usage

```js
expect(await window.closed()).toBeFalsy();
```

### Arguments

- None

### Returns

- `Promise<boolean>`

## openNewPage

`openNewPage(url?: string): Promise<Page>`

Opens a new page in this window.

### Usage

```js
const p = await window.openNewPage('https://sagibrant.github.io/mimic/aut/mouse.html');
await p.sync();
```

### Arguments

- `url?` `<string>`

### Returns

- `Promise<Page>`

## focus

`focus(): Promise<void>`

Brings the window into focus.

### Usage

```js
await window.focus();
expect(await window.focused()).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<void>`

## close

`close(): Promise<void>`

Closes the window.

### Usage

```js
await window.close();
```

### Arguments

- None

### Returns

- `Promise<void>`

## minimize

`minimize(): Promise<void>`

Minimizes the window.

### Usage

```js
await window.minimize();
expect(await window.state()).toBe('minimized');
```

### Arguments

- None

### Returns

- `Promise<void>`

## maximize

`maximize(): Promise<void>`

Maximizes the window.

### Usage

```js
await window.maximize();
expect(['normal', 'maximized']).toContain(await window.state());
```

### Arguments

- None

### Returns

- `Promise<void>`

## restore

`restore(): Promise<void>`

Restores the window from minimized/maximized state.

### Usage

```js
await window.restore();
expect(await window.state()).toBe('normal');
```

### Arguments

- None

### Returns

- `Promise<void>`

## fullscreen

`fullscreen(toggle?: boolean): Promise<void>`

Toggles fullscreen mode.

### Usage

```js
await window.fullscreen(false);
expect(await window.state()).toBe('fullscreen');

await window.fullscreen();
expect(await window.state()).toBe('normal');
```

### Arguments

- `toggle?` `<boolean>`

### Returns

- `Promise<void>`

## browser

`browser(): Promise<Browser>`

Returns the owning browser.

### Usage

```js
const b = await window.browser();
expect(b.name()).toBeDefined();
```

### Arguments

- None

### Returns

- `Promise<Browser>`

## pages

`pages(): Promise<Page[]>`

Returns all pages in this window.

### Usage

```js
const pages = await window.pages();
expect(pages.length > 0).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<Page[]>`

## activePage

`activePage(): Promise<Page>`

Returns the active page in this window.

### Usage

```js
const active = await window.activePage();
await active.bringToFront();
```

### Arguments

- None

### Returns

- `Promise<Page>`

## on

`on(event: 'page', listener: (page: Page) => (unknown | Promise<unknown>)): this`     
`on(event: 'close', listener: (window: Window) => (unknown | Promise<unknown>)): this`

Registers an event listener.

### Usage

```js
const onClose = () => console.log('window closed');
window.on('close', onClose);
```

### Arguments

- `event` `<'page' | 'close'>`
- `listener` `<(page: Page) => unknown | Promise<unknown>>` or `<(window: Window) => unknown | Promise<unknown>>`

### Returns

- `this`

## off

`off(event: 'page', listener: (page: Page) => (unknown | Promise<unknown>)): this`     
`off(event: 'close', listener: (window: Window) => (unknown | Promise<unknown>)): this`

Removes a specific event listener.

### Usage

```js
const onClose = () => console.log('window closed');
window.on('close', onClose);
window.off('close', onClose);
```

### Arguments

- `event` `<'page' | 'close'>`
- `listener` `<(page: Page) => unknown | Promise<unknown>>` or `<(window: Window) => unknown | Promise<unknown>>`

### Returns

- `this`
