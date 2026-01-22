# Locator

Base interface for all locators.

`get()` resolves **exactly one** match (otherwise it throws `No X Located` / `Multiple X Located`), so prefer to narrow with `filter()` and/or pick an ordinal with `first/last/nth`.

## Methods

---
### filter

`filter(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<T>`

Adds mandatory filters that must match.

#### Usage

```js
const username = await page
  .element('input')
  .filter({ type: 'attribute', name: 'name', value: 'user-name' })
  .get();
```

#### Arguments

- `options?` `<LocatorFilterOption | LocatorFilterOption[]>`: mandatory filter(s).

#### Returns

- `Locator<T>`

---
### prefer

`prefer(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<T>`

Adds assistive filters that are used to try to break ties when multiple matches exist.

#### Usage

```js
const button = page
  .element('button')
  .filter({ type: 'property', name: 'disabled', value: false })
  .prefer({ type: 'attribute', name: 'data-primary', value: 'true' })
  .first();

await button.click();
```

#### Arguments

- `options?` `<LocatorFilterOption | LocatorFilterOption[]>`: assistive filter(s).

#### Returns

- `Locator<T>`

---
### get

`get(): Promise<T>`

Waits (up to the locator timeout) until there is exactly one match, then returns it.

#### Usage

```js
const page = await browser.page({ active: true, lastFocusedWindow: true }).get();
await page.bringToFront();
```

#### Arguments

- None

#### Returns

- `Promise<T>`

---
### count

`count(): Promise<number>`

Returns the number of matches.

#### Usage

```js
const n = await page.element('button').count();
expect(n > 0).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<number>`

---
### all

`all(): Promise<Locator<T>[]>`

Returns locators for all matches (`nth(0..count-1)`).

#### Usage

```js
const items = await page.element('li').all();
expect(items.length > 0).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<Locator<T>[]>`

---
### nth

`nth(index: number): Locator<T>`

Returns a locator for the match at `index` (0-based).

#### Usage

```js
await page.element('button').nth(1).click();
```

#### Arguments

- `index` `<number>`: 0-based index.

#### Returns

- `Locator<T>`

---
### first

`first(): Locator<T>`

Alias for `nth(0)`.

#### Usage

```js
await page.element('button').first().click();
```

#### Arguments

- None

#### Returns

- `Locator<T>`

---
### last

`last(): Locator<T>`

Selects the last match.

#### Usage

```js
await page.element('button').last().click();
```

#### Arguments

- None

#### Returns

- `Locator<T>`
