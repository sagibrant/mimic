/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file locator.js
 * @description 3. event fill test
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

console.log('element fill ======>');
console.log('current page', page);
const inputModes = ['default', 'event', 'cdp'];
for (const inputMode of inputModes) {
  console.log(`inputMode ${inputMode} ======>`);
  const url_keyboard = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/keyboard.html';
  await page.navigate(url_keyboard);
  await page.sync();

  const defaultOptions = inputMode === 'default' ? undefined : { mode: inputMode };

  try {
    if (inputMode === 'cdp') {
      await browser.attachDebugger();
      console.log('await browser.attachDebugger()');
      await wait(1000);
      console.log('await wait(1000)');
    }

    // start monitor
    {
      const btn = await page.element('#btn_start_monitor').get();
      console.log(`await page.element("#btn_start_monitor").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');
      await page.element('#btn_start_monitor').click(defaultOptions);
      console.log(`
        await page.element("#btn_start_monitor").click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);
    }

    // input_clear
    {
      const editor = await page.element('#input_clear').get();
      console.log(`await page.element("#input_clear").get()`, editor);
      expect(editor).not.toBeNullOrUndefined();
      await editor.scrollIntoViewIfNeeded();
      console.log('await editor.scrollIntoViewIfNeeded()');

      await page.element('#input_clear').clear(defaultOptions);
      console.log(`
        await page.element("#input_clear").clear(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      if (inputMode === 'cdp') {
        await page.element('#input_clear').press('Tab', defaultOptions);
        console.log(
          `await page.element("#input_clear").press('Tab', ${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions});`
        );
      }

      const value = await page.element('#input_clear').value();
      console.log(`await page.element("#input_clear").value()`, value);
      expect(value).toEqual('');

      const output = await page.element('#output_input_clear').innerText();
      console.log(`await page.element("#output_input_clear").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_input_clear").innerText() events`, events);
      expect(events).toContain('input');
      expect(events).toContain('change');
    }

    // textarea_fill
    {
      const editor = await page.element('#textarea_fill').get();
      console.log(`await page.element("#textarea_fill").get()`, editor);
      expect(editor).not.toBeNullOrUndefined();
      await editor.scrollIntoViewIfNeeded();
      console.log('await editor.scrollIntoViewIfNeeded()');

      const text = '👋你好呀🤣，这是带unicode的文本！';

      await page.element('#textarea_fill').fill(text, defaultOptions);
      console.log(`
        await page.element("#textarea_fill").fill('${text}', ${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      if (inputMode === 'cdp') {
        await page.element('#textarea_fill').press('Tab', defaultOptions);
        console.log(
          `await page.element("#textarea_fill").press('Tab', ${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions});`
        );
      }

      const value = await page.element('#textarea_fill').value();
      console.log(`await page.element("#textarea_fill").value()`, value);
      expect(value).toEqual(text);

      const output = await page.element('#output_textarea_fill').innerText();
      console.log(`await page.element("#output_textarea_fill").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_textarea_fill").innerText() events`, events);
      expect(events).toContain('input');
      expect(events).toContain('change');
    }

    // input_fill
    {
      const editor = await page.element('#input_fill').get();
      console.log(`await page.element("#input_fill").get()`, editor);
      expect(editor).not.toBeNullOrUndefined();
      await editor.scrollIntoViewIfNeeded();
      console.log('await editor.scrollIntoViewIfNeeded()');

      await page.element('#input_fill').fill('', defaultOptions);
      console.log(`
        await page.element("#input_fill").fill('', ${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      if (inputMode === 'cdp') {
        await page.element('#input_fill').press('Tab', defaultOptions);
        console.log(
          `await page.element("#input_fill").press('Tab', ${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions});`
        );
      }

      let value = await page.element('#input_fill').value();
      console.log(`await page.element("#input_fill").value()`, value);
      expect(value).toEqual('');

      await page.element('#input_fill').click(defaultOptions);
      console.log(
        `await page.element("#input_fill").click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})`
      );

      for (let i = 0; i < 3; i++) {
        const options = Object.assign({}, defaultOptions, { delayBetweenDownUp: i * 10 });
        await page.element('#input_fill').press(['Shift', 'KeyA'], options);
        console.log(`
          await page.element("#input_fill").press(['Shift', 'KeyA'], ${options ? JSON.stringify(options) : options})
        `);
      }

      value = await page.element('#input_fill').value();
      console.log(`await page.element("#input_fill").value()`, value);
      expect(value).toEqual('AAA');

      const output = await page.element('#output_input_fill').innerText();
      console.log(`await page.element("#output_input_fill").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_input_fill").innerText() events`, events);
      expect(events).toContain('input');
      expect(events).toContain('change');
    }

    // contenteditable_fill
    {
      const editor = await page.element('#contenteditable_fill').get();
      console.log(`await page.element("#contenteditable_fill").get()`, editor);
      expect(editor).not.toBeNullOrUndefined();
      await page.element('#contenteditable_fill').scrollIntoViewIfNeeded();
      console.log(`await page.element("#contenteditable_fill").scrollIntoViewIfNeeded()`);

      const text = '👋你好呀🤣，这是带unicode的文本！';

      const options = Object.assign({}, defaultOptions, { delayBetweenDownUp: 10, delayBetweenChar: 50 });
      await page.element('#contenteditable_fill').fill(text, options);
      console.log(`
        await page.element("#contenteditable_fill").fill('${text}', ${options ? JSON.stringify(options) : options})
      `);

      if (inputMode === 'cdp') {
        await page.element('#contenteditable_fill').press('Tab', defaultOptions);
        console.log(
          `await page.element("#contenteditable_fill").press('Tab', ${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions});`
        );
      }

      let textContent = await page.element('#contenteditable_fill').textContent();
      console.log(`await page.element("#contenteditable_fill").textContent()`, textContent);
      expect(textContent).toEqual(text);

      const output = await page.element('#output_contenteditable_fill').innerText();
      console.log(`await page.element("#output_contenteditable_fill").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_contenteditable_fill").innerText() events`, events);
      expect(events).toContain('input');
    }
  } catch (error) {
    throw error;
  } finally {
    // btn_stop_monitor
    {
      const btn = await page.element('#btn_stop_monitor').get();
      console.log(`await page.element("#btn_stop_monitor").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await page.element('#btn_stop_monitor').scrollIntoViewIfNeeded();
      console.log(`await page.element("#btn_stop_monitor").scrollIntoViewIfNeeded()`);
      await page.element('#btn_stop_monitor').click(defaultOptions);
      console.log(`
        await page.element("#btn_stop_monitor").click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);
    }
    if (inputMode === 'cdp') {
      await browser.detachDebugger();
      console.log('await browser.detachDebugger()');
      await wait(1000);
      console.log('await wait(1000)');
    }
    console.log(`inputMode ${inputMode} <======`);
  }
}

console.log('element fill <======');

await page.bringToFront();

console.warn('all passed');
