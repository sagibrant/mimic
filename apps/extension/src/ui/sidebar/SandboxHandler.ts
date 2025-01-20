/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file SandboxHandler.ts
 * @description 
 * Handle the actions in sandbox
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

import { MsgUtils, RtidUtils, Utils, AODesc, AutomationObject, MsgDataHandlerBase, Settings, SettingUtils } from "@gogogo/shared";
import { expect, BrowserLocator, RuntimeUtils, AIClient } from "@gogogo/browser-sdk";

export class SandboxHandler extends MsgDataHandlerBase {

  constructor() {
    const rtid = RtidUtils.getAgentRtid();
    rtid.context = 'external';
    rtid.external = 'sandbox-handler';
    super(rtid);
  }

  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/
  async runScript(script: string, isolated: boolean = false): Promise<unknown> {
    try {
      // clear the cached objects
      RuntimeUtils.repo.clear();

      // overwrite the Utils.wait because the wait in sandbox/sidebar is not stable
      const wait = async (timeout: number): Promise<void> => {
        if (RuntimeUtils.dispatcher) {
          const rtid = RtidUtils.getAgentRtid();
          const reqMsgData = MsgUtils.createMessageData('command', rtid, {
            name: 'invoke',
            params: {
              name: 'wait',
              args: [timeout]
            }
          });
          const resMsgData = await RuntimeUtils.dispatcher.sendRequest(reqMsgData, timeout + 1000);
          if (resMsgData.status !== 'OK' && resMsgData.error) {
            console.error('Utils.wait with background failed', resMsgData.error);
          }
        }
        else {
          return new Promise(resolve => setTimeout(resolve, timeout));
        }
      };
      (globalThis as any).gogogo = {
        ...(globalThis as any).gogogo,
        wait: wait
      };
      // reset the page in case the tab is switched before the script execution
      // may fail due to the extension inactive
      // then we need to return error and user need to run again
      const browserLocator = new BrowserLocator();
      const browser = await browserLocator.get();
      // (window as any).browser = browser;
      const page = await browser.lastActivePage();
      // (window as any).page = page;
      const ai = new AIClient();

      // eval/new Function are only allowed in sandbox in extension mv3 for CSP issues
      let result: any = undefined;
      this.logger.debug('runScript: ==> ', script, 'isolated:', isolated);
      if (isolated) {
        // Isolated mode: use new Function
        // Explicitly pass allowed globals to prevent unintended access
        const func = new Function(
          // Whitelist allowed global variables (e.g., fetch, console)
          // but fetch is not working in sandbox, to be supported in future for external resources
          'fetch', 'console', 'ai', 'browser', 'page', 'expect', 'wait', 'BrowserLocator',
          `return (async () => { ${script} })()`
        );
        // Inject whitelisted globals as arguments
        result = await func(fetch, console, ai, browser, page, expect, wait, BrowserLocator);
      }
      else {
        // Non-isolated mode: use direct eval to access local scope
        // WARNING: Allows script to access/modify local variables (risky for untrusted code)
        // use 'var' to store variables and return value without the 'return' but direct call to the variable
        // 'var a = 1; a;'
        result = eval.call(window, script);
      }

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
      this.logger.debug('runScript: <==');
    }
  }

  async onEvent(event: 'windowCreated' | 'windowRemoved' |
    'pageCreated' | 'pageDOMContentLoaded' | 'pageRemoved' |
    'dialogOpened' | 'dialogClosed', data: any): Promise<void> {

    const supportedEvents = ['windowCreated', 'windowRemoved',
      'pageCreated', 'pageDOMContentLoaded', 'pageRemoved',
      'dialogOpened', 'dialogClosed'];
    if (!supportedEvents.includes(event)) {
      this.logger.error(`onEvent: Unexpected event - ${event}`);
    }

    const repo = RuntimeUtils.repo;

    if (event === 'windowCreated') {
      const rtid = RtidUtils.getBrowserRtid();
      const browser = repo.getBrowser(rtid);
      browser.emit('window', data);
    }
    else if (event === 'windowRemoved') {
      if (typeof data === 'number') {
        const windowId = data as number;
        const rtid = RtidUtils.getWindowRtid(windowId);
        const window = repo.getWindow(rtid);
        window.emit('close', data);
      }
    }
    else if (event === 'pageCreated') {
      const tabInfo = data;
      {
        const rtid = RtidUtils.getBrowserRtid();
        const browser = repo.getBrowser(rtid);
        browser.emit('page', data);
      }
      {
        if (!Utils.isNullOrUndefined(tabInfo?.windowId) && typeof tabInfo.windowId === 'number') {
          const rtid = RtidUtils.getWindowRtid(tabInfo.windowId);
          const window = repo.getWindow(rtid);
          window.emit('page', data);
        }
      }
    }
    else if (event === 'pageDOMContentLoaded') {
      if (typeof data === 'number') {
        const tabId = data as number;
        const rtid = RtidUtils.getTabRtid(tabId);
        const page = repo.getPage(rtid);
        page.emit('domcontentloaded', data);
      }
    }
    else if (event === 'pageRemoved') {
      if (typeof data === 'number') {
        const tabId = data as number;
        const rtid = RtidUtils.getTabRtid(tabId);
        const page = repo.getPage(rtid);
        page.emit('close', data);
      }
    }
    else if (event === 'dialogOpened') {
      const dialogInfo = data;
      if (!Utils.isNullOrUndefined(dialogInfo?.tabId) && typeof dialogInfo.tabId === 'number') {
        const rtid = RtidUtils.getTabRtid(dialogInfo.tabId);
        const page = repo.getPage(rtid);
        page.emit('dialog', data);
      }
    }
  }

  async updateSettings(settings: Settings): Promise<void> {
    if (SettingUtils.isSettings(settings)) {
      const newSettings = await SettingUtils.load(settings);
      this.logger.debug('updateSettings: Settings are updated to', newSettings);
    }
  }

  /** ==================================================================================================================== **/
  /** ====================================================== query ======================================================= **/
  /** ==================================================================================================================== **/
  protected override async queryProperty(_propName: string): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  protected override async queryObjects(_desc: AODesc): Promise<AutomationObject[]> {
    throw new Error("Method not implemented.");
  }
}
