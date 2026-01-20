/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ExtensionFrameChannel.ts
 * @description 
 * Use chrome.tabs.sendMessage for communication.
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

import { ChannelBase, ChannelStatus, Message, Utils } from "@mimic-sdk/core";

/**
 * The channel based on the chrome.runtime apis
 */
export class ExtensionFrameChannel extends ChannelBase {
  /**
   * If there's only postMessage available
   */
  readonly async: boolean;

  constructor() {
    super();
    this.async = true;
    this._status = ChannelStatus.CONNECTED;
  }

  postMessage(_msg: Message): void {
    throw new Error("Method not implemented.");
  }

  async sendEvent(msg: Message): Promise<void> {
    if (this._status != ChannelStatus.CONNECTED) {
      throw new Error('Channel is not connected');
    }
    if (msg.type !== 'event') {
      throw new Error('The message type is not event');
    }
    this.logger.debug('sendEvent: >>>>>> msg=', msg);
    const dest = msg.data.dest;
    // sendEvent failed can be ignored
    // await this.ping(dest.tab, dest.frame, msg);
    await chrome.tabs.sendMessage(dest.tab, msg, { frameId: dest.frame });
    this.logger.debug('sendEvent: <<<<<< msg=', msg);
  }

  async sendRequest(msg: Message): Promise<Message> {
    if (this._status != ChannelStatus.CONNECTED) {
      throw new Error('Channel is not connected');
    }
    if (msg.type !== 'request') {
      throw new Error('The message type is not request');
    }
    this.logger.debug('sendRequest: >>>>>> msg=', msg);
    const dest = msg.data.dest;
    await this.ping(dest.tab, dest.frame, msg);
    const responseUnknown: unknown = await chrome.tabs.sendMessage(dest.tab, msg, { frameId: dest.frame });
    this.logger.debug('sendRequest: <<<<<< msg=', msg, ' response=', responseUnknown);
    return responseUnknown as Message;
  }

  disconnect(_reason?: string): void {
    if (this._status != ChannelStatus.CONNECTED) {
      this.logger.warn('disconnect: failed to disconnect because the status is not connected');
      return;
    }
    this._status = ChannelStatus.DISCONNECTED;
  }

  private async ping(tabId: number, frameId: number, msg: Message): Promise<void> {
    // ping 3 times
    for (let i = 1; i <= 3; i++) {
      try {
        const response = await Utils.waitResult(async () => {
          const responseUnknown: unknown = await chrome.tabs.sendMessage(tabId, 'PING', { frameId: frameId });
          return responseUnknown as string;
        }, 100);
        if (response === 'PONG') {
          return;
        }
      } catch (error) {
        if (i >= 2) {
          this.logger.warn(`ping round - ${i} failed - ${tabId} - ${frameId}`, error, msg);
        }
        else {
          this.logger.debug(`ping round - ${i} failed - ${tabId} - ${frameId}`, error, msg);
        }
      }
    }
  }
}
