/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file SidebarDispatcher.ts
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

import { MsgUtils, RtidUtils, IChannel, Dispatcher, Message } from "@gogogo/shared";
import { PostMessageChannel } from "../../channels/PostMessageChannel";
import { ExtensionRuntimeChannel } from "../../channels/ExtensionRuntimeChannel";

class SidebarToBackgroundChannel extends ExtensionRuntimeChannel { }
class SidebarToSandboxChannel extends PostMessageChannel { }

export class SidebarDispatcher extends Dispatcher {
  private readonly _sidebarToSandboxChannel: SidebarToSandboxChannel;
  private readonly _sidebarToBackgroundChannel: SidebarToBackgroundChannel;

  constructor() {
    super('sidebar');

    // id : "ilcdijkgbkkllhojpgbiajmnbdiadppj"
    // origin: "chrome-extension://ilcdijkgbkkllhojpgbiajmnbdiadppj"
    // bg url: 'chrome-extension://ilcdijkgbkkllhojpgbiajmnbdiadppj/background.js'
    // sidebar url: "chrome-extension://ilcdijkgbkkllhojpgbiajmnbdiadppj/ui/sidebar/index.html"
    const extensionId = chrome.runtime.id;
    const extensionOrigin = `chrome-extension://${extensionId}`;
    const backgroundURL = `chrome-extension://${extensionId}/background.js`;
    // const sidebarURL = `chrome-extension://${extensionId}/ui/sidebar/index.html`;

    this._sidebarToBackgroundChannel = new SidebarToBackgroundChannel();
    this._sidebarToBackgroundChannel.on('message', ({ msg, sender, responseCallback }) => {
      if (!MsgUtils.isMessage(msg)) {
        this.logger.error('Invalid message format: msg:', msg, ' sender:', sender);
        return;
      }
      const { id, origin, url } = sender as any;
      if (id !== extensionId || (url && url !== backgroundURL) || (origin && origin !== extensionOrigin)) {
        // do not log here as all message to background will also be received here
        // this.logger.error('Invalid message sender: msg:', msg, ' sender:', sender);
        return;
      }
      // event or request must specify the external as 'sidebar'
      if ((msg.type === 'event' || msg.type === 'request') && msg.data.dest.external !== 'sidebar') {
        this.logger.error('Invalid message dest: msg:', msg, ' sender:', sender, ' external: ', msg.data.dest.external);
        return;
      }

      this.onMessage(msg, sender, responseCallback);
    });

    const frame = document.getElementById('sandbox-iframe');
    if (frame && 'contentWindow' in frame) {
      const win = frame.contentWindow as Window;
      this._sidebarToSandboxChannel = new SidebarToSandboxChannel(win);
      this._sidebarToSandboxChannel.on('message', ({ msg, sender, responseCallback }) => {
        this.onMessage(msg, sender, responseCallback);
      });
    }
    else {
      throw new Error('SidebarToSandboxChannel init failed in getElementById - sandbox-iframe');
    }
  }

  async init() {
    this._sidebarToBackgroundChannel.startListening(true, false);
    this._sidebarToSandboxChannel.startListening();
  }

  protected override getChannel(msg: Message): IChannel {
    const dest = msg.data.dest;
    let contextType = RtidUtils.getRtidContextType(dest);
    if (contextType === 'external' && dest.external === 'sandbox-handler') {
      return this._sidebarToSandboxChannel;
    }
    else {
      return this._sidebarToBackgroundChannel;
    }
  }
}
