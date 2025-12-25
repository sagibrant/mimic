/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file keyboard.js
 * @description 3. keyboard test
 *
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

expect(browser).not.toBeNullOrUndefined();
expect(page).not.toBeNullOrUndefined();
expect(expect).not.toBeNullOrUndefined();
expect(wait).not.toBeNullOrUndefined();

const clean = async () => {
  const page = await browser.page({ active: true, lastFocusedWindow: true }).get();
  await page.bringToFront();
  const windows = await browser.windows();
  expect(windows.length > 0).toBeTruthy();
  // close other windows
  for (const window of windows) {
    const focused = await window.focused();
    if (!focused) {
      await window.close();
    }
  }
  if (windows.length > 1) {
    await wait(300);
  }
  const pages = await browser.pages();
  expect(pages.length > 0).toBeTruthy();
  // close other pages
  for (const page of pages) {
    const closed = await page.closed();
    if (closed) {
      continue;
    }
    const active = await page.active();
    if (!active) {
      await page.close();
    }
  }
};

await clean();

console.log('keyboard =>');
console.log('current page', page);
const url_keyboard = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/keyboard.html';

await page.navigate(url_keyboard);
console.log('await page.navigate(url_keyboard)', url_keyboard);
await page.sync();
console.log('await page.sync()');
let page_status = await page.status();
console.log('await page.status()', page_status);
expect(page_status).toBe('complete');
let page_url = await page.url();
console.log('await page.url()', page_url);
expect(page_url).toEqual(url_keyboard);

const keyboard = page.keyboard();
console.log('page.keyboard()', keyboard);
expect(keyboard).not.toBeNullOrUndefined();

const mouse = page.mouse();
console.log('page.mouse()', mouse);
expect(mouse).not.toBeNullOrUndefined();

try {
  await browser.attachDebugger();
  console.log('await browser.attachDebugger()');
  // start monitor
  {
    const btn_id = 'btn_start_monitor';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.click(x, y);
    console.log(` await mouse.click(${x}, ${y}); `);
  }

  // await keyboard.type(''); for #input_clear
  {
    const input_id = 'input_clear';
    const input = await page.element(`#${input_id}`).first().get();
    console.log(`await page.element(\"#${input_id}\").first().get()`, input);
    expect(input).not.toBeNullOrUndefined();

    await input.scrollIntoViewIfNeeded();
    console.log('await input.scrollIntoViewIfNeeded()');

    const old_value = await input.value();
    console.log('await input.value()', old_value);

    const boundingBox = await input.boundingBox();
    console.log('await input.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;
    await mouse.click(x, y);
    console.log(` await mouse.click(${x}, ${y}); `);

    await keyboard.type('');
    console.log(` await keyboard.type(''); `);

    const value = await input.value();
    console.log('await input.value()', value);
    // expect(value).toEqual('');
  }

  // await keyboard.type(text); unicode for #textarea_fill
  {
    const textarea_id = 'textarea_fill';
    const textarea = await page.element().filter({ name: 'id', value: textarea_id }).first().get();
    console.log(`await page.element().filter({ name: 'id', value: '${textarea_id}' }).first().get();`, textarea);
    expect(textarea).not.toBeNullOrUndefined();

    await textarea.scrollIntoViewIfNeeded();
    console.log('await textarea.scrollIntoViewIfNeeded()');

    const old_value = await textarea.value();
    console.log('await textarea.value()', old_value);

    const boundingBox = await textarea.boundingBox();
    console.log('await textarea.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;
    await mouse.click(x, y);
    console.log(` await mouse.click(${x}, ${y}); `);

    const text = '👋你好呀🤣，这是带unicode的文本！';
    await keyboard.type(text);
    console.log(` await keyboard.type('${text}'); `);

    const value = await textarea.value();
    console.log('await textarea.value()', value);
    // expect(value).toEqual(old_value + text);
  }

  // await keyboard.press(['ControlOrMeta', 'a']); for #input_fill
  {
    const input_id = 'input_fill';
    const input = await page.element().filter({ name: 'id', value: input_id }).last().get();
    console.log(`await page.element().filter({name:'id', value:'${input_id}'}).first().get()`, input);

    expect(input).not.toBeNullOrUndefined();

    await input.scrollIntoViewIfNeeded();
    console.log('await input.scrollIntoViewIfNeeded()');

    const old_value = await input.value();
    console.log('await input.value()', old_value);

    const boundingBox = await input.boundingBox();
    console.log('await input.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;
    await mouse.click(x, y);
    console.log(` await mouse.click(${x}, ${y}); `);

    await keyboard.press(['ControlOrMeta', 'a']);
    console.log(` await keyboard.press(['ControlOrMeta', 'a']); `);
    await keyboard.press(['Backspace']);
    console.log(` await keyboard.press(['Backspace']); `);

    const value = await input.value();
    console.log('await input.value()', value);
    // expect(value).toEqual('');
  }

  // await keyboard.type(text); for #contenteditable_fill
  {
    const contenteditable_id = 'contenteditable_fill';
    const contenteditable = await page.element().filter({ name: 'id', value: contenteditable_id }).get();
    console.log(
      `await page.element().filter({name:'id', value:'${contenteditable_id}'}).first().get()`,
      contenteditable
    );
    expect(contenteditable).not.toBeNullOrUndefined();
    await contenteditable.scrollIntoViewIfNeeded();
    console.log('await contenteditable.scrollIntoViewIfNeeded()');

    const boundingBox = await contenteditable.boundingBox();
    console.log('await contenteditable.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;
    await mouse.click(x, y);
    console.log(` await mouse.click(${x}, ${y}); `);

    const old_value = await contenteditable.textContent();
    console.log('await contenteditable.textContent()', old_value);

    const text = '👋你好呀🤣，这是带unicode的文本！';
    await keyboard.type(text);
    console.log(` await keyboard.type('${text}'); `);

    let value = await contenteditable.textContent();
    console.log('await contenteditable.textContent()', value);
    // expect(value).toEqual(text);
  }

  // stop monitor
  {
    const btn_id = 'btn_stop_monitor';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.click(x, y);
    console.log(` await mouse.click(${x}, ${y}); `);
  }
} catch (error) {
  throw error;
} finally {
  await browser.detachDebugger();
  console.log('await browser.detachDebugger()');
  await page.bringToFront();
}

console.log('keyboard <=');

console.warn('all passed');
