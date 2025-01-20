/**
 * background.ts
 * init the extension background
 * Author: Zhang Jie
 */
import { Utils } from "./common/Common";
import { BackgroundDispatcher } from "./background/BackgroundDispatcher";
import { Agent } from "./background/aos/Agent";
import { ChromeExtensionAPI } from "./background/app/ChromeExtensionAPI";
import { ChromiumExtensionAPI } from "./background/app/ChromiumExtensionAPI";
import { EdgeExtensionAPI } from "./background/app/EdgeExtensionAPI";
import { FirefoxWebExtensionAPI } from "./background/app/FirefoxWebExtensionAPI";
import { SafariWebExtensionAPI } from "./background/app/SafariWebExtensionAPI";

const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;
console.log(`${timestamp()} background:: start`);

const dispatcher = new BackgroundDispatcher();
const browserInfo = Utils.getBrowserInfo();
type BrowserAPI = ChromiumExtensionAPI | ChromeExtensionAPI | EdgeExtensionAPI | FirefoxWebExtensionAPI | SafariWebExtensionAPI;
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
      console.error(`unexpected browser type ${browserName}, rollback to ChromiumExtensionAPI`);
      return new ChromiumExtensionAPI();
  }
}
const browserAPI = createBrowserAPIFunc(browserInfo.name);
const agent = new Agent(browserAPI);
dispatcher.addHandler(agent);

// extend self type for TypeScript requirements
declare global {
  interface ServiceWorkerGlobalScope {
    gogogo: {
      dispatcher: BackgroundDispatcher,
      browserAPI: BrowserAPI,
      agent: Agent,
    };
  }
}
// 关键：通过类型断言明确 self 的类型
const swSelf = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;
// add globalData to self as Service Worker's global object
swSelf.gogogo = {
  dispatcher: dispatcher,
  browserAPI: browserAPI,
  agent: agent
};

console.log(`${timestamp()} background:: end`);

export { };