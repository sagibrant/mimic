/**
 * @copyright 2026 Sagi All Rights Reserved.
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

console.log('page =>');
console.log('current page', page);
const url_mouse = 'https://sagibrant.github.io/mimic/aut/mouse.html';
const url_keyboard = 'https://sagibrant.github.io/mimic/aut/keyboard.html';

await page.navigate(url_mouse);
console.log('await page.navigate(url_mouse)', url_mouse);
await page.sync();
console.log('await page.sync();');

// print all page properties
{
  const url = await page.url();
  console.log('await page.url()', url);
  expect(url).toEqual(url_mouse);

  const status = await page.status();
  console.log('await page.status()', status);
  expect(status).toBe('complete');

  const title = await page.title();
  console.log('await page.title()', title);
  expect(title).toEqual('mouse test');

  const content = await page.content();
  const log_content = content && content.length > 10 ? content.slice(0, 10) + '...' : content;
  console.log('await page.content()', log_content);
  expect(content.length > 0).toBeTruthy();

  const active = await page.active();
  console.log('await page.active()', active);
  expect(active).toBeTruthy();

  const closed = await page.closed();
  console.log('await page.closed()', closed);
  expect(closed).toBeFalsy();
}

// aos
{
  const pageWindow = await page.window();
  console.log('await page.window()', pageWindow);
  expect(pageWindow).not.toBeNullOrUndefined();

  let pageWindowState = await pageWindow.state();
  console.log('await pageWindow.state()', pageWindowState);
  if (pageWindowState !== 'normal') {
    await pageWindow.restore();
    console.log('await pageWindow.restore()');
    pageWindowState = await pageWindow.state();
    console.log('await pageWindow.state()', pageWindowState);
  }
  expect(['normal', 'maximized']).toContain(pageWindowState);

  const mainFrame = await page.mainFrame();
  console.log('await page.mainFrame()', mainFrame);
  expect(mainFrame).not.toBeNullOrUndefined();

  const mainFrameUrl = await mainFrame.url();
  console.log('await mainFrame.url()', mainFrameUrl);
  expect(mainFrameUrl).toEqual(url_mouse);

  const frames = await page.frames();
  console.log('await page.frames()', frames);
  expect(frames).not.toBeNullOrUndefined();
  expect(frames).toHaveLength(1);
  for (const frame of frames) {
    const frameUrl = await frame.url();
    console.log('await frame.url()', frameUrl);
    expect(frameUrl).not.toBeNullOrUndefined();
    expect(frameUrl).toEqual(url_mouse);
  }
}

// methods
{
  await page.refresh();
  console.log('await page.refresh()');
  await page.sync();
  console.log('await page.sync()');
  let status = await page.status();
  console.log('await page.status()', status);
  expect(status).toBe('complete');

  await page.refresh(true);
  console.log('await page.refresh(true)');
  await page.sync();
  console.log('await page.sync()');
  status = await page.status();
  console.log('await page.status()', status);
  expect(status).toBe('complete');

  // open new page
  const newPage = await page.openNewPage(url_keyboard);
  console.log('await page.openNewPage(url_keyboard)', newPage, url_keyboard);
  expect(newPage).not.toBeNullOrUndefined();
  await newPage.sync();
  console.log('await newPage.sync(');
  let newPage_status = await newPage.status();
  console.log('await newPage.status()', newPage_status);
  expect(newPage_status).toBe('complete');
  let newPage_url = await newPage.url();
  console.log('await newPage.url()', newPage_url);
  expect(newPage_url).toEqual(url_keyboard);
  let newPage_active = await newPage.active();
  console.log('await newPage.active()', newPage_active);
  expect(newPage_active).toBeTruthy();

  // switch pages to check active
  let page_active = await page.active();
  console.log('await page.active()', page_active);
  expect(page_active).toBeFalsy();
  await page.bringToFront();
  console.log('await page.bringToFront()');
  page_active = await page.active();
  console.log('await page.active()', page_active);
  expect(page_active).toBeTruthy();
  newPage_active = await newPage.active();
  console.log('await newPage.active()', newPage_active);
  expect(newPage_active).toBeFalsy();
  await newPage.activate();
  console.log('await newPage.activate()');
  newPage_active = await newPage.active();
  console.log('await newPage.active()', newPage_active);
  expect(newPage_active).toBeTruthy();

  // test api on newPage
  await newPage.bringToFront();
  console.log('await newPage.bringToFront()');
  await newPage.zoom(2.5);
  console.log('await newPage.zoom(2.5)');

  // move newPage to the first window
  const windows = await browser.windows();
  console.log('await browser.windows()', windows);
  expect(windows.length > 0).toBeTruthy();
  const win = windows[0];
  console.log('windows[0]', win);
  expect(win).not.toBeNullOrUndefined();
  await newPage.moveToWindow(win, 0);
  console.log('await newPage.moveToWindow(win, 0)');
  newPage_active = await newPage.active();
  console.log('await newPage.active()', newPage_active);
  expect(newPage_active).toBeTruthy();

  // after move into a new window, need to bring it to top before capture screenshot
  await newPage.bringToFront();
  console.log('await newPage.bringToFront()');
  newPage_active = await newPage.active();
  console.log('await newPage.active()', newPage_active);
  expect(newPage_active).toBeTruthy();
  const screenshot = await newPage.captureScreenshot();
  let screenshot_log = screenshot && screenshot.length > 10 ? screenshot.slice(0, 10) + '...' : screenshot;
  console.log('await newPage.captureScreenshot()', screenshot_log);
  expect(screenshot.length > 0).toBeTruthy();

  // suggest to sync before query content elements
  await newPage.sync();
  console.log('await newPage.sync()');
  const elements = await newPage.querySelectorAll('div');
  console.log("await newPage.querySelectorAll('div')", elements);
  expect(elements).not.toBeNullOrUndefined();
  expect(elements.length > 0).toBeTruthy();

  // executeScript
  const result = await newPage.executeScript(
    (a, b, c) => {
      console.error('this is the console.error by page.executeScript', a, b, c);
      return { tested: true, a: a, b: b, c: c };
    },
    [1, 'msg222', { d: 3 }]
  );
  console.log(
    `
    await newPage.executeScript((a, b, c) => {
      console.error('this is the console.error by page.executeScript', a, b, c);
      return { tested: true, a: a, b: b, c: c };
    }, [1, 'msg222', { d: 3 }]);
    `,
    result
  );
  expect(result).toEqual({ tested: true, a: 1, b: 'msg222', c: { d: 3 } });

  const async_result = await newPage.executeScript(
    async (a, b, c) => {
      console.error('this is the console.error by page.executeScript async', a, b, c);
      return Promise.resolve({ tested: true, a: a, b: b, c: c, async: true });
    },
    [2, 'msg333', { g: 7 }]
  );
  console.log(
    `
    await newPage.executeScript(async (a, b, c) => {
      console.error('this is the console.error by page.executeScript async', a, b, c);
      return Promise.resolve({ tested: true, a: a, b: b, c: c, async: true });
    }, [2, 'msg333', { g: 7 }]);
    `,
    async_result
  );
  expect(async_result).toEqual({ tested: true, a: 2, b: 'msg333', c: { g: 7 }, async: true });

  await newPage.zoom(1);
  console.log('await newPage.zoom(1)');

  await page.close();
  console.log('await page.close()');
  const closed = await page.closed();
  console.log('await page.closed()', closed);
  expect(closed).toBeTruthy();

  await newPage.bringToFront();
  console.log('await newPage.bringToFront()');
}

console.log('page <=');

console.warn('all passed');
