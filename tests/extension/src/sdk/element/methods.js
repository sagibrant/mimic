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

console.log('element methods ==>');
console.log('current page', page);
const url_mouse = 'https://sagibrant.github.io/mimic/aut/mouse.html';
await page.navigate(url_mouse);
await page.sync();
const elements = await page.querySelectorAll('#btn_start_monitor');
console.log("await page.querySelectorAll('#btn_start_monitor')", elements);
expect(elements.length > 0).toBeTruthy();

let elem = elements[0];
expect(elem).not.toBeNullOrUndefined();
if (elem) {
  // aos
  {
    const ownerFrame = await elem.ownerFrame();
    console.log('await elem.ownerFrame', ownerFrame);
    expect(ownerFrame).not.toBeNullOrUndefined();
    const url_ownerFrame = await ownerFrame.url();
    console.log('await ownerFrame.url()', url_ownerFrame);
    expect(url_ownerFrame).toEqual(url_mouse);

    const contentFrame = await elem.contentFrame();
    console.log('await elem.contentFrame()', contentFrame);
    expect(contentFrame).toBeNullOrUndefined();
  }
  // properties
  // node properties
  {
    const nodeName = await elem.nodeName();
    console.log('await elem.nodeName()', nodeName);
    expect(nodeName).toEqual('INPUT');

    const nodeType = await elem.nodeType();
    console.log('await elem.nodeType()', nodeType);
    expect(nodeType).toEqual(1);

    const nodeValue = await elem.nodeValue();
    console.log('await elem.nodeValue()', nodeValue);
    expect(nodeValue).toBeNull();

    const isConnected = await elem.isConnected();
    console.log('await elem.isConnected()', isConnected);
    expect(isConnected).toBeTruthy();

    const textContent = await elem.textContent();
    console.log('await elem.textContent()', textContent);
    expect(textContent).toEqual('');
  }
  // element properties
  {
    const tagName = await elem.tagName();
    console.log('await elem.tagName()', tagName);
    expect(tagName).toEqual('INPUT');

    const id = await elem.id();
    console.log('await elem.id()', id);
    expect(id).toEqual('btn_start_monitor');

    const innerHTML = await elem.innerHTML();
    console.log('await elem.innerHTML()', innerHTML);
    expect(innerHTML).toEqual('');

    const outerHTML = await elem.outerHTML();
    console.log('await elem.outerHTML()', outerHTML);
    expect(outerHTML).toEqual('<input type="button" id="btn_start_monitor" value="start monitor">');

    const innerText = await elem.innerText();
    console.log('await elem.innerText()', innerText);
    expect(innerText).toEqual('');

    const outerText = await elem.outerText();
    console.log('await elem.outerText()', outerText);
    expect(outerText).toEqual('');

    const title = await elem.title();
    console.log('await elem.title()', title);
    expect(title).toEqual('');

    const accessKey = await elem.accessKey();
    console.log('await elem.accessKey()', accessKey);
    expect(accessKey).toEqual('');

    const hidden = await elem.hidden();
    console.log('await elem.hidden()', hidden);
    expect(hidden).toBeFalsy();

    const visible = await elem.visible();
    console.log('await elem.visible()', visible);
    expect(visible).toBeTruthy();
  }

  // input properties
  {
    const name = await elem.name();
    console.log('await elem.name()', name);
    expect(name).toEqual('');

    const value = await elem.value();
    console.log('await elem.value()', value);
    expect(value).toEqual('start monitor');

    const type = await elem.type();
    console.log('await elem.type()', type);
    expect(type).toEqual('button');

    const alt = await elem.alt();
    console.log('await elem.alt()', alt);
    expect(alt).toEqual('');

    const placeholder = await elem.placeholder();
    console.log('await elem.placeholder()', placeholder);
    expect(placeholder).toEqual('');

    const src = await elem.src();
    console.log('await elem.src()', src);
    expect(src).toEqual('');

    const disabled = await elem.disabled();
    console.log('await elem.disabled()', disabled);
    expect(disabled).toBeFalsy();

    const readOnly = await elem.readOnly();
    console.log('await elem.readOnly()', readOnly);
    expect(readOnly).toBeFalsy();

    const required = await elem.required();
    console.log('await elem.required()', required);
    expect(required).toBeFalsy();

    const checked = await elem.checked();
    console.log('await elem.checked()', checked);
    expect(checked).toBeFalsy();
  }

  // general methods
  {
    const ppp = await elem.getProperty('ppp');
    console.log(`await elem.getProperty('ppp')`, ppp);
    expect(ppp).toBeUndefined();

    const attrs = await elem.getAttributes();
    console.log('await elem.getAttributes()', attrs);
    expect(attrs).not.toBeNullOrUndefined();

    for (const attrName of Object.keys(attrs)) {
      const attrValue = await elem.getAttribute(attrName);
      console.log('await elem.getAttribute(attrName)', attrName, attrValue);
    }

    const hasAttrBefore = await elem.hasAttribute('test-id');
    console.log('elem.hasAttributeb before test-id', hasAttrBefore);
    expect(hasAttrBefore).toBeFalsy();

    await elem.setAttribute('test-id', 'test-id-value');
    console.log('elem.setAttribute test-id = test-id-value');

    const hasAttrAfter = await elem.hasAttribute('test-id');
    console.log('elem.hasAttributeb after test-id', hasAttrAfter);
    expect(hasAttrAfter).toBeTruthy();

    const boundingClientRect = await elem.getBoundingClientRect();
    console.log('elem.getBoundingClientRect', boundingClientRect);
    expect(boundingClientRect).not.toBeNullOrUndefined();
  }
}

// checkbox
elem = await page.element('#checkbox').get();
console.log("await page.element('#checkbox').get()", elem);
expect(elem).not.toBeNullOrUndefined();
if (elem) {
  const validity = await elem.checkValidity();
  console.log('await elem.checkValidity()', validity);
  expect(validity).toBeTruthy();

  const visibility = await elem.checkVisibility();
  console.log('await elem.checkVisibility()', visibility);
  expect(visibility).toBeTruthy();

  await elem.scrollIntoViewIfNeeded();
  console.log('await elem.scrollIntoViewIfNeeded()');

  await elem.focus();
  console.log('await elem.focus()');

  await elem.check();
  console.log('await elem.check()');

  let checked = await elem.checked();
  console.log('await elem.checked()', checked);
  expect(checked).toBeTruthy();

  await elem.uncheck();
  console.log('await elem.uncheck()');

  checked = await elem.checked();
  console.log('await elem.checked()', checked);
  expect(checked).toBeFalsy();

  await elem.blur();
  console.log('await elem.blur()');
}

// select
elem = await page.element('#select').get();
console.log("await page.element('#select').get()", elem);
expect(elem).not.toBeNullOrUndefined();
if (elem) {
  const option = await page.element('option[value="cat"]').get();
  console.log(`await page.element('option[value="cat"]').get()`, option);
  expect(option).not.toBeNullOrUndefined();

  let selected = await page.element('option[value="cat"]').selected();
  console.log(`await page.element('option[value="cat"]').selected()`, selected);
  expect(selected).toBeFalsy();

  const label = await page.element('option[value="cat"]').label();
  console.log(`await page.element('option[value="cat"]').label()`, label);
  expect(label).toBe('Cat');

  await page.element('#select').toggleAttribute('multiple', true);
  console.log("await page.element('#select').toggleAttribute('multiple', true)");

  let multiple = await page.element('#select').multiple();
  console.log("await page.element('#select').multiple()", multiple);
  expect(multiple).toBeTruthy();

  await page.element('#select').toggleAttribute('multiple');
  console.log("await page.element('#select').toggleAttribute('multiple')");

  multiple = await page.element('#select').multiple();
  console.log("await page.element('#select').multiple()", multiple);
  expect(multiple).toBeFalsy();

  await elem.selectOption('Cat');
  console.log("await elem.selectOption('Cat')");

  selected = await page.element('option[value="cat"]').selected();
  console.log(`await page.element('option[value="cat"]').selected()`, selected);
  expect(selected).toBeTruthy();

  let selectedIndex = await await page.element('#select').selectedIndex();
  console.log("await page.element('#select').selectedIndex()", selectedIndex);
  expect(selectedIndex).toBe(2);

  const selectedOptions = await await page.element('#select').selectedOptions();
  console.log("await page.element('#select').selectedOptions()", selectedOptions);
  expect(selectedOptions).toHaveLength(1);

  let value = await selectedOptions[0].value();
  console.log('await selectedOptions[0].value()', value);
  expect(value).toBe('cat');

  const options = await await page.element('#select').options();
  console.log("await page.element('#select').options()", options);
  expect(options).toHaveLength(7);

  await elem.selectOption(options[3]);
  console.log(`await elem.selectOption(options[0])`);

  selectedIndex = await await page.element('#select').selectedIndex();
  console.log("await page.element('#select').selectedIndex()", selectedIndex);
  expect(selectedIndex).toBe(3);

  await elem.selectOption(-1);
  console.log(`await elem.selectOption(-1)`);

  selectedIndex = await await page.element('#select').selectedIndex();
  console.log("await page.element('#select').selectedIndex()", selectedIndex);
  expect(selectedIndex).toBe(-1);
}
// querySelectorAll x 2
const elem_tables = await page.querySelectorAll('body > table');
console.log("await page.querySelectorAll('body > table')", elem_tables);
expect(elem_tables).not.toBeNullOrUndefined();
expect(elem_tables).toHaveLength(1);
if (elem_tables) {
  const elem_table = elem_tables[0];
  expect(elem_table).not.toBeNullOrUndefined();

  const elem_table_inputs = await elem_table.querySelectorAll('input');
  console.log("await elem_table.querySelectorAll('input')", elem_table_inputs);
  expect(elem_table_inputs).toHaveLength(6);

  for (const elem of elem_table_inputs) {
    const tagName = await elem.tagName();
    console.log('await elem.tagName()', tagName);
    expect(tagName).toEqual('INPUT');
    const attrs = await elem.getAttributes();
    console.log('elem.getAttributes', attrs);
    expect(attrs).not.toBeNullOrUndefined();
  }
}

const url_frame = 'https://sagibrant.github.io/mimic/aut/index.html';
await page.navigate(url_frame);
console.log('await page.navigate(url_frame);');
await page.sync();
console.log('await page.sync();');
{
  let value = '';
  // closed shadowdom
  {
    // click in the closed shadowdom with js link (require cdp)
    await page
      .frame()
      .nth(1)
      .element()
      .filter([{ name: 'tagName', value: 'DIV' }])
      .nth(1)
      .click();
    console.log(`await page.frame().nth(1).element().filter([{ "name": "tagName", "value": "DIV" }]).nth(1).click()`);
    await page
      .frame()
      .nth(1)
      .element()
      .filter([{ name: 'tagName', value: 'DIV' }])
      .nth(1)
      .highlight();
    console.log(`await page.frame().nth(1).element().filter([{ "name": "tagName", "value": "DIV" }]).nth(1).highlight()`);
    value = await page
      .frame()
      .nth(1)
      .element()
      .filter([{ name: 'tagName', value: 'INPUT' }])
      .value();
    expect(value).toEqual('ttt1');
    // fill in the closed shadowdom
    await page
      .frame()
      .nth(1)
      .element()
      .filter([{ name: 'tagName', value: 'INPUT' }])
      .fill('abc');
    console.log(`await page.frame().nth(1).element().filter([{ "name": "tagName", "value": "INPUT" }]).fill('abc')`);
    value = await page
      .frame()
      .nth(1)
      .element()
      .filter([{ name: 'tagName', value: 'INPUT' }])
      .value();
    expect(value).toEqual('abc');
  }

  // opened shadowdom
  {
    // visible js links
    {
      // click in the opened shadowdom with js links
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'A' }])
        .first()
        .click();
      console.log(`await page.frame().nth(2).element().filter([{ "name": "tagName", "value": "A" }]).first().click()`);
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('js link click');

      // click in the opened shadowdom with image in js links
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .fill('');
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('');
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'IMG' }])
        .click();
      console.log(`await page.frame().nth(2).element().filter([{ "name": "tagName", "value": "IMG" }]).click()`);
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('js link click');

      // click in the opened shadowdom with js links with role
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .fill('');
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('');
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'A' }])
        .nth(1)
        .click();
      console.log(`await page.frame().nth(2).element().filter([{ "name": "tagName", "value": "A" }]).nth(1).click()`);
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('role based js link click');

      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .fill('');
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('');
    }
    // hide the links in the opened shadowdom
    await page.frame().nth(2).element('#btn1').click();
    console.log(`await page.frame().nth(2).element('#btn1').click()`);

    // invisible js links (require click in main world)
    {
      // click in the opened shadowdom with js links
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'A' }])
        .first()
        .click();
      console.log(`await page.frame().nth(2).element().filter([{ "name": "tagName", "value": "A" }]).first().click()`);
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('js link click');

      // click in the opened shadowdom with image in js links
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .fill('');
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('');
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'IMG' }])
        .click();
      console.log(`await page.frame().nth(2).element().filter([{ "name": "tagName", "value": "IMG" }]).click()`);
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('js link click');

      // click in the opened shadowdom with js links with role
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .fill('');
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('');
      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'A' }])
        .nth(1)
        .click();
      console.log(`await page.frame().nth(2).element().filter([{ "name": "tagName", "value": "A" }]).nth(1).click()`);
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('role based js link click');

      await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .fill('');
      value = await page
        .frame()
        .nth(2)
        .element()
        .filter([{ name: 'tagName', value: 'INPUT' }])
        .nth(1)
        .value();
      expect(value).toEqual('');
    }
  }

  // file upload
  {
    await page
      .frame()
      .nth(3)
      .element('#avatar')
      .setFileInputFiles(['/Users/sagi/Workspace/temp/extension_release_1/logo_450x800.png']);
    console.log(
      `await page.frame().nth(3).element('#avatar').setFileInputFiles(["/Users/sagi/Workspace/temp/extension_release_1/logo_450x800.png"])`
    );
    value = await page.frame().nth(3).element('#avatar').value();
    expect(value).toEqual('C:\\fakepath\\logo_450x800.png');
  }
}

console.log('element methods <==');

await page.bringToFront();

console.warn('all passed');
