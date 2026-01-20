/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ElementHandler.ts
 * @description 
 * Support the automation actions on a specific Frame
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

import { MsgUtils, RtidUtils, Utils, Rtid, RectInfo } from "@mimic-sdk/core";
import { FrameHandler } from "./FrameHandler";
import * as EventSimulator from "../EventSimulator";
import { NodeHandler } from "./NodeHandler";
import { ContentUtils } from "../ContentUtils";

export class ElementHandler extends NodeHandler {
  protected readonly _elem: Element;

  constructor(frame: FrameHandler, elem: Element, rtid: Rtid) {
    super(frame, elem, rtid);
    this._elem = elem;
  }

  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  tagName(): string {
    return this._elem.tagName;
  }
  id(): string {
    return this._elem.id;
  }
  innerHTML(): string {
    return this._elem.innerHTML;
  }
  outerHTML(): string {
    return this._elem.outerHTML;
  }
  innerText(): string {
    return (this._elem as HTMLElement).innerText;
  }
  outerText(): string {
    return (this._elem as HTMLElement).outerText;
  }
  title(): string {
    return (this._elem as HTMLElement).title;
  }
  accessKey(): string {
    return (this._elem as HTMLElement).accessKey;
  }
  hidden(): boolean {
    return (this._elem as HTMLElement).hidden;
  }

  name(): string {
    return (this._elem as HTMLInputElement).name;
  }
  value(): string {
    return (this._elem as HTMLInputElement | HTMLTextAreaElement).value;
  }
  type(): string {
    return (this._elem as HTMLInputElement).type;
  }
  alt(): string {
    return (this._elem as HTMLInputElement).alt;
  }
  accept(): string {
    return (this._elem as HTMLInputElement).accept;
  }
  placeholder(): string {
    return (this._elem as HTMLInputElement).placeholder;
  }
  src(): string {
    return (this._elem as HTMLInputElement).src;
  }
  disabled(): boolean {
    return (this._elem as HTMLInputElement).disabled;
  }
  readOnly(): boolean {
    return (this._elem as HTMLInputElement).readOnly;
  }
  required(): boolean {
    return (this._elem as HTMLInputElement).required;
  }
  checked(): boolean {
    return (this._elem as HTMLInputElement).checked;
  }

  label(): string {
    return (this._elem as HTMLOptionElement).label;
  }
  selected(): boolean {
    return (this._elem as HTMLOptionElement).selected;
  }

  multiple(): boolean {
    return (this._elem as HTMLSelectElement).multiple;
  }
  options(): Rtid[] {
    const results: Rtid[] = [];
    const options = (this._elem as HTMLSelectElement).options || [];
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option instanceof Element) {
        const ao = ContentUtils.repo.getAOByElement(option);
        if (ao) {
          results.push(ao.rtid);
        }
      }
    }
    return results;
  }
  selectedIndex(): number {
    return (this._elem as HTMLSelectElement).selectedIndex;
  }
  selectedOptions(): Rtid[] {
    const results: Rtid[] = [];
    const options = (this._elem as HTMLSelectElement).selectedOptions || [];
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option instanceof Element) {
        const ao = ContentUtils.repo.getAOByElement(option);
        if (ao) {
          results.push(ao.rtid);
        }
      }
    }
    return results;
  }

  visible(): boolean {
    if (Utils.isFunction(this._elem.checkVisibility)) {
      return !!this._elem.checkVisibility();
    }
    else {
      return ContentUtils.isVisibleBasedOnCSS(this._elem);
    }
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  /** ==================================================================================================================== */
  /** ====================================================== native ====================================================== */
  /** ==================================================================================================================== */
  getAttribute(name: string): string | null {
    const value = this._elem.getAttribute(name);
    return value;
  }
  getAttributes(): Record<string, unknown> {
    const attrs: Record<string, unknown> = {};
    const attrNames = this._elem.getAttributeNames();
    for (const attrName of attrNames) {
      const attrValue = this._elem.getAttribute(attrName);
      attrs[attrName] = attrValue;
    }
    return attrs;
  }
  setAttribute(name: string, value: string): void {
    this._elem.setAttribute(name, value);
  }
  hasAttribute(name: string): boolean {
    return this._elem.hasAttribute(name);
  }
  toggleAttribute(name: string, force?: boolean): boolean {
    return this._elem.toggleAttribute(name, force);
  }
  querySelectorAll(selector: string): Rtid[] {
    const results: Rtid[] = [];
    const elems = this._elem.querySelectorAll(selector);
    elems.forEach((elem) => {
      const ao = ContentUtils.repo.getAOByElement(elem);
      if (ao) {
        results.push(ao.rtid);
      }
    });
    return results;
  }
  getBoundingClientRect(): RectInfo {
    const rect = this._elem.getBoundingClientRect();
    return Utils.fixRectangle(rect);
  }
  checkValidity(): boolean {
    return !!(this._elem as HTMLSelectElement).checkValidity();
  }
  checkVisibility(options?: object): boolean {
    return !!this._elem.checkVisibility(options);
  }

  focus(): void {
    if (this._elem.isConnected === false) {
      throw new Error("Element is not connected to the document.");
    }
    EventSimulator.simulateFocus(this._elem);
  }
  blur(): void {
    if (this._elem.isConnected === false) {
      throw new Error("Element is not connected to the document.");
    }
    EventSimulator.simulateBlur(this._elem);
  }
  scrollIntoViewIfNeeded(): void {
    if ('scrollIntoViewIfNeeded' in this._elem) {
      (this._elem as any).scrollIntoViewIfNeeded();
    }
    else {
      this._elem.scrollIntoView();
    }
  }
  async check(): Promise<void> {
    if (this.checked()) {
      return;
    }
    await this.click();
  }
  async uncheck(): Promise<void> {
    if (!this.checked()) {
      return;
    }
    await this.click();
  }
  selectOption(values: (string | number | Rtid)[]): void {
    const select = this._elem as HTMLSelectElement;
    if (Utils.isEmpty(select.options)) {
      return;
    }
    if (!Array.isArray(values)) {
      return;
    }
    if (values.length === 1 && typeof values[0] === 'number') {
      let selectedIndex = values[0];
      select.selectedIndex = selectedIndex;
      select.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    const selectedOptions: HTMLOptionElement[] = [];
    const options = [];
    for (let i = 0; i < select.options.length; i++) {
      options.push(select.options[i]);
    }
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      let matchedOptions: HTMLOptionElement[] = [];
      if (typeof value === 'number') {
        let selectedIndex = value;
        matchedOptions = options.filter(o => o.index === selectedIndex).filter(o => !selectedOptions.includes(o));
      }
      else if (typeof value === 'string') {
        matchedOptions = options.filter(o => o.value === value || o.label === value).filter(o => !selectedOptions.includes(o));
      }
      else if (RtidUtils.isRtid(value)) {
        const elem = ContentUtils.repo.getElementByObjId(value.object);
        if (elem) {
          matchedOptions = options.filter(o => o === elem).filter(o => !selectedOptions.includes(o));
        }
      }
      if (matchedOptions && matchedOptions.length > 0) {
        selectedOptions.push(...matchedOptions);
      }
    }
    if (selectedOptions.length > 0) {
      if (select.multiple) {
        selectedOptions.forEach(option => option.selected = true);
      }
      else {
        selectedOptions[0].selected = true;
      }
      select.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  async setFileInputFiles(files: string[]): Promise<void> {
    const isDebuggerAttached = await this._invokeTabMethod('isDebuggerAttached', []);
    if (!isDebuggerAttached) {
      throw new Error('The debugger is not attached for setFileInputFiles');
    }
    const isReady = await ContentUtils.frame.installFrameInMAIN();
    if (!isReady) {
      throw new Error('The frame is not ready for setFileInputFiles');
    }
    ContentUtils.frame.main.setElement(this.elem);
    await this._invokeTabMethod('setFileInputFiles', [files]);
    ContentUtils.frame.main.setElement(null);
  }

  /** ==================================================================================================================== **/
  /** =================================================== Query methods ================================================== **/
  /** ==================================================================================================================== **/

  /**
   * query property value 
   * @param propName property name
   * @returns property value
   */
  protected override async queryProperty(propName: string): Promise<unknown> {
    if (propName === 'rtid') {
      return this.rtid;
    }
    else if (propName === 'parent_rtid') {
      let parentRtid = Utils.deepClone(this.rtid);
      parentRtid.object = -1;
      return parentRtid;
    }
    else {
      const attrNames = this._elem.getAttributeNames();
      if (propName in attrNames) {
        const propValue = this._elem.getAttribute(propName);
        return propValue;
      }
      else if (propName in this._elem) {
        const propValue = (this._elem as any)[propName];
        if (typeof propValue === 'function') {
          return propValue();
        }
        return propValue;
      }
    }
    throw new Error(`Unknown property name - ${propName}`);
  }

  protected async _invokeTabMethod(funcName: string, args?: any[]): Promise<unknown> {
    const rtid = RtidUtils.getTabRtid(this.rtid.tab, -1);
    const reqMsgData = MsgUtils.createMessageData('command', rtid, {
      name: 'invoke',
      params: {
        name: funcName,
        args: args
      }
    });
    const resMsgData = await ContentUtils.sendRequest(reqMsgData);
    if (resMsgData.status === 'OK') {
      return resMsgData.result;
    }
    else {
      throw new Error(resMsgData.error || '_invokeTabMethod failed');
    }
  }
}