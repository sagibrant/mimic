/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file methods.js
 * @description 2. methods test
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

console.log('browser =>');

// global browser instance
console.log('browser', browser);

// aos
{
  const windows = await browser.windows();
  console.log('await browser.windows()', windows);
  expect(windows).not.toBeNullOrUndefined();

  const pages = await browser.pages();
  console.log('await browser.pages()', pages);
  expect(pages).not.toBeNullOrUndefined();

  const window = await browser.lastFocusedWindow();
  console.log('await browser.lastFocusedWindow()', window);
  expect(window).not.toBeNullOrUndefined();

  const lastActivePage = await browser.lastActivePage();
  console.log('await browser.lastActivePage()', lastActivePage);
  expect(lastActivePage).not.toBeNullOrUndefined();
}

// browser info
{
  const name = browser.name();
  console.log('browser.name()', name);
  expect(['edge', 'chrome']).toContain(name);

  const version = browser.version();
  console.log('browser.version()', version);
  expect(version).not.toBeNullOrUndefined();

  const majorVersion = browser.majorVersion();
  console.log('browser.majorVersion()', majorVersion);
  expect(majorVersion > 130).toBeTruthy();
}

// browser methods
{
  // enable cdp
  await browser.attachDebugger();
  console.log('await browser.attachDebugger()');
  // set timeout
  const timeout = 5100;
  await browser.setDefaultTimeout(timeout);
  console.log('await browser.setDefaultTimeout(timeout)', timeout);

  // get cookies
  const cookie_url = 'https://juejin.cn/';
  const cookie_url_domain = 'juejin.cn';
  const cookies = await browser.cookies();
  console.log('await browser.cookies()', cookies);
  expect(cookies.length >= 0).toBeTruthy();
  // remove test cookies in case exists
  await browser.clearCookies({ name: /^test_cookie_name/ });
  console.log(`await browser.clearCookies({name: /^test_cookie_name/})`);
  // get cookies for cookie_url
  const filter_url_cookies = await browser.cookies(cookie_url);
  console.log(`await browser.cookies(${cookie_url})`, filter_url_cookies);
  expect(filter_url_cookies.length >= 0).toBeTruthy();
  const filter_url_domain_cookies = filter_url_cookies.filter(
    c => c.domain === cookie_url_domain || c.domain === '.' + cookie_url_domain
  );
  console.log(
    `filter_url_cookies.filter(c=>c.domain === '${cookie_url_domain}' || c.domain === '.' + '${cookie_url_domain}')`,
    filter_url_domain_cookies
  );
  expect(filter_url_domain_cookies).toHaveLength(filter_url_cookies.length);

  // add cookies
  await browser.addCookies({ name: 'test_cookie_name', value: 'test_cookie_value', url: cookie_url });
  console.log(`await browser.addCookies({ name: 'test_cookie_name', value: 'test_cookie_value', url: ${cookie_url} })`);
  let filter_url_cookies_after_add = await browser.cookies(cookie_url);
  console.log(`await browser.cookies('${cookie_url}')`, filter_url_cookies_after_add);
  expect(filter_url_cookies_after_add).toHaveLength(filter_url_cookies.length + 1);

  await browser.addCookies([
    { name: 'test_cookie_name2', value: 'test_cookie_value2', domain: cookie_url_domain, path: '/' },
  ]);
  console.log(
    `await browser.addCookies({ name: 'test_cookie_name2', value: 'test_cookie_value2', domain: ${cookie_url_domain} , path: '/'})`
  );
  filter_url_cookies_after_add = await browser.cookies(cookie_url);
  console.log(`await browser.cookies('${cookie_url}')`, filter_url_cookies_after_add);
  expect(filter_url_cookies_after_add).toHaveLength(filter_url_cookies.length + 2);

  await browser.addCookies({
    name: 'test_cookie_name3',
    value: 'test_cookie_value3',
    domain: cookie_url_domain,
    path: '/',
  });
  console.log(
    `await browser.addCookies({ name: 'test_cookie_name3', value: 'test_cookie_value3', domain: ${cookie_url_domain} , path: '/'})`
  );
  filter_url_cookies_after_add = await browser.cookies(cookie_url);
  console.log(`await browser.cookies('${cookie_url}')`, filter_url_cookies_after_add);
  expect(filter_url_cookies_after_add).toHaveLength(filter_url_cookies.length + 3);

  // remove cookies
  await browser.clearCookies({ name: 'test_cookie_name' });
  console.log(`ait browser.clearCookies({name: 'test_cookie_name'})`);
  let filter_url_cookies_after_clear = await browser.cookies(cookie_url);
  console.log(`await browser.cookies('${cookie_url}')`, filter_url_cookies_after_clear);
  expect(filter_url_cookies_after_clear).toHaveLength(filter_url_cookies_after_add.length - 1);
  const cookie_name_test_cookie_name = filter_url_cookies_after_clear.filter(c => c.name === 'test_cookie_name');
  expect(cookie_name_test_cookie_name).toHaveLength(0);
  let cookie_name_test_cookie_nam2 = filter_url_cookies_after_clear.filter(c => c.name === 'test_cookie_name2');
  expect(cookie_name_test_cookie_nam2).toHaveLength(1);

  await browser.clearCookies({ domain: /juejin.cn$/, name: /^test_cookie_name/, path: '/' });
  console.log(`await browser.clearCookies({ domain: /^juejin.cn$/, name: /^test_cookie_name/, path: '/' })`);
  filter_url_cookies_after_clear = await browser.cookies(cookie_url);
  console.log(`await browser.cookies('${cookie_url}')`, filter_url_cookies_after_clear);
  expect(filter_url_cookies_after_clear).toHaveLength(filter_url_cookies_after_add.length - 3);
  cookie_name_test_cookie_nam2 = filter_url_cookies_after_clear.filter(c => c.name === 'test_cookie_name2');
  expect(cookie_name_test_cookie_nam2).toHaveLength(0);
  let cookie_name_test_cookie_nam3 = filter_url_cookies_after_clear.filter(c => c.name === 'test_cookie_name3');
  expect(cookie_name_test_cookie_nam3).toHaveLength(0);

  // remove all cookies
  // do not test in daily testing, because browser lost all cached sessions after removes all cookies
  // await browser.clearCookies();
  // console.log(`await browser.clearCookies()`);
  // filter_url_cookies_after_clear = await browser.cookies(cookie_url);
  // console.log(`await browser.cookies('${cookie_url}')`, filter_url_cookies_after_clear);
  // expect(filter_url_cookies_after_clear).toHaveLength(0);

  const windows = await browser.windows();
  console.log('await browser.windows()', windows);
  expect(windows).not.toBeNullOrUndefined();
  // open new window
  const url_keyboard = 'https://sagibrant.github.io/mimic/aut/keyboard.html';
  const newWindow = await browser.openNewWindow(url_keyboard);
  console.log('await browser.openNewWindow(url_keyboard)', newWindow);
  expect(newWindow).not.toBeNullOrUndefined();
  // windows should + 1
  const new_windows = await browser.windows();
  console.log('await browser.windows()', new_windows);
  expect(new_windows).not.toBeNullOrUndefined();
  console.log(`windows.length change from ${windows.length} to ${new_windows.length}`);
  expect(new_windows.length - windows.length).toBe(1);

  await newWindow.page({ active: true }).sync();
  console.log('await newWindow.page({active: true}).sync()');

  const pages = await browser.pages();
  console.log('await browser.pages()', pages);
  expect(pages).not.toBeNullOrUndefined();
  // open new page
  const url_mouse = 'https://sagibrant.github.io/mimic/aut/mouse.html';
  const newPage = await browser.openNewPage(url_mouse);
  console.log('await browser.openNewPage(url_mouse)', newPage);
  expect(newPage).not.toBeNullOrUndefined();
  // page should + 1
  const new_pages = await browser.pages();
  console.log('await browser.pages()', new_pages);
  expect(new_pages).not.toBeNullOrUndefined();
  console.log(`pages.length from ${pages.length} to ${new_pages.length}`);
  expect(new_pages.length - pages.length).toBe(1);

  await newPage.sync();
  console.log('await newPage.sync()');

  // disable cdp
  await browser.detachDebugger();
  console.log('await browser.detachDebugger()');

  // close the browser
  // await browser.close();
  // console.log("browser.close()");
}
await page.bringToFront();
await wait(300);
await clean();

console.log('browser <=');

console.log('all passed');
