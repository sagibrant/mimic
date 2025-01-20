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

console.log('element locator ==>');
console.log('current page', page);
const url_frame = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/index.html';

await page.navigate(url_frame);
await page.sync();

console.log('element locator in page =======>');
// page locator in browser
if (page) {
  // #css - #frame1 - 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/shadowclosed.html'
  console.log('element <---> frame ======>');
  {
    const url_frame1_shadowclosed =
      'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/shadowclosed.html';
    const elem_frame1 = await page.element('#frame1').first().get();
    console.log("await page.element('#frame1').first().get()", elem_frame1);
    expect(elem_frame1).not.toBeNullOrUndefined();
    const tagName = await page.element('#frame1').first().tagName();
    console.log("await page.element('#frame1').first().tagName()", tagName);
    expect(tagName).toEqual('IFRAME');
    const attrs = await page.element('#frame1').first().getAttributes();
    console.log("await page.element('#frame1').first().getAttributes()", attrs);
    expect(attrs).not.toBeNullOrUndefined();
    // elem to frame
    const contentFrame = await page.element('#frame1').first().contentFrame();
    console.log("await page.element('#frame1').first().contentFrame()", contentFrame);
    expect(contentFrame).not.toBeNullOrUndefined();
    const url = await contentFrame.url();
    console.log("await page.element('#frame1').first().contentFrame().url()", url);
    expect(url).toEqual(url_frame1_shadowclosed);
    // frame to elem
    const ownerElement = await contentFrame.ownerElement();
    console.log('await contentFrame.ownerElement()', ownerElement);
    expect(ownerElement).toEqual(elem_frame1);

    await ownerElement.highlight();
    console.log('await ownerElement.highlight()');
  }
  console.log('element <---> frame <======');

  // #css = #container1
  console.log('element locator using css selector or xpath ======>');
  {
    {
      const elems_container1 = await page.element({ selector: '#container1' }).all();
      console.log("await page.element({ selector: '#container1' }).all()", elems_container1);
      expect(elems_container1).toHaveLength(1);
      const tagName = await page.element({ selector: '#container1' }).tagName();
      console.log("await page.element({ selector: '#container1' }).tagName()", tagName);
      expect(tagName).toEqual('DIV');
      const attrs = await page.element({ selector: '#container1' }).getAttributes();
      console.log("await page.element({ selector: '#container1' }).getAttributes()", attrs);
      expect(attrs).not.toBeNullOrUndefined();

      // child element
      const elems_container1_frame1_count = await page.element({ selector: '#container1' }).element('#frame1').count();
      console.log(
        "await page.element({ selector: '#container1' }).element('#frame1').count()",
        elems_container1_frame1_count
      );
      expect(elems_container1_frame1_count).toEqual(1);
      const elems_container1_frame1 = await page.element({ selector: '#container1' }).element('#frame1').first().get();
      console.log(
        "await page.element({ selector: '#container1' }).element('#frame1').first().get()",
        elems_container1_frame1
      );
      expect(elems_container1_frame1).not.toBeNullOrUndefined();
      const src = await page.element({ selector: '#container1' }).element('#frame1').first().getAttribute('src');
      console.log(
        "await page.element({ selector: '#container1' }).element('#frame1').first().getAttribute('src')",
        src
      );
      expect(src).toEqual('shadowclosed.html');
      const contentframe_elems_container1_frame1 = await page
        .element({ selector: '#container1' })
        .element('#frame1')
        .first()
        .contentFrame();
      console.log(
        "await page.element({ selector: '#container1' }).element('#frame1').first().contentFrame()",
        contentframe_elems_container1_frame1
      );
      expect(contentframe_elems_container1_frame1).not.toBeNullOrUndefined();
      const frame1_shadowclosed = await page
        .frame('#frame1')
        .prefer({ name: 'src', value: 'shadowclosed.html' })
        .first()
        .get();
      console.log(
        "await page.frame('#frame1').prefer({ name: 'src', value: 'shadowclosed.html' }).first().get()",
        frame1_shadowclosed
      );
      expect(frame1_shadowclosed).not.toBeNullOrUndefined();
      expect(contentframe_elems_container1_frame1).toEqual(frame1_shadowclosed);
    }

    // #xpath = //*[@id="container1"]
    {
      const elems_container1 = await page.element({ xpath: '//*[@id="container1"]' }).all();
      console.log('await page.element({ xpath: \'//*[@id="container1"]\' }).all()', elems_container1);
      expect(elems_container1).toHaveLength(1);
      const tagName = await page.element({ xpath: '//*[@id="container1"]' }).tagName();
      console.log('await page.element({ xpath: \'//*[@id="container1"]\' }).tagName()', tagName);
      expect(tagName).toEqual('DIV');
      const attrs = await page.element({ xpath: '//*[@id="container1"]' }).getAttributes();
      console.log('await page.element({ xpath: \'//*[@id="container1"]\' }).getAttributes()', attrs);
      expect(attrs).not.toBeNullOrUndefined();
    }

    // #css = #btn1 in shadowdom, cannot find
    {
      const elems_btn1 = await page.element({ selector: '#btn1' }).all();
      console.log("shadowdom: await page.element({ selector: '#btn1' }).all()", elems_btn1);
      expect(elems_btn1).toHaveLength(0);
      const elems_btn1_count = await page.element({ selector: '#btn1' }).count();
      console.log("shadowdom: await page.element({ selector: '#btn1' }).count()", elems_btn1_count);
      expect(elems_btn1_count).toBe(0);
    }
    // #xpath = //*[@id="btn1"], cannot find
    {
      const elems_btn1 = await page.element({ xpath: '//*[@id="btn1"]' }).all();
      console.log('shadowdom: await page.element({ xpath: \'//*[@id="btn1"]\' }).all()', elems_btn1);
      expect(elems_btn1).toHaveLength(0);
      const elems_btn1_count = await page.element({ xpath: '//*[@id="btn1"]' }).count();
      console.log('shadowdom: await page.element({ xpath: \'//*[@id="btn1"]\' }).count()', elems_btn1_count);
      expect(elems_btn1_count).toBe(0);
    }
  }
  console.log('element locator using css selector or xpath <======');

  // filter id = btn1 in shadowdom
  console.log('element locator using filters for shadowdom in page ======>');
  {
    const elems_btn1 = await page.element().filter({ name: 'id', value: 'btn1' }).all();
    console.log("await page.element().filter({name: 'id', value: 'btn1'}).all()", elems_btn1);
    expect(elems_btn1).toHaveLength(1);
    const tagName = await page.element().filter({ name: 'id', value: 'btn1' }).tagName();
    console.log("await page.element().filter({name: 'id', value: 'btn1'}).tagName()", tagName);
    expect(tagName).toEqual('INPUT');
    const attrs = await page.element().filter({ name: 'id', value: 'btn1' }).getAttributes();
    console.log("await page.element().filter({name: 'id', value: 'btn1'}).getAttributes()", attrs);
    expect(attrs).not.toBeNullOrUndefined();
  }
  console.log('element locator using filters for shadowdom in page <======');
}
console.log('element locator in page <=======');

// frame1_shadowclosed 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/shadowclosed.html'
console.log('element locator in frame1_shadowclosed =======>');
{
  // this aaa button is hidden inside a closed shadowdom, cannot find it
  let count = await page
    .frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({ selector: 'input[name="aaa"]' })
    .count();
  console.log(
    `this aaa button is hidden inside a closed shadowdom, cannot find it:
    await page.frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({ selector: 'input[name="aaa"]' })
    .count();
    `,
    count
  );
  expect(count).toBe(0);

  // this shadowdiv1 button is outside of the closed shadowdom, can find it
  count = await page
    .frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({ selector: '#shadowdiv1' })
    .count();
  console.log(
    `this shadowdiv1 button is outside of the closed shadowdom, can find it
    await page.frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({selector: '#shadowdiv1'})
    .count();
    `,
    count
  );
  expect(count).toBe(1);

  const shadowdiv1_locator = await page
    .frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({ selector: '#shadowdiv1' });
  console.log(
    `
    await page.frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({selector: '#shadowdiv1'});
    `,
    shadowdiv1_locator
  );
  const tagName = await shadowdiv1_locator.tagName();
  console.log('await shadowdiv1_locator.tagName()', tagName);
  expect(tagName).toEqual('DIV');
  let attrs = await shadowdiv1_locator.getAttributes();
  console.log('await shadowdiv1_locator.getAttributes()', attrs);
  expect(attrs).not.toBeNullOrUndefined();

  const input_name_aaa = await page
    .frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({ selector: '#shadowdiv1' })
    .element()
    .filter([
      { name: 'tagName', value: 'INPUT' },
      { name: 'name', value: 'aaa' },
    ])
    .get();
  console.log(
    `this aaa button is hidden inside a closed shadowdom, can find it by filter
    await page.frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({ selector: '#shadowdiv1' })
    .element()
    .filter([{ name: 'tagName', value: 'INPUT' }, { name: 'name', value: 'aaa' }])
    .get();
    `,
    input_name_aaa
  );
  expect(input_name_aaa).not.toBeNullOrUndefined();
  attrs = await input_name_aaa.getAttributes();
  console.log('await input_name_aaa.getAttributes()', attrs);
  expect(attrs).not.toBeNullOrUndefined();

  await page
    .frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({ selector: '#shadowdiv1' })
    .element()
    .filter([
      { name: 'tagName', value: 'INPUT' },
      { name: 'name', value: 'aaa' },
    ])
    .highlight();
  console.log(`this aaa button is hidden inside a closed shadowdom, can find it by filter
    await page.frame({ url: /shadowclosed\.html$/ })
    .filter({ name: 'id', value: 'frame1' })
    .prefer({ name: 'width', value: '300', type: 'attribute' })
    .nth(0)
    .element({ selector: '#shadowdiv1' })
    .element()
    .filter([{ name: 'tagName', value: 'INPUT' }, { name: 'name', value: 'aaa' }])
    .highlight()`);
}
console.log('element locator in frame1_shadowclosed <==');

// frame2_shadowopen 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/shadowopen.html'
console.log('element locator in frame2_shadowopen =======>');
{
  // btn1 outside the shadowdom
  let count = await page
    .frame({ selector: '#frame2' })
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element({ selector: '#btn1' })
    .count();
  console.log(
    `btn1 outside the shadowdom, can find:
    await page.frame({ selector: '#frame2' })
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element({ selector: '#btn1' })
    .count();
    `,
    count
  );
  expect(count).toBe(1);

  // btn4 inside the shadowdom
  count = await page
    .frame({ selector: '#frame2' })
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element({ xpath: '//*[@id="btn4"]' })
    .count();
  console.log(
    `btn4 inside the shadowdom, cannot find:
    await page.frame({ selector: '#frame2' })
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element({ xpath: '//*[@id="btn4"]' })
    .count();
    `,
    count
  );
  expect(count).toBe(0);

  // use filter to locate the btn4
  count = await page
    .frame({ selector: '#frame2' })
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element()
    .filter({ name: 'id', value: 'btn4' })
    .count();
  console.log(
    `btn4 inside the shadowdom, can find by filter:
    await page.frame({ selector: '#frame2' })
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element()
    .filter({ name: 'id', value: 'btn4' })
    .count();
    `,
    count
  );
  expect(count).toBe(1);

  const btn4 = await page
    .frame({ selector: '#frame2' })
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element()
    .filter({ name: 'id', value: 'btn4' })
    .get();
  console.log(
    `btn4 inside the shadowdom, can find by filter:
    await page.frame({ selector: '#frame2' })
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element()
    .filter({ name: 'id', value: 'btn4' })
    .get();
    `,
    btn4
  );
  let tagName = await btn4.tagName();
  console.log('await btn4.tagName()', tagName);
  expect(tagName).toEqual('INPUT');
  let attrs = await btn4.getAttributes();
  console.log('await btn4.getAttributes()', attrs);
  expect(attrs).not.toBeNullOrUndefined();

  // use parent element to locate link1
  count = await page
    .frame('#frame2')
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element('#shadowdiv1')
    .element()
    .filter({ name: 'id', value: 'link1' })
    .count();
  console.log(
    `link1 inside the shadowdom, use parent element and filter to locate link1:
    await page.frame('#frame2')
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element('#shadowdiv1')
    .element()
    .filter({ name: 'id', value: 'link1' })
    .count();
    `,
    count
  );
  expect(count).toBe(1);

  const link1 = await page
    .frame('#frame2')
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element('#shadowdiv1')
    .element()
    .filter({ name: 'id', value: 'link1' })
    .get();
  console.log(
    `link1 inside the shadowdom, use parent element and filter to locate link1:
    await page.frame('#frame2')
    .filter({ name: 'id', value: 'frame2' })
    .prefer({ name: 'url', value: /shadowopen/ })
    .first()
    .element('#shadowdiv1')
    .element()
    .filter({ name: 'id', value: 'link1' })
    .get();
    `,
    link1
  );
  tagName = await link1.tagName();
  console.log('await link1.tagName()', tagName);
  expect(tagName).toEqual('A');
  attrs = await link1.getAttributes();
  console.log('await link1.getAttributes()', attrs);
  expect(attrs).not.toBeNullOrUndefined();
}
console.log('element locator in frame2_shadowopen <=======');

console.log('element locator <==');

await page.bringToFront();

console.warn('all passed');
