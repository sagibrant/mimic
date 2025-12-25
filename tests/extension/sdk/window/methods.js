/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file methods.js
 * @description 2. methods test
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

console.log('window =>');

console.log('current page', page);
const url_mouse = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/mouse.html';
await page.navigate(url_mouse);
await page.sync();

// open new window
let window_old = await browser.lastFocusedWindow();
console.log('await browser.lastFocusedWindow()', window_old);
expect(window_old).not.toBeNullOrUndefined();

let window_new = await browser.openNewWindow(url_mouse);
console.log('await browser.openNewWindow(url_mouse)', window_new);
expect(window).not.toBeNullOrUndefined();

// aos
// access browser object
const winBrowser = await window_new.browser();
console.log(
  'await window_new.browser()',
  winBrowser,
  winBrowser.name(),
  winBrowser.version(),
  winBrowser.majorVersion()
);
expect(winBrowser).not.toBeNullOrUndefined();
expect(winBrowser).toEqual(browser);

// only one page if opened by openNewWindow
let winPages = await window_new.pages();
console.log('await window_new.pages()', winPages);
expect(winPages).not.toBeNullOrUndefined();
expect(winPages).toHaveLength(1);

const activePage = await window_new.activePage();
console.log('await window_new.activePage()', activePage);
expect(activePage).not.toBeNullOrUndefined();
expect(activePage).toEqual(winPages[0]);
await activePage.sync();
console.log('await activePage.sync()', activePage);
const activePageUrl = await activePage.url();
console.log('await activePage.url()', activePageUrl);
expect(activePageUrl).toEqual(url_mouse);

// print all window properties
let state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).not.toBeNullOrUndefined();
if (state !== 'normal') {
  await window_new.restore();
  console.log('await window_new.restore()');
  state = await window_new.state();
  console.log('await window_new.state()', state);
}
expect(state).toEqual('normal');

let focused = await window_new.focused();
console.log('await window_new.focused()', focused);
expect(focused).toBeTruthy();

const incognito = await window_new.incognito();
console.log('await window_new.incognito()', incognito);
expect(incognito).toBeFalsy();

let closed = await window_new.closed();
console.log('await window_new.closed()', closed);
expect(closed).toBeFalsy();

// open a new page, now the window has 2 pages
const newPage = await window_new.openNewPage(url_mouse);
console.log('await window_new.openNewPage(url_mouse)', newPage);
expect(newPage).not.toBeNullOrUndefined();
await newPage.sync();
console.log('await newPage.sync()', newPage);
const new_winPages = await window_new.pages();
expect(new_winPages.length - winPages.length).toBe(1);

// change focus
await window_old.focus();
console.log('await window_old.focus()');
focused = await window_old.focused();
console.log('await window_old.focused()', focused);
expect(focused).toBeTruthy();
await window_new.focus();
console.log('await window_new.focus()');
focused = await window_new.focused();
console.log('await window_new.focused()', focused);
expect(focused).toBeTruthy();

// change window state
// => normal
await window_new.restore();
console.log('await window_new.restore()');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).toBe('normal');

// min => max = normal or max, restore = normal
await window_new.minimize();
console.log('await window_new.minimize()');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).toBe('minimized');

await window_new.maximize();
console.log('await window_new.maximize()');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(['normal', 'maximized']).toContain(state);

await window_new.restore();
console.log('await window_new.restore()');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).toBe('normal');

// max => min = min,restor => max
await window_new.maximize();
console.log('await window_new.maximize()');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).toBe('maximized');

await window_new.minimize();
console.log('await window_new.minimize()');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).toBe('minimized');

await window_new.restore();
console.log('await window_new.restore()');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).toBe('maximized');

await window_new.fullscreen(false);
console.log('await window_new.fullscreen(false)');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).toBe('fullscreen');

await window_new.fullscreen();
console.log('await window_new.fullscreen()');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).toBe('normal');

await window_new.restore();
console.log('await window_new.restore()');
state = await window_new.state();
console.log('await window_new.state()', state);
expect(state).toBe('normal');

await window_new.focus();
console.log('await window_new.focus()');

closed = await window_new.closed();
console.log('await window_new.closed()', closed);
expect(closed).toBeFalsy();

await wait(1000);
console.log('await wait(1000)');

await window_new.close();
console.log('await window_new.close()');

let retryNum = 0;
while (retryNum < 5) {
  closed = await window_new.closed();
  console.log('await window_new.closed()', closed);
  if (closed) {
    break;
  }
  retryNum++;
  await wait(1000);
  console.log('await wait(1000)');
}
expect(closed).toBeTruthy();

console.log('window <=');

await window_old.focus();

console.warn('all passed');
