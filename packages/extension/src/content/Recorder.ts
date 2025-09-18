/**
 * @copyright 2025 Sagi All Rights Reserved.
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

import { MsgUtils, RtidUtils, Utils } from "../common/Common";
import { Logger } from "@/common/Logger";
import { DOMPathUtils } from "@/common/DOMPath";
import { ContentUtils } from "./ContentUtils";
import { AO, AODesc, DOMElementDescription, RecordedStep, Selector } from "@/types/protocol";

export class Recorder {
  private readonly _logger: Logger;
  private readonly _recordingEvents: string[];
  private readonly _objMap: Map<EventTarget, RecordObject>;
  private _hanleEventFunc?: (event: Event) => Promise<void>;

  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? 'Recorder' : this.constructor?.name;
    this._logger = new Logger(prefix);
    this._recordingEvents = ['focus', 'click', 'change', 'blur'];
    this._objMap = new Map();
  }

  isRecording(): boolean {
    return this._hanleEventFunc !== undefined;
  }

  async startRecording(): Promise<void> {
    this._logger.debug('startRecording:: ===>');
    if (!this._hanleEventFunc) {
      this._hanleEventFunc = this.hanleEvent.bind(this);
    }
    for (const event of this._recordingEvents) {
      window.addEventListener(event, this._hanleEventFunc, true);
    }
    const shadowRoots = ContentUtils.traverseGetAllShadowRoot(document, 'closed');
    for (const shadowRoot of shadowRoots) {
      for (const event of this._recordingEvents) {
        shadowRoot.addEventListener(event, this._hanleEventFunc, true);
      }
    }
    this._logger.debug('startRecording:: <===');
  }

  async stopRecording(): Promise<void> {
    this._logger.debug('stopRecording:: ===>');
    if (this._hanleEventFunc) {
      for (const event of this._recordingEvents) {
        window.removeEventListener(event, this._hanleEventFunc, true);
      }
      const shadowRoots = ContentUtils.traverseGetAllShadowRoot(document, 'closed');
      for (const shadowRoot of shadowRoots) {
        for (const event of this._recordingEvents) {
          shadowRoot.removeEventListener(event, this._hanleEventFunc, true);
        }
      }
    }
    this._hanleEventFunc = undefined;
    this._logger.debug('stopRecording:: <===');
  }

  async hanleEvent(event: Event): Promise<void> {
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
    this._events.push(event);

    if (event.type === 'focus') {
      const elem = this.getInterestedElement(event);
      if (elem && elem instanceof HTMLElement && elem.contentEditable === 'true') {
        this._cachedTextContent = elem.textContent;
      }
    }
  }

  async receiveEvent(event: Event) {
    if (this._events.length <= 0 || this._events[this._events.length - 1] !== event) {
      this._events.push(event);
    }
    switch (event.type) {
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
    const aoDesc = await this.generateAODesc(elem, details);
    if (!aoDesc.queryInfo) return;
    const scripts = await this.generateElementScript(aoDesc);
    const recordedStep: RecordedStep = {
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
    const aoDesc = await this.generateAODesc(elem, details);
    if (!aoDesc.queryInfo) return;
    const scripts = await this.generateElementScript(aoDesc);
    const recordedStep: RecordedStep = {
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

  private async generateAODesc(node: Node, desc: DOMElementDescription): Promise<AODesc> {
    const ao = ContentUtils.repo.getAOByElement(node as Element);
    const aoDesc: AODesc = { type: 'element' };
    aoDesc.queryInfo = {};

    const matchAO = async (aoDesc: AODesc, ordinal: boolean = true): Promise<boolean> => {
      aoDesc.queryInfo = aoDesc.queryInfo || {};
      let aos = await this.queryObjects(aoDesc);
      if (aos.length === 1 && RtidUtils.isRtidEqual(aos[0].rtid, ao.rtid)) {
        return true;
      }
      else if (aos.length > 1 && ordinal && Utils.isNullOrUndefined(aoDesc.queryInfo.ordinal)) {
        const index = aos.findIndex(a => RtidUtils.isRtidEqual(a.rtid, ao.rtid));
        if (index >= 0) {
          aoDesc.queryInfo.ordinal = { type: 'default', index: index, reverse: false };
          aos = await this.queryObjects(aoDesc);
          if (aos.length === 1 && RtidUtils.isRtidEqual(aos[0].rtid, ao.rtid)) {
            return true;
          }
        }
        aoDesc.queryInfo.ordinal = undefined;
      }
      return false;
    };

    // if in the shadow DOM, use mandatory selector + nth
    // if not in the shadow DOM, use primary css selector + nth
    if (desc.isInShadowRoot !== true) {
      // try with css selector
      aoDesc.queryInfo.primary = [{ name: '#css', value: desc.selector, type: 'property', match: 'exact' }];
      let matched = await matchAO(aoDesc);
      if (matched) {
        return aoDesc;
      }
      // try with xpath
      aoDesc.queryInfo.primary = [{ name: '#xpath', value: desc.xPath, type: 'property', match: 'exact' }];
      matched = await matchAO(aoDesc);
      if (matched) {
        return aoDesc;
      }
      // remove primary if not found
      aoDesc.queryInfo.primary = undefined;
    }

    // try mandatory selectors
    const mandatorySelectors: Selector[] = [];
    {
      if (desc.tagName) {
        mandatorySelectors.push({ name: 'tagName', value: desc.tagName, type: 'property', match: 'exact' });
      }
      if (desc.nodeValue) {
        mandatorySelectors.push({ name: 'nodeValue', value: desc.nodeValue, type: 'property', match: 'exact' });
      }
      if (desc.textContent) {
        mandatorySelectors.push({ name: 'textContent', value: desc.textContent, type: 'property', match: 'exact' });
      }
      if (desc.attributes && desc.attributes.length > 0) {
        const attrs = Object.entries(desc.attributes);
        for (const [name, value] of attrs) {
          mandatorySelectors.push({ name: name, value: value, type: 'attribute', match: 'exact' });
        }
      }

      for (let i = 1; i <= mandatorySelectors.length; i++) {
        const combinations = Utils.getCombinations(mandatorySelectors, i);
        for (const combo of combinations) {
          aoDesc.queryInfo.mandatory = combo;
          let matched = await matchAO(aoDesc);
          if (matched) {
            return aoDesc;
          }
        }
      }
      aoDesc.queryInfo.mandatory = undefined;
    }


    // last try with tagName only
    if (desc.tagName) {
      aoDesc.queryInfo.mandatory = [{ name: 'tagName', value: desc.tagName, type: 'property', match: 'exact' }];
      let matched = await matchAO(aoDesc);
      if (matched) {
        return aoDesc;
      }
    }

    if (mandatorySelectors.length > 0) {
      aoDesc.queryInfo.assistive = mandatorySelectors;
      let matched = await matchAO(aoDesc, false);
      if (matched) {
        return aoDesc;
      }
    }

    this._logger.warn(`Fail to generate unique AODesc for element:`, desc);
    aoDesc.queryInfo = undefined;
    return aoDesc;
  }

  private async queryObjects(desc: AODesc): Promise<AO[]> {
    const frameRtid = ContentUtils.frame.rtid;
    const reqMsgData = MsgUtils.createMessageData('query', frameRtid, { name: 'query_objects' }, desc);
    const resMsgData = await ContentUtils.sendRequest(reqMsgData);
    if (resMsgData.status === 'OK' && resMsgData.objects) {
      return resMsgData.objects;
    }
    else {
      return [];
    }
  }

  private async generateElementScript(aoDesc: AODesc): Promise<string> {
    let scripts: string[] = [];
    if (aoDesc.queryInfo && aoDesc.queryInfo.primary && aoDesc.queryInfo.primary.length === 1) {
      const primary = aoDesc.queryInfo.primary[0];
      if (primary.name === '#css') {
        scripts.push(`element('${primary.value}')`);
      }
      else if (primary.name === '#xpath') {
        scripts.push(`element({ xpath: '${primary.value}'})`);
      }
      else {
        scripts.push(`element()`);
      }
    }
    if (scripts.length === 0) {
      scripts.push(`element()`);
    }
    if (aoDesc.queryInfo && aoDesc.queryInfo.mandatory && aoDesc.queryInfo.mandatory.length > 0) {
      const filters: object[] = [];
      for (const selector of aoDesc.queryInfo.mandatory) {
        const filterObj = Object.assign({},
          { name: selector.name, value: selector.value },
          selector.type === 'property' ? {} : { type: selector.type },
          selector.match === 'exact' ? {} : { match: selector.match },
        );
        filters.push(filterObj);
      }
      scripts.push(`filter(${JSON.stringify(filters)})`);
    }
    if (aoDesc.queryInfo && aoDesc.queryInfo.assistive && aoDesc.queryInfo.assistive.length > 0) {
      const filters: object[] = [];
      for (const selector of aoDesc.queryInfo.assistive) {
        const filterObj = Object.assign({},
          { name: selector.name, value: selector.value },
          selector.type === 'property' ? {} : { type: selector.type },
          selector.match === 'exact' ? {} : { match: selector.match },
        );
        filters.push(filterObj);
      }
      scripts.push(`prefer(${JSON.stringify(filters)})`);
    }
    if (aoDesc.queryInfo && aoDesc.queryInfo.ordinal) {
      if (aoDesc.queryInfo.ordinal.index === 0 && aoDesc.queryInfo.ordinal.reverse === false) {
        scripts.push(`first()`);
      }
      else if (aoDesc.queryInfo.ordinal.index === 0 && aoDesc.queryInfo.ordinal.reverse === true) {
        scripts.push(`last()`);
      }
      else {
        scripts.push(`nth(${aoDesc.queryInfo.ordinal.index})`);
      }
    }
    return scripts.join('.');
  }

  private async sendRecordedStep(step: RecordedStep): Promise<void> {
    this._logger.debug(`Sending recorded step:`, step);
    const frameRtid = ContentUtils.frame.rtid;
    const rtid = RtidUtils.getTabRtid(frameRtid.tab, -1);
    const msgData = MsgUtils.createMessageData('record', rtid, { name: 'record_step', params: { step: step } });
    await ContentUtils.sendEvent(msgData);
  }

}

