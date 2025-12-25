/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file step_5.js
 * @description 5. Checkout
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

await page.element('#checkout').highlight();
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
await page.sync();
