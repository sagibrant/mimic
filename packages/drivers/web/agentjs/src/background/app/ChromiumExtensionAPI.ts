/**
 * ChromiumExtensionAPI.ts
 * Provide Chromium Extension APIs
 * Author: Zhang Jie
 */
import { ChromeDevToolsProtocol } from "./ChromeDevToolsProtocol";
import { ChromiumTabAPI } from "./ChromiumTabAPI";
import { ChromiumWindowAPI } from "./ChromiumWindowAPI";

export class ChromiumExtensionAPI {

  readonly windowAPI: ChromiumWindowAPI;
  readonly tabAPI: ChromiumTabAPI;
  readonly cdpAPI: ChromeDevToolsProtocol;

  constructor() {
    this.windowAPI = new ChromiumWindowAPI();
    this.tabAPI = new ChromiumTabAPI();
    this.cdpAPI = new ChromeDevToolsProtocol();
  }
}