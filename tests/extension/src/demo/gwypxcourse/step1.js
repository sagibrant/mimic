/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file step_1.js
 * @description 点开课程进行测试
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

const list = await page.element('.video-warp-start').all();
// video-warp-start state-paused
let watching = false;

const func = async newPage => {
  console.log('==> newPage', newPage);
  try {
    await wait(10000);
    await newPage.sync();
    const url = await newPage.url();
    if (!url.startsWith('https://cela.gwypx.com.cn/pcPage/commend/coursedetail?courseId=')) {
      return;
    }
    console.log('==> start watch video');
    let playbackRate = 1;
    // get all sub video list
    const chapters = await newPage.element('div.title-list > .chapter-title').all();
    if (chapters.length > 1) {
      playbackRate = 1;
    }
    let count = await newPage
      .element('button.el-button.el-button--default.el-button--small.el-button--primary')
      .count();
    if (count > 0) {
      await newPage
        .element('button.el-button.el-button--default.el-button--small.el-button--primary')
        .first()
        .highlight();
      await newPage
        .element('button.el-button.el-button--default.el-button--small.el-button--primary')
        .first()
        .click({ mode: 'cdp' });
      await wait(3000);
    }
    await newPage.element('video').highlight();
    await newPage.element('video').click({ mode: 'cdp' });
    await wait(3000);
    count = await newPage.element('button.el-button.el-button--default.el-button--small.el-button--primary').count();
    if (count > 0) {
      await newPage
        .element('button.el-button.el-button--default.el-button--small.el-button--primary')
        .first()
        .highlight();
      await newPage
        .element('button.el-button.el-button--default.el-button--small.el-button--primary')
        .first()
        .click({ mode: 'cdp' });
      await wait(3000);
      await newPage.element('video').highlight();
      await newPage.element('video').click({ mode: 'cdp' });
      await wait(3000);
    }
    let paused = await newPage.element('video').getProperty('paused');
    console.log('=== check if paused', paused);
    if (paused) {
      await newPage.element('video').highlight();
      await newPage.element('video').click({ mode: 'cdp' });
      await wait(3000);
    }
    await newPage.element('video').setProperty('playbackRate', playbackRate);
    const duration = await newPage.element('video').getProperty('duration');
    let currentTime = await newPage.element('video').getProperty('currentTime');
    let lastTime = currentTime;
    while (lastTime < duration) {
      console.log('---', lastTime, '/', duration);
      await wait(30 * 1000);
      console.log('=== checking if the video is end');
      count = await newPage.element('div.title-list > .chapter-title > .chapter-percentage').count();
      if (count > 0) {
        const textContent = await newPage
          .element('div.title-list > .chapter-title > .chapter-percentage')
          .last()
          .textContent();
        if (textContent === '100%') {
          break;
        }
      }
      let ended = await newPage.element('video').getProperty('ended');
      if (ended) {
        break;
      }
      console.log('=== the video is not end');
      paused = await newPage.element('video').getProperty('paused');
      console.log('=== check if video is paused', paused);
      if (paused) {
        await newPage.element('video').highlight();
        await newPage.element('video').click({ mode: 'cdp' });
        await wait(3000);
        continue;
      }
      currentTime = await newPage.element('video').getProperty('currentTime');
      if (lastTime === currentTime && lastTime != duration) {
        console.log('=== video may be paused');
        await newPage.element('video').highlight();
        await newPage.element('video').click({ mode: 'cdp' });
        await wait(3000);
      }
      lastTime = currentTime;
      await newPage.element('video').setProperty('playbackRate', playbackRate);
    }
    count = await newPage.element('.countdownText').count();
    if (count > 0) {
      await newPage.element('.countdownText').click({ mode: 'cdp' });
    }
    await newPage.close();
  } catch (err) {
    console.error('unexpected error on page', newPage);
    console.error(err);
  } finally {
    console.log('<==', newPage);
    watching = false;
  }
};

try {
  // browser.on('page', func);
  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    console.log('==> ', i, '/', list.length, ':', item);
    await item.highlight();
    let count = await item.element('.state-paused').count();
    if (count < 0) {
      console.warn('state-paused cannot be found', item);
      continue;
    }
    const textContent = await item.element('.state-paused').first().textContent();
    if (textContent === '已学习') {
      continue;
    }
    let old_pages = await browser.pages();
    await item.click({ mode: 'cdp' });
    watching = true;
    while (watching) {
      await wait(3000);
      let pages = await browser.pages();
      if (pages.length > old_pages.length) {
        let newPage = await browser.page().last().get();
        await wait(2000);
        const url = await newPage.url();
        if (!url.startsWith('https://cela.gwypx.com.cn/pcPage/commend/coursedetail?courseId=')) {
          continue;
        }
        await func(newPage);
        watching = false;
      }
    }
  }
} catch (err) {
  console.error(err);
  throw err;
} finally {
  // browser.off('page', func);
}
console.log('====end====');
