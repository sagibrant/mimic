# BrowserLocator

Locator for the current browser session.

This type extends `Locator<Browser>` and `Browser`.

## Getting Started

### Usage

```js
import { BrowserLocator } from 'mimic-sdk';

const browser = await new BrowserLocator().get();
const page = await browser.lastActivePage();
await page.bringToFront();
```

### Arguments

- None

### Returns

- `Browser` (via `BrowserLocator.get()`)

### Notes

Currently, it only targets the browser session that hosts the Mimic extension.

## Methods

---
### window

`window(selector?: WindowLocatorOptions): WindowLocator`

Creates a window locator scoped to the current browser session.

#### Usage

```js
import { BrowserLocator } from 'mimic-sdk';

const win = await new BrowserLocator().window({ lastFocused: true }).get();
const page = await win.page({ active: true }).get();
await page.bringToFront();
```

#### Arguments

- `selector?` `<WindowLocatorOptions>`

#### Returns

- `WindowLocator`

---
### page

`page(selector?: PageLocatorOptions): PageLocator`

Creates a page locator scoped to the current browser session.

#### Usage

```js
import { BrowserLocator } from 'mimic-sdk';

const page = await new BrowserLocator()
  .page({ active: true, lastFocusedWindow: true })
  .get();

await page.bringToFront();
```

#### Arguments

- `selector?` `<PageLocatorOptions>`

#### Returns

- `PageLocator`

## Locator Members

All locator methods are available. See [Locator](Locator.md) for details.     

## Browser Members     

All `Browser` members are available on `BrowserLocator`. See [Browser](../aos/Browser.md) for full details.
