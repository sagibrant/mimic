import { expect, BrowserLocator, RuntimeUtils, AIClient } from "@gogogo/browser-sdk";

export class GogogoUtils {
  static async runScript(script: string, url?: string): Promise<any> {
    try {
      console.debug('runScript: ==> ', script, 'url:', url);
      // clear the cached objects
      RuntimeUtils.repo.clear();
      const browserLocator = new BrowserLocator();
      // create global browser, page, and ai objects
      const browser = await browserLocator.get();
      const page = url ? await browser.openNewPage(url) : await browser.lastActivePage();
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
}
