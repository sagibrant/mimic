# FrameLocator

Locator for frames.

This type extends `Locator<Frame>` and `Frame`.

## Getting Started

### Usage

```js
const frame = await page.frame({ url: /embedded/ }).get();
await frame.sync();
```

### Arguments

- `selector?` `<FrameLocatorOptions | string>`

### Returns

- `Frame` (via `FrameLocator.get()`)

## Methods

---
### element

`element(selector?: ElementLocatorOptions | string): ElementLocator`

Creates an element locator scoped to the located frame.

#### Usage

```js
const frame = await page.frame({ url: /embedded/ }).get();
await frame.element('input').first().fill('hello');
```

#### Arguments

- `selector?` `<ElementLocatorOptions | string>`

#### Returns

- `ElementLocator`

---
### text

`text(selector?: TextLocatorOptions | string | RegExp): TextLocator`

Creates a text locator scoped to the located frame.

#### Usage

```js
const frame = await page.frame({ url: /embedded/ }).get();
await frame.text(/submit/i).first().click();
```

#### Arguments

- `selector?` `<TextLocatorOptions | string | RegExp>`

#### Returns

- `TextLocator`

## Locator Members

All locator methods are available. See [Locator](Locator.md) for details.     

## Frame Members     

All `Frame` members are available on `FrameLocator`. See [Frame](../aos/Frame.md) for full details.
