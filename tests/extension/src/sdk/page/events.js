/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file events.js
 * @description 5. events test
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

console.log('events =>');
console.log('current page', page);
const url_index = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/index.html';

await page.navigate(url_index);
console.log('await page.navigate(url_index)', url_index);
let page_status = await page.status();
console.log('await page.status()', page_status);
while (page_status !== 'complete') {
  await page.sync();
  console.log('await page.sync()');
  page_status = await page.status();
  console.log('await page.status()', page_status);
}
expect(page_status).toBe('complete');
let page_url = await page.url();
console.log('await page.url()', page_url);
expect(page_url).toEqual(url_index);

const dialog = page.dialog();
console.log('page.dialog()', dialog);
expect(dialog).not.toBeNullOrUndefined();

try {
  console.log('page dialog events ====> ');
  // dialog
  {
    await browser.attachDebugger();
    console.log('await browser.attachDebugger()');
    await wait(300);
    console.log('await wait(300)');
  }

  // alert_button
  {
    const btn = await page.element().filter({ name: 'id', value: 'alert_button' }).get();
    console.log(
      `
      await page.element().filter({ name: 'id', value: 'alert_button'}).get()
    `,
      btn
    );
    expect(btn).not.toBeNullOrUndefined();
    await page.element().filter({ name: 'id', value: 'alert_button' }).scrollIntoViewIfNeeded();
    console.log(
      `
      await page.element().filter({ name: 'id', value: 'alert_button'}).scrollIntoViewIfNeeded()
    `,
      btn
    );

    let dialogHandled = false;
    const dialogOpenListener = async dialog => {
      console.log(` dialogOpenListener for alert ==> `, dialog);

      expect(dialog).toBe(page.dialog());

      let opened = await dialog.opened();
      console.log(
        `
        await page.dialog().opened()
      `,
        opened
      );
      expect(opened).toBeTruthy();

      opened = await page.dialog().opened();
      console.log(
        `
        await page.dialog().opened()
      `,
        opened
      );
      expect(opened).toBeTruthy();

      const type = await page.dialog().type();
      console.log(
        `
        await page.dialog().type()
      `,
        type
      );
      expect(type).toBe('alert');

      const message = await page.dialog().message();
      console.log(
        `
        await page.dialog().message()
      `,
        message
      );
      expect(message).toBe('this is the alert message');

      const defaultValue = await page.dialog().defaultValue();
      console.log(
        `
        await page.dialog().defaultValue()
      `,
        defaultValue
      );
      expect(defaultValue).toBe('');

      await page.dialog().accept();
      console.log(`
        await page.dialog().accept()
      `);

      opened = await dialog.opened();
      console.log(
        `
        await page.dialog().opened()
      `,
        opened
      );
      expect(opened).toBeFalsy();

      const value = await page.element().filter({ name: 'id', value: 'alert_button' }).value();
      console.log(
        `
        await page.element().filter({ name: 'id', value: 'alert_button' }).value()
      `,
        value
      );
      expect(value).toEqual('alert dialog is clicked');

      dialogHandled = true;
      page.off('dialog', dialogOpenListener);
      console.log("page.off('dialog', dialogOpenListener)");

      console.log(` dialogOpenListener for alert <== `);
    };

    page.on('dialog', dialogOpenListener);
    console.log("page.on('dialog', dialogOpenListener)");

    await page.element().filter({ name: 'id', value: 'alert_button' }).click({ mode: 'cdp' });
    console.log(`
      await page.element().filter({ name: 'id', value: 'alert_button' }).click({ mode: 'cdp' });
    `);

    let wait_count = 0;
    if (!dialogHandled && wait_count < 3) {
      await wait(300);
      console.log('await wait(300)');
      wait_count++;
    }
    expect(dialogHandled).toBeTruthy();

    const opened = await page.dialog().opened();
    console.log(
      `
        await page.dialog().opened()
      `,
      opened
    );
    expect(opened).toBeFalsy();
  }

  // confirm_button
  {
    const btn = await page.element().filter({ name: 'id', value: 'confirm_button' }).get();
    console.log(
      `
      await page.element().filter({ name: 'id', value: 'confirm_button'}).get()
    `,
      btn
    );
    expect(btn).not.toBeNullOrUndefined();
    await page.element().filter({ name: 'id', value: 'confirm_button' }).scrollIntoViewIfNeeded();
    console.log(
      `
      await page.element().filter({ name: 'id', value: 'confirm_button'}).scrollIntoViewIfNeeded()
    `,
      btn
    );

    const actions = [true, false];
    for (const action of actions) {
      let dialogHandled = false;
      const dialogOpenListener = async dialog => {
        console.log(` dialogOpenListener for confirm ==> `, dialog);

        expect(dialog).toBe(page.dialog());

        let opened = await dialog.opened();
        console.log(
          `
          await page.dialog().opened()
        `,
          opened
        );
        expect(opened).toBeTruthy();

        opened = await page.dialog().opened();
        console.log(
          `
          await page.dialog().opened()
        `,
          opened
        );
        expect(opened).toBeTruthy();

        const type = await page.dialog().type();
        console.log(
          `
          await page.dialog().type()
        `,
          type
        );
        expect(type).toBe('confirm');

        const message = await page.dialog().message();
        console.log(
          `
          await page.dialog().message()
        `,
          message
        );
        expect(message).toBe('this is the confirm message');

        const defaultValue = await page.dialog().defaultValue();
        console.log(
          `
          await page.dialog().defaultValue()
        `,
          defaultValue
        );
        expect(defaultValue).toBe('');

        if (action) {
          await page.dialog().accept();
          console.log(`
            await page.dialog().accept()
          `);
        } else {
          await page.dialog().dismiss();
          console.log(`
            await page.dialog().dismiss()
          `);
        }

        opened = await dialog.opened();
        console.log(
          `
          await page.dialog().opened()
        `,
          opened
        );
        expect(opened).toBeFalsy();

        const value = await page.element().filter({ name: 'id', value: 'confirm_button' }).value();
        console.log(
          `
          await page.element().filter({ name: 'id', value: 'confirm_button' }).value()
        `,
          value
        );
        if (action) {
          expect(value).toEqual('confirm dialog is accepted');
        } else {
          expect(value).toEqual('confirm dialog is dismissed');
        }

        dialogHandled = true;
        page.off('dialog', dialogOpenListener);
        console.log("page.off('dialog', dialogOpenListener)");

        console.log(` dialogOpenListener for confirm <== `);
      };

      page.on('dialog', dialogOpenListener);
      console.log("page.on('dialog', dialogOpenListener)");

      await page.element().filter({ name: 'id', value: 'confirm_button' }).click({ mode: 'cdp' });
      console.log(`
        await page.element().filter({ name: 'id', value: 'confirm_button' }).click({ mode: 'cdp' })
      `);

      let wait_count = 0;
      if (!dialogHandled && wait_count < 3) {
        await wait(300);
        console.log('await wait(300)');
        wait_count++;
      }
      expect(dialogHandled).toBeTruthy();

      const opened = await page.dialog().opened();
      console.log(
        `
        await page.dialog().opened()
      `,
        opened
      );
      expect(opened).toBeFalsy();
    }
  }

  // prompt_button
  {
    const btn = await page.element().filter({ name: 'id', value: 'prompt_button' }).get();
    console.log(
      `
      await page.element().filter({ name: 'id', value: 'prompt_button'}).get()
    `,
      btn
    );
    expect(btn).not.toBeNullOrUndefined();
    await page.element().filter({ name: 'id', value: 'prompt_button' }).scrollIntoViewIfNeeded();
    console.log(
      `
      await page.element().filter({ name: 'id', value: 'prompt_button'}).scrollIntoViewIfNeeded()
    `,
      btn
    );

    const promptTexts = [null, undefined, '', 'new text'];
    for (const text of promptTexts) {
      let dialogHandled = false;
      const dialogOpenListener = async dialog => {
        console.log(` dialogOpenListener for prompt ==> `, dialog);
        expect(dialog).toBe(page.dialog());
        let opened = await dialog.opened();
        console.log(
          `
          await page.dialog().opened()
        `,
          opened
        );
        expect(opened).toBeTruthy();

        opened = await page.dialog().opened();
        console.log(
          `
          await page.dialog().opened()
        `,
          opened
        );
        expect(opened).toBeTruthy();

        const type = await page.dialog().type();
        console.log(
          `
          await page.dialog().type()
        `,
          type
        );
        expect(type).toBe('prompt');

        const message = await page.dialog().message();
        console.log(
          `
          await page.dialog().message()
        `,
          message
        );
        expect(message).toBe('this is the default prompt message');

        const defaultValue = await page.dialog().defaultValue();
        console.log(
          `
          await page.dialog().defaultValue()
        `,
          defaultValue
        );
        expect(defaultValue).toBe('this is the default prompt message value');

        if (text === null) {
          await page.dialog().dismiss();
          console.log(`
            await page.dialog().dismiss()
          `);
        } else if (text === undefined) {
          await page.dialog().accept();
          console.log(`
            await page.dialog().accept()
          `);
        } else if (text === '') {
          await page.dialog().accept('');
          console.log(`
            await page.dialog().accept('')
          `);
        } else {
          await page.dialog().accept(text);
          console.log(`
            await page.dialog().accept(${text})
          `);
        }

        opened = await dialog.opened();
        console.log(
          `
          await page.dialog().opened()
        `,
          opened
        );
        expect(opened).toBeFalsy();

        const value = await page.element().filter({ name: 'id', value: 'prompt_button' }).value();
        console.log(
          `
          await page.element().filter({ name: 'id', value: 'prompt_button' }).value()
        `,
          value
        );
        if (text === null) {
          expect(value).toBe('prompt dialog is clicked with value-null');
        } else if (text === undefined) {
          expect(value).toBe('prompt dialog is clicked with value-this is the default prompt message value');
        } else if (text === '') {
          expect(value).toBe('prompt dialog is clicked with value-');
        } else {
          expect(value).toBe(`prompt dialog is clicked with value-${text}`);
        }

        dialogHandled = true;
        page.off('dialog', dialogOpenListener);
        console.log("page.off('dialog', dialogOpenListener)");

        console.log(` dialogOpenListener for prompt <== `);
      };

      page.on('dialog', dialogOpenListener);
      console.log("page.on('dialog', dialogOpenListener)");

      await page.element().filter({ name: 'id', value: 'prompt_button' }).click({ mode: 'cdp' });
      console.log(`
        await page.element().filter({ name: 'id', value: 'prompt_button' }).click({ mode: 'cdp' })
      `);

      let wait_count = 0;
      if (!dialogHandled && wait_count < 3) {
        await wait(300);
        console.log('await wait(300)');
        wait_count++;
      }
      expect(dialogHandled).toBeTruthy();

      const opened = await page.dialog().opened();
      console.log(
        `
        await page.dialog().opened()
      `,
        opened
      );
      expect(opened).toBeFalsy();
    }
  }

  {
    const opened = await page.dialog().opened();
    console.log(
      `
      await page.dialog().opened()
    `,
      opened
    );
    expect(opened).toBeFalsy();
  }
  console.log('page dialog events <==== ');

  console.log('page domcontentloaded & close events ====>');
  // page domcontentloaded & close
  {
    const url_keyboard = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/keyboard.html';
    const newPage = await page.openNewPage('about:blank');
    console.log("await page.openNewPage('about:blank')", newPage);
    await newPage.sync();
    console.log('await newPage.sync()');

    let pageDOMContentLoadedHandled = false;
    const pageDOMContentLoadedListener = async page => {
      console.log(` pageDOMContentLoadedListener on page ==> `, page);
      expect(page).toBe(newPage);

      await page.sync();
      console.log('await page.sync()');

      const status = await page.status();
      console.log('await page.status()', status);
      expect(['loading', 'complete']).toContain(status);

      page.off('domcontentloaded', pageDOMContentLoadedListener);
      console.log("page.off('domcontentloaded', pageDOMContentLoadedListener)");

      pageDOMContentLoadedHandled = true;
      console.log(` pageDOMContentLoadedListener on page <== `);
    };

    newPage.on('domcontentloaded', pageDOMContentLoadedListener);
    console.log("newPage.on('domcontentloaded', pageDOMContentLoadedListener)");

    await newPage.navigate(url_keyboard);
    console.log('await newPage.navigate(url_keyboard)');

    await newPage.sync();
    console.log('await newPage.sync()');

    let wait_count = 0;
    if (!pageDOMContentLoadedHandled && wait_count < 3) {
      await wait(300);
      console.log('await wait(300)');
      wait_count++;
    }
    expect(pageDOMContentLoadedHandled).toBeTruthy();

    const status = await page.status();
    console.log(
      `
        await newPage.status()
      `,
      status
    );
    expect(status).toEqual('complete');

    let pageCloseHandled = false;
    const pageCloseListener = async page => {
      console.log(` pageCloseListener on page ==> `, page);
      expect(page).toBe(newPage);

      const closed = await page.closed();
      console.log('await page.closed()', closed);
      expect(page).toBeTruthy();

      page.off('close', pageCloseListener);
      console.log("page.off('close', pageCloseListener)");

      pageCloseHandled = true;
      console.log(` pageCloseListener on page <== `);
    };

    newPage.on('close', pageCloseListener);
    console.log("newPage.on('close', pageCloseListener)");

    await newPage.close();
    console.log('await newPage.close()');

    wait_count = 0;
    if (!pageCloseHandled && wait_count < 3) {
      await wait(300);
      console.log('await wait(300)');
      wait_count++;
    }
    expect(pageCloseHandled).toBeTruthy();

    const closed = await newPage.closed();
    console.log(
      `
        await newPage.closed()
      `,
      closed
    );
    expect(closed).toBeTruthy();
  }
  console.log('page domcontentloaded & close events <====');
} catch (error) {
  console.error(error);
  throw error;
} finally {
  await browser.detachDebugger();
  console.log('await browser.detachDebugger()');
  await page.bringToFront();
  console.log('await page.bringToFront()');
}

console.log('events <=');

console.warn('all passed');
