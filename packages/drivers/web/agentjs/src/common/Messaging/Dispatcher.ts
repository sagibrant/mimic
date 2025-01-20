/**
 * Dispatcher.ts
 * Dispatching the message to the handlers or forward via channels using routing map
 * Author: Zhang Jie
 */

import { Logger } from './../Logger';
import { Utils, Rtid, ContextType } from './../Common';
import { Message, MessageData } from './Message';
import { MsgDataHandlerBase } from './MsgDataHandlerBase';
import { ChannelBase, ClientChannel, ClientInfo, IChannel } from './ChannelBase';

/**
 * Dispatcher class that routes messages between handlers and channels.
 */
export abstract class Dispatcher {
  readonly id: number;
  protected readonly logger: Logger;
  protected readonly mode: 'content' | 'background';
  private _responseCallbacks: Record<string, (result: MessageData) => void> = {};
  private _handlers: MsgDataHandlerBase[] = [];
  protected readonly routingMap: Record<ContextType, ClientChannel[]> = {
    MAIN: [],
    content: [],
    background: [],
    extension: [],
    native: [],
    server: []
  };

  constructor(mode: 'content' | 'background') {
    this.id = Date.now();
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Dispatcher" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this.mode = mode;
  }

  /**
   * Add a message handler.
   * @param handler - a message handler
   */
  addHandler(handler: MsgDataHandlerBase): void {
    this._handlers.push(handler);
  }

  /**
   * Remove a message handler.
   * @param handler - a message handler
   */
  removeHandler(handler: MsgDataHandlerBase): void {
    const index = this._handlers.indexOf(handler);
    if (index >= 0) {
      this._handlers.splice(index, 1);
    }
  }

  /**
 * Remove a [client, channel]  from the routing map under a routing key.
 * @param routingKey - the routing key: 'main' | 'content' | 'background' | 'extension' | 'native' | 'server';
 * @param client - the connected client 
 * @param channel - the channel 
 */
  addRoutingChannel(routingKey: ContextType, client: ClientInfo, channel: IChannel): void {
    this.logger.info('addRoutingChannel: ', routingKey, channel, client);
    // init if no routing key
    if (!this.routingMap.hasOwnProperty(routingKey)) {
      this.routingMap[routingKey] = [];
    }

    let i = this.routingMap[routingKey].findIndex((val) => {
      let [cur_client, cur_channel] = val;
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
      channel.on('message', (data) => {
        this.onMessage(data.msg, channel);
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
    this.logger.info('removeRoutingChannel: ', routingKey, channel, client);
    if (!this.routingMap.hasOwnProperty(routingKey)) {
      this.routingMap[routingKey] = [];
    }

    this.routingMap[routingKey] = this.routingMap[routingKey].filter(
      ([cur_client, cur_channel]) => !(cur_channel.id === channel.id && cur_client.id === client.id)
    );
  }

  /**
   * Send a message to destination or via routing channels.
   * @param data Payload data
   * @param resultCallback Optional callback for response
   */
  send(
    data: MessageData,
    resultCallback?: (result: MessageData) => void
  ): void {

    // Try to handle message locally
    const handled = this.handleMessage(data, resultCallback);
    if (handled) {
      return;
    }

    // wrapper the data into the Msg and send it via channels
    const msg = new Message('event', Utils.deepClone(data));
    // in case the uid is duplicated
    while (msg.uid in this._responseCallbacks) {
      msg.uid = msg.uid + '-dup';
    }
    if (resultCallback) {
      msg.type = 'request';
      this._responseCallbacks[msg.uid] = resultCallback;
    }

    // Forward via routingMap
    this.forwardMessageViaRouting(msg);
  }

  /**
   * Handler for incoming messages from a channel.
   */
  onMessage(msg: Message, sender: IChannel): void {
    // response:
    if (msg.type === 'response' && msg.uid in this._responseCallbacks) {
      const responseCallback = this._responseCallbacks[msg.uid];
      delete this._responseCallbacks[msg.uid];
      if (Utils.isFunction(responseCallback)) {
        responseCallback.call(this, msg.data);
      }
      return;
    }

    // event | request handled by local automation objects
    if (msg.type === 'event' || msg.type === 'request') {
      const handled = this.handleMessage(msg.data, (result: MessageData) => {
        if (msg.type === 'event') {
          return;
        }

        // send response for request
        const resMsg = new Message('response', Utils.deepClone(result));
        resMsg.uid = msg.uid;
        sender.send(msg);
      });
      if (handled) {
        return;
      }
    }

    // forward message
    const clonedMsg = new Message(msg.type, Utils.deepClone(msg.data));
    if (clonedMsg.type === 'request') {
      this._responseCallbacks[clonedMsg.uid] = (result: MessageData) => {
        const resMsg = new Message('response', Utils.deepClone(result));
        resMsg.uid = msg.uid;
        sender.send(resMsg);
      };
    }
    this.forwardMessageViaRouting(clonedMsg);
  }

  /** ================================================================== */
  /** ========================= Helper methods ========================= */
  /** ================================================================== */

  /**
   * Handle a message data via the registered handlers that match the destination RTID.
   * @returns true if handled, false otherwise
   */
  private handleMessage(msgData: MessageData, resultCallback?: (result: MessageData) => void): boolean {
    const dest = msgData.dest;
    const handlers = this._handlers.filter((handler) =>
      Utils.isNullOrUndefined(dest) || Rtid.isRtidEqual(dest, handler.id)
    );
    if (handlers.length === 0) {
      this.logger.error('0 handlers found for the target of the message', msgData, dest);
      return false;
    }
    for (const handler of handlers) {
      const handled = handler.handle(msgData, resultCallback);
      if (handled) {
        return true;
      }
    }
    return false;
  }

  /**
   * Send message via routing channels.   
   * @param msg message
   * @param dest force destination RTID
   */
  protected forwardMessageViaRouting(msg: Message): void {
    const dest = msg.data.dest;
    const routingKey = this.resolveRoutingKey(dest);
    if (Utils.isNullOrUndefined(routingKey)) {
      this.logger.error('forwardMessageViaRouting: fail to find the routingKey for the message: ', msg);
      return;
    }
    const channels: IChannel[] = this.getRoutingChannels(routingKey, msg);
    if (Utils.isEmpty(channels)) {
      this.logger.warn(`forwardMessageViaRouting: find 0 channels when sending msg ${msg}`);
      return;
    }

    try {
      channels.forEach((channel) => {
        channel.send(msg);
      });
    } catch (e) {
      this.logger.error('forwardMessageViaRouting: failed to send msg ', msg, e);
    }
  }

  /**
   * Determine routing key from RTID.
   */
  protected resolveRoutingKey(rtid: Rtid): ContextType | null {

    // message to the specified context
    if (!Utils.isEmpty(rtid.context)) {
      return rtid.context;
    }

    // message to another browser by native application forwarding
    if (rtid.browser > 0) {
      return 'native';
    }

    // agent rtid (browser:-1, page:-1, frame: -1)
    if (rtid.browser === -1 && rtid.page === -1 && rtid.frame === -1) {
      return 'background';
    }

    // tab rtid (browser:-1, page:>=0, frame: -1)
    if (rtid.browser === -1 && rtid.page >= 0 && rtid.frame === -1) {
      return 'background';
    }

    // frame rtid (browser:-1, page:>=0, frame: >=0)
    if (rtid.browser == -1 && rtid.page >= 0 && rtid.frame >= 0) {
      return 'content';
    }

    // frame rtid in MAIN WORLD (browser:-1, page:-1, frame: >=0). -- (MAIN WORLD: The web page execution environment)  
    if (rtid.browser == -1 && rtid.page == -1 && rtid.frame >= 0) {
      return 'MAIN';
    }

    return null;
  }

  /**
   * Get the routing channel based on the routing key for the give message
   * @param routingKey routing key
   * @param msg message
   */
  protected abstract getRoutingChannels(routingKey: ContextType, msg: Message): IChannel[];

}
