# Mouse

Mouse controller for a page (coordinate-based input).

## Methods

---
### click

`click(x: number, y: number, options?: Omit<ClickOptions, 'position'>): Promise<void>`

Clicks at the given coordinates.

#### Usage

```js
const mouse = page.mouse();
await mouse.click(100, 200, { button: 'left' });
```

#### Arguments

- `x` `<number>`
- `y` `<number>`
- `options?` `<Omit<ClickOptions, 'position'>>`

#### Returns

- `Promise<void>`

---
### down

`down(options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number; }): Promise<void>`

Presses down a mouse button.

#### Usage

```js
await page.mouse().down({ button: 'left', clickCount: 1 });
```

#### Arguments

- `options?` `<{ button?: 'left' | 'right' | 'middle'; clickCount?: number; }>`

#### Returns

- `Promise<void>`

---
### up

`up(options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number; }): Promise<void>`

Releases a mouse button.

#### Usage

```js
await page.mouse().up({ button: 'left', clickCount: 1 });
```

#### Arguments

- `options?` `<{ button?: 'left' | 'right' | 'middle'; clickCount?: number; }>`

#### Returns

- `Promise<void>`

---
### move

`move(x: number, y: number, options?: { steps?: number }): Promise<void>`

Moves the mouse to the given coordinates.

#### Usage

```js
await page.mouse().move(300, 200, { steps: 10 });
```

#### Arguments

- `x` `<number>`
- `y` `<number>`
- `options?` `<{ steps?: number }>`

#### Returns

- `Promise<void>`

---
### wheel

`wheel(deltaX: number, deltaY: number): Promise<void>`

Scrolls the mouse wheel.

#### Usage

```js
await page.mouse().wheel(0, 500);
```

#### Arguments

- `deltaX` `<number>`
- `deltaY` `<number>`

#### Returns

- `Promise<void>`
