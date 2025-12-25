/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file events.js
 * @description 3. events test
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

// global page instance
console.log('page', page);

// page events
{
  const url_mouse = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/mouse.html';
  const url_keyboard = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/keyboard.html';

  const newWindow = await browser.openNewWindow(url_mouse);
  console.log('await browser.openNewWindow(url_mouse)', newWindow);
  expect(newWindow).not.toBeNullOrUndefined();

  const newWindowPage = await newWindow.page({ active: true }).get();
  console.log('await newWindow.page({active: true}).get()', newWindowPage);
  expect(newWindowPage).not.toBeNullOrUndefined();

  await newWindowPage.sync();
  console.log('await newWindowPage.sync()');

  const url = await newWindowPage.url();
  console.log('await newWindowPage.url()', url);
  expect(url).toEqual(url_mouse);

  let events_count = 0;
  const newPageListener = async page => {
    console.log(` newPageListener on window ==> `, page);

    await page.sync();
    console.log('await page.sync())');

    const url = await page.url();
    console.log('await page.url()', url);
    expect(url).toEqual(url_keyboard);

    const window = await page.window();
    console.log('await page.window()', window);
    expect(window).not.toBeNullOrUndefined();

    window.off('page', newPageListener);
    console.log("window.off('page', newPageListener)");

    events_count++;
    console.log(` newPageListener on window <== `);
  };

  newWindow.on('page', newPageListener);
  console.log("newWindow.on('page', newPageListener)");

  const newPage = await newWindow.openNewPage(url_keyboard);
  console.log('await newWindow.openNewPage(url_keyboard)', newPage);
  expect(newPage).not.toBeNullOrUndefined();

  await newPage.sync();
  console.log('await newPage.sync())');

  let wait_count = 0;
  if (events_count < 1 && wait_count < 3) {
    await wait(1000);
    console.log('await wait(1000)');
    wait_count++;
  }
  expect(events_count).toBe(1);

  const windowCloseListener = async window => {
    console.log(` windowCloseListener on window ==> `, window);
    const closed = await window.closed();
    console.log('await window.closed()', closed);
    expect(closed).toBeTruthy();

    window.off('close', windowCloseListener);
    console.log("window.off('close', windowCloseListener)");

    events_count++;
    console.log(` windowCloseListener on window <== `);
  };

  newWindow.on('close', windowCloseListener);
  console.log("newWindow.on('close', windowCloseListener)");

  await newWindow.close();
  console.log('await newWindow.close()');

  wait_count = 0;
  if (events_count < 2 && wait_count < 3) {
    await wait(1000);
    console.log('await wait(1000)');
    wait_count++;
  }

  expect(events_count).toEqual(2);

  const closed = await newWindow.closed();
  console.log('await newWindow.closed()', closed);
  expect(closed).toBeTruthy();
}

await page.bringToFront();
await wait(300);
await clean();

console.log('events <=');

console.log('all passed');
