/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file TaskUtils.ts
 * @description 
 * Defines Utils for tasks and steps for automation.
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

import { Utils } from "@mimic-sdk/core";
import { ObjectDescription, Step, StepResult, Task, TaskAsset, TaskGroup, TaskResult } from "./Task";

export function createNewTaskAsset(): TaskAsset {
  const emptyTask: Task = {
    id: Utils.generateUUID(),
    name: 'task',
    type: 'task',
    steps: []
  }
  const root: TaskGroup = {
    id: Utils.generateUUID(),
    name: 'root',
    type: 'group',
    children: [emptyTask]
  };
  const asset: TaskAsset = {
    id: Utils.generateUUID(),
    name: 'asset',
    type: 'asset',
    url: '',
    author: 'placeholder',
    description: 'placeholder',
    version: '0.0.1',
    tags: [],
    root: root,
    results: [],
    creation_time: Date.now(),
    last_modified_time: Date.now(),
  };
  return asset;
}

export function createDemoTaskAsset(): TaskAsset {
  const asset = createNewTaskAsset();
  const task = (asset.root as TaskGroup).children[0];
  if (!task || task.type !== 'task') {
    throw new Error('Fail to create Demo Task asset');
  }
  const sauceDemoSteps = [
    {
      description: '1. Navigate to demo page',
      script: `const url = 'https://www.saucedemo.com/';
await page.navigate(url);
await page.bringToFront();
await page.sync();`
    },
    {
      description: '2. Login',
      script: `await page.element('#login_credentials').first().text().nth(1).highlight();
const username = await page.element('#login_credentials').first().text().nth(1).textContent();

const password = await page.element().filter({ name: 'data-test', value: 'login-password', type: 'attribute' }).first().text().nth(1).textContent();
await page.element().filter({ name: 'data-test', value: 'login-password', type: 'attribute' }).first().text().nth(1).highlight();

await page.element('#user-name').highlight();
await page.element('#user-name').fill(username);

await page.element('#password').highlight();
await page.element('#password').fill(password);

await page.element('#login-button').highlight();
await page.element('#login-button').click();

await page.sync();`
    },
    {
      description: '3. Buy Backpack',
      script: `await page.element('div .inventory_item_name ').filter({ name: 'textContent', value: /Backpack/ }).highlight();
await page.element('div .inventory_item_name ').filter({ name: 'textContent', value: /Backpack/ }).click();
await page.sync();
const count = await page.element('button#add-to-cart').count();
if (count === 1) {
  await page.element('button#add-to-cart').highlight();
  await page.element('button#add-to-cart').click();
}
await page.element('#back-to-products').highlight();
await page.element('#back-to-products').click();
await page.sync();`
    },
    {
      description: '4. Buy Bike Light & Fleece Jacket',
      script: `const items = await page.element('div .inventory_item_description').all();
const names = [/Bike Light/, /Fleece Jacket/];
for (const item of items) {
  for (const name of names) {
    if (await item.text(name).count() === 1 && await item.text('Add to cart').count() === 1) {
      await item.text(name).highlight();
      await item.text('Add to cart').highlight();
      await item.text('Add to cart').click();
    }
  }
}
const itemCount = await page.element('#shopping_cart_container > a > span').textContent();
expect(itemCount).toEqual('3');
await page.element('#shopping_cart_container > a').highlight();
await page.element('#shopping_cart_container > a').click();
await page.sync();`
    },
    {
      description: '5. Checkout',
      script: `await page.element('#checkout').highlight();
await page.element('#checkout').click();
await page.sync();
await page.element('input#first-name').highlight();
await page.element('input#first-name').fill('first_name');
await page.element('input#last-name').highlight();
await page.element('input#last-name').fill('last_name');
await page.element('input#postal-code').highlight();
await page.element('input#postal-code').fill('111111');
await page.element('#continue').highlight();
await page.element('#continue').click();
await page.sync();`
    },
    {
      description: '6. Verify and Finish',
      script: `const elems = await page.element('div.inventory_item_price').all();
let total_price = 0;
for (const elem of elems) {
  await elem.highlight();
  const textContent = await elem.textContent();
  const index = textContent.indexOf('$');
  const price = Number(textContent.slice(index + 1));
  total_price += price;
}
await page.element('div.summary_subtotal_label').highlight();
const summary_total_text = await page.element('div.summary_subtotal_label').textContent();
const index = summary_total_text.indexOf('$');
const summary_total_price = Number(summary_total_text.slice(index + 1));
expect(total_price).toBe(summary_total_price);

await page.element('#finish').highlight();
await page.element('#finish').click();`
    },
    {
      description: '7. Back Home',
      script: `await page.element('#back-to-products').highlight();
await page.element('#back-to-products').click();`
    },
    {
      description: '8. Reset and Logout',
      script: `await page.element('#react-burger-menu-btn').highlight();
await page.element('#react-burger-menu-btn').click();
let exists = await page.element('div.bm-menu').text('Reset App State').count() === 1;
while (!exists) {
  await wait(500);
  exists = await page.element('div.bm-menu').text('Reset App State').count() === 1;
}
await page.element('div.bm-menu').text('Reset App State').highlight();
await page.element('div.bm-menu').text('Reset App State').click();
await page.element('div.bm-menu').text('Logout').highlight();
await page.element('div.bm-menu').text('Logout').click();`
    },
  ];
  const demoSteps = sauceDemoSteps;
  for (const stepInfo of demoSteps) {
    const step: Step = {
      uid: Utils.generateUUID(),
      type: 'script_step',
      description: stepInfo.description,
      script: stepInfo.script
    };
    task.steps.push(step);
  }
  return asset;
}

export function isTaskAsset(asset: unknown): asset is TaskAsset {

  if (asset === null || typeof asset !== 'object') {
    return false;
  }
  const a = asset as Record<string, unknown>;

  const basicChecks = [
    typeof a.id === 'string',
    typeof a.name === 'string',
    typeof a.type === 'string' && a.type === 'asset',
    typeof a.url === 'string',
    typeof a.author === 'string',
    typeof a.description === 'string',
    typeof a.version === 'string',
    Array.isArray(a.tags) && (a.tags as unknown[]).every((tag: unknown) => typeof tag === 'string'),
    typeof a.creation_time === 'number',
    typeof a.last_modified_time === 'number'
  ];

  if (basicChecks.some(check => !check)) {
    return false;
  }

  if (!isTaskNode(a.root)) {
    return false;
  }

  if (!Array.isArray(a.results)) {
    return false;
  }
  if (!(a.results as unknown[]).every((result: unknown) => isTaskResult(result))) {
    return false;
  }

  return true;
}

function isTaskResult(result: unknown): result is TaskResult {
  if (result === null || typeof result !== 'object') {
    return false;
  }
  const r = result as Record<string, unknown>;

  const requiredChecks = [
    typeof r.task_id === 'string',
    typeof r.task_start_time === 'number',
    typeof r.task_end_time === 'number',
    Array.isArray(r.steps) && (r.steps as unknown[]).every((step: unknown) => isStepResult(step))
  ];

  if (requiredChecks.some(check => !check)) {
    return false;
  }

  const optionalStatus = r.status === undefined ||
    ['passed', 'failed'].includes(r.status as string);
  const optionalError = r.last_error === undefined || typeof r.last_error === 'string';

  return optionalStatus && optionalError;
}

function isStepResult(step: unknown): step is StepResult {
  if (step === null || typeof step !== 'object') {
    return false;
  }
  const s = step as Record<string, unknown>;

  const requiredChecks = [
    typeof s.step_uid === 'string',
    typeof s.step_description === 'string',
    typeof s.step_start_time === 'number',
    typeof s.step_end_time === 'number'
  ];

  if (requiredChecks.some(check => !check)) {
    return false;
  }

  const optionalStatus = s.status === undefined ||
    ['passed', 'failed'].includes(s.status as string);
  const optionalError = s.error === undefined || typeof s.error === 'string';
  const optionalScreenshot = s.screenshot === undefined || typeof s.screenshot === 'string';

  return optionalStatus && optionalError && optionalScreenshot;
}

function isTaskNode(root: unknown): root is TaskGroup | Task {
  if (root === null || typeof root !== 'object') {
    return false;
  }
  const r = root as Record<string, unknown>;

  if (
    typeof r.id !== 'string' ||
    typeof r.name !== 'string' ||
    typeof r.type !== 'string'
  ) {
    return false;
  }

  if (r.type === 'group') {
    return (
      Array.isArray(r.children) &&
      (r.children as unknown[]).every((child: unknown) => isTaskNode(child))
    );
  } else if (r.type === 'task') {
    if (!Array.isArray(r.steps)) {
      return false;
    }

    return (r.steps as unknown[]).every((step: unknown) => {
      if (typeof step !== 'object' || step === null) return false;
      const s = step as Record<string, unknown>;
      return (
        typeof s.uid === 'string' &&
        s.type === 'script_step' &&
        typeof s.description === 'string' &&
        typeof s.script === 'string' &&
        (s.objects === undefined ||
          (Array.isArray(s.objects) &&
            (s.objects as unknown[]).every(isObjectDescription)))
      );
    });
  }

  return false;
}

function isObjectDescription(obj: unknown): obj is ObjectDescription {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  const o = obj as Record<string, unknown>;

  if ('title' in o && 'url' in o && 'index' in o) {
    return (
      typeof o.title === 'string' &&
      typeof o.url === 'string' &&
      typeof o.index === 'number'
    );
  }

  if ('tagName' in o) {
    const baseCheck = typeof o.tagName === 'string';

    const parentCheck = o.parent === undefined || isObjectDescription(o.parent);
    const valueCheck = o.value === undefined || typeof o.value === 'string';
    const textContentCheck = o.textContent === undefined || typeof o.textContent === 'string';
    const attributesCheck = o.attributes === undefined ||
      (typeof o.attributes === 'object' &&
        o.attributes !== null &&
        !Array.isArray(o.attributes));

    return baseCheck && parentCheck && valueCheck && textContentCheck && attributesCheck;
  }

  return false;
}
