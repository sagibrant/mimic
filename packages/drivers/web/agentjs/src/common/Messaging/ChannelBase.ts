/**
 * Channel.ts
 * The base class for Communication Channel
 * Provides default initialization and methods for adding/removing listeners
 * Author: Zhang Jie
 */

import { ContextType } from "../Common";
import { EventEmitter } from "../EventEmitter";
import { Message } from "./Message";

/**
 * Enumerates possible statuses of a communication channel
 */
export enum ChannelStatus {
  DISCONNECTED = 'disconnected',  // Channel is not connected
  CONNECTING = 'connecting',      // Channel is in the process of connecting
  CONNECTED = 'connected',        // Channel is successfully connected
  DISCONNECTING = 'disconnecting',// Channel is in the process of disconnecting
  ERROR = 'error'                 // Channel encountered an error
}

/**
 * Defines event types emitted by a basic communication channel
 */
export interface ChannelEvents {
  /**
   * Triggered when the channel receives a message
   * @property msg - The received message object
   */
  message: { msg: Message };
  
  /**
   * Triggered when the channel is disconnected
   * @property reason - Optional reason for disconnection
   */
  disconnected: { reason?: string };
}

/**
 * Contains metadata about a client connected through a channel
 */
export interface ClientInfo {
  id: string;               // Unique identifier for the client
  type: ContextType;        // Type of context the client is running in (from Common)
  info?: unknown;           // Additional optional client information
}

/**
 * Defines event types emitted by a channel client
 */
export interface ChannelClientEvents {
  /**
   * Triggered when the channel successfully connects
   * @property client - Information about the connected client
   * @property channel - The connected channel instance
   */
  connected: { client: ClientInfo, channel: IChannel };
  
  /**
   * Triggered when the channel disconnects
   * @property client - Information about the disconnected client
   * @property channel - The disconnected channel instance
   * @property reason - Optional reason for disconnection
   */
  disconnected: { client: ClientInfo, channel: IChannel, reason?: string };
}

/**
 * Interface defining the core functionality of a communication channel
 */
export interface IChannel {
  /**
   * Unique identifier for the channel
   */
  readonly id: string;
  
  /**
   * Retrieves the current status of the channel
   * @returns The current ChannelStatus
   */
  getStatus(): ChannelStatus;
  
  /**
   * Disconnects the channel
   * @param reason - Optional reason for disconnection
   */
  disconnect(reason?: string): void;
  
  /**
   * Sends a message through the channel
   * @param msg - The Message object to be sent
   */
  send(msg: Message): void;
}

/**
 * Tuple type representing a client-channel association
 * @typedef [ClientInfo, IChannel] - Pair of client metadata and its associated channel
 */
export type ClientChannel = [client: ClientInfo, channel: IChannel];

/**
 * Base class for all communication channels
 * Extends EventEmitter to support event handling and implements core IChannel interface
 * Should be extended by specific channel implementations (created by clients or hosts)
 */
export abstract class ChannelBase extends EventEmitter<ChannelEvents> implements IChannel {
  readonly id: string;
  protected _status: ChannelStatus = ChannelStatus.DISCONNECTED;

  /**
   * Initializes a new ChannelBase instance
   * Generates a unique channel ID using timestamp and random string
   */
  constructor() {
    super();
    this.id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Retrieves the current connection status of the channel
   * @returns The current ChannelStatus
   */
  getStatus(): ChannelStatus {
    return this._status;
  }

  /**
   * Abstract method to disconnect the channel
   * Must be implemented by subclasses to handle specific disconnection logic
   * @param reason - Optional reason for disconnection
   */
  abstract disconnect(reason?: string): void;

  /**
   * Abstract method to send a message through the channel
   * Must be implemented by subclasses to handle specific message transmission
   * @param msg - The Message object to send
   */
  abstract send(msg: Message): void;
}

/**
 * Base class for communication channel clients
 * Extends EventEmitter to handle client-specific connection events
 */
export abstract class ChannelClient extends EventEmitter<ChannelClientEvents> {
  readonly id: string;

  /**
   * Initializes a new ChannelClient instance
   * Generates a unique client ID using timestamp and random string
   */
  constructor() {
    super();
    this.id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Abstract method to initiate a connection
   * Implementations should trigger 'connected' event on successful connection
   */
  abstract connect(): void;

  /**
   * Abstract method to terminate the connection
   * Implementations should trigger 'disconnected' event on successful termination
   * Should call channel.disconnect() if a channel was created
   * @param reason - Optional reason for disconnection
   */
  abstract disconnect(reason?: string): void;
}

/**
 * Base class for communication channel hosts
 * Extends EventEmitter to handle host-specific connection events
 * Manages incoming connections from clients
 */
export abstract class ChannelHost extends EventEmitter<ChannelClientEvents> {
  readonly id: string;

  /**
   * Initializes a new ChannelHost instance
   * Generates a unique host ID using timestamp and random string
   */
  constructor() {
    super();
    this.id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Abstract method to start listening for incoming connections
   * Implementations should begin accepting client connections when called
   */
  abstract start(): void;

  /**
   * Abstract method to stop listening for connections
   * Implementations should terminate existing connections and stop accepting new ones
   */
  abstract stop(): void;
}