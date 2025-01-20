/**
 * ExtensionChannel.ts
 * Using Port (in the namespace of chrome.runtime) for communication between the extension background and extension content script execution context.
 * Using the Port, we will establish a Long-lived connection.
 * messaging flow: background →(request)→ content →(response)→ background
 * Author: Zhang Jie
 */

import { Rtid, Utils } from '../../Common';
import { ChannelBase, ChannelClient, ChannelHost, ChannelStatus, ClientChannel, ClientInfo } from '../ChannelBase';
import { Message } from '../Message';

interface PortListenerWrapper {
  onMessage: (msg: Message, port: chrome.runtime.Port) => void;
  onDisconnect: (port: chrome.runtime.Port) => void;
}

/**
 * The channel based on the extension port
 */
export class ExtensionPortChannel extends ChannelBase {
  /**
   * the listenerWrapper for port events
   */
  private readonly _listener: PortListenerWrapper;
  /**
   * the port for communication
   */
  private readonly _port: chrome.runtime.Port;

  constructor(port: chrome.runtime.Port) {
    super();

    this._port = port;
    this._status = ChannelStatus.CONNECTED;
    this._listener = {
      onMessage: this.onMessage.bind(this),
      onDisconnect: this.onDisconnect.bind(this)
    };

    this._port.onMessage.addListener(this._listener.onMessage);
    this._port.onDisconnect.addListener(this._listener.onDisconnect);
  }

  send(msg: Message): void {
    if (this._status != ChannelStatus.CONNECTED) {
      this.logger.warn('send: failed to send message because the port status is not connected');
      return;
    }
    try {
      this._port.postMessage(msg);
    }
    catch (err) {
      this.logger.error('send: port.postMessage failed', err);
    }
    finally {
      let error = '';
      if ('error' in this._port && 'message' in (this._port as any).error) {
        error = (this._port as any).error.message;
      }
      else if (chrome.runtime.lastError?.message) {
        error = chrome.runtime.lastError.message;
      }
      if (error) {
        this.logger.error('send: port.postMessage get error', error);
      }
    }

  }

  disconnect(_reason?: string): void {
    if (this._status != ChannelStatus.CONNECTED) {
      this.logger.warn('disconnect: failed to disconnect because the port status is not connected');
      return;
    }
    this._status = ChannelStatus.DISCONNECTING;
    this._port.disconnect();
  }

  private onMessage(msg: Message, _port: chrome.runtime.Port): void {
    this.emit('message', { msg: msg });
  }

  private onDisconnect(port: chrome.runtime.Port): void {
    this._status = ChannelStatus.DISCONNECTED;
    let reason = 'disconnected';
    if ('error' in port && 'message' in (port as any).error) {
      reason = (port as any).error.message;
    }
    else if (chrome.runtime.lastError?.message) {
      reason = chrome.runtime.lastError.message;
    }
    this.emit('disconnected', { reason: reason });
  }
}

/**
 * The connection client which connect to the extension background/another extension/native applicaton
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
  private readonly _externalId: string | null = null;
  /**
   * the port for communication
   */
  private _port?: chrome.runtime.Port;
  /**
   * the client info
   */
  private _clientInfo?: ExtensionClientInfo;
  /**
   * the channel wrappered the extension port
   */
  private _channel?: ExtensionPortChannel;

  constructor(type: 'background' | 'extension' | 'native' = 'background', externalId: string | null = null) {
    super();

    this._type = type;
    this._externalId = externalId;

    if (Utils.isFunction(chrome.runtime?.connect)) {
      this.logger.info('use chrome.runtime for messaging');
      this._messagingService = chrome?.runtime;
    } else if ('connect' in chrome.extension && Utils.isFunction((chrome.extension as any).connect)) {
      this.logger.info('use chrome.extension for messaging');
      this._messagingService = chrome?.extension;
    } else {
      throw new Error('the messagingService (chrome.runtime | chrome.extension) is not available');
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
    if (!Utils.isNullOrUndefined(this._port)) {
      this.logger.warn('connect: already connected as port is not null')
      return;
    }

    if (this._type === 'native') {
      if (!('connectNative' in this._messagingService)) {
        this.logger.warn('connect: the connectNative function is not available in the current messagingService')
        return;
      }
      if (Utils.isEmpty(this._externalId)) {
        this.logger.warn('connect: the native application name is missing')
        return;
      }
      try {
        this.logger.info(`connect: try to connectNative to the ${this._externalId} start - ${new Date().toLocaleString()}`);
        this._port = this._messagingService.connectNative(this._externalId);
        this.logger.info(`connect: try to connectNative to the ${this._externalId} end - ${new Date().toLocaleString()}`);
      }
      catch (ex) {
        console.error('connect failed', ex);
      }
    }
    else {
      if (!('connect' in this._messagingService)) {
        this.logger.warn('connect: the connect function is not available in the current messagingService')
        return;
      }

      /**
       * this._clientInfo is not null only if it is a re-connection 
       */
      if (!Utils.isNullOrUndefined(this._clientInfo)) {
        this._clientInfo.isReconnected = true;
      }
      const connectInfo: chrome.runtime.ConnectInfo | undefined = this._clientInfo ? { name: JSON.stringify(this._clientInfo) } : undefined;
      if (this._type === 'background') {
        this._port = this._messagingService.connect(connectInfo);
      }
      else if (this._type === 'extension') {
        if (Utils.isEmpty(this._externalId)) {
          this.logger.warn('connect: the external extension id is missing')
          return;
        }
        this._port = this._messagingService.connect(this._externalId, connectInfo);
      }
      else {
        this.logger.warn(`connect: the channel client type[${this._type}] is not supported`)
        return;
      }
    }

    if (!Utils.isNullOrUndefined(this._port)) {
      this._port.onMessage.addListener(this._listener.onMessage);
      this._port.onDisconnect.addListener(this._listener.onDisconnect);
    }

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
      if (msg.type === 'event' && msg.data.type === 'config') {
        if (msg.data.status === 'OK' && msg.data.action.name === 'connection_accept') {
          let clientInfo = msg.data.action.params['clientInfo'] as ExtensionClientInfo;
          if (Utils.isNullOrUndefined(clientInfo)) {
            this.logger.warn('onMessage: Connection failed as the clientInfo is missing', msg);
            return;
          }
          this._clientInfo = clientInfo;
          let channel = new ExtensionPortChannel(port);
          this._channel = channel;
          // remove the listeners as the channel will capture the events
          this._port?.onMessage.removeListener(this._listener.onMessage);
          this._port?.onDisconnect.removeListener(this._listener.onDisconnect);
          this._port = undefined;
          this._channel.once('disconnected', ({ reason }) => {
            this.emit('disconnected', { client: clientInfo, channel: channel, reason: reason });
            this._channel = undefined;
          });
          // emit the connected event
          this.emit('connected', { client: clientInfo, channel: channel });
        } else {
          this.logger.warn('onMessage: Connection failed', msg);
        }
      }
    }
    this.logger.warn('onMessage: unexpected message', msg);
  }

  private onDisconnect(port: chrome.runtime.Port): void {
    if (Utils.isNullOrUndefined(this._port) && Utils.isNullOrUndefined(this._channel)) {
      return;
    }
    if (!Utils.isNullOrUndefined(this._channel)) {
      this.logger.warn('onDisconnect: unexpected event when channel is still valid');
      this._channel.disconnect();
      this._channel = undefined;
    }
    if (this._port === port) {
      this._port = undefined;
      this._channel = undefined;
    }
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
      this.logger.info('use chrome.runtime for messaging');
      this._messagingService = chrome?.runtime;
    } else if ('connect' in chrome.extension && Utils.isFunction((chrome.extension as any).connect)) {
      this.logger.info('use chrome.extension for messaging');
      this._messagingService = chrome?.extension;
    } else {
      throw new Error('the messagingService (chrome.runtime | chrome.extension) is not available');
    }

    const manifest = chrome.runtime.getManifest();
    this._manifestVersion = manifest?.manifest_version ?? -1;
    this._extensionId = chrome.runtime.id;

    this._allowedExternalExtensionIds = [this._extensionId];

    this._onConnectListener = this.onConnected.bind(this);
  }

  start(): void {
    if ('onConnect' in this._messagingService) {
      this._messagingService.onConnect.addListener(this._onConnectListener);
    }
    if ('onConnectExternal' in this._messagingService) {
      this._messagingService.onConnectExternal.addListener(this._onConnectListener);
    }
    this.logger.info(`start: listening for internal and exteranl extension connections. extension_id: ${this._extensionId}, manifestVersion: ${this._manifestVersion}`);
  }

  stop(): void {
    if ('onConnect' in this._messagingService) {
      this._messagingService.onConnect.removeListener(this._onConnectListener);
    }
    if ('onConnectExternal' in this._messagingService) {
      this._messagingService.onConnectExternal.removeListener(this._onConnectListener);
    }
    this.logger.info(`stop: listening for internal and exteranl extension connections. extension_id: ${this._extensionId}, manifestVersion: ${this._manifestVersion}`);
  }

  private onConnected(port: chrome.runtime.Port): void {
    const clientInfo = this.getClientInfo(port);
    // unsupported connection, refuse the connection
    if (Utils.isNullOrUndefined(clientInfo) || Utils.isEmpty(clientInfo.id)) {
      const refuseMsg = new Message('event', {
        type: 'config',
        action: { name: 'connection_refuse', params: { 'reason': 'connection refused' } },
        dest: Rtid.getAgentRtid(),
        status: 'ERROR',
      });
      port.postMessage(refuseMsg);
      return;
    }

    // send back the success response
    const connectResponse = new Message('event', {
      type: 'config',
      action: { name: 'connection_accept', params: { 'clientInfo': clientInfo } },
      dest: Rtid.getAgentRtid(),
      status: 'OK',
    });
    port.postMessage(connectResponse);

    // set port after the postMessage
    this.logger.info('Client connected', clientInfo);
    const channel = new ExtensionPortChannel(port);
    channel.once("disconnected", ({ reason }) => {
      if (this._clientChannels.hasOwnProperty(clientInfo.id)) {
        delete this._clientChannels[clientInfo.id];
      }
      this.emit('disconnected', { client: clientInfo, channel: channel, reason });
    });
    this._clientChannels[clientInfo.id] = [clientInfo, channel];
    // dispatch event: connected
    this.emit('connected', { client: clientInfo, channel: channel });
  }

  private getClientInfo(port: chrome.runtime.Port): ClientInfo | null {
    if (this.isSupportedContentClient(port)) {
      return this.getExtensionClientInfo('content', port);
    } else if (this.isSupportedExtensionClient(port)) {
      return this.getExtensionClientInfo('extension', port);
    }
    return null;
  }

  private isSupportedContentClient(port: chrome.runtime.Port): boolean {
    return !!port.sender?.tab && !port.sender.tab.url?.startsWith('devtools://');
  }

  private isSupportedExtensionClient(port: chrome.runtime.Port): boolean {
    let id = port.sender?.id;
    return !Utils.isEmpty(id) && this._allowedExternalExtensionIds.includes(id);
  }

  private getExtensionClientInfo(mode: 'content' | 'extension', port: chrome.runtime.Port): ExtensionClientInfo {
    const sender = Utils.deepClone(port.sender);
    let connectionId = 'mock';
    if (mode === 'content') {
      // { sender: { tab: {windowId, id}, frameId, documentId, contextId } }
      connectionId = `content-tab::${sender?.tab?.id}-frameId::${sender?.frameId}`;
    }
    else if (mode === 'extension') {
      connectionId = `extension-extension::${sender?.id}-url::${sender?.url}`;
    }
    let isReconnected = false;
    // only in mv3 extension, the bg is running in service worker and it will be inactive for every 5 mins
    if (!Utils.isEmpty(port.name)) {
      try {
        const knownClientInfo = JSON.parse(port.name) as ExtensionClientInfo;
        connectionId = knownClientInfo.id;
        isReconnected = knownClientInfo.isReconnected;
      } catch {
        this.logger.warn(`Unexpected port name format ${port.name}`);
      }
    }

    // theoretically it will not happen as tabId and frameId are unique 
    // while (connectionId in this.clients) {
    while (this._clientChannels.hasOwnProperty(connectionId)) {
      connectionId += '-dup';
    }

    let clientInfo: ExtensionClientInfo = {
      id: connectionId,
      type: mode,
      isReconnected,
      info: sender,
    };
    return clientInfo;
  }
}
