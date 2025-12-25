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

console.log('frame => ');
console.log('current page', page);
const url_frame = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/index.html';

await page.navigate(url_frame);
await page.sync();

const mainFrame = await page.mainFrame();
console.log('await page.mainFrame()', mainFrame);
expect(mainFrame).not.toBeNullOrUndefined();

const printFrame = async (frame, printChild) => {
  console.log('current frame: ==>', frame);

  // print all frame properties
  let url = await frame.url();
  console.log('await frame.url()', url);
  expect(url).not.toBeNullOrUndefined();

  const status = await frame.status();
  console.log('await frame.status()', status);
  expect(status).not.toBeNullOrUndefined();
  expect(['BeforeNavigate', 'Committed', 'DOMContentLoaded', 'Completed', 'ErrorOccurred', 'Removed']).toContain(
    status
  );
  if (status === 'ErrorOccurred') {
    return;
  }

  const content = await frame.content();
  const log_content = content && content.length > 10 ? content.slice(0, 10) + '...' : content;
  console.log('await frame.content()', log_content);
  expect(content.length > 0).toBeTruthy();

  let readyState = await frame.readyState();
  console.log('await frame.readyState()', readyState);
  expect(['loading', 'interactive', 'complete']).toContain(readyState);

  // aos
  const framePage = await frame.page();
  console.log('await frame.page()', framePage);
  expect(framePage).not.toBeNullOrUndefined();

  const parentFrame = await frame.parentFrame();
  console.log('await frame.parentFrame()', parentFrame);
  if (url !== url_frame) {
    // no parent frame for mainFrame
    expect(parentFrame).not.toBeNullOrUndefined();
  }

  const childFrames = await frame.childFrames();
  console.log('await frame.childFrames()', childFrames);
  expect(childFrames).not.toBeNullOrUndefined();
  expect(childFrames.length >= 0).toBeTruthy();

  const ownerElement = await frame.ownerElement();
  console.log('await frame.ownerElement()', ownerElement);
  if (url !== url_frame) {
    // no ownerElement for mainFrame
    expect(ownerElement).not.toBeNullOrUndefined();
  }

  if (readyState === 'interactive') {
    const start_time = performance.now();
    console.log('frame.sync -->');
    await frame.sync();
    const end_time = performance.now();
    console.log('frame.sync <--', end_time - start_time);
    readyState = await frame.readyState();
    console.log('await frame.readyState()', readyState);
    expect(['loading', 'interactive', 'complete']).toContain(readyState);
  }
  if (readyState === 'interactive' || readyState === 'complete') {
    const elements = await frame.querySelectorAll('div');
    console.log("await frame.querySelectorAll('div')", elements);
    expect(elements).not.toBeNullOrUndefined();
    expect(elements.length >= 0).toBeTruthy();

    const result = await frame.executeScript(
      (a, b, c) => {
        console.error('this is the console.error by frame.executeScript', a, b, c);
        return { tested: true, a: a, b: b, c: c };
      },
      [1, 'msg222', { d: 3 }]
    );
    console.log(
      `
      await frame.executeScript((a, b, c) => {
        console.error('this is the console.error by frame.executeScript', a, b, c);
        return { tested: true, a: a, b: b, c: c };
      }, [1, 'msg222', { d: 3 }]);
      `,
      result
    );
    expect(result).toEqual({ tested: true, a: 1, b: 'msg222', c: { d: 3 } });

    const async_result = await frame.executeScript(
      async (a, b, c) => {
        console.error('this is the console.error by frame.executeScript async', a, b, c);
        return Promise.resolve({ tested: true, a: a, b: b, c: c, async: true });
      },
      [2, 'msg333', { g: 7 }]
    );
    console.log(
      `
      await frame.executeScript(async (a, b, c) => {
        console.error('this is the console.error by frame.executeScript async', a, b, c);
        return Promise.resolve({ tested: true, a: a, b: b, c: c, async: true });
      }, [2, 'msg333', { g: 7 }]);
      `,
      async_result
    );
    expect(async_result).toEqual({ tested: true, a: 2, b: 'msg333', c: { g: 7 }, async: true });

    if (printChild) {
      for (const childFrame of childFrames) {
        await printFrame(childFrame, printChild);
      }
    }
  }
  console.log('current frame: <==', frame);
};
console.log('print main frame tree: ==>');
await printFrame(mainFrame, true);
console.log('print main frame tree: <==');

const frames = await page.frames();
console.log('await page.frames()', frames);
expect(frames).not.toBeNullOrUndefined();
expect(frames.length > 0).toBeTruthy();
console.log('print frames: ==>');
for (const frame of frames) {
  await printFrame(frame, false);
}
console.log('print frames: <==');

console.log('frame <= ');

await page.bringToFront();

console.warn('all passed');
