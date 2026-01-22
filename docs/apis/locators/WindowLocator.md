# WindowLocator

Locator for windows.

This type is both `Locator<Window>` and `Window`.

## Methods

---
### page

`page(selector?: PageLocatorOptions): PageLocator`

Creates a page locator scoped to the located window.

#### Usage

```js
const win = await browser.window({ lastFocused: true }).get();
const activePage = await win.page({ active: true }).get();
await activePage.bringToFront();
```

#### Arguments

- `selector?` `<PageLocatorOptions>`

#### Returns

- `PageLocator`

## Locator Members

All locator methods are available. See [Locator](Locator.md) for details:     
- `filter(...)`, `prefer(...)`     
- `get()`, `count()`, `all()`     
- `nth(...)`, `first()`, `last()`     
## Window Members     
All `Window` members are available on `WindowLocator`. See [Window](../aos/Window.md) for full details, including:     
- `state()`, `focused()`, `incognito()`, `closed()`     
- `browser()`, `pages()`, `activePage()`     
- `openNewPage(...)`, `focus()`, `close()`, `minimize()`, `maximize()`, `restore()`, `fullscreen(...)`     
- `on(...)`, `off(...)`
