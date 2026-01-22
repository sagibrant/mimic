# Element

Element automation object.

## Getting Started

### Usage

```js
const element = await page.element('#btn_click').get();
await element.scrollIntoViewIfNeeded();
await element.click();
```

### Arguments

- None

### Returns

- `Element` (via `ElementLocator.get()`)

## Properties

All getters are async and return a value from the DOM element.

| Method name | Usage | Returns |
| --- | --- | --- |
| `nodeName()` | `await element.nodeName()` | `Promise<string>` |
| `nodeType()` | `await element.nodeType()` | `Promise<number>` |
| `nodeValue()` | `await element.nodeValue()` | `Promise<string>` |
| `isConnected()` | `await element.isConnected()` | `Promise<boolean>` |
| `textContent()` | `await element.textContent()` | `Promise<string>` |
| `boundingBox()` | `await element.boundingBox()` | `Promise<RectInfo \| null>` |
| `tagName()` | `await element.tagName()` | `Promise<string>` |
| `id()` | `await element.id()` | `Promise<string>` |
| `innerHTML()` | `await element.innerHTML()` | `Promise<string>` |
| `outerHTML()` | `await element.outerHTML()` | `Promise<string>` |
| `innerText()` | `await element.innerText()` | `Promise<string>` |
| `outerText()` | `await element.outerText()` | `Promise<string>` |
| `title()` | `await element.title()` | `Promise<string>` |
| `accessKey()` | `await element.accessKey()` | `Promise<string>` |
| `hidden()` | `await element.hidden()` | `Promise<boolean>` |
| `name()` | `await element.name()` | `Promise<string>` |
| `value()` | `await element.value()` | `Promise<string>` |
| `type()` | `await element.type()` | `Promise<string>` |
| `alt()` | `await element.alt()` | `Promise<string>` |
| `accept()` | `await element.accept()` | `Promise<string>` |
| `placeholder()` | `await element.placeholder()` | `Promise<string>` |
| `src()` | `await element.src()` | `Promise<string>` |
| `disabled()` | `await element.disabled()` | `Promise<boolean>` |
| `readOnly()` | `await element.readOnly()` | `Promise<boolean>` |
| `required()` | `await element.required()` | `Promise<boolean>` |
| `checked()` | `await element.checked()` | `Promise<boolean>` |
| `label()` | `await element.label()` | `Promise<string>` |
| `selected()` | `await element.selected()` | `Promise<boolean>` |
| `multiple()` | `await element.multiple()` | `Promise<boolean>` |
| `options()` | `await element.options()` | `Promise<Element[]>` |
| `selectedIndex()` | `await element.selectedIndex()` | `Promise<number>` |
| `selectedOptions()` | `await element.selectedOptions()` | `Promise<Element[]>` |
| `visible()` | `await element.visible()` | `Promise<boolean>` |

## Methods

---
### highlight

`highlight(): Promise<void>`

Highlights the element in the page.

### Usage

```js
await element.highlight();
```

### Arguments

- None

### Returns

- `Promise<void>`

---
### getProperty

`getProperty(name: string): Promise<unknown>`

Reads a property from the element.

### Usage

```js
const value = await element.getProperty('value');
expect(value).toBeDefined();
```

### Arguments

- `name` `<string>`

### Returns

- `Promise<unknown>`

---
### setProperty

`setProperty(name: string, value: unknown): Promise<void>`

Sets a property on the element.

### Usage

```js
await element.setProperty('value', 'hello');
```

### Arguments

- `name` `<string>`
- `value` `<unknown>`

### Returns

- `Promise<void>`

---
### getBoundingClientRect

`getBoundingClientRect(): Promise<RectInfo>`

Returns the element client rect.

### Usage

```js
const rect = await element.getBoundingClientRect();
expect(rect.width >= 0).toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<RectInfo>`

---
### dispatchEvent

`dispatchEvent(type: string, options?: object): Promise<void>`

Dispatches a DOM event.

### Usage

```js
await element.dispatchEvent('click');
```

### Arguments

- `type` `<string>`
- `options?` `<object>`

### Returns

- `Promise<void>`

---
### sendCDPCommand

`sendCDPCommand(method: string, commandParams?: { [key: string]: unknown }): Promise<void>`

Sends a raw CDP command for this element.

### Usage

```js
await browser.attachDebugger();
await element.sendCDPCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 100, y: 200 });
```

### Arguments

- `method` `<string>`
- `commandParams?` `<{ [key: string]: unknown }>`

### Returns

- `Promise<void>`

---
### getAttribute

`getAttribute(name: string): Promise<string | null>`

Gets an attribute value.

### Usage

```js
const id = await element.getAttribute('id');
expect(id === null || typeof id === 'string').toBeTruthy();
```

### Arguments

- `name` `<string>`

### Returns

- `Promise<string | null>`

---
### getAttributes

`getAttributes(): Promise<Record<string, unknown>>`

Returns a map of attributes.

### Usage

```js
const attrs = await element.getAttributes();
expect(typeof attrs === 'object').toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<Record<string, unknown>>`

---
### setAttribute

`setAttribute(name: string, value: string): Promise<void>`

Sets an attribute value.

### Usage

```js
await element.setAttribute('data-qa', 'submit');
```

### Arguments

- `name` `<string>`
- `value` `<string>`

### Returns

- `Promise<void>`

---
### hasAttribute

`hasAttribute(name: string): Promise<boolean>`

Checks whether the element has an attribute.

### Usage

```js
const has = await element.hasAttribute('data-qa');
expect(typeof has === 'boolean').toBeTruthy();
```

### Arguments

- `name` `<string>`

### Returns

- `Promise<boolean>`

---
### toggleAttribute

`toggleAttribute(name: string, force?: boolean): Promise<boolean>`

Toggles an attribute and returns the new state.

### Usage

```js
const on = await element.toggleAttribute('multiple', true);
expect(on).toBeTruthy();
```

### Arguments

- `name` `<string>`
- `force?` `<boolean>`

### Returns

- `Promise<boolean>`

---
### querySelectorAll

`querySelectorAll(selector: string): Promise<Element[]>`

Queries within the element subtree.

### Usage

```js
const children = await element.querySelectorAll('div');
expect(children.length >= 0).toBeTruthy();
```

### Arguments

- `selector` `<string>`

### Returns

- `Promise<Element[]>`

---
### checkValidity

`checkValidity(): Promise<boolean>`

Returns whether the element is valid (for form controls).

### Usage

```js
const valid = await element.checkValidity();
expect(typeof valid === 'boolean').toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<boolean>`

---
### checkVisibility

`checkVisibility(options?: object): Promise<boolean>`

Checks element visibility.

### Usage

```js
const visible = await element.checkVisibility();
expect(typeof visible === 'boolean').toBeTruthy();
```

### Arguments

- `options?` `<object>`

### Returns

- `Promise<boolean>`

---
### focus

`focus(): Promise<void>`

Focuses the element.

### Usage

```js
await element.focus();
```

### Arguments

- None

### Returns

- `Promise<void>`

---
### blur

`blur(): Promise<void>`

Blurs the element.

### Usage

```js
await element.blur();
```

### Arguments

- None

### Returns

- `Promise<void>`

---
### scrollIntoViewIfNeeded

`scrollIntoViewIfNeeded(): Promise<void>`

Scrolls the element into view.

### Usage

```js
await element.scrollIntoViewIfNeeded();
```

### Arguments

- None

### Returns

- `Promise<void>`

---
### check

`check(options?: ActionOptions): Promise<void>`

Checks a checkbox/radio.

### Usage

```js
await page.element('input[type=\"checkbox\"]').first().check();
```

### Arguments

- `options?` `<ActionOptions>`

### Returns

- `Promise<void>`

---
### uncheck

`uncheck(options?: ActionOptions): Promise<void>`

Unchecks a checkbox.

### Usage

```js
await page.element('input[type=\"checkbox\"]').first().uncheck();
```

### Arguments

- `options?` `<ActionOptions>`

### Returns

- `Promise<void>`

---
### selectOption

`selectOption(values: string | string[] | number | number[] | Element | Element[]): Promise<void>`

Selects an option in a `<select>`.

### Usage

```js
await page.element('select').first().selectOption('value1');
```

### Arguments

- `values` `<string | string[] | number | number[] | Element | Element[]>`

### Returns

- `Promise<void>`

---
### setFileInputFiles

`setFileInputFiles(files: string | string[]): Promise<void>`

Sets files on a file input.

### Usage

```js
await page.element('input[type=\"file\"]').get().then(el => el.setFileInputFiles('/path/to/file.png'));
```

### Arguments

- `files` `<string | string[]>`

### Returns

- `Promise<void>`

---
### element

`element(selector?: ElementLocatorOptions | string): ElementLocator`

Creates an element locator scoped within this element.

### Usage

```js
await element.element('li').first().click();
```

### Arguments

- `selector?` `<ElementLocatorOptions | string>`

### Returns

- `ElementLocator`

---
### text

`text(selector?: TextLocatorOptions | string | RegExp): TextLocator`

Creates a text locator scoped within this element.

### Usage

```js
await element.text(/Item \\d+/).first().highlight();
```

### Arguments

- `selector?` `<TextLocatorOptions | string | RegExp>`

### Returns

- `TextLocator`

---
### hover

`hover(options?: { position?: Point } & ActionOptions): Promise<void>`

### Usage

```js
await element.hover();
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
await element.click();
await element.click({ mode: 'cdp' });
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
await element.dblclick();
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
await element.wheel({ deltaY: 120 });
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
const source = await page.element('#drag-source').get();
const target = await page.element('#drop-target').get();
await source.dragTo(target);
```

### Arguments

- `target` `<Element | Text>`
- `options?` `<{ sourcePosition?: Point, targetPosition?: Point, steps?: number } & ActionOptions>`

### Returns

- `Promise<void>`

---
### fill

`fill(text: string, options?: TextInputOptions & ActionOptions): Promise<void>`

Fills text into an input/textarea/contenteditable element.

### Usage

```js
await page.element('#input_fill').fill('Hello');
```

### Arguments

- `text` `<string>`
- `options?` `<TextInputOptions & ActionOptions>`

### Returns

- `Promise<void>`

---
### clear

`clear(options?: ActionOptions): Promise<void>`

Clears text content of an editable element.

### Usage

```js
await page.element('#input_clear').clear();
```

### Arguments

- `options?` `<ActionOptions>`

### Returns

- `Promise<void>`

---
### press

`press(keys: string | string[], options?: { delayBetweenDownUp?: number } & ActionOptions): Promise<void>`

Presses a key or chord.

### Usage

```js
await page.element('#input_fill').press(['Shift', 'KeyA']);
```

### Arguments

- `keys` `<string | string[]>`
- `options?` `<{ delayBetweenDownUp?: number } & ActionOptions>`

### Returns

- `Promise<void>`

---
### tap

`tap(options?: { position?: Point } & ActionOptions): Promise<void>`

Taps on the element.

### Usage

```js
await element.tap();
```

### Arguments

- `options?` `<{ position?: Point } & ActionOptions>`

### Returns

- `Promise<void>`

---
### ownerFrame

`ownerFrame(): Promise<Frame>`

Returns the frame that owns this element.

### Usage

```js
const frame = await element.ownerFrame();
expect(frame).toBeDefined();
```

### Arguments

- None

### Returns

- `Promise<Frame>`

---
### contentFrame

`contentFrame(): Promise<Frame | null>`

If this element is an iframe/frame, returns the contained frame.

### Usage

```js
const frame = await element.contentFrame();
expect(frame === null || typeof frame === 'object').toBeTruthy();
```

### Arguments

- None

### Returns

- `Promise<Frame | null>`
