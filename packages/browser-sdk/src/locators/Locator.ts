/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Locator.ts
 * @description 
 * Base class for Locators
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
import { Utils, SettingUtils, QueryInfo } from "@mimic-sdk/core";
import { ChannelBase } from "../Channel";
import { AutomationObject } from "../aos/AutomationObject";

export interface LocatorOrdinalOption {
  type?: 'default' | 'location';
  index: number;
  reverse?: boolean;
}

export abstract class Locator<T extends AutomationObject> extends ChannelBase implements api.Locator<T> {
  protected readonly parent?: api.Locator<unknown>;
  protected readonly primary?: api.LocatorOptions;
  protected readonly mandatory?: api.LocatorFilterOption[];
  protected readonly assistive?: api.LocatorFilterOption[];
  protected readonly ordinal?: LocatorOrdinalOption;
  protected objects?: T[];

  constructor(parent?: api.Locator<unknown>,
    primary?: api.LocatorOptions,
    mandatory?: api.LocatorFilterOption[],
    assistive?: api.LocatorFilterOption[],
    ordinal?: LocatorOrdinalOption) {

    super();
    this.parent = parent;
    this.primary = primary;
    this.mandatory = mandatory;
    this.assistive = assistive;
    this.ordinal = ordinal;

    // TODO: we can use proxy to simplify the codes
    // return new Proxy(this, {
    //   get: async (target, propKey) => {
    //     // 1. Prioritize accessing Wrapper's own properties/methods (e.g., getInstance)
    //     if (propKey in target) {
    //       return (target as any)[propKey];
    //     }

    //     // 2. Otherwise, get from the target instance
    //     const instance = await target.get();
    //     const value = (instance as any)[propKey];

    //     // 3. If it's a function, return a proxy function (maintain original method calling style)
    //     if (typeof value === 'function') {
    //       return (...args: any[]) => value.apply(instance, args);
    //     }

    //     // 4. If it's a regular property or getter, return its value directly
    //     return value;
    //   },

    //   // Optional: Support setting properties (if need to modify properties of the target instance)
    //   set: (target, propKey, value) => {
    //     // If the property belongs to the wrapper itself, set it directly
    //     if (propKey in target) {
    //       (target as any)[propKey] = value;
    //       return true;
    //     }

    //     // Otherwise, forward to the target instance
    //     target.get().then(instance => {
    //       (instance as any)[propKey] = value;
    //     }).catch(err => this.logger.error("Set failed:", err));

    //     return false;
    //   }
    // }) as unknown as Locator<T> & Wrapped<T>;
  }

  protected abstract locateObjects(): Promise<T[]>;

  resolve(objects: T[]): void {
    this.objects = objects;
  }

  protected createQueryInfo(): QueryInfo | undefined {
    if (Utils.isNullOrUndefined(this.primary) && Utils.isEmpty(this.mandatory)
      && Utils.isEmpty(this.assistive) && Utils.isNullOrUndefined(this.ordinal)) {
      return undefined;
    }

    const queryInfo: QueryInfo = {};

    if (this.primary) {
      queryInfo.primary = [];
      for (const [name, value] of Object.entries(this.primary)) {
        if (value instanceof RegExp) {
          queryInfo.primary.push({ name: name, value: Utils.toRegExpSpec(value), type: 'property', match: 'regex' });
        }
        else {
          queryInfo.primary.push({ name: name, value: value as string | number | boolean | undefined, type: 'property', match: 'exact' });
        }
      }
    }

    if (this.mandatory && this.mandatory.length > 0) {
      queryInfo.mandatory = [];
      for (const filter of this.mandatory) {
        if (filter.value instanceof RegExp) {
          queryInfo.mandatory.push({ name: filter.name, value: Utils.toRegExpSpec(filter.value), type: filter.type ?? 'property', match: 'regex' });
        }
        else {
          if ('value' in filter) {
            queryInfo.mandatory.push({ name: filter.name, value: filter.value, type: filter.type ?? 'property', match: filter.match ?? 'exact' });
          }
          else {
            queryInfo.mandatory.push({ name: filter.name, value: filter.value, type: filter.type ?? 'property', match: filter.match ?? 'has' });
          }
        }
      }
    }

    if (this.assistive && this.assistive.length > 0) {
      queryInfo.assistive = [];
      for (const filter of this.assistive) {
        if (filter.value instanceof RegExp) {
          queryInfo.assistive.push({ name: filter.name, value: Utils.toRegExpSpec(filter.value), type: filter.type ?? 'property', match: 'regex' });
        }
        else {
          if ('value' in filter) {
            queryInfo.assistive.push({ name: filter.name, value: filter.value, type: filter.type ?? 'property', match: filter.match ?? 'exact' });
          }
          else {
            queryInfo.assistive.push({ name: filter.name, value: filter.value, type: filter.type ?? 'property', match: filter.match ?? 'has' });
          }
        }
      }
    }

    if (this.ordinal) {
      queryInfo.ordinal = { type: this.ordinal.type ?? 'default', index: this.ordinal.index, reverse: this.ordinal.reverse ?? false };
    }

    return queryInfo;
  }

  private createNew(parent?: api.Locator<unknown>,
    primary?: api.LocatorOptions,
    mandatory?: api.LocatorFilterOption[],
    assistive?: api.LocatorFilterOption[],
    ordinal?: LocatorOrdinalOption): Locator<T> {
    const locator = new (this.constructor as new () => Locator<T>)();
    Object.defineProperty(locator, 'parent', { value: parent });
    Object.defineProperty(locator, 'primary', { value: primary ? { ...primary } : undefined });
    Object.defineProperty(locator, 'mandatory', { value: mandatory ? [...mandatory] : undefined });
    Object.defineProperty(locator, 'assistive', { value: assistive ? [...assistive] : undefined });
    Object.defineProperty(locator, 'ordinal', { value: ordinal ? { ...ordinal } : undefined });
    return locator;
  }

  /** ==================================================================================================================== */
  /** ================================================= locator methods ================================================== */
  /** ==================================================================================================================== */
  filter(options?: api.LocatorFilterOption | api.LocatorFilterOption[]): api.Locator<T> {
    const mandatory = [];
    if (this.mandatory) {
      mandatory.push(...this.mandatory);
    }
    if (options) {
      if (Array.isArray(options)) {
        mandatory.push(...options);
      }
      else {
        mandatory.push(options);
      }
    }
    const locator = this.createNew(this.parent, this.primary, mandatory, this.assistive, this.ordinal);
    if (this.objects) {
      locator.resolve(this.objects);
    }
    return locator;
  }

  prefer(options?: api.LocatorFilterOption | api.LocatorFilterOption[]): api.Locator<T> {
    const assistive = [];
    if (this.assistive) {
      assistive.push(...this.assistive);
    }
    if (options) {
      if (Array.isArray(options)) {
        assistive.push(...options);
      }
      else {
        assistive.push(options);
      }
    }
    const locator = this.createNew(this.parent, this.primary, this.mandatory, assistive, this.ordinal);
    if (this.objects) {
      locator.resolve(this.objects);
    }
    return locator;
  }

  async get(): Promise<T> {
    const timeout = SettingUtils.getReplaySettings().locatorTimeout;
    const startTime = performance.now();
    const endTime = startTime + timeout;
    let objects: T[] | undefined = undefined;
    while (true) {
      objects = this.objects ?? await this.locateObjects();
      if (objects.length === 1) {
        break;
      }
      if (performance.now() >= endTime) {
        break;
      }
      await Utils.wait(500);
    }
    const count = objects.length;
    let name = this.constructor?.name ?? 'Object';
    if (name.endsWith('Locator') && name.length > 7) {
      name = name.slice(0, name.length - 7);
    }
    if (count <= 0) {
      throw new Error(`No ${name} Located`);
    } else if (count > 1) {
      throw new Error(`Multiple ${name} Located (found ${count})`);
    }
    return objects[0];
  }

  async count(): Promise<number> {
    const objects = this.objects ?? await this.locateObjects();
    return objects.length;
  }

  async all(): Promise<Locator<T>[]> {
    const all = [];
    const count = await this.count();
    for (let i = 0; i < count; i++) {
      const locator = this.nth(i);
      all.push(locator);
    }
    return all;
  }

  nth(index: number): Locator<T> {
    const ordinal = {
      type: 'default',
      index: index
    } as LocatorOrdinalOption;
    const locator = this.createNew(this.parent, this.primary, this.mandatory, this.assistive, ordinal);
    if (this.objects) {
      locator.resolve(this.objects);
    }
    return locator;
  }

  first(): Locator<T> {
    return this.nth(0);
  }

  last(): Locator<T> {
    const ordinal = {
      type: 'default',
      index: 0,
      reverse: true
    } as LocatorOrdinalOption;
    const locator = this.createNew(this.parent, this.primary, this.mandatory, this.assistive, ordinal);
    if (this.objects) {
      locator.resolve(this.objects);
    }
    return locator;
  }
}

// TODO: use proxy and Wrapped type to reduce the redundant codes
// type Wrapped<T> = {
//   [K in keyof T]:
//   T[K] extends (...args: infer A) => infer R
//   ? (...args: A) => Promise<Awaited<R>>
//   : Promise<T[K]>;
// };