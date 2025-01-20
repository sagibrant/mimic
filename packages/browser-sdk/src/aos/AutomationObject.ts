/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file AutomationObject.ts
 * @description 
 * Class for AutomationObject
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

import { Rtid } from "@gogogo/shared";
import { ChannelBase } from "../Channel";

export type Listener = (arg: unknown) => (unknown | Promise<unknown>);

export class AutomationObject extends ChannelBase {
  protected readonly _rtid: Rtid;
  protected readonly _listeners: Map<string, Listener[]>;

  constructor(rtid: Rtid) {
    super();
    this._rtid = rtid;
    this._listeners = new Map();
  }

  /** ==================================================================================================================== */
  /** ==================================================== properties ==================================================== */
  /** ==================================================================================================================== */

  rtid(): Rtid {
    return this._rtid;
  }

  /** ==================================================================================================================== */
  /** ====================================================== events ====================================================== */
  /** ==================================================================================================================== */

  on(event: string, listener: Listener): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.push(listener);
    }
    return this;
  }

  emit(event: string, args: unknown): void {
    const listeners = this._listeners.get(event);
    if (!listeners || listeners.length === 0) {
      return;
    }

    // Clone listeners to avoid mutation during iteration
    const listenersCopy = [...listeners];
    for (const listener of listenersCopy) {
      try {
        // Execute listener and handle potential async result
        const result = listener(args);

        // Prevent unhandled promise rejections
        if (result && result instanceof Promise) {
          result.catch(error => {
            this.logger.error(`Unhandled async error in "${String(event)}" listener`, error);
          });
        }
      } catch (error) {
        this.logger.error(`Sync listener error for "${String(event)}"`, error);
      }
    }
  }

  off(event: string, listener: Listener): this {
    const listeners = this._listeners.get(event);
    if (!listeners) return this;

    // Filter out exact listener reference
    this._listeners.set(
      event,
      listeners.filter(l => l !== listener)
    );
    return this;
  }

  clearListeners(): this {
    this._listeners.clear();
    return this;
  }
}