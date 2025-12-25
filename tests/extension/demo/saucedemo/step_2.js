/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file step_2.js
 * @description 2. Login
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

await page.element('#login_credentials').first().text().nth(1).highlight();
const username = await page.element('#login_credentials').first().text().nth(1).textContent();

const password = await page
  .element()
  .filter({ name: 'data-test', value: 'login-password', type: 'attribute' })
  .first()
  .text()
  .nth(1)
  .textContent();
await page
  .element()
  .filter({ name: 'data-test', value: 'login-password', type: 'attribute' })
  .first()
  .text()
  .nth(1)
  .highlight();

await page.element('#user-name').highlight();
await page.element('#user-name').fill(username);

await page.element('#password').highlight();
await page.element('#password').fill(password);

await page.element('#login-button').highlight();
await page.element('#login-button').click();

await page.sync();
