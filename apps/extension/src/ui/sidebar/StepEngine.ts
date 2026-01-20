/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file StepEngine.ts
 * @description 
 * Support the automation actions on a specific Tab
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

import { MsgUtils, RtidUtils, Utils, AODesc, AutomationObject, InvokeAction, Rtid, Logger, SettingUtils, ElementInfo } from "@mimic-sdk/core";
import { SidebarDispatcher } from "./SidebarDispatcher";

export class StepEngine {
  private readonly _logger: Logger;
  private readonly _dispatcher: SidebarDispatcher;

  constructor(dispatcher: SidebarDispatcher) {
    this._dispatcher = dispatcher;
    const prefix = Utils.isEmpty(this.constructor?.name) ? "StepEngine" : this.constructor?.name;
    this._logger = new Logger(prefix);
  }

  async isDebuggerAttached(): Promise<boolean> {
    const browserRtid = RtidUtils.getBrowserRtid();
    const result = await this.getConfig(browserRtid, 'attachDebugger') as boolean;
    return result;
  }

  async isRecording(): Promise<boolean> {
    const browserRtid = RtidUtils.getBrowserRtid();
    const result = await this.getConfig(browserRtid, 'isRecording') as boolean;
    return result;
  }

  async attachDebugger(): Promise<void> {
    const browserRtid = RtidUtils.getBrowserRtid();
    await this.invokeFunction(browserRtid, 'attachDebugger', []);
  }

  async detachDebugger(): Promise<void> {
    const browserRtid = RtidUtils.getBrowserRtid();
    await this.invokeFunction(browserRtid, 'detachDebugger', []);
  }

  async startRecording(): Promise<void> {
    const browserRtid = RtidUtils.getBrowserRtid();
    await this.invokeFunction(browserRtid, 'startRecording', []);
  }

  async stopRecording(): Promise<void> {
    const browserRtid = RtidUtils.getBrowserRtid();
    await this.invokeFunction(browserRtid, 'stopRecording', []);
  }

  async getPageUrl(): Promise<string> {
    const tabRtid = await this.activePageRtid();
    const content = await this.queryProperty(tabRtid, 'url') as string;
    return content;
  }

  async getPageTitle(): Promise<string> {
    const tabRtid = await this.activePageRtid();
    const content = await this.queryProperty(tabRtid, 'title') as string;
    return content;
  }

  async getPageStatus(): Promise<string> {
    const tabRtid = await this.activePageRtid();
    const content = await this.queryProperty(tabRtid, 'status') as string;
    return content;
  }

  async getPageHtml(): Promise<string> {
    const tabRtid = await this.activePageRtid();
    const content = await this.queryProperty(tabRtid, 'content') as string;
    return content;
  }

  async capturePage(): Promise<string> {
    const tabRtid = await this.activePageRtid();
    const base64ImgString = await this.invokeFunction(tabRtid, 'capturePage', []);
    return base64ImgString as string;
  }

  async getElementFromPoint(x: number, y: number, width?: number, height?: number): Promise<ElementInfo> {
    const tabRtid = await this.activePageRtid();
    const result = await this.invokeFunction(tabRtid, 'getElementFromPoint', [x, y, width, height]);
    return result as ElementInfo;
  }

  async toggleInspectMode(): Promise<void> {
    const tabRtid = await this.activePageRtid();
    await this.invokeFunction(tabRtid, 'toggleInspectMode', []);
  }

  async highlight(_desc: AODesc): Promise<boolean> {
    const tabRtid = await this.activePageRtid();
    await this.invokeFunction(tabRtid, 'highlight', []);
    this._logger.warn('highlight Not supported');
    return true;
  }

  async runScript(script: string, isolated: boolean = true, timeout: number = 60000): Promise<any> {
    if (!script) return;
    const rtid = RtidUtils.getAgentRtid();
    rtid.context = 'external';
    rtid.external = 'sandbox-handler';
    const result = await this.invokeFunction(rtid, 'runScript', [script, isolated], undefined, timeout);
    return result;
  }

  async updateSettings(): Promise<void> {
    const rtid = RtidUtils.getAgentRtid();
    rtid.context = 'external';
    rtid.external = 'sandbox-handler';
    const settings = SettingUtils.getSettings();
    await this.invokeFunction(rtid, 'updateSettings', [settings]);
  }

  /** ==================================================================================================================== */
  /** ===================================================== methods ====================================================== */
  /** ==================================================================================================================== */

  async activePageRtid(): Promise<Rtid> {
    const browserRtid = RtidUtils.getBrowserRtid();
    const aos = await this.queryObjects(browserRtid, {
      type: 'tab',
      queryInfo: {
        primary: [
          { name: 'active', value: true, type: 'property', match: 'exact' },
          { name: 'lastFocusedWindow', value: true, type: 'property', match: 'exact' }
        ]
      }
    });
    if (aos.length === 1) {
      return aos[0].rtid;
    }
    else {
      throw new Error('No valid active page');
    }
  }

  async getConfig(rtid: Rtid, propName: string, timeout?: number): Promise<unknown> {
    const reqMsgData = MsgUtils.createMessageData('config', rtid, { name: 'get', params: { name: propName } });
    const resMsgData = await this._dispatcher.sendRequest(reqMsgData, timeout);
    if (resMsgData.status === 'OK') {
      const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
      return propValue;
    }
    else {
      throw new Error(resMsgData.error || `get config value of ${propName} failed`);
    }
  }

  async queryProperty(rtid: Rtid, propName: string, timeout?: number): Promise<unknown> {
    const reqMsgData = MsgUtils.createMessageData('query', rtid, { name: 'query_property', params: { name: propName } });
    const resMsgData = await this._dispatcher.sendRequest(reqMsgData, timeout);
    if (resMsgData.status === 'OK') {
      const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
      return propValue;
    }
    else {
      throw new Error(resMsgData.error || 'query property failed');
    }
  }

  async queryObjects(rtid: Rtid, desc: AODesc, timeout?: number): Promise<AutomationObject[]> {
    const reqMsgData = MsgUtils.createMessageData('query', rtid, { name: 'query_objects' }, desc);
    const resMsgData = await this._dispatcher.sendRequest(reqMsgData, timeout);
    if (resMsgData.status === 'OK') {
      return resMsgData.objects || [];
    }
    else {
      throw new Error(resMsgData.error || 'query objects failed');
    }
  }

  async invokeFunction(rtid: Rtid, funcName: string, args: unknown[], target?: AODesc, timeout?: number): Promise<unknown> {
    const reqMsgData = MsgUtils.createMessageData('command', rtid, {
      name: 'invoke',
      params: {
        name: funcName,
        args: args
      }
    } as InvokeAction, target);
    const resMsgData = await this._dispatcher.sendRequest(reqMsgData, timeout);
    if (resMsgData.status === 'OK') {
      return resMsgData.result;
    }
    else {
      throw new Error(resMsgData.error || `${funcName} failed`);
    }
  }
}
