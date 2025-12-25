/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file mouse.js
 * @description 6. mouse test
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

console.log('mouse =>');
console.log('current page', page);
const url_mouse = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/mouse.html';

await page.navigate(url_mouse);
console.log('await page.navigate(url_mouse)', url_mouse);
await page.sync();
console.log('await page.sync()');
let page_status = await page.status();
console.log('await page.status()', page_status);
expect(page_status).toBe('complete');
let page_url = await page.url();
console.log('await page.url()', page_url);
expect(page_url).toEqual(url_mouse);

const keyboard = page.keyboard();
console.log('page.keyboard()', keyboard);
expect(keyboard).not.toBeNullOrUndefined();

const mouse = page.mouse();
console.log('page.mouse()', mouse);
expect(mouse).not.toBeNullOrUndefined();

try {
  await browser.attachDebugger();
  console.log('await browser.attachDebugger()');
  await wait(1000);
  console.log('await wait(1000)');

  // start monitor
  {
    const btn_id = 'btn_start_monitor';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.click(x, y);
    console.log(` await mouse.click(${x}, ${y}); `);
  }

  // move
  {
    const btn_id = 'btn_mousemoved';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.move(x, y);
    console.log(` await mouse.move(${x}, ${y}); `);

    const output = await page.element('#output_mousemoved').innerText();
    console.log(`await page.element("#output_mousemoved").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_mousemoved").innerText() events`, events);
    expect(events).toContain('mouseover');
    expect(events).toContain('mouseenter');
    expect(events).toContain('mousemove');
  }

  // mouse down
  {
    const btn_id = 'btn_mousedown';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.move(x, y);
    console.log(` await mouse.move(${x}, ${y}); `);
    await mouse.down();
    console.log(` await mouse.down(); `);

    const output = await page.element('#output_mousedown').innerText();
    console.log(`await page.element("#output_mousedown").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_mousedown").innerText() events`, events);
    expect(events).toContain('mousedown');
  }

  // mouse up
  {
    const btn_id = 'btn_mouseup';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.move(x, y);
    console.log(` await mouse.move(${x}, ${y}); `);
    await mouse.up();
    console.log(` await mouse.up(); `);

    const output = await page.element('#output_mouseup').innerText();
    console.log(`await page.element("#output_mouseup").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_mouseup").innerText() events`, events);
    expect(events).toContain('mouseup');
  }

  // mouse wheel
  {
    const btn_id = 'btn_wheel';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.move(x, y);
    console.log(` await mouse.move(${x}, ${y}); `);
    await mouse.wheel(0, 100);
    console.log(` await mouse.wheel(0, 100); `);

    const output = await page.element('#output_wheel').innerText();
    console.log(`await page.element("#output_wheel").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_wheel").innerText() events`, events);
    expect(events).toContain('wheel');
  }

  // mouse click
  {
    const btn_id = 'btn_click';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.click(x, y, { button: 'left' });
    console.log(` await mouse.click(${x}, ${y}, { button: 'left'}); `);

    const output = await page.element('#output_click').innerText();
    console.log(`await page.element("#output_click").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_click").innerText() events`, events);
    expect(events).toContain('mousedown');
    expect(events).toContain('mouseup');
    expect(events).toContain('click');
  }

  // mouse dblclick
  {
    const btn_id = 'btn_dblclick';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.click(x, y, { button: 'left', clickCount: 2, position: { x: 3, y: 3 }, delayBetweenClick: 50 });
    console.log(` 
      await mouse.click(${x}, ${y}, { button: 'left', clickCount: 2, position: { x: 3, y: 3 }, delayBetweenClick: 50 });
    `);

    const output = await page.element('#output_dblclick').innerText();
    console.log(`await page.element("#output_dblclick").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_dblclick").innerText() events`, events);
    expect(events).toContain('mousedown');
    expect(events).toContain('mouseup');
    expect(events).toContain('click');
    expect(events).toContain('dblclick');
  }

  // mouse middleclick
  {
    const btn_id = 'btn_middleclick';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.click(x, y, { button: 'middle', delayBetweenDownUp: 50 });
    console.log(` 
      await mouse.click(${x}, ${y}, { button: 'middle', delayBetweenDownUp: 50 });
    `);
    await wait(500);
    console.log('await wait(500)');
    await mouse.click(x, y, { button: 'middle', delayBetweenDownUp: 50 });
    console.log(` 
      await mouse.click(${x}, ${y}, { button: 'middle', delayBetweenDownUp: 50 });
    `);

    const output = await page.element('#output_middleclick').innerText();
    console.log(`await page.element("#output_middleclick").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_middleclick").innerText() events`, events);
    expect(events).toContain('mousedown');
    expect(events).toContain('mouseup');
    // expect(events).toContain('auxclick');
  }

  // mouse rightclick
  {
    const btn_id = 'btn_rightclick';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.click(x, y, { button: 'right', delayBetweenDownUp: 50 });
    console.log(` 
      await mouse.click(${x}, ${y}, { button: 'right', delayBetweenDownUp: 50 });
    `);

    const output = await page.element('#output_rightclick').innerText();
    console.log(`await page.element("#output_rightclick").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_rightclick").innerText() events`, events);
    expect(events).toContain('mousedown');
    expect(events).toContain('mouseup');
    expect(events).toContain('auxclick');
    expect(events).toContain('contextmenu');
  }

  // mouse move (btn_hover)
  {
    const btn_id = 'btn_hover';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.move(x, y);
    console.log(` 
      await mouse.click(${x}, ${y});
    `);

    const output = await page.element('#output_hover').innerText();
    console.log(`await page.element("#output_hover").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_hover").innerText() events`, events);
    expect(events).toContain('mouseover');
    expect(events).toContain('mouseenter');
  }

  // mouse drag drop
  {
    const btn_id_drag = 'btn_drag';
    const btn_drag = await page.element().filter({ name: 'id', value: btn_id_drag }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id_drag}'}).first().get()`, btn_drag);
    expect(btn_drag).not.toBeNullOrUndefined();

    await btn_drag.scrollIntoViewIfNeeded();
    console.log('await btn_drag.scrollIntoViewIfNeeded()');

    const btn_id_drop = 'btn_drop';
    const btn_drop = await page.element().filter({ name: 'id', value: btn_id_drop }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id_drop}'}).first().get()`, btn_drop);
    expect(btn_drop).not.toBeNullOrUndefined();

    await btn_drop.scrollIntoViewIfNeeded();
    console.log('await btn_drop.scrollIntoViewIfNeeded()');

    const boundingBox_drag = await btn_drag.boundingBox();
    console.log('await btn_drag.boundingBox()', boundingBox_drag);

    const x_drag = boundingBox_drag.x + boundingBox_drag.width / 2;
    const y_drag = boundingBox_drag.y + boundingBox_drag.height / 2;

    const boundingBox_drop = await btn_drop.boundingBox();
    console.log('await btn_drop.boundingBox()', boundingBox_drop);

    const x_drop = boundingBox_drop.x + boundingBox_drop.width / 2;
    const y_drop = boundingBox_drop.y + boundingBox_drop.height / 2;

    await mouse.move(x_drag, y_drag);
    console.log(` 
      await mouse.move(${x_drag}, ${y_drag});
    `);
    await mouse.down();
    console.log(` 
      await mouse.down();
    `);

    await mouse.move(x_drop, y_drop, { steps: 10 });
    console.log(` 
      await mouse.move(${x_drop}, ${y_drop}, {steps: 10});
    `);
    await mouse.up();
    console.log(` 
      await mouse.up();
    `);

    const output = await page.element('#output_drag_drop').innerText();
    console.log(`await page.element("#output_drag_drop").innerText()`, output.slice(0, 10));
    expect(output.length > 0).toBeTruthy();

    const events = output.split('\n').filter(s => s.length > 0);
    console.log(`await page.element("#output_drag_drop").innerText() events`, events);
    expect(events).toContain('dragstart');
    expect(events).toContain('drag');
    expect(events).toContain('dragenter');
    expect(events).toContain('dragover');
    expect(events).toContain('drag');
    expect(events).toContain('dragleave');
    expect(events).toContain('drop');
    expect(events).toContain('dragend');
  }

  // stop monitor
  {
    const btn_id = 'btn_stop_monitor';
    const btn = await page.element().filter({ name: 'id', value: btn_id }).first().get();
    console.log(`await page.element().filter({name:'id', value:'${btn_id}'}).first().get()`, btn);
    expect(btn).not.toBeNullOrUndefined();

    await btn.scrollIntoViewIfNeeded();
    console.log('await btn.scrollIntoViewIfNeeded()');

    const boundingBox = await btn.boundingBox();
    console.log('await btn.boundingBox()', boundingBox);

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    await mouse.click(x, y);
    console.log(` await mouse.click(${x}, ${y}); `);
  }
} catch (error) {
  throw error;
} finally {
  await browser.detachDebugger();
  console.log('await browser.detachDebugger()');
  await page.bringToFront();
}

console.log('mouse <=');

console.warn('all passed');
