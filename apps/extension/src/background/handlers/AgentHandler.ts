/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file AgentHandler.ts
 * @description 
 * Support the general automation actions which not in a specific browser tab 
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

import { BrowserUtils, RtidUtils, AODesc, AutomationObject, SettingUtils, Settings, MsgDataHandlerBase, Utils } from "@mimic-sdk/core";
import { ChromeExtensionAPI } from "../api/ChromeExtensionAPI";
import { BrowserHandler } from "./BrowserHandler";

interface AgentEvent extends Record<string, unknown> {
  browserCreated: { browser: BrowserHandler };
  browserRemoved: { browser: BrowserHandler };
}

export class AgentHandler extends MsgDataHandlerBase<AgentEvent> {
  private readonly _browserAPI: ChromeExtensionAPI;
  private readonly _browsers: Record<number, BrowserHandler>;
  // todo: support multiple browsers if we can support multi-browser in the future

  constructor(browserAPI: ChromeExtensionAPI) {
    const rtid = RtidUtils.getAgentRtid();
    super(rtid);
    this._browserAPI = browserAPI;
    this._browsers = {};
  }

  /**
   * init the agent
   */
  async init(): Promise<void> {
    const browser = new BrowserHandler(this._browserAPI);
    this._browsers[browser.rtid.browser] = browser;
    this.emit('browserCreated', { browser });
  }

  /** agent settings */
  get settings(): Settings {
    return SettingUtils.getSettings();
  }

  get currentBrowser(): BrowserHandler {
    //current browser's rtid.browser = 0
    return this._browsers[0];
  }

  async wait(timeout: number): Promise<void> {
    await Utils.wait(timeout);
  }

  /** ==================================================================================================================== **/
  /** ====================================================== query ======================================================= **/
  /** ==================================================================================================================== **/

  /**
   * query property value 
   * @param propName property name
   * @returns property value
   */
  protected override async queryProperty(propName: string): Promise<unknown> {
    if (propName === 'rtid') {
      return this.rtid;
    }
    else if (propName === 'settings') {
      return this.settings;
    }
    else if (propName === 'id') {
      return chrome.runtime.id;
    }
    else if (propName === 'name') {
      return chrome.runtime.getManifest().name;
    }
    else if (propName === 'version') {
      return chrome.runtime.getManifest().version;
    }
    throw new Error(`Unknown property name - ${propName}`);
  }

  /**
   * query automation objects
   * @param desc description for objects
   * @returns automation objects
   */
  protected override async queryObjects(desc: AODesc): Promise<AutomationObject[]> {
    if (desc.type === 'browser') {
      const objects = [{
        type: "browser" as const,
        name: 'browser',
        rtid: RtidUtils.getBrowserRtid(),
        runtimeInfo: { ...BrowserUtils.getBrowserInfo() },
        metaData: undefined
      }];
      return objects;
    }
    throw new Error(`Unknown description type - ${desc.type}`);
  }

}