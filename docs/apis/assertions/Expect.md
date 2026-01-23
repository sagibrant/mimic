# Expect

Assertion helper returned by `expect(actual)`.

## Getting Started

### Usage

```js
expect(await page.closed()).not.toBeTruthy();
```

### Notes

In Mimic extension sidebar, a global function is available:

- `expect(actual: unknown): Expect`, which is the assertion function to create `Expect` object.

## Properties

---
### not

`not: Expect`

Negates the next assertion.

#### Usage

```js
expect(await page.closed()).not.toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Expect`

## Methods

---
### expect

`expect(actual: unknown): Expect`

Creates an `Expect` object for the given `actual` value.

#### Usage

```js
expect(2 + 2).toBe(4);
expect('hello world').toMatch(/world/);
```

#### Arguments

- `actual` `<unknown>`: actual value to assert on.

#### Returns

- `Expect`

---
### toBe

Asserts strict equality (`===`) with `expected`.

#### Usage

```js
expect(await page.status()).toBe('complete');
```

#### Arguments

- `expected` `<unknown>`

#### Returns

- `void`

---
### toEqual

Asserts deep equality with `expected`.

#### Usage

```js
expect({ a: 1 }).toEqual({ a: 1 });
```

#### Arguments

- `expected` `<unknown>`

#### Returns

- `void`

---
### toBeTruthy

Asserts `actual` is truthy.

#### Usage

```js
expect((await page.frames()).length > 0).toBeTruthy();
```

#### Arguments

- None

#### Returns

- `void`

---
### toBeFalsy

Asserts `actual` is falsy.

#### Usage

```js
expect(await page.closed()).toBeFalsy();
```

#### Arguments

- None

#### Returns

- `void`

---
### toBeNaN

Asserts `actual` is `NaN`.

#### Usage

```js
expect(Number('x')).toBeNaN();
```

#### Arguments

- None

#### Returns

- `void`

---
### toBeNull

Asserts `actual` is `null`.

#### Usage

```js
expect(null).toBeNull();
```

#### Arguments

- None

#### Returns

- `void`

---
### toBeUndefined

Asserts `actual` is `undefined`.

#### Usage

```js
expect(undefined).toBeUndefined();
```

#### Arguments

- None

#### Returns

- `void`

---
### toBeDefined

Asserts `actual` is not `undefined`.

#### Usage

```js
expect(await page.title()).toBeDefined();
```

#### Arguments

- None

#### Returns

- `void`

---
### toBeNullOrUndefined

Asserts `actual` is `null` or `undefined`.

#### Usage

```js
expect(await page.window()).toBeNullOrUndefined();
```

#### Arguments

- None

#### Returns

- `void`

---
### toHaveLength

Asserts `actual.length === expected`.

#### Usage

```js
expect(await browser.windows()).toHaveLength(1);
```

#### Arguments

- `expected` `<number>`

#### Returns

- `void`

---
### toContain

Asserts `actual` contains `expected`.

#### Usage

```js
expect(['edge', 'chrome']).toContain(browser.name());
```

#### Arguments

- `expected` `<unknown>`

#### Returns

- `void`

---
### toMatch

Asserts `actual` matches the regex/string.

#### Usage

```js
expect(await page.url()).toMatch(/example/);
```

#### Arguments

- `expected` `<RegExp | string>`

#### Returns

- `void`

---
### toThrow

Asserts the function throws.

#### Usage

```js
expect(() => {
  throw new Error('boom');
}).toThrow('boom');
```

#### Arguments

- `expectedErrorMsg?` `<string>`

#### Returns

- `void`
