/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file background.ts
 * @description 
 * the extension background.js
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


import { BrowserUtils, SettingUtils } from "@mimic-sdk/core";
import { BackgroundDispatcher } from "./background/BackgroundDispatcher";
import { AgentHandler } from "./background/handlers/AgentHandler";
import { ChromeExtensionAPI } from "./background/api/ChromeExtensionAPI";
import { EdgeExtensionAPI } from "./background/api/EdgeExtensionAPI";
import { FirefoxWebExtensionAPI } from "./background/api/FirefoxWebExtensionAPI";
import { SafariWebExtensionAPI } from "./background/api/SafariWebExtensionAPI";
import { BackgroundUtils } from "./background/BackgroundUtils";

await SettingUtils.init();
// create dispatcher
const dispatcher = new BackgroundDispatcher();
BackgroundUtils.dispatcher = dispatcher;
// create agent
const browserInfo = BrowserUtils.getBrowserInfo();
type BrowserAPI = ChromeExtensionAPI | EdgeExtensionAPI | FirefoxWebExtensionAPI | SafariWebExtensionAPI;
const createBrowserAPIFunc = (browserName: string) => {
  switch (browserName) {
    case 'chrome':
      return new ChromeExtensionAPI();
    case 'edge':
      return new EdgeExtensionAPI();
    case 'firefox':
      return new FirefoxWebExtensionAPI();
    case 'safari':
      return new SafariWebExtensionAPI();
    default:
      return new ChromeExtensionAPI();
  }
}
const browserAPI = createBrowserAPIFunc(browserInfo.name);
const agent = new AgentHandler(browserAPI);
dispatcher.addHandler(agent);
BackgroundUtils.agent = agent;

agent.on('browserCreated', ({ browser }) => {
  // set browser
  BackgroundUtils.browser = browser;

  dispatcher.addHandler(browser);

  browser.on('tabCreated', ({ tab }) => {
    dispatcher.addHandler(tab);
  });
  browser.on('tabRemoved', ({ tab }) => {
    dispatcher.removeHandler(tab);
  });

  browser.on('windowCreated', ({ window }) => {
    dispatcher.addHandler(window);
  });
  browser.on('windowRemoved', ({ window }) => {
    dispatcher.removeHandler(window);
  });

  browser.init();
});

// extend self type for TypeScript requirements
declare global {
  interface ServiceWorkerGlobalScope {
    mimic: {
      dispatcher: BackgroundDispatcher,
      browserAPI: BrowserAPI,
      agent: AgentHandler,
    };
  }
}
// Key: Explicitly declare the type of self using type assertion
const swSelf = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;
// add globalData to self as Service Worker's global object
swSelf.mimic = {
  dispatcher: dispatcher,
  browserAPI: browserAPI,
  agent: agent
};

await agent.init();
await dispatcher.init();

export { };