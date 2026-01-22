# Frame

Frame automation object.

## element

`element(selector?: ElementLocatorOptions | string): ElementLocator`

Creates an element locator scoped to this frame.

### Usage

```js
await frame.element('button').first().click();
```

### Arguments

- `selector?` `<ElementLocatorOptions | string>`

### Returns

- `ElementLocator`

## text

`text(selector?: TextLocatorOptions | string | RegExp): TextLocator`

Creates a text locator scoped to this frame.

### Usage

```js
await frame.text(/Submit/).first().click();
```

### Arguments

- `selector?` `<TextLocatorOptions | string | RegExp>`

### Returns

- `TextLocator`

## url

`url(): Promise<string>`

Returns the frame URL.

### Usage

```js
const url = await frame.url();
expect(url.length > 0).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<string>`

## status

`status(): Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'>`

Returns the navigation lifecycle status.

### Usage

```js
const status = await frame.status();
expect(['BeforeNavigate', 'Committed', 'DOMContentLoaded', 'Completed', 'ErrorOccurred', 'Removed']).toContain(status);
```

### Arguments

- None

### Returns

- `Promise<'BeforeNavigate' | 'Committed' | 'DOMContentLoaded' | 'Completed' | 'ErrorOccurred' | 'Removed'>`

## readyState

`readyState(): Promise<'loading' | 'interactive' | 'complete'>`

Returns the document readiness state.

### Usage

```js
const state = await frame.readyState();
expect(['loading', 'interactive', 'complete']).toContain(state);
```

### Arguments

- None

### Returns

- `Promise<'loading' | 'interactive' | 'complete'>`

## content

`content(): Promise<string>`

Returns the frame HTML content.

### Usage

```js
const html = await frame.content();
expect(html.length > 0).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<string>`

## sync

`sync(timeout?: number): Promise<void>`

Waits for the frame to reach a ready state.

### Usage

```js
await frame.sync(5000);
```

### Arguments

- `timeout?` `<number>`

### Returns

- `Promise<void>`

## querySelectorAll

`querySelectorAll(selector: string): Promise<Element[]>`

Returns all elements matching `selector` within the frame.

### Usage

```js
const divs = await frame.querySelectorAll('div');
expect(divs.length >= 0).toBeTruthy();
```

### Arguments

- `selector` `<string>`

### Returns

- `Promise<Element[]>`

## executeScript

`executeScript<Args extends unknown[], Result>(func: (...args: Args) => Result, args?: Args): Promise<Result>`

Executes a function in the frame context.

### Usage

```js
const value = await frame.executeScript((a, b) => a + b, [1, 2]);
expect(value).toBe(3);
```

### Arguments

- `func` `<(...args: Args) => Result>`
- `args?` `<Args>`

### Returns

- `Promise<Result>`

## page

`page(): Promise<Page>`

Returns the page that owns this frame.

### Usage

```js
const p = await frame.page();
await p.bringToFront();
```

### Arguments

- None

### Returns

- `Promise<Page>`

## parentFrame

`parentFrame(): Promise<Frame | null>`

Returns the parent frame, or `null` if this is the main frame.

### Usage

```js
const parent = await frame.parentFrame();
expect(parent === null || typeof parent === 'object').toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<Frame | null>`

## childFrames

`childFrames(): Promise<Frame[]>`

Returns child frames.

### Usage

```js
const children = await frame.childFrames();
expect(children.length >= 0).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<Frame[]>`

## ownerElement

`ownerElement(): Promise<Element | null>`

Returns the owning element (e.g. iframe element), or `null` for main frame.

### Usage

```js
const owner = await frame.ownerElement();
expect(owner === null || typeof owner === 'object').toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<Element | null>`
