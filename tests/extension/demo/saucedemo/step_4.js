/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file step_4.js
 * @description 4. Buy Bike Light & Fleece Jacket
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

const items = await page.element('div .inventory_item_description').all();
const names = [/Bike Light/, /Fleece Jacket/];
for (const item of items) {
  for (const name of names) {
    if ((await item.text(name).count()) === 1 && (await item.text('Add to cart').count()) === 1) {
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
await page.sync();
