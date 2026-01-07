/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file MsgDataHandler.ts
 * @description 
 * Defines the interface and base class for MessageData handler
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

import { AODesc, AutomationObject, InvokeAction, MessageData, queryActionName, recordActionName, RecordedStep, Rtid } from "../types/protocol";
import { EventEmitter, EventMap } from "../EventEmitter";
import { RtidUtils, Utils } from "../Common";

/**
 * Callback type for delivering handler results
 */
export type ResultCallback = (result: MessageData) => void;

/**
 * The base class for handling communication messages
 */
export interface IMsgDataHandler {
  readonly rtid: Rtid;

  /**
   * Handles a message and invokes a result callback when done.
   * @param msg - The incoming message data.
   * @param resultCallback - Callback to return results.
   */
  handle(data: MessageData, resultCallback?: ResultCallback): boolean;
}

/**
 * the base class for MessageData handler
 */
export abstract class MsgDataHandlerBase<T extends EventMap = any> extends EventEmitter<T> implements IMsgDataHandler {
  readonly rtid: Rtid;
  readonly config: Record<string, unknown>;

  constructor(rtid: Rtid) {
    super();
    this.rtid = rtid;
    this.config = {};
  }

  /**
   * handle the message data
   * @param data message data
   * @param resultCallback result callback func
   * @returns handled or not
   */
  handle(data: MessageData, resultCallback?: ResultCallback): boolean {
    if (!RtidUtils.isRtidEqual(data.dest, this.rtid)) {
      return false;
    }
    this.logger.debug('handle: ==> handle the msgData:\r\n', data);
    this._handle(data).then((res) => {
      if (res && resultCallback) {
        this.logger.debug('handle: <== resultCallback, result:\r\n', res);
        resultCallback(res);
      }
      else {
        this.logger.debug('handle: <== no resultCallback, result:\r\n', res);
      }
    }).catch((error) => {
      this.logger.error('handle: ==x error on the message data:', data, error);
      if (resultCallback) {
        let errorMessage = error instanceof Error ? error.stack || error.message : String(error);
        const runScriptErrorIndicator = 'at async eval (eval at runScript';
        if (errorMessage.includes('at async eval (eval at runScript')) {
          // simplify the error message from runScript
          errorMessage = errorMessage.split(runScriptErrorIndicator)[0].trim();
        }
        errorMessage = Utils.replaceAll(errorMessage, 'chrome-extension://kpohfimcpcmbcihhpgnjcomihmcnfpna/ui/sidebar/sandbox.js', 'sandbox.js');
        errorMessage = Utils.replaceAll(errorMessage, 'extension://ilcdijkgbkkllhojpgbiajmnbdiadppj/ui/sidebar/sandbox.js', 'sandbox.js');
        const resData: MessageData = {
          ...Utils.deepClone(data),
          status: 'ERROR',
          error: errorMessage
        };
        this.logger.debug('handle: <== resultCallback ERROR result:\r\n', data);
        resultCallback(resData);
      }
    });
    return true;
  }


  async getAO(): Promise<AutomationObject> {
    return {
      type: 'agent',
      name: 'agent',
      rtid: this.rtid,
      runtimeInfo: {}
    };
  }

  /** ==================================================================================================================== **/
  /** ================================================== handle methods ================================================== **/
  /** ========================================== config, query, command, record ========================================== **/
  /** ==================================================================================================================== **/

  /**
   * internal message data handle function
   * @param data MessageData to be handled
   */
  private async _handle(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;
    if (Utils.isNullOrUndefined(type) || Utils.isNullOrUndefined(action)) {
      throw new Error('Invalid type or action');
    }

    if (type === 'config') {
      const result = await this._handleConfigActions(data);
      return result;
    }
    else if (type === 'query') {
      const result = await this._handleQueryActions(data);
      return result;
    }
    else if (type === 'command') {
      if (action.name === 'invoke') {
        const invokeAction = action as InvokeAction;
        const { name, args } = invokeAction.params;
        const result = await this.invokeFunction(name, args);
        const resData: MessageData = {
          ...Utils.deepClone(data),
          status: 'OK'
        };
        if (result !== undefined) {
          resData.result = result;
        }
        const ao = await this.getAO();
        resData.objects = [ao];
        return resData;
      }
      // if not invoke, handle as command action
      const result = await this._handleCommandActions(data);
      return result;
    }
    else if (type === 'record') {
      const result = await this._handleRecordActions(data);
      return result;
    }

    throw new Error(`Unsupported type - ${type}`);
  }

  /** handle the config action */
  protected async _handleConfigActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;

    if (type != 'config') {
      throw new Error(`Invalid type - ${type}`);
    }

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    if (action.name === 'set' && typeof action.params?.name === 'string') {
      const name = action.params.name as string
      const value = action.params?.value;
      this.config[name] = value;
      resData.status = 'OK';
    }
    else if (action.name === 'get' && typeof action.params?.name === 'string') {
      const name = action.params.name as string
      const value = this.config[name];
      const result: Record<string, unknown> = {};
      result[name] = value;
      resData.result = result;
      resData.status = 'OK';
    }

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`Unsupported action name - ${action.name}`);
    }

    return resData;
  }

  /** handle the query action */
  protected async _handleQueryActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action, target } = data;

    if (type != 'query') {
      throw new Error(`Invalid type - ${type}`);
    }

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    const actionName = action.name as queryActionName;

    if (actionName === 'query_object' && target) {
      const objects = await this.queryObjects(target);
      resData.objects = objects;
      resData.result = { rtids: objects.map(t => t.rtid) };
      if (objects.length === 1) {
        resData.status = 'OK';
      }
      else if (objects.length > 1) {
        resData.status = 'ERROR';
        resData.error = 'Multiple objects';
      }
      else {
        resData.status = 'ERROR';
        resData.error = 'No object';
      }
    }
    else if (actionName === 'query_objects' && target) {
      const objects = await this.queryObjects(target);
      resData.objects = objects;
      resData.result = { rtids: objects.map(t => t.rtid) };
      resData.status = 'OK';
    }
    else if (actionName === 'query_property' && typeof action.params?.name === 'string') {
      const propName = action.params?.name as string
      const propValue = await this.queryProperty(propName);
      const result: Record<string, unknown> = {};
      result[propName] = propValue;
      resData.result = result;
      resData.status = 'OK';
    }
    else if (actionName === 'query_properties' && Array.isArray(action.params?.names)) {
      const propNames = action.params?.names as string[];
      const values = await this.queryProperties(propNames);
      resData.result = values;
      resData.status = 'OK';
    }

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`Unsupported action name - ${action.name}`);
    }

    return resData;
  }

  /** handle the command action */
  protected async _handleCommandActions(_data: MessageData): Promise<MessageData | undefined> {
    throw new Error("Method not implemented.");
  }

  /** handle the record action */
  protected async _handleRecordActions(data: MessageData): Promise<MessageData | undefined> {
    const { type, action } = data;

    if (type != 'record') {
      throw new Error(`Invalid type - ${type}`);
    }

    const resData: MessageData = {
      ...Utils.deepClone(data)
    };

    const actionName = action.name as recordActionName;

    if (actionName === 'record_step') {
      const step = action.params?.step as RecordedStep;
      if (!step) {
        throw new Error(`Invalid record step`);
      }
      await this.recordStep(step);
      resData.status = 'OK';
    }

    if (Utils.isNullOrUndefined(resData.status)) {
      throw new Error(`Unsupported action name - ${action.name}`);
    }

    return resData;
  }

  /**
   * query property value 
   * @param propName property name
   * @returns property value
   */
  protected abstract queryProperty(propName: string): Promise<unknown>;

  /**
   * query property values
   * @param props property array
   * @returns property values
   */
  protected async queryProperties(props: string[]): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const propName of props) {
      try {
        const propValue = await this.queryProperty(propName);
        result[propName] = propValue;
      } catch (error) {
        this.logger.warn('queryProperty error -', propName, error);
      }
    }
    return result;
  }

  /**
   * query automation objects
   * @param desc description for objects
   * @returns automation objects
   */
  protected abstract queryObjects(desc: AODesc): Promise<AutomationObject[]>;

  /**
   * invoke a function with name and arguments
   * @param funcName function name to invoke
   * @param args function arguments
   * @returns function call result
   */
  protected async invokeFunction(funcName: string, args?: unknown[]): Promise<unknown> {
    if (Utils.isEmpty(funcName)) {
      throw new Error(`No function name - '${funcName}'`);
    }
    if (!(funcName in this)) {
      throw new Error(`Unknown function name - '${funcName}'`);
    }
    const func = (this as any)[funcName];
    if (!Utils.isFunction(func)) {
      throw new Error(`Invalid function name - '${funcName}'`);
    }
    const result = await func.apply(this, args);
    return result;
  }

  /**
   * record the step
   * @param step the recorded step information from child
   */
  protected async recordStep(_step: RecordedStep): Promise<void> {
    throw new Error("Method not implemented.");
  }

}