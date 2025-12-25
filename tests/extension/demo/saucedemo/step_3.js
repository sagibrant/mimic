/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file step_3.js
 * @description 3. Buy Backpack
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

await page
  .element('div .inventory_item_name ')
  .filter({ name: 'textContent', value: /Backpack/ })
  .highlight();
await page
  .element('div .inventory_item_name ')
  .filter({ name: 'textContent', value: /Backpack/ })
  .click();
await page.sync();
const count = await page.element('button#add-to-cart').count();
if (count === 1) {
  await page.element('button#add-to-cart').highlight();
  await page.element('button#add-to-cart').click();
}
await page.element('#back-to-products').highlight();
await page.element('#back-to-products').click();
await page.sync();
