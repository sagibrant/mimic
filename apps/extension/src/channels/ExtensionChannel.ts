/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ExtensionChannel.ts
 * @description 
 * Using Port (in the namespace of chrome.runtime) for communication between the extension background and extension content script execution context.
 * Using the Port, we will establish a Long-lived connection.
 * messaging flow: background →(request)→ content →(response)→ background
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

import { Utils, MsgUtils, RtidUtils, ChannelBase, ChannelClient, ChannelHost, ChannelStatus, ClientChannel, ClientInfo, Message } from "@gogogo/shared";

interface PortListenerWrapper {
  onMessage: (msg: Message, port: chrome.runtime.Port) => void;
  onDisconnect: (port: chrome.runtime.Port) => void;
}

/**
 * The channel based on the extension port
 */
export class ExtensionPortChannel extends ChannelBase {
  /**
   * the port for communication
   */
  private readonly _port: chrome.runtime.Port;
  /**
   * the listenerWrapper for port events
   */
  private _listener?: PortListenerWrapper;

  constructor(port: chrome.runtime.Port) {
    super();

    this._port = port;
    this._status = ChannelStatus.CONNECTED;
  }

  startListening(): void {
    if (this._listener) {
      return;
    }
    this._listener = {
      onMessage: this.onMessage.bind(this),
      onDisconnect: this.onDisconnect.bind(this)
    };
    this._port.onMessage.addListener(this._listener.onMessage);
    this._port.onDisconnect.addListener(this._listener.onDisconnect);
  }

  stopListening(): void {
    if (Utils.isNullOrUndefined(this._listener)) {
      return;
    }
    this._port.onMessage.removeListener(this._listener.onMessage);
    this._port.onDisconnect.removeListener(this._listener.onDisconnect);
    this._listener = undefined;
  }

  postMessage(msg: Message): void {
    if (this._status != ChannelStatus.CONNECTED) {
      throw new Error('Channel is not connected');
    }
    try {
      this.logger.debug('postMessage: >>>> msg=', msg);

      this._port.postMessage(msg);
    } catch (error) {
      this.logger.error('postMessage: error ', error, msg);
      throw error;
    }
    finally {
      let error = '';
      const port = this._port as unknown as { error?: { message?: string } };
      if ('error' in this._port && port.error && 'message' in port.error) {
        error = port.error.message || '';
      }
      else if (chrome.runtime.lastError?.message) {
        error = chrome.runtime.lastError.message;
      }
      if (error) {
        this.logger.error(`send: port.postMessage get error: ${error}, msg: ${JSON.stringify(msg)}`);
      }
    }
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
    this._status = ChannelStatus.DISCONNECTING;
    this.stopListening();
    this._port.disconnect();
  }

  private onMessage(msg: Message, port: chrome.runtime.Port): void {
    this.logger.debug('onMessage: >>>> msg=', msg, ' port:', port);

    this.emit('message', {
      msg: msg,
      sender: port,
      responseCallback: (response) => {
        this.postMessage(response);
        this.logger.debug('onMessage: <<<< msg=', msg, ' port:', port, ' response:', response);
      }
    });
  }

  private onDisconnect(port: chrome.runtime.Port): void {
    this._status = ChannelStatus.DISCONNECTED;
    let reason = 'disconnected';
    const p = port as unknown as { error?: { message?: string } };
    if ('error' in port && p.error && 'message' in p.error) {
      reason = p.error.message || '';
    }
    else if (chrome.runtime.lastError?.message) {
      reason = chrome.runtime.lastError.message;
    }
    this.emit('disconnected', { reason: reason });
  }
}

/**
 * The connection client which connect to the extension background/another extension/native application
 */
export class ExtensionChannelClient extends ChannelClient {
  /**
   * the messaging service for extension api (chrome.runtime for new versions, chrome.extension for lower versions)
   */
  private readonly _messagingService: typeof chrome.runtime | typeof chrome.extension;
  /**
   * the listenerWrapper for port events
   */
  private readonly _listener: PortListenerWrapper;
  /**
   * the channel client type
   * 'background' : connect to the current extension background
   * 'extension' : connect to another extension which defined in the externalId
   * 'native' : connect to a native application which defined in the externalId
   */
  private readonly _type: 'background' | 'extension' | 'native';
  /**
   * the external extension id or native application name which defined in the native application's manifest file
   */
  private readonly _externalId?: string = undefined;
  /**
   * the port for communication
   */
  private _port?: chrome.runtime.Port;
  /**
   * the client info
   */
  private _clientInfo?: ExtensionClientInfo;
  /**
   * the channel wrapped the extension port
   */
  private _channel?: ExtensionPortChannel;

  constructor(type: 'background' | 'extension' | 'native' = 'background', externalId?: string) {
    super();

    this._type = type;
    this._externalId = externalId;
    if (this._type === 'extension' && Utils.isNullOrUndefined(this._externalId)) {
      throw new Error('The external id is missing for external extension connection');
    }
    if (this._type === 'native' && Utils.isNullOrUndefined(this._externalId)) {
      throw new Error('The external id is missing for external native connection');
    }

    if (Utils.isFunction(chrome.runtime?.connect)) {
      this.logger.debug('use chrome.runtime for messaging');
      this._messagingService = chrome?.runtime;
    } else if ('connect' in chrome.extension && Utils.isFunction((chrome.extension as unknown as Record<string, unknown>).connect)) {
      this.logger.debug('use chrome.extension for messaging');
      this._messagingService = chrome?.extension;
    } else {
      throw new Error('chrome.runtime is not available');
    }
    /**
     * we wrapped the callback so that we can safely remove the listeners after the binding
     */
    this._listener = {
      onMessage: this.onMessage.bind(this),
      onDisconnect: this.onDisconnect.bind(this)
    };
  }

  connect(): void {
    if (!Utils.isNullOrUndefined(this._port) || !Utils.isNullOrUndefined(this._channel)) {
      this.logger.warn('connect: already connected as port or channel is not null');
      return;
    }

    /** this._clientInfo is not null only if it is a re-connection */
    if (!Utils.isNullOrUndefined(this._clientInfo)) {
      this._clientInfo.isReconnected = true;
    }
    const connectInfo: chrome.runtime.ConnectInfo | undefined = this._clientInfo ? { name: JSON.stringify(this._clientInfo) } : undefined;

    switch (this._type) {
      case 'native': {
        if (!('connectNative' in this._messagingService)) {
          throw new Error('The connectNative function is missing');
        }
        if (Utils.isEmpty(this._externalId)) {
          throw new Error('The external id is missing for external native connection');
        }

        this.logger.debug(`connect: ==> connectNative to the ${this._externalId}`);
        this._port = this._messagingService.connectNative(this._externalId);
        this.logger.debug(`connect: <== connectNative to the ${this._externalId}}`);
        break;
      }
      case 'background': {
        if (!('connect' in this._messagingService)) {
          throw new Error('The connect function is missing');
        }

        this.logger.debug(`connect: ==> connect to background`);
        this._port = this._messagingService.connect(connectInfo);
        this.logger.debug(`connect: <== connect to background`);
        break;
      }
      case 'extension': {
        if (!('connect' in this._messagingService)) {
          throw new Error('The connect function is missing');
        }
        if (Utils.isEmpty(this._externalId)) {
          throw new Error('The external id is missing for external extension connection');
        }

        this.logger.debug(`connect: ==> connect to external extension - ${this._externalId}`);
        this._port = this._messagingService.connect(this._externalId, connectInfo);
        this.logger.debug(`connect: <== connect to external extension - ${this._externalId}`);
        break;
      }
      default: {
        this.logger.warn(`connect: the channel client type[${String(this._type)}] is not supported`);
        return;
      }
    }

    if (!Utils.isNullOrUndefined(this._port)) {
      this._port.onMessage.addListener(this._listener.onMessage);
      this._port.onDisconnect.addListener(this._listener.onDisconnect);
    }

  }

  async connectAsync(timeout: number = 500): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connect();
      const end_time = performance.now() + timeout;
      const delay = timeout / 10;
      const checkConnection = async (): Promise<void> => {
        // if channel exists, connection is established
        if (!Utils.isNullOrUndefined(this._channel)) {
          return resolve();
        }

        // if exist error message, connection is failed
        let errorMessage = '';
        const port = this._port as unknown as { error?: { message?: string } };
        if (this._port && 'error' in this._port && port.error && 'message' in port.error) {
          errorMessage = port.error.message || '';
        }
        else if (chrome.runtime.lastError?.message) {
          errorMessage = chrome.runtime.lastError.message;
        }
        if (!Utils.isEmpty(errorMessage)) {
          return reject(new Error(errorMessage));
        }

        // if timeout, connection may be failed
        if (performance.now() > end_time) {
          return reject(new Error('Timeout in connectAsync'));
        }

        setTimeout(checkConnection, delay);
      };
      return checkConnection();
    });
  }

  reconnect(timeout: number = -1, delay: number = 500): void {
    let count = 1;
    const end_time: number | undefined = timeout > 0 ? performance.now() + timeout : undefined
    let lastExecution: number | undefined = undefined;
    const reconnectFunc = async (): Promise<void> => {
      if (end_time && performance.now() >= end_time) {
        this.logger.debug('reconnect timeout', timeout, delay);
        return;
      }
      try {
        if (Utils.isNullOrUndefined(lastExecution) || performance.now() - lastExecution >= delay) {
          this.logger.debug('reconnect: retry num:', count++);
          lastExecution = performance.now();
          await this.connectAsync();
          lastExecution = performance.now();
          this.logger.debug('reconnect succeeded');
          return;
        }
        else {
          setTimeout(reconnectFunc, delay);
        }
      } catch (error) {
        this.logger.error('reconnect failed', error);
        setTimeout(reconnectFunc, delay);
      }
    };
    void reconnectFunc();
  }

  disconnect(_reason?: string): void {
    if (Utils.isNullOrUndefined(this._port) && Utils.isNullOrUndefined(this._channel)) {
      return;
    }
    if (!Utils.isNullOrUndefined(this._channel)) {
      this._channel.disconnect();
      this._channel = undefined;
      this._port = undefined;
    }
    else if (!Utils.isNullOrUndefined(this._port)) {
      this._port.disconnect();
      this._port = undefined;
    }
  }

  private onMessage(msg: Message, port: chrome.runtime.Port): void {
    // the client should handle the connection messages only if the port is connected but channel not created
    if (!Utils.isNullOrUndefined(this._port) && Utils.isNullOrUndefined(this._channel)) {
      // connectResponse
      if (msg.type === 'event' && msg.data.type === 'config' && msg.data.action.name === 'set') {
        if (msg.data.status === 'OK' && msg.data.action.params?.name === 'clientInfo') {
          const clientInfo = msg.data.action.params?.value as ExtensionClientInfo;
          if (Utils.isNullOrUndefined(clientInfo)) {
            this.logger.warn('onMessage: Connection failed as the clientInfo is missing', msg);
            return;
          }
          this._clientInfo = clientInfo;
          const channel = new ExtensionPortChannel(port);
          this._channel = channel;
          // remove the listeners as the channel will capture the events
          this._port.onMessage.removeListener(this._listener.onMessage);
          this._port.onDisconnect.removeListener(this._listener.onDisconnect);
          this._channel.once('disconnected', ({ reason }) => {
            this._channel = undefined;
            this._port = undefined;
            this.emit('disconnected', { client: clientInfo, channel: channel, reason: reason });
          });
          // emit the connected event
          this.emit('connected', { client: clientInfo, channel: channel });
          channel.startListening();
          return;
        } else {
          this.logger.warn('onMessage: Connection failed', msg);
          return;
        }
      }
    }
    this.logger.warn('onMessage: unexpected message', msg);
  }

  private onDisconnect(_port: chrome.runtime.Port): void {
    if (Utils.isNullOrUndefined(this._port) && Utils.isNullOrUndefined(this._channel)) {
      return;
    }
    if (!Utils.isNullOrUndefined(this._channel)) {
      this.logger.warn('onDisconnect: unexpected event when channel is still valid');
      this._channel.disconnect();
    }
    this._port = undefined;
    this._channel = undefined;
  }
}

/**
 * use Intersection Types (交叉类型) to define the extension client info
 */
export type ExtensionClientInfo = ClientInfo & {
  isReconnected: boolean;
  info?: chrome.runtime.MessageSender;
};

/**
 * the channel host who listening for the incoming content and external extension connections
 */
export class ExtensionChannelHost extends ChannelHost {
  /**
   * the listener for port connected event
   */
  private readonly _onConnectListener: (port: chrome.runtime.Port) => void;
  /**
   * the messaging service for extension api (chrome.runtime for new versions, chrome.extension for lower versions)
   */
  private readonly _messagingService: typeof chrome.runtime | typeof chrome.extension;
  /**
   * manifest version for this extension (2 or 3)
   */
  private readonly _manifestVersion: number = -1;
  /**
   * the extension id for this extension
   */
  private readonly _extensionId: string | null = null;
  /**
   * the extension id allowed for external connection
   */
  private readonly _allowedExternalExtensionIds: string[];
  /**
   * the connected <connectionId, client & channels>
   */
  private _clientChannels: Record<string, ClientChannel> = {};

  constructor() {
    super();

    if (Utils.isFunction(chrome.runtime?.connect)) {
      this.logger.debug('use chrome.runtime for messaging');
      this._messagingService = chrome?.runtime;
    } else if ('connect' in chrome.extension && Utils.isFunction((chrome.extension as unknown as Record<string, unknown>).connect)) {
      this.logger.debug('use chrome.extension for messaging');
      this._messagingService = chrome?.extension;
    } else {
      throw new Error('chrome.runtime is not available');
    }

    const manifest = chrome.runtime.getManifest();
    this._manifestVersion = manifest?.manifest_version ?? -1;
    this._extensionId = chrome.runtime.id;

    this._allowedExternalExtensionIds = [];

    this._onConnectListener = this.onConnected.bind(this);
  }

  start(): void {
    if ('onConnect' in this._messagingService) {
      this._messagingService.onConnect.addListener(this._onConnectListener);
    }
    if ('onConnectExternal' in this._messagingService) {
      this._messagingService.onConnectExternal.addListener(this._onConnectListener);
    }
    this.logger.debug(`start: listening for internal and external extension connections. extension_id: ${this._extensionId}, manifestVersion: ${this._manifestVersion}`);
  }

  stop(): void {
    if ('onConnect' in this._messagingService) {
      this._messagingService.onConnect.removeListener(this._onConnectListener);
    }
    if ('onConnectExternal' in this._messagingService) {
      this._messagingService.onConnectExternal.removeListener(this._onConnectListener);
    }
    this.logger.debug(`stop: listening for internal and external extension connections. extension_id: ${this._extensionId}, manifestVersion: ${this._manifestVersion}`);
  }

  private onConnected(port: chrome.runtime.Port): void {
    const clientInfo = this.getClientInfo(port);
    // unsupported connection, refuse the connection
    if (Utils.isNullOrUndefined(clientInfo) || Utils.isEmpty(clientInfo.id)) {
      const msgData = MsgUtils.createMessageData('config', RtidUtils.getAgentRtid(), { name: 'set', params: { 'reason': 'connection refused' } });
      msgData.status = 'ERROR';
      const refuseMsg = MsgUtils.createEvent(msgData);
      port.postMessage(refuseMsg);
      return;
    }

    // send back the success response
    const msgData = MsgUtils.createMessageData('config', RtidUtils.getAgentRtid(), { name: 'set', params: { name: 'clientInfo', value: clientInfo } });
    msgData.status = 'OK';
    const connectResponse = MsgUtils.createEvent(msgData);
    port.postMessage(connectResponse);

    // set port after the postMessage
    this.logger.debug('Client connected', clientInfo);
    const channel = new ExtensionPortChannel(port);
    channel.once("disconnected", ({ reason }) => {
      if (Object.prototype.hasOwnProperty.call(this._clientChannels, clientInfo.id)) {
        Reflect.deleteProperty(this._clientChannels, clientInfo.id);
      }
      this.emit('disconnected', { client: clientInfo, channel: channel, reason });
    });
    this._clientChannels[clientInfo.id] = [clientInfo, channel];
    // dispatch event: connected
    this.emit('connected', { client: clientInfo, channel: channel });
    channel.startListening();
  }

  private getClientInfo(port: chrome.runtime.Port): ClientInfo | null {
    if (this.isSupportedContentClient(port)) {
      return this.getExtensionClientInfo('content', port);
    } else if (this.isSupportedBackgroundClient(port)) {
      return this.getExtensionClientInfo('background', port);
    } else if (this.isSupportedExtensionClient(port)) {
      return this.getExtensionClientInfo('external', port);
    }
    return null;
  }

  private isSupportedContentClient(port: chrome.runtime.Port): boolean {
    return !!port.sender?.tab && !port.sender.tab.url?.startsWith('devtools://');
  }

  private isSupportedBackgroundClient(port: chrome.runtime.Port): boolean {
    const id = port.sender?.id;
    return !Utils.isEmpty(id) && id === this._extensionId;
  }

  private isSupportedExtensionClient(port: chrome.runtime.Port): boolean {
    const id = port.sender?.id;
    return !Utils.isEmpty(id) && this._allowedExternalExtensionIds.includes(id);
  }

  private getExtensionClientInfo(mode: 'content' | 'background' | 'external', port: chrome.runtime.Port): ExtensionClientInfo {
    const sender = Utils.deepClone(port.sender);
    let connectionId = 'mock';
    if (mode === 'content') {
      // { sender: { tab: {windowId, id}, frameId, documentId, contextId } }
      connectionId = `content-tab::${sender?.tab?.id}-frameId::${sender?.frameId}`;
    }
    else if (mode === 'background') {
      // sidebar url: "chrome-extension://ilcdijkgbkkllhojpgbiajmnbdiadppj/ui/sidebar/index.html"
      connectionId = `background::url::${sender?.url}`;
    }
    else if (mode === 'external') {
      connectionId = `external-extension::${sender?.id}-url::${sender?.url}`;
    }
    let isReconnected = false;
    // only in mv3 extension, the bg is running in service worker and it will be inactive for every 5 mins
    if (!Utils.isEmpty(port.name)) {
      try {
        const knownClientInfo = JSON.parse(port.name) as ExtensionClientInfo;
        // if the knownClientInfo.id is not used, reuse it.
        if (!Object.prototype.hasOwnProperty.call(this._clientChannels, knownClientInfo.id)) {
          connectionId = knownClientInfo.id;
          isReconnected = knownClientInfo.isReconnected;
        }
      } catch {
        this.logger.warn('Unexpected port name format - ', port.name);
      }
    }

    // theoretically it will not happen as tabId and frameId are unique 
    // while (connectionId in this.clients) {
    while (Object.prototype.hasOwnProperty.call(this._clientChannels, connectionId)) {
      connectionId += '-dup';
    }

    const clientInfo: ExtensionClientInfo = {
      id: connectionId,
      type: mode,
      isReconnected,
      info: sender,
    };
    return clientInfo;
  }
}
