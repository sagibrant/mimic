# Types

Public option objects and data structures used by the Mimic SDK APIs.

All definitions here are aligned to [types.d.ts](file:///Users/sagi/Workspace/src/sagibrant/mimic/packages/core/src/types/types.d.ts).

## LocatorFilterOption

Used by `locator.filter(...)` and `locator.prefer(...)`.

### Fields

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Key to match (property/attribute/function/text). |
| `value?` | `string \| number \| boolean \| RegExp` | Value to match. |
| `type?` | `'property' \| 'attribute' \| 'function' \| 'text'` | Match target category. Default is `'property'`. |
| `match?` | `'has' \| 'hasNot' \| 'exact' \| 'includes' \| 'startsWith' \| 'endsWith' \| 'regex'` | Match mode. |

### Usage

```js
page.element().filter({ type: 'attribute', name: 'id', value: 'login-button' });
page.element().filter({ type: 'property', name: 'disabled', value: false });
page.element().filter({ type: 'attribute', name: 'class', value: /primary/i, match: 'regex' });
page.element().filter({ type: 'attribute', name: 'data-test', match: 'has' });
page.element().filter({ type: 'function', name: 'click', match: 'has' });
```

## BrowserLocatorOptions

Used by `BrowserLocatorOptions`.

### Fields

| Field | Type |
| --- | --- |
| `name?` | `string` |
| `version?` | `string` |
| `processId?` | `number` |

### Usage

```js
const page = await browser.page({ active: true, lastFocusedWindow: true }).get();
await page.bringToFront();
```

## WindowLocatorOptions

### Fields

| Field | Type |
| --- | --- |
| `lastFocused?` | `boolean` |

### Usage

```js
const win = await browser.window({ lastFocused: true }).get();
await win.focus();
```

## PageLocatorOptions

### Fields

| Field | Type |
| --- | --- |
| `url?` | `string \| RegExp` |
| `title?` | `string \| RegExp` |
| `active?` | `boolean` |
| `lastFocusedWindow?` | `boolean` |
| `index?` | `number` |

### Usage

```js
const page = await browser.page({ active: true, lastFocusedWindow: true }).get();
await page.bringToFront();
```

## FrameLocatorOptions

### Fields

| Field | Type |
| --- | --- |
| `url?` | `string \| RegExp` |
| `selector?` | `string` |

### Usage

```js
const frame = await page.frame({ url: /embedded/ }).get();
await frame.text(/submit/i).first().click();
```

## ElementLocatorOptions

### Fields

| Field | Type |
| --- | --- |
| `selector?` | `string` |
| `xpath?` | `string` |

### Usage

```js
await page.element({ selector: '#btn_click' }).click();
```

## TextLocatorOptions

### Fields

| Field | Type |
| --- | --- |
| `text?` | `string \| RegExp` |

### Usage

```js
await page.text({ text: /Welcome/ }).first().highlight();
```

## ActionOptions

Used by most actions (click/fill/hover/etc).

### Fields

| Field | Type | Description |
| --- | --- | --- |
| `mode?` | `'event' \| 'cdp'` | Input mode. |
| `force?` | `boolean` | Force the action when applicable. |

### Usage

```js
await browser.attachDebugger();
await page.element('#submit').click({ mode: 'cdp' });
```

## ClickOptions

### Fields

| Field | Type |
| --- | --- |
| `button?` | `'left' \| 'right' \| 'middle'` |
| `clickCount?` | `number` |
| `position?` | `Point` |
| `modifiers?` | `Array<'Alt' \| 'Control' \| 'ControlOrMeta' \| 'Meta' \| 'Shift'>` |
| `delayBetweenDownUp?` | `number` |
| `delayBetweenClick?` | `number` |

### Usage

```js
await page.element('#submit').click({ button: 'left', clickCount: 2 });
```

## TextInputOptions

### Fields

| Field | Type |
| --- | --- |
| `delayBetweenDownUp?` | `number` |
| `delayBetweenChar?` | `number` |

### Usage

```js
await page.keyboard().type('Hello', { delayBetweenChar: 50 });
```

## Cookie

### Fields

| Field | Type |
| --- | --- |
| `name` | `string` |
| `value` | `string` |
| `domain?` | `string` |
| `path?` | `string` |
| `expires?` | `number` |
| `httpOnly?` | `boolean` |
| `secure?` | `boolean` |
| `session?` | `boolean` |
| `sameSite?` | `'Strict' \| 'Lax' \| 'None'` |
| `partitionKey?` | `string` |

### Usage

```js
await browser.addCookies({ name: 'test_cookie', value: '1', url: 'https://juejin.cn/' });
const cookies = await browser.cookies('https://juejin.cn/');
expect(cookies.length >= 0).toBeTruthy();
```

## Point

### Fields

| Field | Type |
| --- | --- |
| `x` | `number` |
| `y` | `number` |

## RectInfo

### Fields

| Field | Type |
| --- | --- |
| `left` | `number` |
| `top` | `number` |
| `right` | `number` |
| `bottom` | `number` |
| `width` | `number` |
| `height` | `number` |
| `x` | `number` |
| `y` | `number` |
