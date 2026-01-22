# FrameLocator

Locator for frames.

This type is both `Locator<Frame>` and `Frame`.

## element

`element(selector?: ElementLocatorOptions | string): ElementLocator`

### Usage

```js
const frame = await page.frame({ url: /embedded/ }).get();
await frame.element('input').first().fill('hello');
```

### Arguments

- `selector?` `<ElementLocatorOptions | string>`

### Returns

- `ElementLocator`

## text

`text(selector?: TextLocatorOptions | string | RegExp): TextLocator`

### Usage

```js
const frame = await page.frame({ url: /embedded/ }).get();
await frame.text(/submit/i).first().click();
```

### Arguments

- `selector?` `<TextLocatorOptions | string | RegExp>`

### Returns

- `TextLocator`

## Locator Members

All locator methods are available. See [Locator](Locator.md) for details.     
## Frame Members     
All `Frame` members are available on `FrameLocator`. See [Frame](../aos/Frame.md) for full details.
