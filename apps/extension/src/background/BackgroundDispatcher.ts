/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file BackgroundDispatcher.ts
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

import { MsgUtils, RtidUtils, Utils, ChannelBase, ClientChannel, ClientInfo, IChannel, Dispatcher, ContextType, Message, MessageData } from "@gogogo/shared";
import { ExtensionRuntimeChannel } from "../channels/ExtensionRuntimeChannel";
import { ExtensionFrameChannel } from "../channels/ExtensionFrameChannel";

class BackgroundListeningChannel extends ExtensionRuntimeChannel { }
class BackgroundToFrameChannel extends ExtensionFrameChannel { }

export class BackgroundDispatcher extends Dispatcher {

  private readonly _backgroundListeningChannel: BackgroundListeningChannel;
  private readonly _backgroundToFrameChannel: BackgroundToFrameChannel;
  protected readonly routingMap: Record<ContextType, ClientChannel[]> = {
    MAIN: [],
    content: [],
    background: [],
    external: []
  };

  constructor() {
    super('background');
    this._backgroundListeningChannel = new BackgroundListeningChannel();
    this._backgroundListeningChannel.on('message', ({ msg, sender, responseCallback }) => {
      if (!MsgUtils.isMessage(msg)) {
        this.logger.error('Invalid message format: msg:', msg, ' sender:', sender);
        return;
      }
      if (msg.data.dest.external === 'sidebar') {
        this.logger.error('sidebar message format: msg:', msg, ' sender:', sender);
        return;
      }
      this.onMessage(msg, sender, responseCallback);
    });
    this._backgroundToFrameChannel = new BackgroundToFrameChannel();
  }

  async init(): Promise<void> {
    this._backgroundListeningChannel.startListening(true, true);
  }

  override onMessage(msg: Message, sender?: unknown, responseCallback?: (response: Message) => void): void {
    // handle the frame register message
    // const reqMsgData = MsgUtils.createMessageData('config', RtidUtils.getAgentRtid(), { name: 'get', params: { name: 'sender' } });
    if (msg.type === 'request' && RtidUtils.isRtidEqual(RtidUtils.getAgentRtid(), msg.data.dest) && responseCallback
      && msg.data.type === 'config' && msg.data.action.name === 'get' && msg.data.action.params?.name === 'sender') {
      const resData: MessageData = {
        ...Utils.deepClone(msg.data),
        status: 'OK',
        result: { sender: sender }
      };
      const response = MsgUtils.createResponse(resData, msg.syncId || '', msg.correlationId);
      responseCallback(response);
    }
    else {
      super.onMessage(msg, sender, responseCallback);
    }
  }

  protected override getChannel(msg: Message): IChannel {
    const dest = msg.data.dest;
    const contextType = RtidUtils.getRtidContextType(dest);
    if (contextType === 'content' || contextType === 'MAIN') {
      return this._backgroundToFrameChannel;
    }
    else if (contextType === 'external' && msg.data.dest.external === 'sidebar') {
      return this._backgroundListeningChannel;
    }
    else {
      this.logger.error("Unsupported context type for getChannel", msg);
      throw new Error(`Unsupported context type ${contextType}`);
    }
  }

  /**
 * Remove a [client, channel]  from the routing map under a routing key.
 * @param routingKey - the routing key: 'main' | 'content' | 'background' | 'external';
 * @param client - the connected client 
 * @param channel - the channel 
 */
  addRoutingChannel(routingKey: ContextType, client: ClientInfo, channel: IChannel): void {
    // init if no routing key
    if (!Object.prototype.hasOwnProperty.call(this.routingMap, routingKey)) {
      this.routingMap[routingKey] = [];
    }

    const i = this.routingMap[routingKey].findIndex((val) => {
      const [cur_client, cur_channel] = val;
      if (cur_channel.id === channel.id && cur_client.id === client.id) {
        return true;
      }
      return false;
    });
    if (i >= 0) {
      this.logger.warn('addRoutingChannel: find duplicated client & channel', routingKey, client, channel);
      this.routingMap[routingKey][i] = [client, channel];
    }
    else {
      this.routingMap[routingKey].push([client, channel]);
    }

    if (channel instanceof ChannelBase) {
      channel.on('message', ({ msg, sender, responseCallback }) => {
        this.onMessage(msg, sender, responseCallback);
      });
    }
  }

  /**
   * Remove a [client, channel]  from the routing map under a routing key.
   * @param routingKey - the routing key: 'page' | 'content' | 'background' | 'external' | 'native' | 'server'
   * @param client - the connected client 
   * @param channel - the channel 
   */
  removeRoutingChannel(routingKey: ContextType, client: ClientInfo, channel: IChannel): void {
    if (!Object.prototype.hasOwnProperty.call(this.routingMap, routingKey)) {
      this.routingMap[routingKey] = [];
    }

    this.routingMap[routingKey] = this.routingMap[routingKey].filter(
      ([cur_client, cur_channel]) => !(cur_channel.id === channel.id && cur_client.id === client.id)
    );
  }
}
