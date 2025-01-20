/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ContentDispatcher.ts
 * @description 
 * Dispatching the message to the handlers or forward via channels using routing map
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

import { MsgUtils, RtidUtils, Utils, IChannel, Dispatcher, Message, Rtid, MessageData, SettingUtils } from "@gogogo/shared";
import { ExtensionRuntimeChannel } from "../channels/ExtensionRuntimeChannel";
import { ContentUtils } from "./ContentUtils";
import { CustomEventChannel } from "../channels/CustomEventChannel";

class ContentToBackgroundChannel extends ExtensionRuntimeChannel { }
class ContentToMainChannel extends CustomEventChannel { }

export class ContentDispatcher extends Dispatcher {
  private readonly _contentToBackgroundChannel: ContentToBackgroundChannel;
  private readonly _contentToMainChannel: ContentToMainChannel;
  private _frameSenderInfo: unknown;

  constructor() {
    super('content');

    // id : "ilcdijkgbkkllhojpgbiajmnbdiadppj"
    // origin: "chrome-extension://ilcdijkgbkkllhojpgbiajmnbdiadppj"
    // bg url: 'chrome-extension://ilcdijkgbkkllhojpgbiajmnbdiadppj/background.js'
    // even edge is using the prefix of "chrome-extension://"
    const extensionId = chrome.runtime.id;
    const extensionOrigin = `chrome-extension://${extensionId}`;
    const backgroundUrl = `chrome-extension://${extensionId}/background.js`
    this._contentToBackgroundChannel = new ContentToBackgroundChannel();
    this._contentToBackgroundChannel.on('message', ({ msg, sender, responseCallback }) => {
      if (!MsgUtils.isMessage(msg)) {
        this.logger.error('Invalid message format: msg:', msg, ' sender:', sender);
        return;
      }
      const { id, origin, url } = sender as chrome.runtime.MessageSender;
      if (id !== extensionId || (origin !== extensionOrigin && url !== backgroundUrl)) {
        this.logger.error('Invalid message sender: msg:', msg, ' sender:', sender);
        return;
      }
      const frameRtid = Utils.deepClone(msg.data.dest);
      frameRtid.context = 'content';
      frameRtid.object = -1;
      if ((msg.type === 'event' || msg.type === 'request') && !RtidUtils.isRtidEqual(frameRtid, ContentUtils.frame.rtid)) {
        this.logger.error('Invalid message dest: msg:', msg, ' sender:', sender, ' frameRtid:', ContentUtils.frame.rtid);
        return;
      }
      this.onMessage(msg, sender, responseCallback);
    });

    this._contentToMainChannel = new ContentToMainChannel();
    this._contentToMainChannel.on('message', ({ msg, sender, responseCallback }) => {
      if (!MsgUtils.isMessage(msg)) {
        this.logger.error('Invalid message format: msg:', msg, ' sender:', sender);
        return;
      }
      // register message from MAIN world
      if (msg.type === 'request' && msg.data.type === 'config' && msg.data.action.name === 'get') {
        if (msg.data.action.params && 'frameRtid' in msg.data.action.params && 'settings' in msg.data.action.params && responseCallback) {
          const resData: MessageData = {
            ...Utils.deepClone(msg.data),
            status: 'OK',
            result: { frameRtid: ContentUtils.frame.rtid, settings: SettingUtils.getSettings() }
          };
          const response = MsgUtils.createResponse(resData, msg.syncId || '', msg.correlationId);
          responseCallback(response);
          return;
        }
        this.logger.error('Invalid config get request message: msg:', msg, ' sender:', sender);
        if (responseCallback) {
          const resData: MessageData = {
            ...Utils.deepClone(msg.data),
            status: 'ERROR',
            error: 'Invalid config get request message'
          };
          const response = MsgUtils.createResponse(resData, msg.syncId || '', msg.correlationId);
          responseCallback(response);
        }
        return;
      }

      this.logger.debug('message from MAIN world:', msg, ' sender:', sender);
      this.onMessage(msg, sender, responseCallback);
    });
  }

  async init(): Promise<void> {
    this._frameSenderInfo = await this.getConfig(RtidUtils.getAgentRtid(), 'sender');
    const frameId = (this._frameSenderInfo as { frameId: number }).frameId;
    const tabId = (this._frameSenderInfo as { tab: { id: number } }).tab.id;
    await ContentUtils.frame.init(tabId, frameId);
    this._contentToBackgroundChannel.startListening(true, false);
    await ContentUtils.frame.installFrameInMAIN();
    const isRecording = await this.getConfig(RtidUtils.getBrowserRtid(), 'isRecording');
    if (isRecording) {
      await ContentUtils.frame.startRecording();
    }
    this._contentToMainChannel.startListening();
    this.logger.debug("init: ==== frame sender:", this._frameSenderInfo, "frameRtid", ContentUtils.frame.rtid);
  }

  async getConfig(rtid: Rtid, propName: string, timeout?: number): Promise<unknown> {
    const reqMsgData = MsgUtils.createMessageData('config', rtid, { name: 'get', params: { name: propName } });
    const resMsgData = await this.sendRequest(reqMsgData, timeout);
    if (resMsgData.status === 'OK') {
      const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
      return propValue;
    }
    else {
      throw new Error(resMsgData.error || `get config value of ${propName} failed`);
    }
  }

  protected override getChannel(msg: Message): IChannel {
    const dest = msg.data.dest;
    const contextType = RtidUtils.getRtidContextType(dest);
    if (contextType !== 'MAIN') {
      return this._contentToBackgroundChannel;
    }
    else {
      return this._contentToMainChannel;
    }
  }
}
