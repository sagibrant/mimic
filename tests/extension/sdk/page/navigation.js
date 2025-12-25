/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file navigation.js
 * @description 4. navigation methods test
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

console.log('page =>');
console.log('current page', page);
const url_mouse = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/mouse.html';
const url_keyboard = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/keyboard.html';
const url_cn_bing = 'https://cn.bing.com/';

const checkPageUrl = async url => {
  const page = await browser.page({ active: true, lastFocusedWindow: true }).get();
  console.log('await browser.page({ active: true, lastFocusedWindow: true }).get()', page);
  await page.sync();
  console.log('await page.sync()');
  let status = await page.status();
  console.log('await page.status()', status);
  expect(status).toBe('complete');
  let page_url = await page.url();
  console.log('await page.url()', page_url);
  expect(page_url).toEqual(url);
};

try {
  // init navigation
  await page.bringToFront();
  console.log('await page.bringToFront()', page);
  await page.navigate(url_cn_bing);
  console.log('await page.navigate(url_cn_bing)', page);
  await checkPageUrl(url_cn_bing);

  await browser.attachDebugger();
  console.log('await browser.attachDebugger()');

  await wait(1000);
  // navigate , history + 1
  await page.navigate(url_keyboard);
  console.log('await page.navigate(url_keyboard)', url_keyboard);
  await checkPageUrl(url_keyboard);

  // navigate , history + 2
  await page.navigate(url_mouse);
  console.log('await page.navigate(url_mouse)', url_mouse);
  await checkPageUrl(url_mouse);

  await page.back();
  console.log('await page.back()');
  await checkPageUrl(url_keyboard);

  await page.forward();
  console.log('await page.forward()');
  await checkPageUrl(url_mouse);
} catch (error) {
  throw error;
} finally {
  await browser.detachDebugger();
  console.log('await browser.detachDebugger()');
}

await clean();

console.log('page <=');

console.warn('all passed');
