/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file step_8.js
 * @description 8. Reset and Logout
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

await page.element('#react-burger-menu-btn').highlight();
await page.element('#react-burger-menu-btn').click();
let exists = (await page.element('div.bm-menu').text('Reset App State').count()) === 1;
while (!exists) {
  await wait(500);
  exists = (await page.element('div.bm-menu').text('Reset App State').count()) === 1;
}
await page.element('div.bm-menu').text('Reset App State').highlight();
await page.element('div.bm-menu').text('Reset App State').click();
await page.element('div.bm-menu').text('Logout').highlight();
await page.element('div.bm-menu').text('Logout').click();
