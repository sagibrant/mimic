/**
 * BackgroundDispatcher.ts
 * Dispatching the message to the handlers or forward via channels using routing map
 * Author: Zhang Jie
 */
import { ContextType, Utils } from "../common/Common";
import { IChannel } from "../common/Messaging/ChannelBase";
import { ExtensionChannelClient, ExtensionChannelHost } from "../common/Messaging/ComChannels/ExtensionChannel";
import { Dispatcher } from "../common/Messaging/Dispatcher";
import { Message } from "../common/Messaging/Message";

export class BackgroundDispatcher extends Dispatcher {

  private readonly _extensionChannelHost: ExtensionChannelHost;
  private readonly _extensionNativeChannelClient: ExtensionChannelClient;

  constructor() {
    super('background');

    // listening for content and extension connections
    this._extensionChannelHost = new ExtensionChannelHost();
    this._extensionChannelHost.on('connected', ({ client, channel }) => {
      if (client.type === 'content') {
        this.addRoutingChannel('content', client, channel);
      }
      else if (client.type === 'extension') {
        this.addRoutingChannel('extension', client, channel);
      }
    });
    this._extensionChannelHost.on('disconnected', ({ client, channel }) => {
      if (client.type === 'content') {
        this.removeRoutingChannel('content', client, channel);
      }
      else if (client.type === 'extension') {
        this.removeRoutingChannel('extension', client, channel);
      }
    });

    // connect to native (native messaging)
    this._extensionNativeChannelClient = new ExtensionChannelClient('native', 'mock_native_app');
    this._extensionNativeChannelClient.on('connected', ({ client, channel }) => {
      if (client.type === 'native') {
        this.addRoutingChannel('native', client, channel);
      }
    });
    this._extensionNativeChannelClient.on('disconnected', ({ client, channel }) => {
      if (client.type === 'native') {
        this.removeRoutingChannel('native', client, channel);
      }
    });

    this._extensionChannelHost.start();
    this._extensionNativeChannelClient.connect();
    // todo: connect to server using ws channel

    this.logger.info('BackgroundDispatcher created');
  }

  protected override getRoutingChannels(routingKey: ContextType, msg: Message): IChannel[] {

    const dest = msg.data.dest;
    let channels: IChannel[] = [];

    if (routingKey === 'MAIN') {
      routingKey = 'content';
    }

    const clientChannels = this.routingMap[routingKey];
    if (Utils.isEmpty(clientChannels)) {
      this.logger.error('getRoutingChannels: find 0 channels using routingKey: ', routingKey);
      return channels;
    }

    // for 'extension' | 'native' | 'server'
    if (routingKey === 'native' || routingKey === 'server' || routingKey === 'extension') {
      clientChannels.forEach((clientChannel) => {
        const [client, channel] = clientChannel;
        // require exact match in background
        if (client.type === routingKey && client.id === dest.external) {
          channels.push(channel);
        }
      });
    }
    else if (routingKey === 'content') {
      clientChannels.forEach((clientChannel) => {
        const [client, channel] = clientChannel;
        // require exact match in background
        if (client.type === 'content'
          && (dest === (client.info as any).tab?.id && dest.frame === (client.info as any).frameId)) {
          channels.push(channel);
        }
      });
    }
    else {
      this.logger.warn(`getRoutingChannels: receive unexpected routingKey ${routingKey}`);
    }

    return channels;
  }
}