/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file SidebarHandler.ts
 * @description 
 * Support the record and inspect actions
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

import { MsgUtils, RtidUtils, MsgDataHandlerBase, AODesc, AutomationObject, InvokeAction, RecordedStep, ElementInfo } from "@gogogo/shared";
import { SidebarUtils } from "./SidebarUtils";

interface SidebarEvents extends Record<string, unknown> {
  nodeInspected: { details: ElementInfo };
  stepRecorded: { step: RecordedStep };
}

export class SidebarHandler extends MsgDataHandlerBase<SidebarEvents> {

  constructor() {
    const rtid = RtidUtils.getAgentRtid();
    rtid.context = 'external';
    rtid.external = 'sidebar';
    super(rtid);
  }
  /** ==================================================================================================================== **/
  /** ===================================================== command ====================================================== **/
  /** ==================================================================================================================== **/
  async onEvent(event: string, data: any): Promise<void> {
    if (event === 'nodeInspected') {
      const details = data as ElementInfo;
      this.emit('nodeInspected', { details });
      return;
    }
    if (event === 'stepRecorded') {
      const step = data as RecordedStep;
      this.emit('stepRecorded', { step });
      return;
    }
    const rtid = RtidUtils.getAgentRtid();
    rtid.context = 'external';
    rtid.external = 'sandbox-handler';
    const msgData = MsgUtils.createMessageData('command', rtid, {
      name: 'invoke',
      params: {
        name: 'onEvent',
        args: [event, data]
      }
    } as InvokeAction);

    await SidebarUtils.dispatcher.sendEvent(msgData);
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
