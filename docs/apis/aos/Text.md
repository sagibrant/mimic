# Text

Text automation object.

## Getting Started

### Usage

```js
const text = await page.text(/Move mouse to me!/).get();
await text.highlight();
```

### Arguments

- None

### Returns

- `Text` (via `TextLocator.get()`)

## Methods

---
### ownerFrame

`ownerFrame(): Promise<Frame>`

Returns the frame that owns this text node.

### Usage

```js
const frame = await text.ownerFrame();
expect(frame).toBeDefined();
```

### Arguments

- None

### Returns

- `Promise<Frame>`

---
### ownerElement

`ownerElement(): Promise<Element | null>`

Returns the element that owns this text node, or `null`.

### Usage

```js
const el = await text.ownerElement();
expect(el === null || typeof el === 'object').toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<Element | null>`

### Getters

| Method name | Usage | Returns |
| --- | --- | --- |
| `nodeName()` | `await text.nodeName()` | `Promise<string>` |
| `nodeType()` | `await text.nodeType()` | `Promise<number>` |
| `nodeValue()` | `await text.nodeValue()` | `Promise<string>` |
| `isConnected()` | `await text.isConnected()` | `Promise<boolean>` |
| `textContent()` | `await text.textContent()` | `Promise<string>` |
| `boundingBox()` | `await text.boundingBox()` | `Promise<RectInfo \| null>` |

---
### highlight

`highlight(): Promise<void>`

Highlights the text node.

### Usage

```js
await text.highlight();
```

### Arguments

- None

### Returns

- `Promise<void>`

---
### getProperty

`getProperty(name: string): Promise<unknown>`

### Usage

```js
const v = await text.getProperty('nodeType');
expect(v).toBeDefined();
```

### Arguments

- `name` `<string>`

### Returns

- `Promise<unknown>`

---
### setProperty

`setProperty(name: string, value: unknown): Promise<void>`

### Usage

```js
await text.setProperty('nodeValue', 'x');
```

### Arguments

- `name` `<string>`
- `value` `<unknown>`

### Returns

- `Promise<void>`

---
### getBoundingClientRect

`getBoundingClientRect(): Promise<RectInfo>`

### Usage

```js
const rect = await text.getBoundingClientRect();
expect(rect.width >= 0).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<RectInfo>`

---
### dispatchEvent

`dispatchEvent(type: string, options?: object): Promise<void>`

### Usage

```js
await text.dispatchEvent('mousemove');
```

### Arguments

- `type` `<string>`
- `options?` `<object>`

### Returns

- `Promise<void>`

---
### sendCDPCommand

`sendCDPCommand(method: string, commandParams?: { [key: string]: unknown }): Promise<void>`

### Usage

```js
await browser.attachDebugger();
await text.sendCDPCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 100, y: 200 });
```

### Arguments

- `method` `<string>`
- `commandParams?` `<{ [key: string]: unknown }>`

### Returns

- `Promise<void>`

---
### hover

`hover(options?: { position?: Point } & ActionOptions): Promise<void>`

### Usage

```js
await text.hover();
```

### Arguments

- `options?` `<{ position?: Point } & ActionOptions>`

### Returns

- `Promise<void>`

---
### click

`click(options?: ClickOptions & ActionOptions): Promise<void>`

### Usage

```js
await text.click();
```

### Arguments

- `options?` `<ClickOptions & ActionOptions>`

### Returns

- `Promise<void>`

---
### dblclick

`dblclick(options?: Omit<ClickOptions, 'clickCount'> & ActionOptions): Promise<void>`

### Usage

```js
await text.dblclick();
```

### Arguments

- `options?` `<Omit<ClickOptions, 'clickCount'> & ActionOptions>`

### Returns

- `Promise<void>`

---
### wheel

`wheel(options?: { deltaX?: number, deltaY?: number } & ActionOptions): Promise<void>`

### Usage

```js
await text.wheel({ deltaY: 120 });
```

### Arguments

- `options?` `<{ deltaX?: number, deltaY?: number } & ActionOptions>`

### Returns

- `Promise<void>`

---
### dragTo

`dragTo(target: Element | Text, options?: { sourcePosition?: Point, targetPosition?: Point, steps?: number } & ActionOptions): Promise<void>`

### Usage

```js
const target = await page.element('#drop-target').get();
await text.dragTo(target);
```

### Arguments

- `target` `<Element | Text>`
- `options?` `<{ sourcePosition?: Point, targetPosition?: Point, steps?: number } & ActionOptions>`

### Returns

- `Promise<void>`

---
### tap

`tap(options?: { position?: Point } & ActionOptions): Promise<void>`

### Usage

```js
await text.tap();
```

### Arguments

- `options?` `<{ position?: Point } & ActionOptions>`

### Returns

- `Promise<void>`
