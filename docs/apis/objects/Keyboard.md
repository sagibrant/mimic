# Keyboard

Keyboard controller for a page.

## Methods

---
### type

`type(text: string, options?: TextInputOptions): Promise<void>`

Types text into the currently focused element.

#### Usage

```js
await page.keyboard().type('Hello World', { delayBetweenChar: 50 });
```

#### Arguments

- `text` `<string>`
- `options?` `<TextInputOptions>`

#### Returns

- `Promise<void>`

---
### down

`down(key: string): Promise<void>`

Presses down a key.

#### Usage

```js
await page.keyboard().down('Shift');
```

#### Arguments

- `key` `<string>`

#### Returns

- `Promise<void>`

---
### up

`up(key: string): Promise<void>`

Releases a key.

#### Usage

```js
await page.keyboard().up('Shift');
```

#### Arguments

- `key` `<string>`

#### Returns

- `Promise<void>`

---
### press

`press(keys: string | string[], options?: { delayBetweenDownUp?: number }): Promise<void>`

Presses and releases a key or chord.

#### Usage

```js
await page.keyboard().press(['Shift', 'KeyA'], { delayBetweenDownUp: 20 });
```

#### Arguments

- `keys` `<string | string[]>`
- `options?` `<{ delayBetweenDownUp?: number }>`

#### Returns

- `Promise<void>`
