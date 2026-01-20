import { expect, BrowserLocator, RuntimeUtils, AIClient } from "mimic-sdk";

export class MimicUtils {
  static async isExtensionInstalled(): Promise<boolean> {
    try {
      const wait = async (timeout: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, timeout));
      };
      await wait(300);
      const browserLocator = new BrowserLocator();
      const browser = await browserLocator.get();
      await browser.lastActivePage();
      return true;
    }
    catch {
      return false;
    }
  }
  static async runScript(script: string, url?: string): Promise<any> {
    try {
      console.debug('runScript: ==> ', script, 'url:', url);
      // clear the cached objects
      RuntimeUtils.repo.clear();
      const browserLocator = new BrowserLocator();
      // create global browser, page, and ai objects
      const browser = await browserLocator.get();
      const page = url ? await browser.openNewPage(url) : await browser.openNewPage('about:blank');
      const ai = new AIClient();

      // eval/new Function are only allowed in sandbox in extension mv3 for CSP issues
      let result: any = undefined;
      const funcScript = `return (async () => { ${script} })()`;
      console.debug('runScript: === ', funcScript);
      const wait = async (timeout: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, timeout));
      };
      const func = new Function(
        'fetch', 'console', 'ai', 'browser', 'page', 'expect', 'wait',
        funcScript
      );
      result = await func(fetch, console, ai, browser, page, expect, wait);

      // clear the cached objects
      RuntimeUtils.repo.clear();

      if (result instanceof Promise) {
        return await result;
      }
      else {
        return result;
      }
    }
    finally {
      console.debug('runScript: <==');
    }
  }
  static getDemoScriptWebSite() {
    return 'https://www.saucedemo.com';
  }
  static getDemoScript() {
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
await page.element('#finish').click();
await page.sync();`
      },
      {
        description: '7. Back Home',
        script: `await page.element('#back-to-products').highlight();
await page.element('#back-to-products').click();
await page.sync();`
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
await page.element('div.bm-menu').text('Logout').click();
await page.sync();`
      },
    ];
    const script = sauceDemoSteps.map(step => {
      return `// ${step.description}
${step.script}
`;
    }).join('\n');
    return script;
  }
}
