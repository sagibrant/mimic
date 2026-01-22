# Mimic SDK API Documentation

This documentation describes the current Mimic SDK surface (locators, automation objects, input helpers, and assertions).

The API behavior and examples are aligned with:

- `packages/browser-sdk/src` (runtime implementation)
- `packages/core/src/types/types.d.ts` (user-visible typings)

## Quick Start (Extension Script Environment)

In the Mimic extension script runtime you can use these globals directly:

- `ai`: AIClient
- `browser`: Browser
- `page`: Page
- `expect(actual)`: Expect
- `wait(ms)`: Promise<void>

Example:

```js
await page.navigate('https://sagibrant.github.io/mimic/aut/index.html');
await page.sync();

await page.element('#btn_click').click();
expect(await page.title()).toMatch(/test/i);
```

## Quick Start (Browser SDK Usage)

Example:

```js
import { BrowserLocator, AIClient, expect } from 'mimic-sdk';

const browser = await new BrowserLocator().get();
const page = await browser.lastActivePage();

await page.bringToFront();
await page.element('#submit-btn').first().click();
```

## API Reference

### Locators

- [Locator](apis/locators/Locator.md)
- [BrowserLocator](apis/locators/BrowserLocator.md)
- [WindowLocator](apis/locators/WindowLocator.md)
- [PageLocator](apis/locators/PageLocator.md)
- [FrameLocator](apis/locators/FrameLocator.md)
- [ElementLocator](apis/locators/ElementLocator.md)
- [TextLocator](apis/locators/TextLocator.md)

### Automation Objects

- [Browser](apis/aos/Browser.md)
- [Window](apis/aos/Window.md)
- [Page](apis/aos/Page.md)
- [Frame](apis/aos/Frame.md)
- [Element](apis/aos/Element.md)
- [Text](apis/aos/Text.md)

### Other Objects

- [AIClient](apis/objects/AIClient.md)
- [Mouse](apis/objects/Mouse.md)
- [Keyboard](apis/objects/Keyboard.md)
- [Dialog](apis/objects/Dialog.md)

### Assertions

- [Expect](apis/assertions/Expect.md)

### Types

- [Types](apis/types.md)
