/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ObjectRepository.ts
 * @description 
 * create and maintain the automation objects
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

import { Rtid, RtidUtils, Utils, Logger } from "@mimic-sdk/core";
import { Browser } from "./aos/Browser";
import { Window } from "./aos/Window";
import { Page } from "./aos/Page";
import { Frame } from "./aos/Frame";
import { Element } from "./aos/Element";
import { Text } from "./aos/Text";

export class ObjectRepository {
  protected readonly logger: Logger;
  private readonly _browserObjects: Map<string, Browser>;
  private readonly _windowObjects: Map<string, Window>;
  private readonly _pageObjects: Map<string, Page>;
  private readonly _frameObjects: Map<string, Frame>;
  private readonly _elementObjects: Map<string, Element>;
  private readonly _textObjects: Map<string, Text>;

  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "ObjectRepository" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this._browserObjects = new Map();
    this._windowObjects = new Map();
    this._pageObjects = new Map();
    this._frameObjects = new Map();
    this._elementObjects = new Map();
    this._textObjects = new Map();
  }

  public clear(): void {
    for (const obj of this._browserObjects.values()) {
      obj.clearListeners();
    }
    this._browserObjects.clear();

    for (const obj of this._windowObjects.values()) {
      obj.clearListeners();
    }
    this._windowObjects.clear();

    for (const obj of this._pageObjects.values()) {
      obj.clearListeners();
    }
    this._pageObjects.clear();

    for (const obj of this._frameObjects.values()) {
      obj.clearListeners();
    }
    this._frameObjects.clear();


    for (const obj of this._elementObjects.values()) {
      obj.clearListeners();
    }
    this._elementObjects.clear();

    for (const obj of this._textObjects.values()) {
      obj.clearListeners();
    }
    this._textObjects.clear();
  }

  public getBrowser(rtid: Rtid): Browser {
    const key = `${rtid.browser}`;// always 0
    if (!this._browserObjects.has(key)) {
      rtid = RtidUtils.getBrowserRtid(rtid.browser);
      const obj = new Browser(rtid);
      this._browserObjects.set(key, obj);
    }
    const obj = this._browserObjects.get(key);
    if (!obj) {
      throw new Error('Unable to get Browser');
    }
    return obj;
  }

  public getWindow(rtid: Rtid): Window {
    const key = `${rtid.browser}:${rtid.window}`;
    if (!this._windowObjects.has(key)) {
      rtid = RtidUtils.getWindowRtid(rtid.window, rtid.browser);
      const obj = new Window(rtid);
      this._windowObjects.set(key, obj);
    }
    const obj = this._windowObjects.get(key);
    if (!obj) {
      throw new Error('Unable to get Window');
    }
    return obj;
  }

  public getPage(rtid: Rtid): Page {
    const key = `${rtid.browser}:-1:${rtid.tab}`;
    if (!this._pageObjects.has(key)) {
      rtid = RtidUtils.getTabRtid(rtid.tab, -1, rtid.browser);
      const obj = new Page(rtid);
      this._pageObjects.set(key, obj);
    }
    const obj = this._pageObjects.get(key);
    if (!obj) {
      throw new Error('Unable to get Page');
    }
    return obj;
  }

  public getFrame(rtid: Rtid): Frame {
    const key = `${rtid.browser}:-1:${rtid.tab}:${rtid.frame}`;
    if (!this._frameObjects.has(key)) {
      rtid = RtidUtils.getFrameRtid(rtid.frame, rtid.tab, -1, rtid.browser);
      const obj = new Frame(rtid);
      this._frameObjects.set(key, obj);
    }
    const obj = this._frameObjects.get(key);
    if (!obj) {
      throw new Error('Unable to get Frame');
    }
    return obj;
  }

  public getElement(rtid: Rtid): Element {
    const key = `${rtid.browser}:-1:${rtid.tab}:${rtid.frame}:${rtid.object}`;
    if (!this._elementObjects.has(key)) {
      rtid = RtidUtils.getObjectRtid(rtid.object, rtid.frame, rtid.tab, -1, rtid.browser);
      const obj = new Element(rtid);
      this._elementObjects.set(key, obj);
    }
    const obj = this._elementObjects.get(key);
    if (!obj) {
      throw new Error('Unable to get Element');
    }
    return obj;
  }

  public getText(rtid: Rtid): Text {
    const key = `${rtid.browser}:-1:${rtid.tab}:${rtid.frame}:${rtid.object}`;
    if (!this._textObjects.has(key)) {
      rtid = RtidUtils.getObjectRtid(rtid.object, rtid.frame, rtid.tab, -1, rtid.browser);
      const obj = new Text(rtid);
      this._textObjects.set(key, obj);
    }
    const obj = this._textObjects.get(key);
    if (!obj) {
      throw new Error('Unable to get Text');
    }
    return obj;
  }

}

