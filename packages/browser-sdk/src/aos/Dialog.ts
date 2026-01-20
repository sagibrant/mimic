/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Dialog.ts
 * @description 
 * Class for Dialog automation (cdp based)
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
import { Rtid, RtidUtils, Utils } from "@mimic-sdk/core";
import { ChannelBase } from "../Channel";
import { PageLocator } from "../locators/PageLocator";

interface DialogInfo extends Record<string, unknown> {
  type?: 'alert' | 'confirm' | 'prompt' | 'beforeunload';
  message?: string;
  defaultPrompt?: string;
}

export class Dialog extends ChannelBase implements api.Dialog {
  private readonly _pageLocator: PageLocator;
  private _pageRtid?: Rtid;

  constructor(pageLocator: PageLocator) {
    super();
    this._pageLocator = pageLocator;
  }
  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */
  async tabRtid(): Promise<Rtid> {
    if (Utils.isNullOrUndefined(this._pageRtid)) {
      const page = await this._pageLocator.get();
      this._pageRtid = page.rtid();
    }
    return RtidUtils.getTabRtid(this._pageRtid.tab);
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */
  async page(): Promise<api.Page> {
    const page = await this._pageLocator.get();
    return page;
  }
  async opened(): Promise<boolean> {
    const tabRtid = await this.tabRtid();
    const dialogInfo = await this.invokeFunction(tabRtid, 'getJavaScriptDialog', []) as DialogInfo | null;
    if (dialogInfo) {
      return true;
    }
    else {
      return false;
    }
  }
  async type(): Promise<'alert' | 'confirm' | 'prompt' | 'beforeunload'> {
    const tabRtid = await this.tabRtid();
    const dialogInfo = await this.invokeFunction(tabRtid, 'getJavaScriptDialog', []) as DialogInfo | null;
    if (dialogInfo && dialogInfo.type) {
      return dialogInfo.type;
    }
    else {
      throw new Error('Dialog is closed');
    }
  }
  async defaultValue(): Promise<string> {
    const tabRtid = await this.tabRtid();
    const dialogInfo = await this.invokeFunction(tabRtid, 'getJavaScriptDialog', []) as DialogInfo | null;
    if (dialogInfo) {
      return dialogInfo.defaultPrompt || '';
    }
    else {
      throw new Error('Dialog is closed');
    }
  }
  async message(): Promise<string> {
    const tabRtid = await this.tabRtid();
    const dialogInfo = await this.invokeFunction(tabRtid, 'getJavaScriptDialog', []) as DialogInfo | null;
    if (dialogInfo) {
      return dialogInfo.message || '';
    }
    else {
      throw new Error('Dialog is closed');
    }
  }
  async accept(promptText?: string): Promise<void> {
    const tabRtid = await this.tabRtid();
    if (promptText === undefined) {
      const dialogInfo = await this.invokeFunction(tabRtid, 'getJavaScriptDialog', []) as DialogInfo | null;
      const type = dialogInfo?.type;
      const defaultPrompt = dialogInfo?.defaultPrompt;
      if (type === 'prompt') {
        promptText = defaultPrompt;
      }
    }
    await this.invokeFunction(tabRtid, 'handleJavaScriptDialog', promptText === undefined ? [true] : [true, promptText]);
  }
  async dismiss(): Promise<void> {
    const tabRtid = await this.tabRtid();
    await this.invokeFunction(tabRtid, 'handleJavaScriptDialog', [false]);
  }
}