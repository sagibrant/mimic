/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file RtidUtils.ts
 * @description 
 * Utility classes and functions
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

import * as Utils from './Utils';
import { ContextType, Rtid } from "./types/protocol";

/**
 * Determines whether an object is an instance of `Rtid` or a compatible shape.
 * @param obj The object to check.
 */
export function isRtid(obj: unknown): obj is Rtid {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.browser === 'number' &&
    typeof candidate.tab === 'number' &&
    typeof candidate.frame === 'number' &&
    typeof candidate.object === 'number'
  );
}

/**
 * Compares two Rtid objects for structural equality.
 * @param a First Rtid object
 * @param b Second Rtid object
 */
export function isRtidEqual(a: unknown, b: unknown): boolean {
  return (
    isRtid(a) &&
    isRtid(b) &&
    a.object === b.object &&
    a.frame === b.frame &&
    a.tab === b.tab &&
    (a.tab === -1 ? a.window === b.window : true) && // compare window only if both tb === -1
    a.browser === b.browser &&
    a.context === b.context &&
    a.external === b.external
  );
}

export function getAgentRtid(): Rtid {
  return {
    context: 'background',
    browser: -1,
    window: -1,
    tab: -1,
    frame: -1,
    object: -1
  } as Rtid;
}

export function getBrowserRtid(browserId: number = 0): Rtid {
  return {
    context: 'background',
    browser: browserId,
    window: -1,
    tab: -1,
    frame: -1,
    object: -1
  } as Rtid;
}

export function getWindowRtid(windowId: number, browserId: number = 0): Rtid {
  return {
    context: 'background',
    browser: browserId,
    window: windowId,
    tab: -1,
    frame: -1,
    object: -1
  } as Rtid;
}

export function getTabRtid(tabId: number, windowId: number = -1, browserId: number = 0): Rtid {
  return {
    context: 'background',
    browser: browserId,
    window: windowId,
    tab: tabId,
    frame: -1,
    object: -1
  } as Rtid;
}

export function getFrameRtid(frameId: number, tabId: number, windowId: number = -1, browserId: number = 0): Rtid {
  return {
    context: 'content',
    browser: browserId,
    window: windowId,
    tab: tabId,
    frame: frameId,
    object: -1
  } as Rtid;
}

export function getObjectRtid(objectId: number, frameId: number, tabId: number, windowId: number = -1, browserId: number = 0): Rtid {
  return {
    context: 'content',
    browser: browserId,
    window: windowId,
    tab: tabId,
    frame: frameId,
    object: objectId
  } as Rtid;
}

export function getRtidContextType(rtid: Rtid): ContextType | null {

  // message to the specified context
  if (!Utils.isEmpty(rtid.context)) {
    return rtid.context;
  }

  // message to another browser by native application forwarding
  // todo: currently we do not support multiple browsers
  if (rtid.browser > 0) {
    return 'external';
  }

  // agent rtid 
  if (rtid.browser === -1 && rtid.tab === -1 && rtid.frame === -1) {
    return 'background';
  }

  // current browser rtid 
  if (rtid.browser === 0 && rtid.tab === -1 && rtid.frame === -1) {
    return 'background';
  }

  // tab rtid 
  if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame === -1) {
    return 'background';
  }

  // frame rtid 
  if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame >= 0 && rtid.object === -1) {
    return 'content';
  }

  // frame rtid in MAIN WORLD
  if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame >= 0 && rtid.object === 0) {
    return 'MAIN';
  }

  // object rtid
  if (rtid.browser === 0 && rtid.tab >= 0 && rtid.frame >= 0 && rtid.object > 0) {
    return 'content';
  }

  return null;
}
