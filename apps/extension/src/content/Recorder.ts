/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Recorder.ts
 * @description 
 * Record the user actions in the web page and generate script code
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

import { MsgUtils, RtidUtils, Utils, Logger, DOMPathUtils, RecordedStep } from "@mimic-sdk/core";
import { ContentUtils } from "./ContentUtils";

export class Recorder {
  private readonly _logger: Logger;
  private readonly _recordingEvents: string[];
  private readonly _objMap: Map<EventTarget, RecordObject>;
  private _handleEventFunc?: (event: Event) => Promise<void>;

  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? 'Recorder' : this.constructor?.name;
    this._logger = new Logger(prefix);
    this._recordingEvents = ['focus', 'click', 'change', 'blur'];
    this._objMap = new Map();
  }

  isRecording(): boolean {
    return this._handleEventFunc !== undefined;
  }

  async startRecording(): Promise<void> {
    this._logger.debug('startRecording:: ===>');
    if (!this._handleEventFunc) {
      this._handleEventFunc = this.handleEvent.bind(this);
    }
    for (const event of this._recordingEvents) {
      window.addEventListener(event, this._handleEventFunc, true);
    }
    const shadowRoots = ContentUtils.traverseGetAllShadowRoot(document);
    for (const shadowRoot of shadowRoots) {
      for (const event of this._recordingEvents) {
        shadowRoot.addEventListener(event, this._handleEventFunc, true);
      }
    }
    this._logger.debug('startRecording:: <===');
  }

  async stopRecording(): Promise<void> {
    this._logger.debug('stopRecording:: ===>');
    if (this._handleEventFunc) {
      for (const event of this._recordingEvents) {
        window.removeEventListener(event, this._handleEventFunc, true);
      }
      const shadowRoots = ContentUtils.traverseGetAllShadowRoot(document);
      for (const shadowRoot of shadowRoots) {
        for (const event of this._recordingEvents) {
          shadowRoot.removeEventListener(event, this._handleEventFunc, true);
        }
      }
    }
    this._handleEventFunc = undefined;
    this._logger.debug('stopRecording:: <===');
  }

  async handleEvent(event: Event): Promise<void> {
    let target = event.target;
    if (event.composedPath) {
      const path = event.composedPath();
      if (path && path.length > 0) {
        target = path[0];
      }
    }
    if (!target) return;

    if (this._objMap.has(target)) {
      const obj = this._objMap.get(target);
      await obj?.receiveEvent(event);
    }
    else {
      const obj = new RecordObject(event);
      this._objMap.set(target, obj);
      await obj.receiveEvent(event);
    }
    if (event.type === 'blur' && this._objMap.has(target)) {
      this._objMap.delete(target);
    }
  }

}

/**
 * The 
 */
class RecordObject {
  private readonly _logger: Logger;
  private readonly _kInputTypesToClick: Set<string> = new Set(['button', 'image', 'reset', 'submit']);
  private readonly _kInputTypesToCheck: Set<string> = new Set(['checkbox', 'radio']);
  private readonly _kInputTypesToSetValue: Set<string> = new Set(['color', 'date', 'datetime-local', 'hidden', 'month', 'range', 'time', 'week', 'datetime']);
  private readonly _kInputTypesToTypeInto: Set<string> = new Set(['', 'email', 'number', 'password', 'search', 'tel', 'text', 'url']);
  private readonly _kInputTypesToSetFile: Set<string> = new Set(['file']);
  private readonly _events: Event[];
  private _cachedTextContent?: string;

  constructor(event: Event) {
    const prefix = Utils.isEmpty(this.constructor?.name) ? 'RecordObject' : this.constructor?.name;
    this._logger = new Logger(prefix);

    this._events = [];

    const elem = this.getInterestedElement(event);
    if (elem && elem instanceof HTMLElement && elem.contentEditable === 'true') {
      this._cachedTextContent = elem.textContent;
    }
  }

  async receiveEvent(event: Event) : Promise<void> {
    if (this._events.length > 0 && this._events[this._events.length - 1] === event) {
      return;
    }
    this._events.push(event);
    switch (event.type) {
      case 'focus': {
        break;
      }
      case 'click': {
        await this.recordClick(event as MouseEvent);
        break;
      }
      case 'change': {
        await this.recordChange(event);
        break;
      }
      case 'blur': {
        const elem = this.getInterestedElement(event);
        if (elem && elem instanceof HTMLElement && elem.contentEditable === 'true' && this._cachedTextContent !== elem.textContent) {
          await this.recordChange(event);
        }
        break;
      }
      default:
        this._logger.warn(`Unhandled event type: ${event.type}`);
        break;
    }
  }

  async recordClick(event: MouseEvent): Promise<void> {
    if (event.button === 2 && event.type === 'auxclick') {
      return;
    }
    const elem = this.getInterestedElement(event);
    if (!elem) return;

    if (elem.tagName === 'SELECT' || elem.tagName === 'OPTION') {
      return;
    }
    else if (elem.tagName === 'TEXTAREA') {
      return;
    }
    else if (elem instanceof HTMLElement && elem.contentEditable === 'true') {
      return;
    }
    else if (elem.tagName === 'INPUT') {
      const inputElement = elem as HTMLInputElement;
      if (!this._kInputTypesToClick.has(inputElement.type)) {
        return;
      }
    }

    const actionScript = `click()`;
    const ao = ContentUtils.repo.getAOByElement(elem as Element);
    const details = DOMPathUtils.getDOMNodeDetails(elem);
    const aoDesc = await ContentUtils.generateAODesc(elem, details);
    if (!aoDesc) return;
    const scripts = await ContentUtils.generateElementScript(aoDesc);
    const recordedStep: RecordedStep = {
      await: true,
      elementRtid: ao.rtid,
      element: details,
      elementScript: scripts,
      actionScript: actionScript
    };
    await this.sendRecordedStep(recordedStep);
  }

  async recordChange(event: Event): Promise<void> {
    const elem = this.getInterestedElement(event);
    if (!elem) return;

    let actionScript = '';
    if (elem.tagName === 'INPUT') {
      const element = elem as HTMLInputElement;
      if (this._kInputTypesToCheck.has(element.type)) {
        actionScript = element.checked ? `check()` : `uncheck()`;
      }
      else if (this._kInputTypesToTypeInto.has(element.type)) {
        actionScript = `fill('${element.value}')`;
      }
      else if (this._kInputTypesToSetValue.has(element.type)) {
        actionScript = `setProperty('value', '${element.value}')`;
      }
      else if (this._kInputTypesToSetFile.has(element.type)) {
        const files = [];
        if (element.files && element.files.length >= 0) {
          const fileList = Array.from(element.files);
          for (const file of fileList) {
            files.push(file.name);
          }
        }
        actionScript = `setFileInputFiles(${JSON.stringify(files)})`;
      }
      else {
        this._logger.warn(`Unsupported input type for change event: ${element.type}`);
        return; // unsupported input type for change event
      }
    }
    else if (elem.tagName === 'TEXTAREA') {
      const element = elem as HTMLTextAreaElement;
      actionScript = `fill('${element.value}')`;
    }
    else if (elem.tagName === 'SELECT') {
      const selectElement = elem as HTMLSelectElement;
      if (selectElement.selectedOptions && selectElement.selectedOptions.length > 0) {
        if (selectElement.multiple) {
          const selectedOptions = [];
          for (const selectOption of Array.from(selectElement.selectedOptions)) {
            if (selectOption.value) {
              selectedOptions.push(selectOption.value);
            }
            else if (selectOption.label) {
              selectedOptions.push(selectOption.label);
            }
            else {
              selectedOptions.push(selectOption.index);
            }
          }
          actionScript = `selectOption(${JSON.stringify(selectedOptions)})`;
        }
        else {
          actionScript = `selectOption('${selectElement.value}')`;
        }
      }
      else {
        actionScript = `selectOption(${selectElement.selectedIndex})`;
      }
    }
    else if (elem instanceof HTMLElement && elem.contentEditable === 'true') {
      actionScript = `fill('${elem.textContent || ''}')`;
      this._cachedTextContent = elem.textContent;
    }
    else {
      return; // unsupported element for change event
    }

    const ao = ContentUtils.repo.getAOByElement(elem as Element);
    const details = DOMPathUtils.getDOMNodeDetails(elem);
    const aoDesc = await ContentUtils.generateAODesc(elem, details);
    if (!aoDesc) return;
    const scripts = await ContentUtils.generateElementScript(aoDesc);
    const recordedStep: RecordedStep = {
      await: true,
      elementRtid: ao.rtid,
      element: details,
      elementScript: scripts,
      actionScript: actionScript
    };
    await this.sendRecordedStep(recordedStep);
  }

  private getInterestedElement(event: Event): Element | null {
    let node = event.target as Node;
    let interactiveElement = null;
    if (event.composedPath) {
      const path = event.composedPath();
      const elems = Array.from(path);
      elems.reverse();
      for (let i = 0; i < elems.length; i++) {
        const cur = elems[i] as Node;
        if (cur && cur.nodeType === Node.ELEMENT_NODE && !cur.nodeName.startsWith(':')) {
          node = cur;
          if (this.isInteractiveElement(cur as Element)) {
            interactiveElement = cur;
          }
        }
      }
    }
    else {
      let cur: Node | null = node;
      while (cur && (cur.nodeType !== Node.ELEMENT_NODE || cur.nodeName.startsWith(':'))) {
        cur = cur.parentNode;
      }
      if (!cur || cur.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }
      node = cur;
      while (cur) {
        if (cur.nodeType === Node.ELEMENT_NODE && !cur.nodeName.startsWith(':') && this.isInteractiveElement(cur as Element)) {
          interactiveElement = cur;
          break;
        }
        else if (cur.nodeType === Node.DOCUMENT_FRAGMENT_NODE || cur.nodeType === Node.DOCUMENT_NODE) {
          break;
        }
        else {
          cur = cur.parentNode;
        }
      }
    }
    if (node && interactiveElement) {
      return node as Element;
    }
    else {
      return null;
    }
  }

  private isInteractiveElement(elem: Element): boolean {
    if (elem.tagName === 'BODY' || elem.tagName === 'HTML') {
      return false;
    }

    const interactiveTags = new Set([
      'BUTTON', 'A', 'SELECT', 'TEXTAREA', 'INPUT',
      'LABEL', 'LI', 'SUMMARY', 'DETAILS', 'IMG', 'SVG'
    ]);
    if (interactiveTags.has(elem.tagName) || elem.tagName.toLowerCase().includes('button')) {
      return true;
    }

    if (elem.hasAttribute('onclick') || elem.hasAttribute('onchange')) {
      return true;
    }

    if (elem instanceof HTMLElement && elem.contentEditable === 'true') {
      return true;
    }

    const role = elem.getAttribute('role');
    const interactiveRoles = new Set([
      'button', 'link', 'checkbox', 'radio', 'menuitem',
      'switch', 'tab', 'treeitem', 'img', 'textbox'
    ]);
    if (role && interactiveRoles.has(role)) {
      return true;
    }

    const tabindex = elem.getAttribute('tabindex');
    if (tabindex !== null && !isNaN(parseInt(tabindex, 10)) && parseInt(tabindex, 10) >= 0) {
      return true;
    }

    const computedStyle = window.getComputedStyle(elem);
    if (computedStyle.cursor === 'pointer') {
      return true;
    }

    // we try to filter the class and data-testid with some terms
    const interactiveTerms = ['clickable', 'interactive',
      'btn', 'button', 'submit', 'reset', 'clean', 'clear',
      'select', 'item', 'option', 'check', 'radio', 'file',
      'image', 'img', 'icon'];
    if (elem.classList.length > 0) {
      const classList = Array.from(elem.classList);
      for (const cls of classList) {
        if (interactiveTerms.some(prefix => cls.toLowerCase().includes(prefix))) {
          return true;
        }
      }
    }

    const datatestid = elem.getAttribute('data-testid');
    if (datatestid && interactiveTerms.some(prefix => datatestid.toLowerCase().includes(prefix))) {
      return true;
    }

    return false;
  }

  private async sendRecordedStep(step: RecordedStep): Promise<void> {
    this._logger.debug(`Sending recorded step:`, step);
    const frameRtid = ContentUtils.frame.rtid;
    const rtid = RtidUtils.getTabRtid(frameRtid.tab, -1);
    const msgData = MsgUtils.createMessageData('record', rtid, { name: 'record_step', params: { step: step } });
    await ContentUtils.sendEvent(msgData);
  }

}

