/**
 * @copyright 2025 Sagi All Rights Reserved.
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

console.log('frame locator =>');
console.log('current page', page);
const url_frame = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/index.html';

await page.navigate(url_frame);
await page.sync();
let url = await page.url();
console.log('await page.url()', url);
expect(url).toBe(url_frame);

// page locator in browser
if (page) {
  console.log('frame locator in page =>');
  const frames = await page.frame().all();
  console.log('await page.frame().all()', frames);
  expect(frames).toHaveLength(6);

  let count = await page.frame().count();
  console.log('await page.frame().count()', count);
  expect(count).toBe(6);

  for (const frame of frames) {
    url = await frame.url();
    console.log('await frame.url()', frame, url);
    expect(url).not.toBeNullOrUndefined();

    const status = await frame.status();
    console.log('await frame.status()', status);
    expect(status).not.toBeNullOrUndefined();
    expect(['BeforeNavigate', 'Committed', 'DOMContentLoaded', 'Completed', 'ErrorOccurred', 'Removed']).toContain(
      status
    );
    if (status === 'ErrorOccurred') {
      continue;
    }

    if (url !== url_frame) {
      const elem = await frame.ownerElement();
      console.log('await frame.ownerElement()', elem);
      expect(elem).not.toBeNullOrUndefined();

      const tagName = await elem.tagName();
      console.log('await elem.tagName()', tagName);
      expect(tagName).toBe('IFRAME');

      const attrs = await elem.getAttributes();
      console.log('await elem.getAttributes()', attrs);
      expect(attrs).not.toBeNullOrUndefined();
      expect(attrs.src).not.toBeNullOrUndefined();
    }
  }

  // complex locators
  // frame1 [shadowclosed.html, https://developer.mozilla.org/en-US/]
  {
    count = await page.frame().filter({ name: 'id', value: 'frame1' }).count();
    console.log("await page.frame().filter({ name: 'id', value: 'frame1' }).count()", count);
    expect(count).toBe(2);
    const frames_frame1 = await page.frame().filter({ name: 'id', value: 'frame1' }).all();
    console.log("await page.frame().filter({ name: 'id', value: 'frame1' }).all()", frames_frame1);
    expect(frames_frame1).not.toBeNullOrUndefined();
    expect(frames_frame1).toHaveLength(2);
    for (const frame1 of frames_frame1) {
      url = await frame1.url();
      console.log('await frame1.url()', frame1, url);
      expect(url).not.toBeNullOrUndefined();

      const elem_frame = await frame1.ownerElement();
      console.log('await frame1.ownerElement()', elem_frame);
      expect(elem_frame).not.toBeNullOrUndefined();
      const elem_attrs = await elem_frame.getAttributes();
      console.log('await elem_frame.getAttributes()', elem_attrs);
      expect(elem_attrs).not.toBeNullOrUndefined();

      const contentFrame = await elem_frame.contentFrame();
      console.log('await elem_frame.contentFrame()', contentFrame);
      const frame1_obj = await frame1.get();
      console.log('await frame1.get()', frame1_obj);
      expect(contentFrame).toEqual(frame1_obj);
    }
  }
  // frame1_mozilla
  {
    const url_frame1_mozilla = 'https://developer.mozilla.org/en-US/';
    count = await page
      .frame()
      .filter({ name: 'id', value: 'frame1' })
      .prefer({ name: 'url', value: /mozilla/ })
      .count();
    console.log(
      "await page.frame().filter({ name: 'id', value: 'frame1' }).prefer({name: 'url', value: /mozilla/}).count()",
      count
    );
    expect(count).toBe(1);
    const frame1_mozilla = await page
      .frame()
      .filter({ name: 'id', value: 'frame1' })
      .prefer({ name: 'url', value: /mozilla/ })
      .get();
    console.log(
      "await page.frame().filter({ name: 'id', value: 'frame1' }).prefer({name: 'url', value: /mozilla/}).get()",
      frame1_mozilla
    );
    expect(frame1_mozilla).not.toBeNullOrUndefined();
    url = await page
      .frame()
      .filter({ name: 'id', value: 'frame1' })
      .prefer({ name: 'url', value: /mozilla/ })
      .url();
    console.log(
      "await page.frame().filter({ name: 'id', value: 'frame1' }).prefer({ name: 'url', value: /mozilla/ }).url()",
      url
    );
    expect(url).toEqual(url_frame1_mozilla);
  }
  // frame1_shadowclosed 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/shadowclosed.html'
  {
    const url_frame1_shadowclosed =
      'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/shadowclosed.html';
    count = await page
      .frame({ url: /shadowclosed\.html$/ })
      .filter({ name: 'id', value: 'frame1' })
      .prefer({ name: 'width', value: '300', type: 'attribute' })
      .count();
    console.log(
      "await page.frame({url: /shadowclosed\.html$/ }).filter({ name: 'id', value: 'frame1' }).prefer({ name: 'width', value:'300', type: 'attribute'}).count()",
      count
    );
    expect(count).toBe(1);
    const frame1_shadowclosed = await page
      .frame({ url: /shadowclosed\.html$/ })
      .filter({ name: 'id', value: 'frame1' })
      .prefer({ name: 'width', value: '300', type: 'attribute' })
      .nth(0)
      .get();
    console.log(
      "await page.frame({url: /shadowclosed\.html$/ }).filter({ name: 'id', value: 'frame1' }).prefer({ name: 'width', value:'300', type: 'attribute'}).nth(0).get()",
      frame1_shadowclosed
    );
    expect(frame1_shadowclosed).not.toBeNullOrUndefined();
    url = await page
      .frame({ url: /shadowclosed\.html$/ })
      .filter({ name: 'id', value: 'frame1' })
      .prefer({ name: 'width', value: '300', type: 'attribute' })
      .nth(0)
      .url();
    console.log(
      "await page.frame({ url: /shadowclosed\.html$/ }).filter({ name: 'id', value: 'frame1' }).prefer({ name: 'width', value: '300', type: 'attribute' }).nth(0).url()",
      url
    );
    expect(url).toEqual(url_frame1_shadowclosed);
  }

  // frame2 [shadowopen.html, https://cn.bing.com/translator?setlang=zh-cn/]
  {
    count = await page.frame({ selector: '#frame2' }).filter({ name: 'id', value: 'frame2' }).count();
    console.log("await page.frame({selector: '#frame2'}).filter({ name: 'id', value: 'frame2' }).count()", count);
    expect(count).toBe(2);
    const frames_frame2 = await page.frame({ selector: '#frame2' }).filter({ name: 'id', value: 'frame2' }).all();
    console.log("await page.frame({selector: '#frame2'}).filter({ name: 'id', value: 'frame2' }).all()", frames_frame2);
    expect(frames_frame2).not.toBeNullOrUndefined();
    expect(frames_frame2).toHaveLength(2);
    for (const frame2 of frames_frame2) {
      url = await frame2.url();
      console.log('frame2.url()', frame2, url);
      expect(url).not.toBeNullOrUndefined();

      const elem_frame = await frame2.ownerElement();
      console.log('await frame2.ownerElement()', elem_frame);
      expect(elem_frame).not.toBeNullOrUndefined();
      const elem_attrs = await elem_frame.getAttributes();
      console.log('await elem_frame.getAttributes()', elem_attrs);
      expect(elem_attrs).not.toBeNullOrUndefined();

      const contentFrame = await elem_frame.contentFrame();
      console.log('await elem_frame.contentFrame()', contentFrame);
      const frame2_obj = await frame2.get();
      console.log('await frame2.get()', frame2_obj);
      expect(contentFrame).toEqual(frame2_obj);
    }
  }
  // frame2 shadowopen.html
  {
    const url_frame2_shadowopen = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/shadowopen.html';
    count = await page
      .frame({ selector: '#frame2' })
      .filter({ name: 'id', value: 'frame2' })
      .prefer({ name: 'url', value: /shadowopen/ })
      .count();
    console.log(
      "await page.frame({selector: '#frame2'}).filter({ name: 'id', value: 'frame2' }).prefer({ name: 'url', value: /shadowopen/ }).count()",
      count
    );
    expect(count).toBe(1);
    const frame2_shadowopen = await page
      .frame({ selector: '#frame2' })
      .filter({ name: 'id', value: 'frame2' })
      .prefer({ name: 'url', value: /shadowopen/ })
      .first()
      .get();
    console.log(
      "await page.frame({selector: '#frame2'}).filter({ name: 'id', value: 'frame2' }).prefer({ name: 'url', value: /shadowopen/ }).first().get()",
      frame2_shadowopen
    );
    expect(frame2_shadowopen).not.toBeNullOrUndefined();
    url = await page
      .frame({ selector: '#frame2' })
      .filter({ name: 'id', value: 'frame2' })
      .prefer({ name: 'url', value: /shadowopen/ })
      .first()
      .url();
    console.log(
      "await page.frame({ selector: '#frame2' }).filter({ name: 'id', value: 'frame2' }).prefer({ name: 'url', value: /shadowopen/ }).first().url()",
      url
    );
    expect(url).toEqual(url_frame2_shadowopen);
  }
  // frame2 https://cn.bing.com/translator?setlang=zh-cn/
  {
    const url_frame2_translator = 'https://cn.bing.com/translator?setlang=zh-cn/';
    count = await page
      .frame('#frame2')
      .filter([
        { name: 'id', value: 'frame2' },
        { name: 'height', value: '200', type: 'attribute' },
      ])
      .prefer({ name: 'url', value: /translator/ })
      .count();
    console.log(
      "await page.frame('#frame2').filter([{ name: 'id', value: 'frame2' }, { name: 'height', value: '200', type: 'attribute' }]).prefer({ name: 'url', value: /translator/ }).count()",
      count
    );
    expect(count).toBe(1);
    const frame2_translator = await page
      .frame('#frame2')
      .filter([
        { name: 'id', value: 'frame2' },
        { name: 'height', value: '200', type: 'attribute' },
      ])
      .prefer({ name: 'url', value: /translator/ })
      .last()
      .get();
    console.log(
      "await page.frame('#frame2').filter([{ name: 'id', value: 'frame2' }, { name: 'height', value: '200', type: 'attribute' }]).prefer({ name: 'url', value: /translator/ }).last().get()",
      frame2_translator
    );
    expect(frame2_translator).not.toBeNullOrUndefined();
    url = await page
      .frame('#frame2')
      .filter([
        { name: 'id', value: 'frame2' },
        { name: 'height', value: '200', type: 'attribute' },
      ])
      .prefer({ name: 'url', value: /translator/ })
      .last()
      .url();
    console.log(
      "await page.frame('#frame2').filter([{ name: 'id', value: 'frame2' }, { name: 'height', value: '200', type: 'attribute' }]).prefer({ name: 'url', value: /translator/ }).last().url()",
      url
    );
    expect(url).toEqual(url_frame2_translator);
  }

  console.log('frame locator in page <=');
}

if (browser) {
  console.log('frame locator expression =>');
  const frames = await browser.window({ lastFocused: true }).page({ active: true }).frame().all();
  console.log('await browser.window({ lastFocused: true }).page({ active: true }).frame().all()', frames);
  expect(frames).toHaveLength(6);

  for (const frame of frames) {
    const url = await frame.url();
    console.log('await frame.url()', frame, url);
    expect(url).not.toBeNullOrUndefined();
  }

  const activePageFrames = await browser.page({ active: true, lastFocusedWindow: true }).frame().all();
  console.log('await browser.page({ active: true, lastFocusedWindow: true }).frame().all()', activePageFrames);
  expect(activePageFrames).toHaveLength(6);

  console.log('frame locator expression <=');
}

console.log('frame locator <=');

await page.bringToFront();

console.warn('all passed');
