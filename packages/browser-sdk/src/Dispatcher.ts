/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Dispatcher.ts
 * @description 
 * Using CustomEvent for communication between the MAIN world and other Isolated Worlds
 * The dispatcher to dispatch messages received from the MainToContentChannel and post messages via the channel
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
import { AODesc, AutomationObject, ChannelBase, ChannelStatus, Dispatcher, IChannel, Message, MessageData, MsgDataHandlerBase, MsgUtils, Rtid, RtidUtils, Settings, SettingUtils, Utils } from "@gogogo/shared";
import { RuntimeUtils } from "./RuntimeUtils";

interface ChromeObj {
  runtime?: {
    id?: string
  };
};

/**
 * The channel based on the CustomEvent API for communication between the MAIN world and the Content script world.
 */
class MainToContentChannel extends ChannelBase {
  private readonly _source: 'content' | 'MAIN';
  /**
   * the listenerWrapper for message events
   */
  private _listener?: (ev: Event) => void;

  constructor() {
    super();
    const chrome = (typeof globalThis !== 'undefined' && 'chrome' in globalThis) ? (globalThis as typeof globalThis & { chrome: ChromeObj }).chrome : undefined;
    if (typeof chrome !== 'undefined' && typeof chrome.runtime?.id === 'string') {
      this._source = 'content';
    }
    else {
      this._source = 'MAIN';
    }
    this._status = ChannelStatus.CONNECTED;
  }

  startListening(): void {
    if (this._listener) {
      return;
    }
    this._listener = this.onMessage.bind(this);
    if (this._source === 'content') {
      window.addEventListener("_Gogogo_MAIN_To_Content_EVENT_", this._listener, true);
    }
    else {
      window.addEventListener("_Gogogo_Content_To_MAIN_EVENT_", this._listener, true);
    }
  }

  stopListening(): void {
    if (Utils.isNullOrUndefined(this._listener)) {
      return;
    }
    if (this._source === 'content') {
      window.removeEventListener("_Gogogo_MAIN_To_Content_EVENT_", this._listener, true);
    }
    else {
      window.removeEventListener("_Gogogo_Content_To_MAIN_EVENT_", this._listener, true);
    }
    this._listener = undefined;
  }

  postMessage(msg: Message): void {
    if (this._status != ChannelStatus.CONNECTED) {
      throw new Error('Unexpected Error: failed to postMessage(dispatchEvent) because the status is not connected');
    }
    this.logger.debug('postMessage: >>>>>> msg=', msg);

    const eventType = this._source === 'content' ? "_Gogogo_Content_To_MAIN_EVENT_" : "_Gogogo_MAIN_To_Content_EVENT_";
    const event = new CustomEvent(eventType, { detail: msg });
    window.dispatchEvent(event);

    this.logger.debug('postMessage: <<<<<< msg=', msg);
  }

  async sendEvent(_msg: Message): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async sendRequest(_msg: Message): Promise<Message> {
    throw new Error("Method not implemented.");
  }

  disconnect(_reason?: string): void {
    if (this._status != ChannelStatus.CONNECTED) {
      this.logger.warn('disconnect: failed to disconnect because the status is not connected');
      return;
    }
    this.stopListening();
    this._status = ChannelStatus.DISCONNECTED;
  }

  private onMessage(ev: Event): void {
    this.logger.debug('onMessage: >>>> ev=', ev);
    const msg = ev instanceof CustomEvent ? ev.detail as unknown: null;
    if (!MsgUtils.isMessage(msg)) {
      this.logger.error('Invalid message format: msg:', msg, ' ev:', ev);
      return;
    }
    this.emit('message', {
      msg: msg,
      sender: this._source === 'content' ? 'MAIN' : 'content',
      responseCallback: (response) => {
        this.postMessage(response);
        this.logger.debug('onMessage: <<<< msg=', msg, ' response:', response);
      }
    });
  }
}

class GogogoEventHandler extends MsgDataHandlerBase {

  constructor() {
    const rtid = RtidUtils.getAgentRtid();
    rtid.context = 'MAIN';
    super(rtid);
  }

  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/
  async onEvent(event: 'windowCreated' | 'windowRemoved' |
    'pageCreated' | 'pageDOMContentLoaded' | 'pageRemoved' |
    'dialogOpened' | 'dialogClosed', data: unknown): Promise<void> {

    const supportedEvents = ['windowCreated', 'windowRemoved',
      'pageCreated', 'pageDOMContentLoaded', 'pageRemoved',
      'dialogOpened', 'dialogClosed'];
    if (!supportedEvents.includes(event)) {
      this.logger.error(`onEvent: Unexpected event - ${event}`);
    }

    const repo = RuntimeUtils.repo;

    if (event === 'windowCreated') {
      const rtid = RtidUtils.getBrowserRtid();
      const browser = repo.getBrowser(rtid);
      browser.emit('window', data);
    }
    else if (event === 'windowRemoved') {
      if (typeof data === 'number') {
        const windowId = data as number;
        const rtid = RtidUtils.getWindowRtid(windowId);
        const window = repo.getWindow(rtid);
        window.emit('close', data);
      }
    }
    else if (event === 'pageCreated') {
      const tabInfo = data as { windowId: number };
      {
        const rtid = RtidUtils.getBrowserRtid();
        const browser = repo.getBrowser(rtid);
        browser.emit('page', data);
      }
      {
        if (!Utils.isNullOrUndefined(tabInfo?.windowId) && typeof tabInfo.windowId === 'number') {
          const rtid = RtidUtils.getWindowRtid(tabInfo.windowId);
          const window = repo.getWindow(rtid);
          window.emit('page', data);
        }
      }
    }
    else if (event === 'pageDOMContentLoaded') {
      if (typeof data === 'number') {
        const tabId = data as number;
        const rtid = RtidUtils.getTabRtid(tabId);
        const page = repo.getPage(rtid);
        page.emit('domcontentloaded', data);
      }
    }
    else if (event === 'pageRemoved') {
      if (typeof data === 'number') {
        const tabId = data as number;
        const rtid = RtidUtils.getTabRtid(tabId);
        const page = repo.getPage(rtid);
        page.emit('close', data);
      }
    }
    else if (event === 'dialogOpened') {
      const dialogInfo = data as { tabId: number }
      if (!Utils.isNullOrUndefined(dialogInfo?.tabId) && typeof dialogInfo.tabId === 'number') {
        const rtid = RtidUtils.getTabRtid(dialogInfo.tabId);
        const page = repo.getPage(rtid);
        page.emit('dialog', data);
      }
    }
  }

  async updateSettings(settings: Settings): Promise<void> {
    if (SettingUtils.isSettings(settings)) {
      const newSettings = await SettingUtils.load(settings);
      this.logger.debug('updateSettings: Settings are updated to', newSettings);
    }
  }

  /** ==================================================================================================================== **/
  /** ====================================================== query ======================================================= **/
  /** ==================================================================================================================== **/
  protected override async queryProperty(_propName: string): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  protected override async queryObjects(_desc: AODesc): Promise<AutomationObject[]> {
    throw new Error("Method not implemented.");
  }
}

export class MainToContentDispatcher extends Dispatcher {
  private readonly _mainToContentChannel: MainToContentChannel;
  private readonly _handler: GogogoEventHandler;

  constructor() {
    super('main-to-content-dispatcher');

    this._handler = new GogogoEventHandler();
    this.addHandler(this._handler);

    this._mainToContentChannel = new MainToContentChannel();
    this._mainToContentChannel.on('message', async ({ msg, sender, responseCallback }) => {
      this.onMessage(msg, sender, responseCallback);
    });
    this._mainToContentChannel.startListening();
  }

  async registerToContentScript(sendRequest: (data: MessageData, timeout?: number) => Promise<MessageData>): Promise<void> {
    const reqMsgData = MsgUtils.createMessageData('config', RtidUtils.getAgentRtid(), { name: 'get', params: { frameRtid: undefined, settings: undefined } });
    const resMsgData = await sendRequest(reqMsgData);
    if (resMsgData.status === 'OK') {
      const result = resMsgData.result as Record<string, unknown>;
      const frameRtid = Utils.getItem('frameRtid', result) as Rtid;
      this._handler.rtid.context = 'MAIN';
      this._handler.rtid.browser = frameRtid.browser;
      this._handler.rtid.window = -1;
      this._handler.rtid.tab = frameRtid.tab;
      this._handler.rtid.frame = frameRtid.frame;
      this._handler.rtid.object = 0;
      const settings = Utils.getItem('settings', result) as Settings;
      await this._handler.updateSettings(settings);
      this.logger.debug('registerToContentScript: MAIN frame rtid are updated to', this._handler.rtid);
    }
  }

  override async sendEvent(data: MessageData, timeout?: number): Promise<void> {
    if (this._handler.rtid.tab === -1) {
      throw new Error('sendEvent: failed to send event because frameRtid is not initialized');
    }
    return await super.sendEvent(data, timeout);
  }

  override async sendRequest(data: MessageData, timeout?: number): Promise<MessageData> {
    if (this._handler.rtid.tab === -1) {
      await this.registerToContentScript(super.sendRequest.bind(this));
    }
    if (this._handler.rtid.tab === -1) {
      throw new Error('sendRequest: failed to send request because frameRtid is not initialized');
    }
    return await super.sendRequest(data, timeout);
  }

  protected override getChannel(_msg: Message): IChannel {
    return this._mainToContentChannel;
  }
}

