/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file locator.js
 * @description 1. locator test
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

console.log('window locator =>');

console.log('current page', page);
const url_mouse = 'https://sagibrant.github.io/mimic/aut/mouse.html';
await page.navigate(url_mouse);
await page.sync();
const status = await page.status();
expect(['loading', 'complete']).toContain(status);

console.log('window locator => ');
// locators
const windows = await browser.window().all();
console.log('await browser.window().all()', windows);
expect(windows).not.toBeNullOrUndefined();
const count = await browser.window().count();
console.log('await browser.window().count()', count);
expect(count > 0).toBeTruthy();

for (const window of windows) {
  const state = await window.state();
  console.log('await window.state()', state, window);
  expect(['normal', 'minimized', 'maximized', 'fullscreen', 'locked-fullscreen']).toContain(state);
  const focused = await window.focused();
  console.log('await window.focused()', focused, window);
}

// open new window
const url_keyboard = 'https://sagibrant.github.io/mimic/aut/keyboard.html';
const newWindow = await browser.openNewWindow(url_keyboard);
console.log('await browser.openNewWindow(url_keyboard)', newWindow);
expect(newWindow).not.toBeNullOrUndefined();

const new_windows = await browser.window().all();
console.log(`await browser.window().all()`, new_windows);
expect(new_windows).not.toBeNullOrUndefined();
const new_windows_count = await browser.window().count();
console.log(`await browser.window().count() from ${count} to ${new_windows_count}`, new_windows_count);
expect(new_windows_count).toEqual(count + 1);

await newWindow.page({ active: true }).sync();
console.log('await newWindow.page({active: true}).sync()');

const lastFocusedWindow = await browser.window({ lastFocused: true }).get();
console.log('await browser.window({ lastFocused: true }).get()', lastFocusedWindow);
expect(lastFocusedWindow).not.toBeNullOrUndefined();
if (lastFocusedWindow) {
  let state = await lastFocusedWindow.state();
  console.log('await lastFocusedWindow.state()', state);
  if (state !== 'normal') {
    await lastFocusedWindow.restore();
    console.log('await lastFocusedWindow.restore()', state);
    state = await lastFocusedWindow.state();
    console.log('await lastFocusedWindow.state()', state);
  }
  expect(state).toEqual('normal');
  const focused = await lastFocusedWindow.focused();
  console.log('await lastFocusedWindow.focused()', focused);
  expect(focused).toBeTruthy();
}

await page.bringToFront();
await wait(300);
await clean();

console.log('window locator <=');

console.warn('all passed');
