/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file step_6.js
 * @description 6. Verify and Finish
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

const elems = await page.element('div.inventory_item_price').all();
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
await page.element('#finish').click();
