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
expect(BrowserLocator).toBeDefined();

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

console.log('browser locator => ');
// global browser instance
console.log('browser', browser);
const browserLocator = new BrowserLocator();
console.log('browserLocator', browserLocator);
expect(browserLocator).not.toBeNullOrUndefined();

const browsers = await browserLocator.all();
expect(browsers).not.toBeNullOrUndefined();
console.log('browserLocator.all()', browsers);

for (const browser of browsers) {
  const name = browser.name();
  console.log('browser.name()', name);
  expect(['edge', 'chrome']).toContain(name);

  const version = browser.version();
  console.log('browser.version()', version);
  expect(version).not.toBeNullOrUndefined();

  const majorVersion = browser.majorVersion();
  console.log('browser.majorVersion()', majorVersion);
  expect(majorVersion > 130).toBeTruthy();
}
console.log('browser locator <= ');

await page.bringToFront();

console.warn('all passed');
