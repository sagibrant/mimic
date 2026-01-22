# BrowserLocator

Locator for the current browser.

This type is both `Locator<Browser>` and `Browser`.

## Methods

---
### get

`get(): Promise<Browser>`

Resolves a single browser instance.

#### Usage

```js
import { BrowserLocator } from 'mimic-sdk';

const browser = await new BrowserLocator().get();
const page = await browser.lastActivePage();
await page.bringToFront();
```

#### Arguments

- None

#### Returns

- `Promise<Browser>`

---
### filter

`filter(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<Browser>`

Adds mandatory filters. See [Locator.filter](Locator.md#filter).

#### Usage

```js
const browser = await new BrowserLocator()
  .filter({ name: 'name', value: 'chrome', type: 'property' })
  .get();
```

#### Arguments

- `options?` `<LocatorFilterOption | LocatorFilterOption[]>`

#### Returns

- `Locator<Browser>`

---
### prefer

`prefer(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<Browser>`

Adds assistive filters. See [Locator.prefer](Locator.md#prefer).

#### Usage

```js
const browser = await new BrowserLocator()
  .prefer({ name: 'version', value: /^130/, type: 'property', match: 'regex' })
  .get();
```

#### Arguments

- `options?` `<LocatorFilterOption | LocatorFilterOption[]>`

#### Returns

- `Locator<Browser>`

---
### count

`count(): Promise<number>`

Counts matches. See [Locator.count](Locator.md#count).

#### Usage

```js
const n = await new BrowserLocator().count();
expect(n > 0).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<number>`

---
### all

`all(): Promise<Locator<Browser>[]>`

Returns all matches. See [Locator.all](Locator.md#all).

#### Usage

```js
const all = await new BrowserLocator().all();
expect(all.length > 0).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<Locator<Browser>[]>`

---
### nth

`nth(index: number): Locator<Browser>`

See [Locator.nth](Locator.md#nth).

#### Usage

```js
const browser = await new BrowserLocator().nth(0).get();
expect(browser.name()).toBeDefined();
```

#### Arguments

- `index` `<number>`

#### Returns

- `Locator<Browser>`

---
### first

`first(): Locator<Browser>`

See [Locator.first](Locator.md#first).

#### Usage

```js
const browser = await new BrowserLocator().first().get();
expect(browser.name()).toBeDefined();
```

#### Arguments

- None

#### Returns

- `Locator<Browser>`

---
### last

`last(): Locator<Browser>`

See [Locator.last](Locator.md#last).

#### Usage

```js
const browser = await new BrowserLocator().last().get();
expect(browser.name()).toBeDefined();
```

#### Arguments

- None

#### Returns

- `Locator<Browser>`

## Browser Members

All `Browser` members are available on `BrowserLocator`. See [Browser](../aos/Browser.md) for full details, including:     
- `name()`, `version()`, `majorVersion()`     
- `window(...)`, `page(...)`     
- `windows()`, `pages()`, `lastFocusedWindow()`, `lastActivePage()`     
- `attachDebugger()`, `detachDebugger()`, `setDefaultTimeout(...)`     
- `cookies(...)`, `addCookies(...)`, `clearCookies(...)`     
- `openNewWindow(...)`, `openNewPage(...)`, `close()`     
- `on(...)`, `off(...)`
