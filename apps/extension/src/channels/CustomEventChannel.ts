/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file CustomEventChannel.ts
 * @description 
 * Using CustomEvent for communication between the MAIN world and other Isolated Worlds:
 * This channel is used for messaging between the content script and the user's JavaScript execution context, ensuring a message flow of background → content → MAIN → content.
 * It is particularly useful when a step action requires both a query and an action.
 * The content world can be used to query DOM elements, preventing JavaScript overwrites, while the MAIN world executes actions—allowing calls to user-defined methods.
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

export class CustomEventChannel extends ChannelBase {
  private readonly _source: 'content' | 'MAIN';
  /**
   * the listenerWrapper for message events
   */
  private _listener?: (ev: Event) => void;

  constructor() {
    super();
    if (typeof chrome !== 'undefined' && typeof chrome.runtime?.id === 'string') {
      this._source = 'content';
    }
    else {
      this._source = 'MAIN';
    }
    this._status = ChannelStatus.CONNECTED;
  }

  startListening(): void {
    if (this._listener) {
      return;
    }
    this._listener = this.onMessage.bind(this);
    if (this._source === 'content') {
      window.addEventListener("_Gogogo_MAIN_To_Content_EVENT_", this._listener, true);
    }
    else {
      window.addEventListener("_Gogogo_Content_To_MAIN_EVENT_", this._listener, true);
    }
  }

  stopListening(): void {
    if (Utils.isNullOrUndefined(this._listener)) {
      return;
    }
    if (this._source === 'content') {
      window.removeEventListener("_Gogogo_MAIN_To_Content_EVENT_", this._listener, true);
    }
    else {
      window.removeEventListener("_Gogogo_Content_To_MAIN_EVENT_", this._listener, true);
    }
    this._listener = undefined;
  }

  postMessage(msg: Message): void {
    if (this._status != ChannelStatus.CONNECTED) {
      throw new Error('Unexpected Error: failed to postMessage(dispatchEvent) because the status is not connected');
    }
    this.logger.debug('postMessage: >>>>>> msg=', msg);

    const eventType = this._source === 'content' ? "_Gogogo_Content_To_MAIN_EVENT_" : "_Gogogo_MAIN_To_Content_EVENT_";
    const event = new CustomEvent(eventType, { detail: msg });
    window.dispatchEvent(event);

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

  private onMessage(ev: Event): void {
    this.logger.debug('onMessage: >>>> ev=', ev);
    const msgUnknown: unknown = ev instanceof CustomEvent ? ev.detail : null;
    if (!MsgUtils.isMessage(msgUnknown)) {
      this.logger.error('Invalid message format: msg:', msgUnknown, ' ev:', ev);
      return;
    }
    const msg = msgUnknown as Message;
    this.emit('message', {
      msg: msg,
      sender: this._source === 'content' ? 'MAIN' : 'content',
      responseCallback: (response) => {
        this.postMessage(response);
        this.logger.debug('onMessage: <<<< msg=', msg, ' response:', response);
      }
    });
  }
}
