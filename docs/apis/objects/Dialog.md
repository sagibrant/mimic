# Dialog

Represents the dialog on a page (`alert/confirm/prompt/beforeunload`).

## Getting Started

### Usage

```js
await browser.attachDebugger();

const onDialog = async (dialog) => {
  expect(await dialog.opened()).toBeTruthy();
  await dialog.accept();
  page.off('dialog', onDialog);
};

page.on('dialog', onDialog);
await page.element('#alert_button').click({ mode: 'cdp' });
```

### Notes

This Dialog Event approach is the suggested solution rather than `page.dialog()`.

## Methods

---
### page

`page(): Promise<Page>`

Returns the page that triggered the dialog.

#### Usage

```js
const p = await page.dialog().page();
expect(p).toBeDefined();
```

#### Arguments

- None

#### Returns

- `Promise<Page>`

---
### opened

`opened(): Promise<boolean>`

Returns whether the dialog is currently open.

#### Usage

```js
const open = await page.dialog().opened();
expect(typeof open === 'boolean').toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<boolean>`

---
### type

`type(): Promise<'alert' | 'confirm' | 'prompt' | 'beforeunload'>`

Returns the dialog type.

#### Usage

```js
const t = await page.dialog().type();
expect(['alert', 'confirm', 'prompt', 'beforeunload']).toContain(t);
```

#### Arguments

- None

#### Returns

- `Promise<'alert' | 'confirm' | 'prompt' | 'beforeunload'>`

---
### defaultValue

`defaultValue(): Promise<string>`

Returns the default prompt value.

#### Usage

```js
const v = await page.dialog().defaultValue();
expect(typeof v === 'string').toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<string>`

---
### message

`message(): Promise<string>`

Returns the dialog message.

#### Usage

```js
const msg = await page.dialog().message();
expect(typeof msg === 'string').toBeTruthy();
```

#### Arguments

- None

#### Returns

- `Promise<string>`

---
### accept

`accept(promptText?: string): Promise<void>`

Accepts the dialog. For prompt dialogs, you can provide `promptText`.

#### Usage

```js
await page.dialog().accept();
```

#### Arguments

- `promptText?` `<string>`

#### Returns

- `Promise<void>`

---
### dismiss

`dismiss(): Promise<void>`

Dismisses the dialog.

#### Usage

```js
await page.dialog().dismiss();
```

#### Arguments

- None

#### Returns

- `Promise<void>`
