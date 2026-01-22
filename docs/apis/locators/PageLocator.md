# PageLocator

Locator for pages.

This type is both `Locator<Page>` and `Page`.

## frame

`frame(selector?: FrameLocatorOptions | string): FrameLocator`

### Usage

```js
const frame = await page.frame({ url: /example-frame/ }).get();
await frame.element('button').first().click();
```

### Arguments

- `selector?` `<FrameLocatorOptions | string>`

### Returns

- `FrameLocator`

## element

`element(selector?: ElementLocatorOptions | string): ElementLocator`

### Usage

```js
await page.element('#submit-btn').click();
```

### Arguments

- `selector?` `<ElementLocatorOptions | string>`

### Returns

- `ElementLocator`

## text

`text(selector?: TextLocatorOptions | string | RegExp): TextLocator`

### Usage

```js
await page.text(/Welcome/i).first().highlight();
```

### Arguments

- `selector?` `<TextLocatorOptions | string | RegExp>`

### Returns

- `TextLocator`

## Locator Members

All locator methods are available. See [Locator](Locator.md) for details.     
## Page Members     
All `Page` members are available on `PageLocator`. See [Page](../aos/Page.md) for full details.
