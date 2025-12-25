/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file step_1.js
 * @description 5. 点击进入主页
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

await page.sync();
const elements = await page.querySelectorAll('#b_results > li.b_algo > h2 > a');
for (const elem of elements) {
  const textContent = await elem.textContent();
  if (textContent.includes('上海交通大学中文主页门户网站')) {
    await elem.click();
    break;
  }
}
