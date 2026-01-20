/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file CDPDOM.ts
 * @description 
 * Provide wrapper class for DOM in Chrome DevTool Protocol APIs
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

import { Utils } from "@mimic-sdk/core";
import { ChromeDevToolsProtocol } from "./ChromeDevToolsProtocol";
import { DebuggerSession } from "./CDPTypes";

/**
 * Wrapper for CDP DOM operations.
 * Provides methods for highlighting DOM elements.
 */
export class CDPDOM {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create a DOM controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }

  async setFileInputFiles(files: string[]): Promise<void> {
    const result = await this._cdp.getRuntimeElement(this._tabId);
    if (!result) {
      throw new Error('Cannot find the runtime element');
    }
    const { objectId, session } = result as any;
    if (objectId && session) {
      const options = { files: files, objectId: objectId };
      await this._cdp.sendCommand(session, "DOM.setFileInputFiles", options);
    }
    else {
      throw new Error('Cannot get the runtime session and objectId');
    }
  }

  // async getNodeDetails(backendNodeId: number, session?: DebuggerSession): Promise<any> {
  //   const target = session ?? { tabId: this._tabId };
  //   // node => object
  //   const object = await this.resolveNode(undefined, backendNodeId, target);
  //   const { objectId } = object as { objectId: string };
  //   // Serialize DOMPath class to inject into the target frame's context
  //   const code_DOMNode = DOMNode.toString() + `\n\n`;
  //   const code_Step = Step.toString() + `\n\n`;
  //   const code_DOMPath = DOMPath.toString() + `\n\n`;
  //   const code_DOMPathUtils = DOMPathUtils.toString() + `\n\n`;
  //   // Function to execute in the target frame: Uses DOMPath to generate details
  //   const functionDeclaration = `function() {
  //     ${code_DOMNode}
  //     ${code_Step}
  //     ${code_DOMPath}
  //     ${code_DOMPathUtils}
  //     let node = this;
  //     const nodeDetails = DOMPathUtils.getDOMNodeDetails(node);
  //     return nodeDetails;
  //   }`;
  //   const result = await this._cdp.callFunctionOn(target, functionDeclaration, objectId);
  //   return result?.result?.value || null;
  // }

  async handleInspectNodeRequested(backendNodeId: number, session?: DebuggerSession): Promise<any> {
    const target = session ?? { tabId: this._tabId };
    // node => object
    const object = await this.resolveNode(undefined, backendNodeId, target);
    const { objectId } = object as { objectId: string };
    // Function to execute in the target frame: Uses DOMPath to generate details
    const functionDeclaration = `function() {
      const msg = { source: 'MAIN', funcName: 'inspectNodeRequested', params: [], callbackId: '' };
      const event = new CustomEvent('_MAIN_To_Content_EVENT_', { detail: msg, bubbles: true, cancelable: true, composed: true });
      this.dispatchEvent(event);
    }`;
    await this._cdp.callFunctionOn(target, functionDeclaration, objectId);
  }

  /**
   * getOuterHTML for a node
   * @param nodeId nodeId
   * @param backendNodeId backendNodeId
   * @param objectId objectId
   * @param session session for target
   * @returns 
   */
  async getOuterHTML(nodeId?: number, backendNodeId?: number, objectId?: string, session?: DebuggerSession): Promise<string> {
    const target = session ?? { tabId: this._tabId };
    const options = Object.assign(
      {},
      Utils.isNullOrUndefined(nodeId) ? {} : { nodeId: nodeId },
      Utils.isNullOrUndefined(backendNodeId) ? {} : { backendNodeId: backendNodeId },
      Utils.isNullOrUndefined(objectId) ? {} : { objectId: objectId }
    );
    const result = await this._cdp.sendCommand(target, "DOM.getOuterHTML", options);
    const { outerHTML } = result as { outerHTML: string };
    if (Utils.isNullOrUndefined(outerHTML) || typeof outerHTML !== 'string') {
      throw new Error(`Fail to execute DOM.getOuterHTML with options-${JSON.stringify(options)}`);
    }
    return outerHTML;
  }

  /**
   * describeNode for a node
   * @param nodeId nodeId
   * @param backendNodeId backendNodeId
   * @param objectId objectId
   * @param session session for target
   * @returns 
   */
  async describeNode(nodeId?: number, backendNodeId?: number, objectId?: string, session?: DebuggerSession): Promise<object> {
    const target = session ?? { tabId: this._tabId };
    const options = Object.assign(
      { depth: 0, pierce: false },
      Utils.isNullOrUndefined(nodeId) ? {} : { nodeId: nodeId },
      Utils.isNullOrUndefined(backendNodeId) ? {} : { backendNodeId: backendNodeId },
      Utils.isNullOrUndefined(objectId) ? {} : { objectId: objectId }
    );
    const result = await this._cdp.sendCommand(target, "DOM.describeNode", options);
    const { node } = result as { node: object };
    if (Utils.isNullOrUndefined(node) || typeof node !== 'object') {
      throw new Error(`Fail to execute DOM.describeNode with options-${JSON.stringify(options)}`);
    }
    return node;
  }

  /**
   * requestNode from objectId to nodeId
   * @param objectId objectId
   * @param session session for target
   * @returns 
   */
  async requestNode(objectId: string, session?: DebuggerSession): Promise<number> {
    const target = session ?? { tabId: this._tabId };
    const options = { objectId: objectId };
    const result = await this._cdp.sendCommand(target, "DOM.requestNode", options);
    const { nodeId } = result as { nodeId: number };
    if (Utils.isNullOrUndefined(nodeId) || typeof nodeId !== 'number') {
      throw new Error(`Fail to execute DOM.requestNode Node with objectId-${objectId}`);
    }
    return nodeId;
  }

  /**
   * resolveNode from nodeId/backendNodeId to Runtime.RemoteObject (has objectId)
   * @param nodeId nodeId
   * @param backendNodeId backendNodeId
   * @param session session for target
   * @returns 
   */
  async resolveNode(nodeId?: number, backendNodeId?: number, session?: DebuggerSession): Promise<object> {
    const target = session ?? { tabId: this._tabId };
    if (Utils.isNullOrUndefined(nodeId) && Utils.isNullOrUndefined(backendNodeId)) {
      throw new Error(`Fail to execute DOM.resolveNode with nodeId-${nodeId}, backendNodeId-${backendNodeId}`);
    }
    const options = Object.assign(
      {},
      Utils.isNullOrUndefined(nodeId) ? {} : { nodeId: nodeId },
      Utils.isNullOrUndefined(backendNodeId) ? {} : { backendNodeId: backendNodeId }
    );
    const result = await this._cdp.sendCommand(target, "DOM.resolveNode", options);
    const { object } = result as { object: object };
    if (Utils.isNullOrUndefined(object) || typeof object !== 'object') {
      throw new Error(`Fail to execute DOM.resolveNode with nodeId-${nodeId}, backendNodeId-${backendNodeId}`);
    }
    return object;
  }

  /**
   * Highlight a rectangle on the page.
   * @param rect - Rectangle coordinates and style
   */
  async highlightRect(
    rect: unknown,
  ): Promise<void> {
    const rectWithDefaults = {
      outlineColor: { r: 18, g: 110, b: 198, a: 0 },
      color: { r: 18, g: 110, b: 198, a: 0.4 },
      ...(rect as any)
    };
    await this._cdp.sendCommand(this._tabId, "DOM.highlightRect", rectWithDefaults);
  }

  /**
   * Hide any active DOM highlight.
   */
  async hideHighlight(): Promise<void> {
    await this._cdp.sendCommand(this._tabId, "DOM.hideHighlight", undefined);
  }
};