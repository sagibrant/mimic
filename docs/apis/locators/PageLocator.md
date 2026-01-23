# PageLocator

Locator for pages.

This type extends `Locator<Page>` and `Page`.

## Getting Started

### Usage

```js
const page = await browser.page({ active: true, lastFocusedWindow: true }).get();
await page.bringToFront();
```

### Arguments

- `selector?` `<PageLocatorOptions>`

### Returns

- `Page` (via `PageLocator.get()`)

## Methods

---
### frame

`frame(selector?: FrameLocatorOptions | string): FrameLocator`

Creates a frame locator scoped to the located page.

#### Usage

```js
const frame = await page.frame({ url: /embedded/ }).get();
await frame.sync();
```

#### Arguments

- `selector?` `<FrameLocatorOptions | string>`

#### Returns

- `FrameLocator`

---
### element

`element(selector?: ElementLocatorOptions | string): ElementLocator`

Creates an element locator scoped to the located page.

#### Usage

```js
const submit = await page.element('#submit').get();
await submit.click();
```

#### Arguments

- `selector?` `<ElementLocatorOptions | string>`

#### Returns

- `ElementLocator`

---
### text

`text(selector?: TextLocatorOptions | string | RegExp): TextLocator`

Creates a text locator scoped to the located page.

#### Usage

```js
const label = await page.text(/sign in/i).first().get();
await label.click();
```

#### Arguments

- `selector?` `<TextLocatorOptions | string | RegExp>`

#### Returns

- `TextLocator`

## Locator Members

All locator methods are available. See [Locator](Locator.md) for details.     

## Page Members     

All `Page` members are available on `PageLocator`. See [Page](../aos/Page.md) for full details.
