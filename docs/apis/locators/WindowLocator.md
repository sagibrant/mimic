# WindowLocator

Locator for windows.

This type extends `Locator<Window>` and `Window`.

## Getting Started

### Usage

```js
const win = await browser.window({ lastFocused: true }).get();
const page = await win.page({ active: true }).get();
await page.bringToFront();
```

### Arguments

- `selector?` `<WindowLocatorOptions>`

### Returns

- `Window` (via `WindowLocator.get()`)

## Methods

---
### page

`page(selector?: PageLocatorOptions): PageLocator`

Creates a page locator scoped to the located window.

#### Usage

```js
const win = await browser.window({ lastFocused: true }).get();
const page = await win.page({ active: true }).get();
await page.bringToFront();
```

#### Arguments

- `selector?` `<PageLocatorOptions>`

#### Returns

- `PageLocator`

## Locator Members

All locator methods are available. See [Locator](Locator.md) for details.     

## Window Members     

All `Window` members are available on `WindowLocator`. See [Window](../aos/Window.md) for full details.
