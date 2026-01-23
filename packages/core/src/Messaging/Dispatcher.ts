/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Dispatcher.ts
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

import { Logger } from './../Logger';
import * as Utils from './../Utils';
import * as MsgUtils from './../MsgUtils';
import * as RtidUtils from './../RtidUtils';
import { Message, MessageData } from '../types/protocol';
import { IChannel } from './ChannelBase';
import { IMsgDataHandler } from './MsgDataHandler';

/**
 * Dispatcher class that routes messages between handlers and channels.
 */
export abstract class Dispatcher {
  readonly id: number;
  protected readonly logger: Logger;
  protected readonly mode: string;
  private _timeout: number = 5000;
  private _responseCallbacks: Record<string, (result: MessageData) => void> = {};
  private _responseTimeoutId: Record<string, ReturnType<typeof setTimeout>> = {};
  private _handlers: IMsgDataHandler[] = [];


  constructor(mode: string) {
    this.id = Date.now();
    const prefix = Utils.isEmpty(this.constructor?.name) ? "Dispatcher" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this.mode = mode;
  }

  /**
   * Add a message handler.
   * @param handler - a message handler
   */
  addHandler(handler: IMsgDataHandler): void {
    this._handlers.push(handler);
  }

  /**
   * Remove a message handler.
   * @param handler - a message handler
   */
  removeHandler(handler: IMsgDataHandler): void {
    const index = this._handlers.indexOf(handler);
    if (index >= 0) {
      this._handlers.splice(index, 1);
    }
  }

  /**
   * set the default timeout for messaging
   * @param timeout default timeout
   */
  setDefaultTimeout(timeout: number): void {
    this._timeout = timeout;
  }

  /**
   * get default timeout for messaging
   * @returns default timeout in milliseconds
   */
  getDefaultTimeout(): number {
    return this._timeout;
  }

  /**
   * Send request
   * @param data Request Payload data
   * @param timeout Timeout in milliseconds (default: 5000ms)
   */
  async sendRequest(
    data: MessageData,
    timeout: number = this._timeout
  ): Promise<MessageData> {
    this.logger.debug('sendRequest: ======> data=', data, ' timeout=', timeout);
    const handlers = this.getLocalHandlers(data);
    if (handlers.length > 0) {
      const result = await this.handleMsgData(data, handlers);
      this.logger.debug('sendRequest: <====== data=', data, ' handled result=', result);
      return result;
    }
    else {
      const request = MsgUtils.createRequest(data);
      const channel = this.getChannel(request);
      if (Utils.isNullOrUndefined(channel)) {
        throw new Error('Cannot find the communication channel');
      }
      if (channel.async) {
        const response = await Utils.waitResult(async () => {
          return await channel.sendRequest(request);
        }, timeout);
        this.logger.debug('sendRequest: <====== data=', data, ' response result=', response.data);
        return response.data;
      }
      else {
        const result = await this._postRequest(request, channel, timeout);
        this.logger.debug('sendRequest: <====== data=', data, ' response result=', result);
        return result;
      }
    }
  }

  /**
   * Send event
   * @param data Request Payload data
   * @param timeout Timeout in milliseconds (default: 5000ms)
   */
  async sendEvent(data: MessageData,
    timeout: number = this._timeout
  ): Promise<void> {
    this.logger.debug('sendEvent: ======> data=', data, ' timeout=', timeout);
    const handlers = this.getLocalHandlers(data);
    if (handlers.length > 0) {
      await this.handleMsgData(data, handlers);
    }
    else {
      const event = MsgUtils.createEvent(data);
      const channel = this.getChannel(event);
      if (Utils.isNullOrUndefined(channel)) {
        throw new Error('Cannot find the communication channel');
      }
      if (channel.async) {
        await Utils.waitResult(async () => {
          return await channel.sendEvent(event);
        }, timeout);
      }
      else {
        channel.postMessage(event);
      }
    }
    this.logger.debug('sendEvent: <====== data=', data);
  }

  /**
   * Handler for incoming messages from a channel.
   */
  onMessage(msg: Message, sender?: unknown, responseCallback?: (response: Message) => void): void {
    this.logger.debug('onMessage: ------> msg=', msg, ' sender=', sender, ' responseCallback=', !!responseCallback);

    // response:
    if (msg.type === 'response' && msg.syncId) {
      if (msg.syncId in this._responseTimeoutId && !Utils.isNullOrUndefined(this._responseTimeoutId[msg.syncId])) {
        const timeoutId = this._responseTimeoutId[msg.syncId];
        this._responseTimeoutId[msg.syncId] = undefined as never;
        clearTimeout(timeoutId);
      }
      if (msg.syncId in this._responseCallbacks && !Utils.isNullOrUndefined(this._responseCallbacks[msg.syncId])) {
        const cachedResponseCallback = this._responseCallbacks[msg.syncId];
        this._responseCallbacks[msg.syncId] = undefined as never;
        cachedResponseCallback(msg.data);
        this.logger.debug('onMessage: <------ response handled by cachedResponseCallback, msg=', msg, ' sender=', sender);
      }
      return;
    }

    if (msg.type === 'event') {
      const handlers = this.getLocalHandlers(msg.data);
      if (handlers.length > 0) {
        this.handleMsgData(msg.data, handlers).then((result) => {
          this.logger.debug('onMessage: <------ event handled by local handlers, msg=', msg, ' sender=', sender, 'result=', result);
        }).catch((err) => {
          this.logger.warn('onMessage: <------ event handled by local handlers, msg=', msg, ' sender=', sender, 'error=', err);
        });
      }
      else {
        const event = MsgUtils.createEvent(msg.data, msg.correlationId);
        this.logger.debug('onMessage: ==> forward event msg=', event);
        const channel = this.getChannel(event);
        if (Utils.isNullOrUndefined(channel)) {
          throw new Error('Cannot find the communication channel');
        }
        if (channel.async) {
          channel.sendEvent(event).then(() => {
            this.logger.debug('onMessage: <------ event forwarded by [sendEvent], msg=', msg, ' new event=', event, ' channel=', channel);
          }).catch((err) => {
            this.logger.warn('onMessage: <------ event forwarded by [sendEvent], msg=', msg, ' new event=', event, ' channel=', channel, 'error=', err);
          });
        }
        else {
          channel.postMessage(event);
          this.logger.debug('onMessage: <------ event forwarded by [postMessage], msg=', msg, ' new event=', event, ' channel=', channel);
        }
      }
    }
    else if (msg.type === 'request') {
      const handlers = this.getLocalHandlers(msg.data);
      if (handlers.length > 0) {
        this.handleMsgData(msg.data, handlers).then((result) => {
          if (!msg.syncId) {
            throw new Error('syncId is empty');
          }
          const response = MsgUtils.createResponse(result, msg.syncId, msg.correlationId);
          if (responseCallback) {
            responseCallback(response);
          }
          this.logger.debug('onMessage: <------ request handled by local handlers, msg=', msg, ' sender=', sender, ' response=', response);
        }).catch((err) => {
          this.logger.error('onMessage: <------ request handled by local handlers, msg=', msg, ' sender=', sender, ' error=', err);
        });
      }
      else {
        const request = MsgUtils.createRequest(msg.data);
        this.logger.debug('onMessage: ------ forward request msg=', request);
        const channel = this.getChannel(request);
        if (Utils.isNullOrUndefined(channel)) {
          throw new Error('Cannot find the communication channel');
        }
        if (channel.async) {
          channel.sendRequest(request).then((resMsg) => {
            if (!msg.syncId) {
              throw new Error('syncId is empty');
            }
            const response = MsgUtils.createResponse(resMsg.data, msg.syncId, msg.correlationId);
            if (responseCallback) {
              responseCallback(response);
            }
            this.logger.debug('onMessage: <------ request forwarded by [sendRequest], msg=', msg, ' sender=', sender, ' channel:', channel, ' response=', response);
          }).catch((err) => {
            this.logger.error('onMessage: <------ request forwarded by [sendRequest], msg=', msg, ' sender=', sender, ' channel:', channel, ' error=', err);
          });
        }
        else {
          // set timeout to -1 so that it will not rejected by timeout
          this._postRequest(request, channel, -1).then((result) => {
            if (!msg.syncId) {
              throw new Error('syncId is empty');
            }
            const response = MsgUtils.createResponse(result, msg.syncId, msg.correlationId);
            if (responseCallback) {
              responseCallback(response);
            }
            this.logger.debug('onMessage: <------ forward request post msg=', msg, ' sender=', sender, ' channel:', channel, ' response=', response);
          }).catch((err) => {
            this.logger.debug('onMessage: <------ forward request post msg=', msg, ' sender=', sender, ' channel:', channel, ' error=', err);
          });
        }
      }
    }
  }

  /** ================================================================== */
  /** ========================= Helper methods ========================= */
  /** ================================================================== */

  /**
   * Get the local handlers which match the given message data
   * @param msgData message data
   * @returns if the message data should be handled locally
   */
  protected getLocalHandlers(msgData: MessageData): IMsgDataHandler[] {
    const dest = msgData.dest;
    const handlers = this._handlers.filter((handler) =>
      Utils.isNullOrUndefined(dest) || RtidUtils.isRtidEqual(dest, handler.rtid)
    );
    return handlers;
  }

  /**
   * Handle a message data via the registered handlers that match the destination RTID.
   * @returns true if handled, false otherwise
   */
  private async handleMsgData(msgData: MessageData, handlers: IMsgDataHandler[]): Promise<MessageData> {
    return new Promise((resolve, reject) => {
      if (handlers.length === 0) {
        reject(new Error('Invalid Arguments: no handlers'));
        return false;
      }

      const resultCallback = (result: MessageData): void => {
        resolve(result);
      };
      for (const handler of handlers) {
        const handled = handler.handle(msgData, resultCallback);
        if (handled) {
          return true;
        }
      }

      reject(new Error('Message Data is not handled successfully.'));
      return false;
    });
  }

  /**
   * Post request message data using channels.
   * @param data message data for request
   * @param timeout message timeout
   */
  private async _postRequest(msg: Message, channel: IChannel, timeout: number = this._timeout): Promise<MessageData> {
    return new Promise((resolve, reject) => {
      const resultCallback = (result: MessageData): void => {
        resolve(result);
      };

      while (Utils.isNullOrUndefined(msg.syncId) || msg.syncId in this._responseCallbacks) {
        msg.syncId = Utils.generateUUID();
      }
      const syncId = msg.syncId;
      this._responseCallbacks[syncId] = resultCallback;

      if (timeout > 0) {
        const timeoutId = setTimeout(() => {
          if (syncId in this._responseTimeoutId) {
            this._responseTimeoutId[syncId] = undefined as never;
          }
          if (syncId in this._responseCallbacks) {
            this._responseCallbacks[syncId] = undefined as never;
            this.logger.error(`============ request timeout after ${timeout}ms. \r\nmessage: ${JSON.stringify(msg)}`);
            reject(new Error(`Request timed out after ${timeout}ms`));
          }
        }, timeout);
        this._responseTimeoutId[syncId] = timeoutId;
      }

      channel.postMessage(msg);
    });
  }

  /**
   * Get the channel for the msg.data.dest
   * @param msg message
   */
  protected abstract getChannel(msg: Message): IChannel | null;

}