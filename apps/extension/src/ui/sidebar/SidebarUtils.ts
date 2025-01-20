/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file SidebarUtils.ts
 * @description 
 * Shared utility classes and functions for Sidebar
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

import { Utils, Dispatcher } from "@gogogo/shared";
import { StepEngine } from "./StepEngine";
import { SidebarHandler } from "./SidebarHandler";

export class SidebarUtils {
  private static _dispatcher?: Dispatcher;
  private static _engine?: StepEngine;
  private static _handler?: SidebarHandler;

  static set dispatcher(dispatcher: Dispatcher) {
    SidebarUtils._dispatcher = dispatcher;
  }

  static get dispatcher() {
    if (Utils.isNullOrUndefined(SidebarUtils._dispatcher)) {
      throw new Error('The dispatcher is not ready');
    }
    return SidebarUtils._dispatcher;
  }

  static set engine(engine: StepEngine) {
    SidebarUtils._engine = engine;
  }

  static get engine() {
    if (Utils.isNullOrUndefined(SidebarUtils._engine)) {
      throw new Error('The step engine is not ready');
    }
    return SidebarUtils._engine;
  }

  static set handler(dispatcher: SidebarHandler) {
    SidebarUtils._handler = dispatcher;
  }

  static get handler() {
    if (Utils.isNullOrUndefined(SidebarUtils._handler)) {
      throw new Error('The handler is not ready');
    }
    return SidebarUtils._handler;
  }
}