/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file FrameInMAIN.ts
 * @description 
 * The Frame in MAIN Wrold
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

export class FrameInMAIN {

  private readonly _callbacks: Record<string, (result: any) => void> = {};
  private readonly _source: 'content' | 'MAIN';
  constructor() {
    if (typeof chrome !== 'undefined' && typeof chrome.runtime?.id === 'string') {
      this._source = 'content';
    }
    else {
      this._source = 'MAIN';
    }
  }

  init() {
    if (this._source === 'content') {
      window.addEventListener("_MAIN_To_Content_EVENT_", this.onEvent.bind(this), true);
    }
    else {
      window.addEventListener("_Content_To_MAIN_EVENT_", this.onEvent.bind(this), true);
    }
  }

  isReady(): boolean {
    const attrName = 'gogogo';
    this.updateState(false)
    this.send('updateState', [true]);
    var attrValue = window.document.documentElement.getAttribute(attrName);
    window.document.documentElement.removeAttribute(attrName);
    if (!attrValue) return false;
    try {
      const stateObj = JSON.parse(attrValue);
      if ('state' in stateObj) {
        return !!stateObj.state;
      }
      return false;
    }
    catch {
      return false;
    }
  }

  setRuntimeElement(elem: Element | null) {
    if (elem) {
      const gogogo_testid = this.generateUUID();
      elem.setAttribute('gogogo-testid', gogogo_testid);
      this.send('updateRuntimeElement', [gogogo_testid], undefined, undefined, elem ?? undefined);
    }
    else {
      this.send('updateRuntimeElement', []);
    }
  }

  send(funcName: string, params: unknown[], result?: unknown, callback?: string | ((result: any) => void), target?: EventTarget) {
    target = target ?? window;
    const msg = { source: this._source, funcName: funcName, params: params, callbackId: '', result: result };
    if (callback && typeof callback === 'function') {
      msg.callbackId = this.generateUUID();
      this._callbacks[msg.callbackId] = callback;
    }
    else if (callback && typeof callback === 'string') {
      msg.callbackId = callback;
    }
    if (this._source === 'content') {
      const event = new CustomEvent('_Content_To_MAIN_EVENT_', { detail: msg });
      target.dispatchEvent(event);

    }
    else {
      const event = new CustomEvent('_MAIN_To_Content_EVENT_', { detail: msg });
      target.dispatchEvent(event);
    }
  }

  async onEvent(event: any) {
    var msg = event.detail;
    if (typeof (msg) !== "object") {
      return;
    }
    if (this._source === 'MAIN' && msg.source !== "content") {
      return;
    }
    if (this._source === 'content' && msg.source !== "MAIN") {
      return;
    }

    const funcName = msg.funcName as string;
    const params = msg.params as any[] || [];
    const callbackId = msg.callbackId as string || undefined;
    const result = msg.result as any || undefined;
    // callback
    if (callbackId && callbackId in this._callbacks) {
      this._callbacks[callbackId](result);
      return;
    }
    // invoke function
    if (funcName && funcName in this && typeof (this as any)[funcName] === 'function') {
      // adjust the params for some functions
      if (funcName === 'updateRuntimeElement' && event.target && event.target.nodeType === Node.ELEMENT_NODE) {
        const elem = event.target as Element;
        const gogogo_testid = params && params.length >= 1 ? params[0] : undefined;
        if (gogogo_testid) {
          if (!elem.hasAttribute('gogogo-testid')) {
            console.warn('updateRuntimeElement: the gogogo-testid is missing', elem);
            return;
          }
          const testid = elem.getAttribute('gogogo-testid');
          elem.removeAttribute('gogogo-testid');
          if (testid !== gogogo_testid) {
            console.warn('updateRuntimeElement: the gogogo-testid is not matched', elem);
            return;
          }
        }
        params.splice(0);
        params.push(elem);
      }

      const func = (this as any)[funcName] as Function;
      const result = await func.apply(this, params);
      if (callbackId) {
        this.send(funcName, params, result, callbackId);
      }
      return;
    }
  }

  private generateUUID(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `uid-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }

  protected updateState(state: boolean = true) {
    window.document.documentElement.setAttribute('gogogo', JSON.stringify({ state: state }));
  }

  protected updateRuntimeElement(elem?: Element) {
    if (elem) {
      window.gogogo = window.gogogo ?? {};
      (window.gogogo as any).runtimeElement = elem;
    }
    else if (window.gogogo) {
      delete (window as any).gogogo;
    }
  }
}