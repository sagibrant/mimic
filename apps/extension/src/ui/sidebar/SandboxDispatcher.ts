/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Channel.ts
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

import { IChannel, Dispatcher, Message } from "@mimic-sdk/core";
import { PostMessageChannel } from "../../channels/PostMessageChannel";

class SandboxToSidebarChannel extends PostMessageChannel { }

export class SandboxDispatcher extends Dispatcher {
  private readonly _sandboxToSidebarChannel: SandboxToSidebarChannel;

  constructor() {
    super('sandbox-dispatcher');

    this._sandboxToSidebarChannel = new SandboxToSidebarChannel(window.parent);
    this._sandboxToSidebarChannel.on('message', async ({ msg, sender, responseCallback }) => {
      this.onMessage(msg, sender, responseCallback);
    });
  }

  async init() {
    this._sandboxToSidebarChannel.startListening();
  }

  protected override getChannel(_msg: Message): IChannel {
    return this._sandboxToSidebarChannel;
  }
}