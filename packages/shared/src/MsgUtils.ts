/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file MsgUtils.ts
 * @description 
 * Shared utility classes and functions
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

import * as Utils from './Utils';
import * as RtidUtils from './RtidUtils';
import { Action, ActionName, AODesc, Message, MessageData, MessageDataType, MessageType, Rtid } from "./types/protocol";

export function createMessageData(type: MessageDataType, dest: Rtid, action: Action, target?: AODesc): MessageData {
  const msgData: MessageData = { type, dest, action, target };
  return msgData;
}

export function createEvent(data: MessageData, correlationId?: string): Message {
  return {
    type: 'event',
    uid: Utils.generateUUID(),
    timestamp: Date.now(),
    data: Utils.deepClone(data),
    correlationId: correlationId,
    syncId: undefined,
  };
}

export function createRequest(data: MessageData, correlationId?: string): Message {
  return {
    type: 'request',
    uid: Utils.generateUUID(),
    timestamp: Date.now(),
    data: Utils.deepClone(data),
    correlationId: correlationId,
    syncId: Utils.generateUUID(),
  };
}

export function createResponse(data: MessageData, syncId: string, correlationId?: string): Message {
  return {
    type: 'response',
    uid: Utils.generateUUID(),
    timestamp: Date.now(),
    data: Utils.deepClone(data),
    correlationId: correlationId,
    syncId: syncId,
  };
}

export function cloneMessage(msg: Message): Message | undefined {
  if (msg.type === 'event') {
    return createEvent(msg.data, msg.correlationId);
  }
  if (msg.type === 'request') {
    return createRequest(msg.data, msg.correlationId);
  }
  if (msg.type === 'response' && msg.syncId) {
    return createResponse(msg.data, msg.syncId, msg.correlationId);
  }
  return undefined;
}

export function isMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || Utils.isNullOrUndefined(value)) {
    return false;
  }
  const msg = value as Message;

  const isMessageType = (value: unknown): value is MessageType => {
    return typeof value === 'string' && ['event', 'request', 'response'].includes(value);
  };

  if (!isMessageType(msg.type)) {
    return false;
  }
  if (typeof msg.uid !== 'string' || msg.uid.trim() === '') {
    return false;
  }
  if (typeof msg.timestamp !== 'number' || msg.timestamp < 0) {
    return false;
  }
  if (typeof msg.data !== 'object' || Utils.isNullOrUndefined(msg.data)) {
    return false;
  }

  const data = msg.data as MessageData;
  const isMessageDataType = (value: unknown): value is MessageDataType => {
    return typeof value === 'string' && ['query', 'record', 'command', 'config'].includes(value);
  }
  if (!isMessageDataType(data.type)) {
    return false;
  }
  if (!RtidUtils.isRtid(data.dest)) {
    return false;
  }
  const isActionName = (value: unknown): value is ActionName => {
    return typeof value === 'string' && ['set', 'get', 'query_objects', 'query_object', 'query_property', 'query_properties', 'invoke', 'record_step', 'inspect_object'].includes(value);
  }
  const isValidAction = (value: unknown): value is Action => {
    if (typeof value !== 'object' || Utils.isNullOrUndefined(value)) {
      return false;
    }
    const action = value as Action;
    if (!isActionName(action.name)) {
      return false;
    }
    return true;
  }
  if (!isValidAction(data.action)) {
    return false;
  }

  return true;
}

