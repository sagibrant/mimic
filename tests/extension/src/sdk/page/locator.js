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

console.log('page locator =>');
console.log('current page', page);
const url_mouse = 'https://sagibrant.github.io/mimic/aut/mouse.html';
const url_keyboard = 'https://sagibrant.github.io/mimic/aut/keyboard.html';
await page.navigate(url_mouse);
await page.sync();

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

// page locator in browser
if (browser) {
  console.log('page locator in browser =>');

  const pages = await browser.page().all();
  console.log('await browser.page().all()', pages);
  expect(pages).not.toBeNullOrUndefined();

  let count = await browser.page().count();
  console.log('await browser.page().count()', count);
  expect(count).toBe(1);

  const lastActivePage = await browser.page({ active: true, lastFocusedWindow: true }).get();
  console.log('await browser.page({ active: true, lastFocusedWindow: true }).get()', lastActivePage);
  let url = await browser.page({ active: true, lastFocusedWindow: true }).url();
  console.log('await browser.page({ active: true, lastFocusedWindow: true }).url()', url);
  expect(url).toEqual(url_mouse);
  let title = await browser.page({ active: true, lastFocusedWindow: true }).title();
  console.log('await browser.page({ active: true, lastFocusedWindow: true }).title()', title);
  expect(title).toEqual('mouse test');

  const lastFocusedWindowPages = await browser.window({ lastFocused: true }).page().all();
  console.log(
    'await browser.window({ lastFocused: true }).page().all()',
    lastFocusedWindowPages,
    lastFocusedWindowPages.length
  );
  for (const page of lastFocusedWindowPages) {
    url = await page.url();
    console.log('page in lastFocusedWindow - ', page, url);
    expect(url).not.toBeNullOrUndefined();
  }

  const lastFocusedWindowActivePage = await browser.window({ lastFocused: true }).page({ active: true }).get();
  console.log('await browser.window({ lastFocused: true }).page({ active: true }).get()', lastFocusedWindowActivePage);
  expect(lastFocusedWindowActivePage).toEqual(lastActivePage);

  // create a page
  const newPage = await browser.openNewPage(url_mouse);
  console.log('await browser.openNewPage(url_mouse)', newPage);
  expect(newPage).not.toBeNullOrUndefined();
  await newPage.sync();
  console.log('await newPage.sync()');

  count = await browser.page().count();
  console.log('await browser.page().count()', count);
  expect(count).toBe(2);

  const page_locator_url = await browser.page({ url: url_mouse }).first();
  console.log('await browser.page({ url: url_mouse }).first()', page_locator_url);
  expect(page_locator_url).not.toBeNullOrUndefined();
  url = await browser.page({ url: url_mouse }).first().url();
  console.log('await browser.page({ url: url_mouse }).first().url()', url);
  expect(url).toEqual(url_mouse);

  const page_locator_title = await browser.page({ title: 'mouse test' }).last();
  console.log("await browser.page({ title: 'mouse test' }).last()", page_locator_title);
  expect(page_locator_title).not.toBeNullOrUndefined();
  title = await browser.page({ title: 'mouse test' }).last().title();
  console.log("await browser.page({ title: 'mouse test' }).last().title()", url);
  expect(title).toEqual('mouse test');

  const page_locator_index = await browser.page({ index: 0 }).nth(0);
  console.log('await browser.page({ index: 0 }).nth(0)', page_locator_index);
  expect(page_locator_index).not.toBeNullOrUndefined();
  url = await browser.page({ index: 0 }).nth(0).url();
  console.log('await browser.page({ index: 0 }).nth(0).url()', url);
  expect(url).toEqual(url_mouse);

  try {
    const newWindow = await browser.openNewWindow(url_keyboard);
    console.log('await browser.openNewWindow(url_keyboard)', newWindow);
    const newWinPage = await newWindow.page().get();
    console.log('await newWindow.page().get()', newWinPage);
    await newWinPage.sync();
    console.log('await newWinPage.sync()');

    count = await browser.page({ index: 0 }).count();
    console.log('await browser.page({ index: 0 }).count()', count);
    expect(count >= 2).toBeTruthy();
    console.log('==> await browser.page({ index: 0 }).nth(count + 1).get()', count + 1);
    const error_page = await browser
      .page({ index: 0 })
      .nth(count + 1)
      .get();
    console.log('<== await browser.page({ index: 0 }).nth(count + 1).get()', count + 1, error_page);
    expect(error_page).toBeNullOrUndefined();
  } catch (error) {
    console.log('expected error for nth with out of range index', error);
    expect(() => {
      throw error;
    }).toThrow();
  }

  // find page by url regex
  const url_mouse_regex = /mouse\.html$/;
  count = await browser.page({ url: url_mouse_regex }).count();
  console.log('await browser.page({url: /file:.*mouse.html$/}).count()', count);
  expect(count).toBe(2);
  const pages_url_mouse_regex = await browser.page({ url: url_mouse_regex }).last().get();
  console.log('await browser.page({url: /file:.*mouse.html$/}).last().get()', pages_url_mouse_regex);
  expect(pages_url_mouse_regex).not.toBeNullOrUndefined();
  url = await browser.page({ url: url_mouse_regex }).last().url();
  console.log('await browser.page({url: /file:.*mouse.html$/}).last().url()', url);
  expect(url).toEqual(url_mouse);
  // find page by title regex
  const title_mouse_regex = /mouse.*test$/;
  count = await browser.page({ title: title_mouse_regex }).count();
  console.log('await browser.page({title: /mouse.*test$/}).count()', count);
  expect(count).toBe(2);
  const pages_title_mouse_regex = await browser.page({ title: title_mouse_regex }).last().get();
  console.log('await browser.page({title: /mouse.*test$/}).last().get()', pages_title_mouse_regex);
  expect(pages_title_mouse_regex).not.toBeNullOrUndefined();
  url = await browser.page({ title: title_mouse_regex }).last().url();
  console.log('await browser.page({title: /mouse.*test$/}).last().url()', url);
  expect(url).toEqual(url_mouse);

  await page.bringToFront();
  console.log('await page.bringToFront()');

  console.log('page locator in browser <=');
}

// page locator in window
await clean();
const window = await page.window();
console.log('page.window', window);
expect(window).not.toBeNullOrUndefined();
if (window) {
  console.log('page locator in window =>');
  await window.focus();
  console.log('await window.focus()');
  const pages = await window.page().all();
  console.log('await window.page().all()', pages);
  expect(pages).not.toBeNullOrUndefined();

  let count = await window.page().count();
  console.log('await window.page().count()', count);
  expect(count).toBe(1);

  const lastActivePage = await window.page({ active: true, lastFocusedWindow: true }).get();
  console.log('await window.page({ active: true, lastFocusedWindow: true }).get()', lastActivePage);
  const activePage = await window.page({ active: true }).get();
  console.log('await window.page({ active: true }).get()', activePage);
  expect(lastActivePage).toEqual(activePage);

  const newPage = await window.openNewPage(url_mouse);
  console.log('await window.openNewPage(url_mouse)', newPage);
  await newPage.sync();
  console.log('await newPage.sync()');
  expect(newPage).not.toBeNullOrUndefined();

  const page_locator_url = await window.page({ url: url_mouse }).first();
  console.log('await window.page({ url: url_mouse }).first()', page_locator_url);
  expect(page_locator_url).not.toBeNullOrUndefined();
  let url = await window.page({ url: url_mouse }).first().url();
  console.log('await window.page({ url: url_mouse }).first().url()', url);
  expect(url).toEqual(url_mouse);

  const page_locator_title = await window.page({ title: 'mouse test' }).last();
  console.log("await window.page({ title: 'mouse test' }).last()", page_locator_title);
  expect(page_locator_title).not.toBeNullOrUndefined();
  let title = await window.page({ title: 'mouse test' }).last().title();
  console.log("await window.page({ title: 'mouse test' }).last().title()", title);
  expect(title).toEqual('mouse test');

  const page_locator_index = await window.page({ index: 0 }).nth(0);
  console.log('await window.page({ index: 0 }).nth(0)', page_locator_index);
  expect(page_locator_index).not.toBeNullOrUndefined();
  url = await window.page({ index: 0 }).nth(0).url();
  console.log('await window.page({ index: 0 }).nth(0).url()', url);
  expect(url).toEqual(url_mouse);

  try {
    count = await window.page({ index: 0 }).count();
    console.log('await window.page({ index: 0 }).count()', count);
    expect(count).toBe(1);
    console.log('==> await window.page({ index: 0 }).nth(count + 1).get()', count + 1);
    const error_page = await window
      .page({ index: 0 })
      .nth(count + 1)
      .get();
    console.log('<== await window.page({ index: 0 }).nth(count + 1).get()', count + 1, error_page);
    expect(error_page).toBeNullOrUndefined();
  } catch (error) {
    console.log('expected error for nth with out of range index', error);
    expect(() => {
      throw error;
    }).toThrow();
  }

  // find page by url regex
  const url_mouse_regex = /mouse\.html$/;
  count = await window.page({ url: url_mouse_regex }).count();
  console.log('await window.page({url: /file:.*mouse.html$/}).count()', count);
  expect(count).toBe(2);
  const pages_url_mouse_regex = await window.page({ url: url_mouse_regex }).last().get();
  console.log('await window.page({url: /file:.*mouse.html$/}).last().get()', pages_url_mouse_regex);
  expect(pages_url_mouse_regex).not.toBeNullOrUndefined();
  url = await window.page({ url: url_mouse_regex }).last().url();
  console.log('await window.page({ url: url_mouse_regex }).last().url()', url);
  expect(url).toEqual(url_mouse);
  // find page by title regex
  const title_mouse_regex = /mouse.*test$/;
  count = await window.page({ title: title_mouse_regex }).count();
  console.log('await window.page({title: /mouse.*test$/}).count()', count);
  expect(count).toBe(2);
  const pages_title_mouse_regex = await window.page({ title: title_mouse_regex }).last().get();
  console.log('await window.page({title: /mouse.*test$/}).last().get()', pages_title_mouse_regex);
  expect(pages_title_mouse_regex).not.toBeNullOrUndefined();
  url = await window.page({ title: title_mouse_regex }).last().url();
  console.log('await window.page({ title: title_mouse_regex }).last().url()', url);
  expect(url).toEqual(url_mouse);

  await page.bringToFront();
  console.log('await page.bringToFront()');

  console.log('page locator in window <=');
}

await clean();

console.log('page locator <=');

console.warn('all passed');
