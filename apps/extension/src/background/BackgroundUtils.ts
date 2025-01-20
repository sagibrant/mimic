/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file BackgroundUtils.ts
 * @description 
 * Shared utility classes and functions for background
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

import { MsgUtils, RtidUtils, Utils, Dispatcher, InvokeAction, MessageData, Rtid } from "@gogogo/shared";
import { AgentHandler } from "./handlers/AgentHandler";
import { BrowserHandler } from "./handlers/BrowserHandler";

export class BackgroundUtils {

  // bypass the lint error
  // error  Unexpected class with only static properties  @typescript-eslint/no-extraneous-class
  doNothing(): void { }

  static async dispatchEvent(event: 'windowCreated' | 'windowRemoved' |
    'pageCreated' | 'pageDOMContentLoaded' | 'pageRemoved' |
    'dialogOpened' | 'dialogClosed' |
    'nodeInspected' | 'stepRecorded', data: unknown): Promise<void> {
    const rtid = RtidUtils.getAgentRtid();
    rtid.context = 'external';
    rtid.external = 'sidebar';
    const msgData = MsgUtils.createMessageData('command', rtid, {
      name: 'invoke',
      params: {
        name: 'onEvent',
        args: [event, data]
      }
    } as InvokeAction);
    // event to sidebar
    await BackgroundUtils.sendEvent(msgData);
    // event to all content MAIN worlds in case @gogogo/browser-sdk is used there
    await BackgroundUtils.broadcastEvent(msgData);
  }

  static async sendEvent(msgData: MessageData, timeout?: number): Promise<void> {
    try {
      await BackgroundUtils.dispatcher.sendEvent(msgData, timeout);
    }
    catch {
      void 0;
    }
  }

  static async broadcastEvent(msgData: MessageData, timeout?: number): Promise<void> {
    const browser = BackgroundUtils.browser;
    const pageContentMainRtids: Rtid[] = browser.tabs.map(tab => ({ ...tab.contentId, context: 'MAIN', object: 0 }));
    for (const rtid of pageContentMainRtids) {
      const broadcastMsgData = Utils.deepClone(msgData);
      broadcastMsgData.dest = rtid;
      try {
        // some page does not have content MAIN world, ignore errors
        await BackgroundUtils.dispatcher.sendEvent(broadcastMsgData, timeout);
      }
      catch {
        void 0;
      }
    }
  }

  static async sendRequest(msgData: MessageData, timeout?: number): Promise<MessageData> {
    const result = await BackgroundUtils.dispatcher.sendRequest(msgData, timeout);
    return result;
  }

  /** ==================================================================================================================== **/
  /** ==================================================== properties ==================================================== **/
  /** ==================================================================================================================== **/
  private static _dispatcher: Dispatcher;
  private static _agent: AgentHandler;
  private static _browser: BrowserHandler;

  static set dispatcher(dispatcher: Dispatcher) {
    BackgroundUtils._dispatcher = dispatcher;
  }
  static get dispatcher(): Dispatcher {
    if (Utils.isNullOrUndefined(BackgroundUtils._dispatcher)) {
      throw new Error('The dispatcher is not ready');
    }
    return BackgroundUtils._dispatcher;
  }

  static set agent(agent: AgentHandler) {
    BackgroundUtils._agent = agent;
  }
  static get agent(): AgentHandler {
    if (Utils.isNullOrUndefined(BackgroundUtils._agent)) {
      throw new Error('The agent is not ready');
    }
    return BackgroundUtils._agent;
  }

  static set browser(browser: BrowserHandler) {
    BackgroundUtils._browser = browser;
  }
  static get browser(): BrowserHandler {
    if (Utils.isNullOrUndefined(BackgroundUtils._browser)) {
      throw new Error('The browser is not ready');
    }
    return BackgroundUtils._browser;
  }
}
