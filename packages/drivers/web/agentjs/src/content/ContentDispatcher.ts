
/**
 * BackgroundDispatcher.ts
 * Dispatching the message to the handlers or forward via channels using routing map
 * Author: Zhang Jie
 */
import { ContextType, Utils } from "../common/Common";
import { IChannel } from "../common/Messaging/ChannelBase";
import { ExtensionChannelClient } from "../common/Messaging/ComChannels/ExtensionChannel";
import { Dispatcher } from "../common/Messaging/Dispatcher";
import { Message } from "../common/Messaging/Message";

export class ContentDispatcher extends Dispatcher {
  private readonly _extensionChannelClient: ExtensionChannelClient;

  constructor() {
    super('content');

    // connect to native (native messaging)
    this._extensionChannelClient = new ExtensionChannelClient('background');
    this._extensionChannelClient.on('connected', ({ client, channel }) => {
      this.addRoutingChannel('background', client, channel);
    });
    this._extensionChannelClient.on('disconnected', ({ client, channel }) => {
      this.removeRoutingChannel('background', client, channel);
    });

    this._extensionChannelClient.connect();
    // todo: connect to the MAIN WORLD

    this.logger.info('ContentDispatcher created');
  }

  protected override getRoutingChannels(routingKey: ContextType, _msg: Message): IChannel[] {
    let channels: IChannel[] = [];

    // content send msg to background and then background forward the message to native/server/extension
    if (routingKey === 'native' || routingKey === 'server' || routingKey === 'extension') {
      routingKey = 'background';
    }

    const clientChannels = this.routingMap[routingKey];
    if (Utils.isEmpty(clientChannels)) {
      this.logger.error('getRoutingChannels: find 0 channels using routingKey: ', routingKey);
      return channels;
    }

    // for 'background' | 'extension' | 'native' | 'server'
    if (routingKey === 'background') {
      // forward the message to background using the ExtensionChannel
      clientChannels.forEach((clientChannel) => {
        const [_client, channel] = clientChannel;
        channels.push(channel);
      });
    }
    else if (routingKey === 'MAIN') {
      // should use the CustomEventChannel
      clientChannels.forEach((clientChannel) => {
        const [_client, channel] = clientChannel;
        channels.push(channel);
      });
    }
    else {
      this.logger.warn(`getRoutingChannels: receive unexpected routingKey ${routingKey}`);
    }

    if (channels.length > 1) {
      this.logger.warn(`getRoutingChannels: find unexpected ${channels.length} channels`);
    }

    return channels;
  }
}