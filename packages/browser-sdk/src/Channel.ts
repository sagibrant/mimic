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

import { MsgUtils, Utils, Logger, AODesc, AutomationObject, InvokeAction, Rtid, Dispatcher } from "@mimic-sdk/core";
import { RuntimeUtils } from "./RuntimeUtils";
import { ObjectRepository } from './ObjectRepository'

export interface IMsgChannel {
  setDefaultTimeout(timeout: number): void;
  queryProperty(rtid: Rtid, propName: string): Promise<unknown>;
  queryObjects(rtid: Rtid, desc: AODesc): Promise<AutomationObject[]>;
  invokeFunction(rtid: Rtid, funcName: string, args: unknown[], target?: AODesc): Promise<unknown>;
}

export class ChannelBase implements IMsgChannel {
  protected readonly logger: Logger;

  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "ChannelBase" : this.constructor?.name;
    this.logger = new Logger(prefix);
  }

  get dispatcher(): Dispatcher {
    return RuntimeUtils.dispatcher;
  }

  get repo(): ObjectRepository {
    return RuntimeUtils.repo;
  }

  setDefaultTimeout(timeout: number): void {
    this.dispatcher.setDefaultTimeout(timeout);
  }

  async queryProperty(rtid: Rtid, propName: string, timeout?: number): Promise<unknown> {
    const reqMsgData = MsgUtils.createMessageData('query', rtid, { name: 'query_property', params: { name: propName } });
    const resMsgData = await this.dispatcher.sendRequest(reqMsgData, timeout);
    if (resMsgData.status === 'OK') {
      const propValue = Utils.getItem(propName, resMsgData.result as Record<string, unknown>);
      return propValue;
    }
    else {
      throw new Error(resMsgData.error || 'query property failed');
    }
  }

  async queryObjects(rtid: Rtid, desc: AODesc, timeout?: number): Promise<AutomationObject[]> {
    const reqMsgData = MsgUtils.createMessageData('query', rtid, { name: 'query_objects' }, desc);
    const resMsgData = await this.dispatcher.sendRequest(reqMsgData, timeout);
    if (resMsgData.status === 'OK') {
      return resMsgData.objects || [];
    }
    else {
      throw new Error(resMsgData.error || 'query objects failed');
    }
  }

  async invokeFunction(rtid: Rtid, funcName: string, args: unknown[], target?: AODesc, timeout?: number): Promise<unknown> {
    const reqMsgData = MsgUtils.createMessageData('command', rtid, {
      name: 'invoke',
      params: {
        name: funcName,
        args: args
      }
    } as InvokeAction, target);
    const resMsgData = await this.dispatcher.sendRequest(reqMsgData, timeout);
    if (resMsgData.status === 'OK') {
      return resMsgData.result;
    }
    else {
      throw new Error(resMsgData.error || 'invokeFunction failed');
    }
  }

}
