/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file methods.js
 * @description 1. methods test
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

console.log('text methods ======>');
console.log('current page', page);
const inputModes = ['default', 'event', 'cdp'];
for (const inputMode of inputModes) {
  console.log(`inputMode ${inputMode} ======>`);
  const url_mouse = 'file:///Users/sagi/Workspace/src/sagibrant/gogogo/tests/aut/mouse.html';
  await page.navigate(url_mouse);
  await page.sync();

  const defaultOptions = inputMode === 'default' ? undefined : { mode: inputMode };

  try {
    if (inputMode === 'cdp') {
      await browser.attachDebugger();
      console.log('await browser.attachDebugger()');
      await wait(1000);
      console.log('await wait(1000)');
    }
    // start monitor
    {
      const btn = await page.element('#btn_start_monitor').get();
      console.log(`await page.element("#btn_start_monitor").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');
      await page.element('#btn_start_monitor').click(defaultOptions);
      console.log(`
        await page.element("#btn_start_monitor").click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);
    }
    // btn_mousemoved
    {
      await page.text(/Move mouse to m/).highlight();
      console.log('await page.text(/Move mouse to m/).highlight()');

      const btn = await page.text(/Move mouse to m/).ownerElement();
      console.log(`await page.text(/Move mouse to m/).ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text(/Move mouse to m/).textContent();
      console.log('await page.text(/Move mouse to m/).textContent()', textContent);
      expect(textContent).toEqual('Move mouse to me!');

      if (inputMode === 'cdp') {
        const boundingBox = await btn.boundingBox();
        console.log('await btn.boundingBox()', boundingBox);

        const x = boundingBox.x + boundingBox.width / 2;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.text(/Move mouse to m/).sendCDPCommand('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: x,
          y: y,
          button: 'left',
          clickCount: 0,
        });
        console.log(`
          await page.text(/Move mouse to m/).sendCDPCommand('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: x,
            y: y,
            button: 'left',
            clickCount: 0
          });
        `);
      } else {
        await page.text(/Move mouse to m/).dispatchEvent('mousemove');
        console.log(`await page.text(/Move mouse to m/).dispatchEvent('mousemove')`);
      }

      const output = await page.element('#output_mousemoved').innerText();
      console.log(`await page.element("#output_mousemoved").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_mousemoved").innerText() events`, events);
      if (inputMode === 'cdp') {
        expect(events).toContain('mouseover');
        expect(events).toContain('mouseenter');
      }
      expect(events).toContain('mousemove');
    }

    // btn_mousedown
    {
      const btn = await page.text('Press mouse on me!').ownerElement();
      console.log(`await page.text('Press mouse on me!').ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text('Press mouse on me!').textContent();
      console.log("await page.text('Press mouse on me!').textContent()", textContent);
      expect(textContent).toEqual('Press mouse on me!');

      if (inputMode === 'cdp') {
        const boundingBox = await btn.boundingBox();
        console.log('await btn.boundingBox()', boundingBox);

        const x = boundingBox.x + boundingBox.width / 2;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.text('Press mouse on me!').sendCDPCommand('Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x: x,
          y: y,
          button: 'left',
          clickCount: 1,
        });
        console.log(`
          await page.text('Press mouse on me!').sendCDPCommand('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x: x,
            y: y,
            button: 'left',
            clickCount: 1
          });
        `);
      } else {
        await page.text('Press mouse on me!').dispatchEvent('mousedown');
        console.log(`await page.text('Press mouse on me!').dispatchEvent('mousedown')`);
      }

      const output = await page.element('#output_mousedown').innerText();
      console.log(`await page.element("#output_mousedown").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_mousedown").innerText() events`, events);
      expect(events).toContain('mousedown');
    }

    // btn_mouseup
    {
      const btn = await page.text({ text: /Release mouse to me/ }).ownerElement();
      console.log(`await page.text({ text: /Release mouse to me/ }).ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text({ text: /Release mouse to me/ }).textContent();
      console.log('await page.text({ text: /Release mouse to me/ }).textContent()', textContent);
      expect(textContent).toEqual('Release mouse to me!');

      if (inputMode === 'cdp') {
        const boundingBox = await btn.boundingBox();
        console.log('await btn.boundingBox()', boundingBox);

        const x = boundingBox.x + boundingBox.width / 2;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.text({ text: /Release mouse to me/ }).sendCDPCommand('Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x: x,
          y: y,
          button: 'left',
          clickCount: 1,
        });
        console.log(`
          await page.text({ text: /Release mouse to me/ }).sendCDPCommand('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x: x,
            y: y,
            button: 'left',
            clickCount: 1
          })
        `);
      } else {
        await page.text({ text: /Release mouse to me/ }).dispatchEvent('mouseup');
        console.log(`await page.text({ text: /Release mouse to me/ }).dispatchEvent('mouseup')`);
      }

      const output = await page.element('#output_mouseup').innerText();
      console.log(`await page.element("#output_mouseup").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_mouseup").innerText() events`, events);
      expect(events).toContain('mouseup');
    }

    // btn_wheel
    {
      await page.text({ text: 'Mouse wheel on me!' }).highlight();
      console.log(`await page.text({ text: 'Mouse wheel on me!' }).highlight()`);

      const btn = await page.text({ text: 'Mouse wheel on me!' }).ownerElement();
      console.log(`await page.text({ text: 'Mouse wheel on me!' }).ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text({ text: 'Mouse wheel on me!' }).textContent();
      console.log("await page.text({ text: 'Mouse wheel on me!' }).textContent()", textContent);
      expect(textContent).toEqual('Mouse wheel on me!');

      const options = { ...defaultOptions, deltaX: 0, deltaY: -80 };
      await page.text({ text: 'Mouse wheel on me!' }).wheel(options);
      console.log(`
          await page.text({ text: 'Mouse wheel on me!' }).wheel(${options ? JSON.stringify(options) : options})
      `);

      const output = await page.element('#output_wheel').innerText();
      console.log(`await page.element("#output_wheel").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_wheel").innerText() events`, events);
      expect(events).toContain('wheel');
    }

    // btn_click
    {
      const btn = await page.text(/Mouse Left Click on me/).ownerElement();
      console.log(`await page.text(/Mouse Left Click on me/).ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text(/Mouse Left Click on me/).textContent();
      console.log('await page.text(/Mouse Left Click on me/).textContent()', textContent);
      expect(textContent).toEqual('Mouse Left Click on me!');

      await page.text(/Mouse Left Click on me/).click(defaultOptions);
      console.log(`
          await page.text(/Mouse Left Click on me/).click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      const output = await page.element('#output_click').innerText();
      console.log(`await page.element("#output_click").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_click").innerText() events`, events);
      expect(events).toContain('mousedown');
      expect(events).toContain('mouseup');
      expect(events).toContain('click');
    }

    // btn_dblclick
    {
      const btn = await page.text('Mouse Left DblClick on me!').ownerElement();
      console.log(`await page.text("Mouse Left DblClick on me!").ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text('Mouse Left DblClick on me!').textContent();
      console.log(`await page.text("Mouse Left DblClick on me!").textContent()`, textContent);
      expect(textContent).toEqual('Mouse Left DblClick on me!');

      await page.text('Mouse Left DblClick on me!').dblclick(defaultOptions);
      console.log(`
          await page.text("Mouse Left DblClick on me!").dblclick(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
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

    // btn_middleclick
    {
      const btn = await page.text(/Mouse Middle Click on me/).ownerElement();
      console.log(`await page.text(/Mouse Middle Click on me/).ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text(/Mouse Middle Click on me/).textContent();
      console.log(`await page.text(/Mouse Middle Click on me/).textContent()`, textContent);
      expect(textContent).toEqual('Mouse Middle Click on me!');

      const options = { ...defaultOptions, button: 'middle' };
      await page.text(/Mouse Middle Click on me/).click(options);
      console.log(`
          await page.text(/Mouse Middle Click on me/).click(${options ? JSON.stringify(options) : options})
      `);
      await wait(500);
      console.log('await wait(500)');
      await page.text(/Mouse Middle Click on me/).click(options);
      console.log(`
          await page.text(/Mouse Middle Click on me/).click(${options ? JSON.stringify(options) : options})
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

    // btn_rightclick
    {
      const btn = await page.text(/Mouse Right Click on me/).ownerElement();
      console.log(`await page.text(/Mouse Right Click on me/).ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text(/Mouse Right Click on me/).textContent();
      console.log(`await page.text(/Mouse Right Click on me/).textContent()`, textContent);
      expect(textContent).toEqual('Mouse Right Click on me!');

      const options = { ...defaultOptions, button: 'right' };
      await page.text(/Mouse Right Click on me/).click(options);
      console.log(`
          await page.text(/Mouse Right Click on me/).click(${options ? JSON.stringify(options) : options})
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

    // btn_hover
    {
      const btn = await page.text(/Mouse hover on me/).ownerElement();
      console.log(`await page.text(/Mouse hover on me/).ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text(/Mouse hover on me/).textContent();
      console.log(`await page.text(/Mouse hover on me/).textContent()`, textContent);
      expect(textContent).toEqual('Mouse hover on me!');

      await page.text(/Mouse hover on me/).hover(defaultOptions);
      console.log(`
          await page.text(/Mouse hover on me/).hover(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      const output = await page.element('#output_hover').innerText();
      console.log(`await page.element("#output_hover").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_hover").innerText() events`, events);
      expect(events).toContain('mouseover');
      expect(events).toContain('mouseenter');
    }

    // btn_tap
    {
      const btn = await page.text(/Tap on m/).ownerElement();
      console.log(`await page.text(/Tap on m/).ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const textContent = await page.text(/Tap on m/).textContent();
      console.log(`await page.text(/Tap on m/).textContent()`, textContent);
      expect(textContent).toEqual('Tap on me!');

      await page.text(/Tap on m/).tap(defaultOptions);
      console.log(`
          await page.text(/Tap on m/).tap(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      const output = await page.element('#output_tap').innerText();
      console.log(`await page.element("#output_tap").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_tap").innerText() events`, events);
      expect(events).toContain('touchstart');
      expect(events).toContain('touchend');
    }

    // btn_drag btn_drop
    {
      const btn = await page.text(/Drag on me/).ownerElement();
      console.log(`await page.text(/Drag on me/).ownerElement()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const btn_drop = await page.text(/Drop on me/).ownerElement();
      console.log(`await page.text(/Drop on me/).ownerElement()`, btn_drop);
      expect(btn_drop).not.toBeNullOrUndefined();
      await btn_drop.scrollIntoViewIfNeeded();
      console.log('await btn_drop.scrollIntoViewIfNeeded()');

      await page.text(/Drag on me/).dragTo(btn_drop, defaultOptions);
      console.log(`
          await page.text(/Drag on me/).dragTo(btn_drop, ${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions});
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

    // checkbox
    {
      const checkbox = await page.text('checkbox').last().ownerElement();
      console.log(`await page.text("checkbox").last().ownerElement()`, checkbox);
      expect(checkbox).not.toBeNullOrUndefined();
      await checkbox.scrollIntoViewIfNeeded();
      console.log('await checkbox.scrollIntoViewIfNeeded()');

      const textContent = await page.text('checkbox').last().textContent();
      console.log(`await page.text("checkbox").last().textContent()`, textContent);
      expect(textContent).toEqual('checkbox');

      let checked = await page.element('#checkbox').checked();
      console.log(`await page.element("#checkbox").checked()`, checked);
      expect(checked).toBeFalsy();

      await page.text('checkbox').last().click(defaultOptions);
      console.log(`
          await page.text("checkbox").last().click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      checked = await page.element('#checkbox').checked();
      console.log(`await page.element("#checkbox").checked()`, checked);
      expect(checked).toBeTruthy();

      await page.text('checkbox').last().click(defaultOptions);
      console.log(`
          await page.text("checkbox").last().click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      checked = await page.element('#checkbox').checked();
      console.log(`await page.element("#checkbox").checked()`, checked);
      expect(checked).toBeFalsy();

      const output = await page.element('#output_checkbox').innerText();
      console.log(`await page.element("#output_checkbox").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_checkbox").innerText() events`, events);
      expect(events).toContain('click');
      expect(events).toContain('input');
      expect(events).toContain('change');
    }

    // radio
    {
      const radio_labes = ['Huey', 'Dewey', 'Louie'];
      const radio_ids = ['huey', 'dewey', 'louie'];
      for (let i = 0; i < radio_labes.length; ++i) {
        let checked = await page.element(`input[id="${radio_ids[i]}"]`).checked();
        console.log(
          `
          await page.element('input[id="${radio_ids[i]}"]).checked();
        `,
          checked
        );
        if (i === 0) {
          expect(checked).toBeTruthy();
        } else {
          expect(checked).toBeFalsy();
        }
        await page.text(radio_labes[i]).click(defaultOptions);
        console.log(`
            await page.text('${radio_labes[i]}').click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
        `);
        checked = await page.element(`input[id="${radio_ids[i]}"]`).checked();
        console.log(
          `
          await page.element('input[id="${radio_ids[i]}"]).checked();
        `,
          checked
        );
        expect(checked).toBeTruthy();
      }

      const output = await page.element('#output_radio').innerText();
      console.log(`await page.element("#output_radio").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_radio").innerText() events`, events);
      expect(events).toContain('click');
      expect(events).toContain('input');
      expect(events).toContain('change');
    }

    // select
    {
      const select = await page.element('#select').get();
      console.log(`await page.element("#select").get()`, select);
      expect(select).not.toBeNullOrUndefined();
      await select.scrollIntoViewIfNeeded();
      console.log('await select.scrollIntoViewIfNeeded()');

      let textContent = await page.frame().nth(0).text('--Please choose an option--').textContent();
      console.log(`await page.frame().nth(0).text("--Please choose an option--").textContent()`, textContent);
      expect(textContent).toEqual('--Please choose an option--');

      textContent = await page
        .frame()
        .nth(0)
        .element('#select')
        .text(/Hamster/)
        .textContent();
      console.log(`await page.frame().nth(0).element("#select").text(/Hamster/).textContent()`, textContent);
      expect(textContent).toEqual('Hamster');
    }
  } catch (error) {
    throw error;
  } finally {
    // btn_stop_monitor
    {
      const btn = await page.element('#btn_stop_monitor').get();
      console.log(`await page.element("#btn_stop_monitor").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');
      await page.element('#btn_stop_monitor').click(defaultOptions);
      console.log(`
        await page.element("#btn_stop_monitor").click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);
    }
    if (inputMode === 'cdp') {
      await browser.detachDebugger();
      console.log('await browser.detachDebugger()');
      await wait(1000);
      console.log('await wait(1000)');
    }
    console.log(`inputMode ${inputMode} <======`);
  }
}

console.log('text methods <======');

await page.bringToFront();

console.warn('all passed');
