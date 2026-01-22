# ElementLocator

Locator for elements.

This type is both `Locator<Element>` and `Element`.

## Methods

---
### element

`element(selector?: ElementLocatorOptions | string): ElementLocator`

Creates a nested element locator scoped within the located element.

#### Usage

```js
const list = await page.element('#list').get();
await list.element('li').first().click();
```

#### Arguments

- `selector?` `<ElementLocatorOptions | string>`

#### Returns

- `ElementLocator`

---
### text

`text(selector?: TextLocatorOptions | string | RegExp): TextLocator`

Creates a text locator scoped within the located element.

#### Usage

```js
const card = await page.element('.card').first().get();
await card.text(/details/i).first().highlight();
```

#### Arguments

- `selector?` `<TextLocatorOptions | string | RegExp>`

#### Returns

- `TextLocator`

## Shadow DOM Targeting

`filter(...)` is the strongest way to identify elements across shadow DOM boundaries.

### Usage

```js
const submit = await page
  .element()
  .filter({ type: 'attribute', name: 'data-test', value: 'shadow-submit' })
  .get();

await submit.click();
```

### Arguments

- Use `filter(...)` with `type: 'attribute' | 'property' | 'function' | 'text'`.     
- Use `prefer(...)` to break ties when multiple elements still match.    
 
### Returns     
- A narrowed `ElementLocator` (via `filter/prefer`) or a resolved `Element` (via `get()`)     
## Locator Members     
All locator methods are available. See [Locator](Locator.md) for details.     
## Element Members     
All `Element` members are available on `ElementLocator`. See [Element](../aos/Element.md) for full details.
