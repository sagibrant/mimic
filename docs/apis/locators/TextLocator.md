# TextLocator

Locator for text nodes.

This type extends `Locator<Text>` and `Text`.

## Getting Started

### Usage

```js
const label = await page.text(/sign in/i).first().get();
await label.highlight();
await label.click();
```

### Arguments

- None

### Returns

- `Text` (via `TextLocator.get()`)

## Methods

`TextLocator` does not add additional methods beyond `Locator<Text>` and `Text`. Use the sections below for details.

## Locator Members

All locator methods are available. See [Locator](Locator.md) for details.     

## Text Members     

All `Text` members are available on `TextLocator`. See [Text](../aos/Text.md) for full details.
