/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ExtensionRuntimeChannel.ts
 * @description 
 * Use chrome.runtime.sendMessage for communication.
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

import { ChannelBase, ChannelStatus, Message, MsgUtils, Utils } from "@gogogo/shared";

/**
 * The channel based on the chrome.runtime apis
 */
export class ExtensionRuntimeChannel extends ChannelBase {
  /**
   * If there's only postMessage available
   */
  readonly async: boolean;
  /**
   * the listenerWrapper for message events
   */
  private _listener?: (msg: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => boolean;
  private _listenRuntime: boolean = false;
  private _listenExternal: boolean = false;

  constructor() {
    super();
    this.async = true;
    this._status = ChannelStatus.CONNECTED;
  }

  startListening(listenRuntime: boolean = true, listenExternal: boolean = false): void {
    if (this._listener) {
      return;
    }
    this._listener = this.onMessage.bind(this);
    this._listenRuntime = listenRuntime;
    this._listenExternal = listenExternal;
    if (this._listenRuntime && this._listener) {
      chrome.runtime.onMessage.addListener(this._listener);
    }
    if (this._listenExternal && this._listener) {
      chrome.runtime.onMessageExternal.addListener(this._listener);
    }
  }

  stopListening(): void {
    if (Utils.isNullOrUndefined(this._listener)) {
      return;
    }
    if (this._listenRuntime) {
      chrome.runtime.onMessage.removeListener(this._listener);
    }
    if (this._listenExternal) {
      chrome.runtime.onMessageExternal.removeListener(this._listener);
    }
    this._listenRuntime = false;
    this._listenExternal = false;
    this._listener = undefined;
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
    try {
      const dest = msg.data.dest;
      if (dest.external === 'sidebar') {
        await chrome.runtime.sendMessage(undefined, msg);
      }
      else if (dest.external) {
        await chrome.runtime.sendMessage(dest.external, msg);
      }
      else {
        // send message to background
        // try to first ping and then send message
        await this.ping(msg);
        await chrome.runtime.sendMessage(undefined, msg);
      }
    } catch (error) {
      this.logger.debug('sendEvent: error ', error);
    }
    finally {
      this.logger.debug('sendEvent: <<<<<< msg=', msg);
    }
  }

  async sendRequest(msg: Message): Promise<Message> {
    if (this._status != ChannelStatus.CONNECTED) {
      throw new Error('Channel is not connected');
    }
    if (msg.type !== 'request') {
      throw new Error('The message type is not request');
    }
    this.logger.debug('sendRequest: >>>>>> msg=', msg);
    let response: unknown = undefined;
    try {
      const dest = msg.data.dest;
      if (dest.external === 'sidebar') {
        response = await chrome.runtime.sendMessage(undefined, msg);
        return response as Message;
      }
      else if (dest.external) {
        response = await chrome.runtime.sendMessage(dest.external, msg);
        return response as Message;
      }
      else {
        // send message to background
        // try to first ping and then send message
        await this.ping(msg);
        response = await chrome.runtime.sendMessage(undefined, msg);
        return response as Message;
      }
    } catch (error) {
      this.logger.debug('sendRequest: error ', error);
      throw error;
    }
    finally {
      this.logger.debug('sendRequest: <<<<<< msg=', msg, ' response=', response);
    }
  }

  disconnect(_reason?: string): void {
    if (this._status != ChannelStatus.CONNECTED) {
      this.logger.warn('disconnect: failed to disconnect because the status is not connected');
      return;
    }
    this.stopListening();
    this._status = ChannelStatus.DISCONNECTED;
  }

  private onMessage(msg: unknown, sender?: chrome.runtime.MessageSender, sendResponse?: (response?: unknown) => void): boolean {
    this.logger.debug('onMessage: ==>> msg=', msg, ' sender:', sender, ' sendResponse', sendResponse);
    if (typeof msg === 'string' && msg === 'PING') {
      if (sendResponse) {
        sendResponse('PONG');
      }
      return true;
    }

    this.emit('message', {
      msg: msg as Message,
      sender: sender,
      responseCallback: !sendResponse ? undefined : (response): void => {
        sendResponse(response);
        this.logger.debug('onMessage: <<<< msg=', msg, ' sender:', sender, ' response:', response);
      }
    });
    if (MsgUtils.isMessage(msg) && msg.type === 'request') {
      return true;
    }
    else {
      return false;
    }
  }

  private async ping(msg: Message): Promise<void> {
    // ping 3 times
    for (let i = 1; i <= 3; i++) {
      try {
        const response = await Utils.waitResult(async () => {
          const responseRaw: unknown = await chrome.runtime.sendMessage(undefined, 'PING');
          return responseRaw as string;
        }, 100);
        if (response === 'PONG') {
          return;
        }
      } catch (error) {
        if (i >= 2) {
          this.logger.warn(`ping round - ${i} failed`, error, msg);
        }
        else {
          this.logger.debug(`ping round - ${i} failed`, error, msg);
        }
      }
    }
  }
}
