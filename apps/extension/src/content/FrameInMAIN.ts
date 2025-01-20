/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file FrameInMAIN.ts
 * @description 
 * The Frame in MAIN World
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

import { ClickOptions } from "@gogogo/shared";
import * as EventSimulator from "./EventSimulator";

export class FrameInMAIN {

  private readonly _callbacks: Record<string, (result: unknown) => void> = {};
  private readonly _source: 'content' | 'MAIN';
  private readonly _onEventHandler = this.onEvent.bind(this);
  constructor() {
    if (typeof chrome !== 'undefined' && typeof chrome.runtime?.id === 'string') {
      this._source = 'content';
    }
    else {
      this._source = 'MAIN';
    }
  }

  init(): void {
    window.removeEventListener("_MAIN_To_Content_EVENT_", this._onEventHandler as EventListener, true);
    window.removeEventListener("_Content_To_MAIN_EVENT_", this._onEventHandler as EventListener, true);
    if (this._source === 'content') {
      window.addEventListener("_MAIN_To_Content_EVENT_", this._onEventHandler as EventListener, true);
    }
    else {
      window.addEventListener("_Content_To_MAIN_EVENT_", this._onEventHandler as EventListener, true);
    }
  }

  isReady(): boolean {
    const attrName = 'gogogo';
    this.updateState(false)
    this.send('updateState', [true]);
    const attrValue = window.document.documentElement.getAttribute(attrName);
    window.document.documentElement.removeAttribute(attrName);
    if (!attrValue) return false;
    try {
      const stateObjUnknown: unknown = JSON.parse(attrValue);
      if (stateObjUnknown && typeof stateObjUnknown === 'object' && 'state' in stateObjUnknown) {
        const stateVal = (stateObjUnknown as { state?: unknown }).state;
        return !!stateVal;
      }
      return false;
    }
    catch {
      return false;
    }
  }

  setElement(elem: Element | null): void {
    if (elem) {
      const gogogo_testid = this.generateUUID();
      elem.setAttribute('gogogo-testid', gogogo_testid);
      this.send('updateRuntimeElement', [gogogo_testid], undefined, undefined, elem ?? undefined);
    }
    else {
      this.send('updateRuntimeElement', []);
    }
  }

  clickElement(elem: Element, options?: ClickOptions): void {
    if (!elem) return;
    const gogogo_testid = this.generateUUID();
    elem.setAttribute('gogogo-testid', gogogo_testid);
    this.send('clickRuntimeElement', [gogogo_testid, options], undefined, undefined, elem);
  }

  send(funcName: string, params: unknown[], result?: unknown, callback?: string | ((result: unknown) => void), target?: EventTarget): void {
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
      const event = new CustomEvent('_Content_To_MAIN_EVENT_', { detail: msg, bubbles: true, cancelable: true, composed: true });
      target.dispatchEvent(event);
    }
    else {
      const event = new CustomEvent('_MAIN_To_Content_EVENT_', { detail: msg, bubbles: true, cancelable: true, composed: true });
      target.dispatchEvent(event);
    }
  }

  private async onEvent(event: Event): Promise<void> {
    const msgUnknown: unknown = (event as CustomEvent).detail;
    if (!msgUnknown || typeof msgUnknown !== "object") {
      return;
    }
    const msg = msgUnknown as { source?: unknown; funcName?: unknown; params?: unknown; callbackId?: unknown; result?: unknown };
    if (this._source === 'MAIN' && msg.source !== "content") {
      return;
    }
    if (this._source === 'content' && msg.source !== "MAIN") {
      return;
    }

    const funcName = msg.funcName as string;
    const params = (msg.params as unknown[]) || [];
    const callbackId = (msg.callbackId as string) || undefined;
    const result = msg.result as unknown;
    // callback
    if (callbackId && callbackId in this._callbacks) {
      this._callbacks[callbackId](result);
      return;
    }
    // invoke function
    if (funcName && funcName in this && typeof (this as unknown as Record<string, unknown>)[funcName] === 'function') {
      // adjust the params for some functions
      if (['updateRuntimeElement', 'clickRuntimeElement'].includes(funcName)) {
        let target = event.target as Node | EventTarget | null;
        if (event.composedPath) {
          const path = event.composedPath();
          if (path && path.length > 0) {
            target = path[0];
          }
        }
        if (!target || (target as Node).nodeType !== Node.ELEMENT_NODE) {
          console.warn(`${funcName}: the target is invalid`, target);
          return;
        }

        const elem = target as Element;
        const gogogo_testid = params && params.length >= 1 ? params[0] : undefined;
        if (gogogo_testid) {
          if (!elem.hasAttribute('gogogo-testid')) {
            console.warn(`${funcName}: the gogogo-testid is missing`, elem);
            return;
          }
          const testid = elem.getAttribute('gogogo-testid');
          elem.removeAttribute('gogogo-testid');
          if (testid !== gogogo_testid) {
            console.warn(`${funcName}: the gogogo-testid is not matched`, elem);
            return;
          }
          params.splice(0, 1);
        }
        params.splice(0, 0, elem);
      }
      if (funcName === 'inspectNodeRequested') {
        let target = event.target;
        if (event.composedPath) {
          const path = event.composedPath();
          if (path && path.length > 0) {
            target = path[0];
          }
        }
        if (!target || (target as Node).nodeType !== Node.ELEMENT_NODE) {
          console.warn(`${funcName}: the target is invalid`, target);
          return;
        }
        params.splice(0);
        params.push(target);
      }

      const func = (this as unknown as Record<string, unknown>)[funcName] as (...args: unknown[]) => unknown | Promise<unknown>;
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

  protected updateState(state: boolean = true): void {
    window.document.documentElement.setAttribute('gogogo', JSON.stringify({ state: state }));
  }

  protected updateRuntimeElement(elem?: Element): void {
    if (elem) {
      window.gogogo = window.gogogo ?? {};
      (window.gogogo as { runtimeElement?: Element }).runtimeElement = elem;
    }
    else if (window.gogogo) {
      Reflect.deleteProperty(window, 'gogogo');
    }
  }

  protected async clickRuntimeElement(elem: Element, options?: ClickOptions): Promise<void> {
    if (elem && elem instanceof Element) {
      await EventSimulator.simulateClick(elem, options);
    }
  }

  protected async inspectNodeRequested(node: Node): Promise<void> {
    if (this._source === 'content' && typeof window.gogogo === 'object' && window.gogogo.frame && window.gogogo.frame.inspectNode) {
      await window.gogogo.frame.inspectNode(node);
    }
  }
}
