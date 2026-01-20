/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ContentObject.ts
 * @description 
 * Class for ContentObject which exists in content frames
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

import * as api from "@mimic-sdk/core";
import { Rtid, RtidUtils, Utils, SettingUtils } from "@mimic-sdk/core";
import { AutomationObject } from "../aos/AutomationObject";

export class Node extends AutomationObject implements api.MouseActions, api.KeyboardActions, api.TouchActions {
  protected readonly _frame: api.Frame;

  constructor(rtid: Rtid) {
    super(rtid);
    const frameRtid = RtidUtils.getFrameRtid(rtid.frame, rtid.tab, -1, rtid.browser);
    this._frame = this.repo.getFrame(frameRtid);
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  rtid(): Rtid {
    return this._rtid;
  }

  async ownerFrame(): Promise<api.Frame> {
    return this._frame;
  }

  async nodeName(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'nodeName', []);
    return result as string;
  }
  async nodeType(): Promise<number> {
    const result = await this.invokeFunction(this._rtid, 'nodeType', []);
    return result as number;
  }
  async nodeValue(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'nodeValue', []);
    return result as string;
  }
  async isConnected(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'isConnected', []);
    return result as boolean;
  }
  async textContent(): Promise<string> {
    const result = await this.invokeFunction(this._rtid, 'textContent', []);
    return result as string;
  }

  async boundingBox(): Promise<api.RectInfo | null> {
    const isConnected = await this.isConnected();
    if (!isConnected) {
      return null;
    }
    const rect = await this.getBoundingClientRect();
    const frame = await this.ownerFrame();
    let frameElem = await frame.ownerElement();
    while (frameElem) {
      const frameRect = await (frameElem as unknown as Node).getContentClientRect();
      rect.top += frameRect.top;
      rect.left += frameRect.left;
      rect.bottom += frameRect.top;
      rect.right += frameRect.left;
      rect.x = rect.left
      rect.y = rect.top;
      // bubble up
      const parentFrame = await frameElem.ownerFrame();
      frameElem = await parentFrame.ownerElement();
    }
    return rect;
  }

  async highlight(): Promise<void> {
    await this.invokeFunction(this._rtid, 'highlight', []);
  }

  async getProperty(name: string): Promise<unknown> {
    const result = await this.invokeFunction(this._rtid, 'getProperty', [name]);
    return result;
  }

  async setProperty(name: string, value: unknown): Promise<void> {
    await this.invokeFunction(this._rtid, 'setProperty', [name, value]);
  }

  async getBoundingClientRect(): Promise<api.RectInfo> {
    const result = await this.invokeFunction(this._rtid, 'getBoundingClientRect', []);
    return result as api.RectInfo;
  }

  async getContentClientRect(): Promise<api.RectInfo> {
    const result = await this.invokeFunction(this._rtid, 'getContentClientRect', []);
    return result as api.RectInfo;
  }

  async dispatchEvent(type: string, options?: object): Promise<void> {
    await this.invokeFunction(this._rtid, 'dispatchEvent', [type, options]);
  }

  async sendCDPCommand(method: string, commandParams?: { [key: string]: unknown }): Promise<void> {
    const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
    await this.invokeFunction(tabRtid, 'sendCDPCommand', [method, commandParams]);
  }

  async checkStates(states?: ('visible' | 'hidden' | 'enabled' | 'disabled' | 'editable')[], timeout: number = 5000): Promise<boolean> {
    states = states ?? ['visible', 'enabled'];
    const check = async (): Promise<boolean> => {
      const result = await this.invokeFunction(this._rtid, 'checkStates', [states]) as boolean;
      return result;
    };
    const result = await Utils.waitChecked(check, timeout);
    return result;
  }

  /** ==================================================================================================================== */
  /** ================================================== mouse actions =================================================== */
  /** ==================================================================================================================== */
  async hover(options?: { position?: api.Point } & api.ActionOptions): Promise<void> {
    const mode = options?.mode ?? await this.getDefaultInputMode();
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck && mode === 'cdp') {
      await this.checkStates(['visible']);
    }

    if (mode === 'cdp') {
      const { x, y } = await this.getBoundingPoint(this, options?.position);
      const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
      await this.invokeFunction(tabRtid, 'mouseMove', [x, y]);
    }
    else {
      await this.invokeFunction(this._rtid, 'hover', [options]);
    }
  }
  async click(options?: api.ClickOptions & api.ActionOptions): Promise<void> {
    let mode = options?.mode ?? await this.getDefaultInputMode('click');
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck) {
      await this.checkStates(mode === 'cdp' ? ['visible', 'enabled'] : ['enabled']);
    }
    if (Utils.isNullOrUndefined(options?.mode) && mode === 'cdp') {
      const rect = await this.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        mode = 'event';
      }
    }
    if (mode === 'cdp') {
      const { x, y } = await this.getBoundingPoint(this, options?.position);
      const clickOption: api.ClickOptions = Utils.deepClone(options ?? {});
      clickOption.position = { x: x, y: y };
      const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
      await this.invokeFunction(tabRtid, 'mouseClick', [clickOption]);
    }
    else {
      await this.invokeFunction(this._rtid, 'click', [options]);
    }
  }
  async dblclick(options?: Omit<api.ClickOptions, 'clickCount'> & api.ActionOptions): Promise<void> {
    let mode = options?.mode ?? await this.getDefaultInputMode('dblclick');
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck) {
      await this.checkStates(mode === 'cdp' ? ['visible', 'enabled'] : ['enabled']);
    }
    if (Utils.isNullOrUndefined(options?.mode) && mode === 'cdp') {
      const rect = await this.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        mode = 'event';
      }
    }
    if (mode === 'cdp') {
      const { x, y } = await this.getBoundingPoint(this, options?.position);
      const clickOption: api.ClickOptions = Object.assign({}, options, { clickCount: 2 });
      clickOption.position = { x: x, y: y };
      const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
      await this.invokeFunction(tabRtid, 'mouseClick', [clickOption]);
    }
    else {
      const clickOption: api.ClickOptions = Object.assign({}, options, { clickCount: 2 });
      await this.invokeFunction(this._rtid, 'click', [clickOption]);
    }
  }
  async wheel(options?: { deltaX?: number, deltaY?: number } & api.ActionOptions): Promise<void> {
    const mode = options?.mode ?? await this.getDefaultInputMode();
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck && mode === 'cdp') {
      await this.checkStates(['visible']);
    }

    if (mode === 'cdp') {
      await this.hover(options);
      const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
      await this.invokeFunction(tabRtid, 'mouseWheel', [options?.deltaX ?? 0, options?.deltaY ?? 100]);
    }
    else {
      await this.invokeFunction(this._rtid, 'wheel', [options]);
    }
  }
  async dragTo(target: api.Element | api.Text, options?: { sourcePosition?: api.Point, targetPosition?: api.Point, steps?: number } & api.ActionOptions): Promise<void> {
    const mode = options?.mode ?? await this.getDefaultInputMode();
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck && mode === 'cdp') {
      await this.checkStates(['visible']);
    }

    if (mode === 'cdp') {
      const startPoint = await this.getBoundingPoint(this, options?.sourcePosition);
      const targetObj = target as unknown as Node;
      const targetPoint = await this.getBoundingPoint(targetObj, options?.targetPosition);
      const steps = options?.steps ?? 10;
      // if (Utils.isNullOrUndefined(options?.steps)) {
      //   const dx = targetPoint.x - startPoint.x;
      //   const dy = targetPoint.y - startPoint.y;
      //   const distance = Math.sqrt(dx * dx + dy * dy);
      //   steps = distance / 100 > 5 ? Math.ceil(distance / 100) : 5;
      // }
      const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
      await this.invokeFunction(tabRtid, 'mouseDragAndDrop', [startPoint, targetPoint, steps]);
    }
    else {
      const rtid = ('rtid' in target && Utils.isFunction(target.rtid)) ? target.rtid() as unknown : undefined;
      if (Utils.isNullOrUndefined(rtid) || !RtidUtils.isRtid(rtid)) {
        throw new Error('Invalid target for dragTo');
      }
      await this.invokeFunction(this._rtid, 'dragTo', [rtid, options]);
    }
  }
  /** ==================================================================================================================== */
  /** ================================================== touch actions =================================================== */
  /** ==================================================================================================================== */
  async tap(options?: { position?: api.Point } & api.ActionOptions): Promise<void> {
    const mode = options?.mode ?? await this.getDefaultInputMode();
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck) {
      await this.checkStates(mode === 'cdp' ? ['visible', 'enabled'] : ['enabled']);
    }

    if (mode === 'cdp') {
      const { x, y } = await this.getBoundingPoint(this, options?.position);
      const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
      await this.invokeFunction(tabRtid, 'touchscreenTap', [x, y, undefined]);
    }
    else {
      await this.invokeFunction(this._rtid, 'tap', [options]);
    }
  }
  /** ==================================================================================================================== */
  /** ================================================ keyboard actions ================================================== */
  /** ==================================================================================================================== */
  async fill(text: string, options?: api.TextInputOptions & api.ActionOptions): Promise<void> {
    let timeout = 0;
    const { delayBetweenDownUp = 0, delayBetweenChar = 0 } = options || {};
    if (delayBetweenDownUp > 0) {
      timeout += text.length * delayBetweenDownUp;
    }
    if (delayBetweenChar > 0) {
      timeout += text.length * delayBetweenChar;
    }

    const mode = options?.mode ?? await this.getDefaultInputMode();
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck) {
      await this.checkStates(mode === 'cdp' ? ['visible', 'enabled', 'editable'] : ['enabled', 'editable']);
    }

    if (mode === 'cdp') {
      await this.hover(options);
      await this.clear(options);
      const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
      await this.invokeFunction(tabRtid, 'keyboardType', [text, options], undefined, timeout > 0 ? timeout + 5000 : undefined);
    }
    else {
      await this.invokeFunction(this._rtid, 'fill', [text, options], undefined, timeout > 0 ? timeout + 5000 : undefined);
    }
  }
  async clear(options?: api.ActionOptions): Promise<void> {
    const mode = options?.mode ?? await this.getDefaultInputMode();
    const force = options?.force ?? false;
    if (!force && SettingUtils.getReplaySettings().autoActionCheck) {
      await this.checkStates(mode === 'cdp' ? ['visible', 'enabled', 'editable'] : ['enabled', 'editable']);
    }

    if (mode === 'cdp') {
      const { x, y } = await this.getBoundingPoint(this);
      const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
      await this.invokeFunction(tabRtid, 'keyboardClearText', [x, y]);
      // cdp ControlOrMeta + Backspace does not work, use selectAll command
      // if (BrowserUtils.isMacOS()) {
      //   await this.invokeFunction(this._rtid, 'fill', ['']);
      // }
    }
    else {
      await this.invokeFunction(this._rtid, 'fill', ['']);
    }
  }
  async press(keys: string | string[], options?: { delayBetweenDownUp?: number } & api.ActionOptions): Promise<void> {
    const mode = options?.mode ?? await this.getDefaultInputMode('press');
    if (mode === 'cdp') {
      const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
      await this.invokeFunction(tabRtid, 'keyboardPress', [keys, options]);
    }
    else {
      await this.invokeFunction(this._rtid, 'press', [keys, options]);
    }
  }
  /** ==================================================================================================================== */
  /** =================================================== help methods =================================================== */
  /** ==================================================================================================================== */
  private async getBoundingPoint(obj: Node, offset?: api.Point): Promise<api.Point> {
    const isConnected = await obj.isConnected();
    if (!isConnected) {
      throw new Error('Element is not connected to the DOM');
    }
    if ('scrollIntoViewIfNeeded' in obj && Utils.isFunction(obj.scrollIntoViewIfNeeded)) {
      await obj.scrollIntoViewIfNeeded();
    }
    const boundingBox = await obj.boundingBox();
    if (!boundingBox) {
      throw new Error(obj instanceof Element ? 'Element is not visible' : 'Text is not visible');
    }
    const offsetX = Utils.isNullOrUndefined(offset?.x) ? boundingBox.width / 2 : offset.x;
    const offsetY = Utils.isNullOrUndefined(offset?.y) ? boundingBox.height / 2 : offset.y;
    const x = boundingBox.x + offsetX;
    const y = boundingBox.y + offsetY;
    return { x: Math.round(x), y: Math.round(y) };
  }
  private async isDebuggerAttached(): Promise<boolean> {
    const tabRtid = RtidUtils.getTabRtid(this._rtid.tab);
    const attached = await this.invokeFunction(tabRtid, 'isDebuggerAttached', []) as boolean;
    return attached;
  }
  protected async getDefaultInputMode(methodName?: string): Promise<'event' | 'cdp'> {
    let defaultInputMode = SettingUtils.getReplaySettings().inputMode ?? 'auto';
    if (defaultInputMode === 'auto') {
      defaultInputMode = 'event';
      if (methodName === 'press') {
        const attached = await this.isDebuggerAttached();
        defaultInputMode = attached ? 'cdp' : 'event';
      }
      else if (methodName === 'click' || methodName === 'dblclick') {
        // use cdp click when href is a javascript: URL 
        const requireCDPClick = await this.requireCDPClick();
        if (requireCDPClick) {
          const attached = await this.isDebuggerAttached();
          defaultInputMode = attached ? 'cdp' : 'event';
        }
      }
    }
    return defaultInputMode;
  }
  protected async requireCDPClick(): Promise<boolean> {
    const result = await this.invokeFunction(this._rtid, 'requireCDPClick', []);
    return result as boolean;
  }
}