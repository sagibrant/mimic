/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file PostMessageChannel.ts
 * @description 
 * Use window.postMessage for communication. risky if running with user script context
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
 * The channel based on the window.postMessage
 */
export class PostMessageChannel extends ChannelBase {
  /**
   * the listenerWrapper for message events
   */
  private _listener?: (ev: MessageEvent<unknown>) => void;
  /**
   * the window for communication
   */
  private readonly _window: Window;

  constructor(win: Window) {
    super();

    if (win) {
      this._window = win;
    }
    else {
      throw new Error(`PostMessageChannel init failed. missing frameId or window`);
    }

    this._status = ChannelStatus.CONNECTED;
  }

  startListening(): void {
    if (this._listener) {
      return;
    }
    this._listener = this.onMessage.bind(this);
    window.addEventListener('message', this._listener);
  }

  stopListening(): void {
    if (Utils.isNullOrUndefined(this._listener)) {
      return;
    }
    window.removeEventListener('message', this._listener);
    this._listener = undefined;
  }

  postMessage(msg: Message): void {
    if (this._status != ChannelStatus.CONNECTED) {
      throw new Error('Unexpected Error: failed to post message because the status is not connected');
    }
    this.logger.debug('postMessage: >>>>>> msg=', msg);

    this._window.postMessage(msg, '*');

    this.logger.debug('postMessage: <<<<<< msg=', msg);
  }

  async sendEvent(_msg: Message): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async sendRequest(_msg: Message): Promise<Message> {
    throw new Error("Method not implemented.");
  }

  disconnect(_reason?: string): void {
    if (this._status != ChannelStatus.CONNECTED) {
      this.logger.warn('disconnect: failed to disconnect because the status is not connected');
      return;
    }
    this.stopListening();
    this._status = ChannelStatus.DISCONNECTED;
  }

  private onMessage(ev: MessageEvent<unknown>): void {
    this.logger.debug('onMessage: >>>> ev=', ev);

    if (ev.source !== this._window) {
      return;
    }
    if (MsgUtils.isMessage(ev.data) && ['event', 'request', 'response'].includes(ev.data.type)) {
      const msg = ev.data as Message;
      this.emit('message', {
        msg: msg,
        sender: ev.source,
        responseCallback: (response) => {
          this.postMessage(response);
          this.logger.debug('onMessage: <<<< msg=', msg, ' response:', response);
        }
      });
    }
  }
}
