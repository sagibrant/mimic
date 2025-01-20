/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file locator.js
 * @description 4. event click test
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

console.log('element click ======>');
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
      const btn = await page.element('#btn_mousemoved').get();
      console.log(`await page.element("#btn_mousemoved").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      if (inputMode === 'cdp') {
        const boundingBox = await btn.boundingBox();
        console.log('await btn.boundingBox()', boundingBox);

        const x = boundingBox.x + boundingBox.width / 2;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.element('#btn_mousemoved').sendCDPCommand('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: x,
          y: y,
          button: 'left',
          clickCount: 0,
        });
        console.log(`
          await page.element("#btn_mousemoved").sendCDPCommand('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: x,
            y: y,
            button: 'left',
            clickCount: 0
          });
        `);
      } else {
        await page.element('#btn_mousemoved').dispatchEvent('mousemove');
        console.log(`await page.element("#btn_mousemoved").dispatchEvent('mousemove')`);
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
      const btn = await page.element('#btn_mousedown').get();
      console.log(`await page.element("#btn_mousedown").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      if (inputMode === 'cdp') {
        const boundingBox = await btn.boundingBox();
        console.log('await btn.boundingBox()', boundingBox);

        const x = boundingBox.x + boundingBox.width / 2;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.element('#btn_mousedown').sendCDPCommand('Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x: x,
          y: y,
          button: 'left',
          clickCount: 1,
        });
        console.log(`
          await page.element("#btn_mousedown").sendCDPCommand('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x: x,
            y: y,
            button: 'left',
            clickCount: 1
          });
        `);
      } else {
        await page.element('#btn_mousedown').dispatchEvent('mousedown');
        console.log(`await page.element("#btn_mousedown").dispatchEvent('mousedown')`);
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
      const btn = await page.element('#btn_mouseup').get();
      console.log(`await page.element("#btn_mouseup").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      if (inputMode === 'cdp') {
        const boundingBox = await btn.boundingBox();
        console.log('await btn.boundingBox()', boundingBox);

        const x = boundingBox.x + boundingBox.width / 2;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.element('#btn_mouseup').sendCDPCommand('Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x: x,
          y: y,
          button: 'left',
          clickCount: 1,
        });
        console.log(`
          await page.element("#btn_mouseup").sendCDPCommand('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x: x,
            y: y,
            button: 'left',
            clickCount: 1
          })
        `);
      } else {
        await page.element('#btn_mouseup').dispatchEvent('mouseup');
        console.log(`await page.element("#btn_mouseup").dispatchEvent('mouseup')`);
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
      const btn = await page.element('#btn_wheel').get();
      console.log(`await page.element("#btn_wheel").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const options = { ...defaultOptions, deltaX: 0, deltaY: -80 };
      await page.element('#btn_wheel').wheel(options);
      console.log(`
          await page.element("#btn_wheel").wheel(${options ? JSON.stringify(options) : options})
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
      const btn = await page.element('#btn_click').get();
      console.log(`await page.element("#btn_click").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      await page.element('#btn_click').click(defaultOptions);
      console.log(`
          await page.element("#btn_click").click(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
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
      const btn = await page.element('#btn_dblclick').get();
      console.log(`await page.element("#btn_dblclick").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      await page.element('#btn_dblclick').dblclick(defaultOptions);
      console.log(`
          await page.element("#btn_dblclick").dblclick(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
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
      const btn = await page.element('#btn_middleclick').get();
      console.log(`await page.element("#btn_middleclick").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const options = { ...defaultOptions, button: 'middle' };
      await page.element('#btn_middleclick').click(options);
      console.log(`
          await page.element("#btn_middleclick").click(${options ? JSON.stringify(options) : options})
      `);
      await wait(500);
      console.log('await wait(500)');
      await page.element('#btn_middleclick').click(options);
      console.log(`
          await page.element("#btn_middleclick").click(${options ? JSON.stringify(options) : options})
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
      const btn = await page.element('#btn_rightclick').get();
      console.log(`await page.element("#btn_rightclick").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const options = { ...defaultOptions, button: 'right' };
      await page.element('#btn_rightclick').click(options);
      console.log(`
          await page.element("#btn_rightclick").click(${options ? JSON.stringify(options) : options})
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

    // btn_focus
    {
      const btn = await page.element('#btn_focus').get();
      console.log(`await page.element("#btn_focus").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      await page.element('#btn_focus').focus();
      console.log(`
          await page.element("#btn_focus").focus()
      `);

      const output = await page.element('#output_focus').innerText();
      console.log(`await page.element("#output_focus").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_focus").innerText() events`, events);
      expect(events).toContain('focus');
    }

    // btn_hover
    {
      const btn = await page.element('#btn_hover').get();
      console.log(`await page.element("#btn_hover").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      await page.element('#btn_hover').hover(defaultOptions);
      console.log(`
          await page.element("#btn_hover").hover(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
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
      const btn = await page.element('#btn_tap').get();
      console.log(`await page.element("#btn_tap").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      await page.element('#btn_tap').tap(defaultOptions);
      console.log(`
          await page.element("#btn_tap").tap(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      const output = await page.element('#output_tap').innerText();
      console.log(`await page.element("#output_tap").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_tap").innerText() events`, events);
      expect(events).toContain('touchstart');
      expect(events).toContain('touchend');
    }

    // btn_blur
    {
      const btn = await page.element('#btn_blur').get();
      console.log(`await page.element("#btn_blur").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      await page.element('#btn_blur').blur();
      console.log(`
          await page.element("#btn_tap").blur()
      `);

      const output = await page.element('#output_blur').innerText();
      console.log(`await page.element("#output_blur").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_blur").innerText() events`, events);
      expect(events).toContain('blur');
    }

    // btn_drag btn_drop
    {
      const btn = await page.element('#btn_drag').get();
      console.log(`await page.element("#btn_drag").get()`, btn);
      expect(btn).not.toBeNullOrUndefined();
      await btn.scrollIntoViewIfNeeded();
      console.log('await btn.scrollIntoViewIfNeeded()');

      const btn_drop = await page.element('#btn_drop').get();
      console.log(`await page.element("#btn_drop").get()`, btn_drop);
      expect(btn_drop).not.toBeNullOrUndefined();
      await btn_drop.scrollIntoViewIfNeeded();
      console.log('await btn_drop.scrollIntoViewIfNeeded()');

      await page.element('#btn_drag').dragTo(btn_drop, defaultOptions);
      console.log(`
          await page.element("#btn_drag").dragTo(btn_drop, ${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions});
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
      const checkbox = await page.element('#checkbox').get();
      console.log(`await page.element("#checkbox").get()`, checkbox);
      expect(checkbox).not.toBeNullOrUndefined();
      await checkbox.scrollIntoViewIfNeeded();
      console.log('await checkbox.scrollIntoViewIfNeeded()');

      let checked = await page.element('#checkbox').checked();
      console.log(`await page.element("#checkbox").checked()`, checked);
      expect(checked).toBeFalsy();

      await page.element('#checkbox').check(defaultOptions);
      console.log(`
          await page.element("#checkbox").check(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
      `);

      checked = await page.element('#checkbox').checked();
      console.log(`await page.element("#checkbox").checked()`, checked);
      expect(checked).toBeTruthy();

      await page.element('#checkbox').uncheck(defaultOptions);
      console.log(`
          await page.element("#checkbox").uncheck(${defaultOptions ? JSON.stringify(defaultOptions) : defaultOptions})
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
      const radio_buttons = await page.element('input[name="drone"]').all();
      console.log(
        `
        await page.element('input[name="drone"]').all()
      `,
        radio_buttons
      );
      expect(radio_buttons).not.toBeNullOrUndefined();
      expect(radio_buttons).toHaveLength(3);
      await radio_buttons[2].scrollIntoViewIfNeeded();
      console.log('await radio_buttons[2].scrollIntoViewIfNeeded()');

      for (let i = 0; i < radio_buttons.length; ++i) {
        let checked = await page.element('input[name="drone"]').nth(i).checked();
        console.log(
          `
          await page.element('input[name="drone"]').nth(${i}).checked()
        `,
          checked
        );
        const id = await page.element('input[name="drone"]').nth(i).id();
        console.log(
          `
          await page.element('input[name="drone"]').nth(${i}).id()
        `,
          id
        );
        const value = await page.element('input[name="drone"]').nth(i).value();
        console.log(
          `
          await page.element('input[name="drone"]').nth(${i}).value()
        `,
          value
        );

        if (!checked) {
          await page.element('input[name="drone"]').nth(i).check();
          console.log(`
            await page.element('input[name="drone"]').nth(${i}).check()
          `);
          checked = await page.element('input[name="drone"]').nth(i).checked();
          console.log(
            `
            await page.element('input[name="drone"]').nth(${i}).checked()
          `,
            checked
          );
          expect(checked).toBeTruthy();
        }
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

      const checkSelectedOptions = async (expectedIndex, expectedValues, expectedLabels) => {
        const selectedIndex = await page.element('#select').selectedIndex();
        console.log(`await page.element("#select").selectedIndex()`, selectedIndex);
        expect(selectedIndex >= -1).toBeTruthy();
        if (typeof expectedIndex === 'number') {
          expect(selectedIndex).toEqual(expectedIndex);
        }

        const selectedOptions = await page.element('#select').selectedOptions();
        console.log(`await page.element("#select").selectedOptions()`, selectedOptions);
        expect(selectedOptions).not.toBeNullOrUndefined();
        expect(Array.isArray(selectedOptions)).toBeTruthy();
        for (const selectedOption of selectedOptions) {
          const value = await selectedOption.value();
          console.log(`await selectedOption.value()`, value);
          const label = await selectedOption.label();
          console.log(`await selectedOption.label()`, label);
          expect(value).not.toBeNullOrUndefined();
          if (Array.isArray(expectedValues) && expectedValues.length > 0) {
            expect(expectedValues).toContain(value);
          }
          if (Array.isArray(expectedLabels) && expectedLabels.length > 0) {
            expect(expectedLabels).toContain(label);
          }
        }
      };

      let multiple = await page.element('#select').multiple();
      console.log(`await page.element("#select").multiple()`, multiple);
      expect(multiple).toBeFalsy();

      await page.element('#select').selectOption(2);
      console.log(`
          await page.element("#select").selectOption(2)
      `);
      await checkSelectedOptions(2);

      await page.element('#select').selectOption('cat');
      console.log(`
          await page.element("#select").selectOption('cat')
      `);
      await checkSelectedOptions(2, ['cat']);

      await page.element('#select').selectOption('Dog');
      console.log(`
          await page.element("#select").selectOption('Dog')
      `);
      await checkSelectedOptions(1, ['dog'], ['Dog']);

      await page.element('#select').toggleAttribute('multiple', true);
      console.log(`
          await page.element("#select").toggleAttribute('multiple', true);
      `);

      multiple = await page.element('#select').multiple();
      console.log(`await page.element("#select").multiple()`, multiple);
      expect(multiple).toBeTruthy();

      await page.element('#select').selectOption(['cat', 'Dog', 3]);
      console.log(`
          await page.element("#select").selectOption(['cat', 'Dog', 3])
      `);
      await checkSelectedOptions(1, ['cat', 'dog', 'hamster'], ['Cat', 'Dog', 'Hamster']);

      await page.element('#select').selectOption(-1);
      console.log(`
          await page.element("#select").selectOption(-1)
      `);
      await checkSelectedOptions(-1);

      const options = await page.element('#select').options();
      console.log(`await page.element("#select").options()`, options);
      expect(options).toHaveLength(7);

      await page.element('#select').selectOption(options.slice(1, 3));
      console.log(`
          await page.element("#select").selectOption(options.slice(1, 3))
      `);
      await checkSelectedOptions(1, ['cat', 'dog'], ['Cat', 'Dog']);

      const output = await page.element('#output_select').innerText();
      console.log(`await page.element("#output_select").innerText()`, output.slice(0, 10));
      expect(output.length > 0).toBeTruthy();

      const events = output.split('\n').filter(s => s.length > 0);
      console.log(`await page.element("#output_select").innerText() events`, events);
      expect(events).toContain('input');
      expect(events).toContain('change');
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

console.log('element click <======');

await page.bringToFront();

console.warn('all passed');
