/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file EventSimulator.ts
 * @description 
 * A comprehensive utility class for simulating user interactions (mouse, pointer, keyboard, drag-drop, etc.)
 * using synthetic DOM events. Mimics real user behavior with accurate event sequences, timing, and coordinate handling.
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

import { BrowserUtils, Utils, KeyboardModifier, KeyDefinitionUtils, ClickOptions, Point, TextInputOptions } from "@mimic-sdk/core";

interface LegacyDocument extends Document {
  createTouch(view: Window, target: EventTarget, identifier: number, pageX: number, pageY: number, screenX: number, screenY: number, radiusX: number, radiusY: number, rotationAngle: number, force: number): Touch;
  createTouchList(...touches: Touch[]): TouchList;
}

interface LegacyDeviceOrientationEvent extends DeviceOrientationEvent {
  initDeviceOrientationEvent(type: string, bubbles: boolean, cancelable: boolean, alpha: number | null, beta: number | null, gamma: number | null, absolute: boolean): void;
}

interface LegacyDeviceMotionEvent extends DeviceMotionEvent {
  initDeviceMotionEvent(type: string, bubbles: boolean, cancelable: boolean, acceleration: DeviceMotionEventAcceleration | null, accelerationIncludingGravity: DeviceMotionEventAcceleration | null, rotationRate: DeviceMotionEventRotationRate | null, interval: number | null): void;
}

/**
 * Enum for mouse button identifiers (matches W3C standards)
 */
export enum MouseButton {
  Left = 0,    // Primary button (left-click)
  Middle = 1,  // Middle button (wheel click)
  Right = 2    // Secondary button (right-click)
}

/**
 * Simulates various mouse and pointer events for testing/interaction automation
 */
const eventTypes: Map<string, 'mouse' | 'keyboard' | 'touch' | 'pointer' | 'focus' | 'drag' | 'wheel' | 'deviceorientation' | 'devicemotion'> = new Map([
  ['auxclick', 'mouse'],
  ['click', 'mouse'],
  ['dblclick', 'mouse'],
  ['mousedown', 'mouse'],
  ['mouseeenter', 'mouse'],
  ['mouseleave', 'mouse'],
  ['mousemove', 'mouse'],
  ['mouseout', 'mouse'],
  ['mouseover', 'mouse'],
  ['mouseup', 'mouse'],
  ['mouseleave', 'mouse'],
  ['mousewheel', 'mouse'],

  ['keydown', 'keyboard'],
  ['keyup', 'keyboard'],
  ['keypress', 'keyboard'],
  ['textInput', 'keyboard'],

  ['touchstart', 'touch'],
  ['touchmove', 'touch'],
  ['touchend', 'touch'],
  ['touchcancel', 'touch'],

  ['pointerover', 'pointer'],
  ['pointerout', 'pointer'],
  ['pointerenter', 'pointer'],
  ['pointerleave', 'pointer'],
  ['pointerdown', 'pointer'],
  ['pointerup', 'pointer'],
  ['pointermove', 'pointer'],
  ['pointercancel', 'pointer'],
  ['gotpointercapture', 'pointer'],
  ['lostpointercapture', 'pointer'],

  ['focus', 'focus'],
  ['blur', 'focus'],

  ['drag', 'drag'],
  ['dragstart', 'drag'],
  ['dragend', 'drag'],
  ['dragover', 'drag'],
  ['dragenter', 'drag'],
  ['dragleave', 'drag'],
  ['dragexit', 'drag'],
  ['drop', 'drag'],

  ['wheel', 'wheel'],

  ['deviceorientation', 'deviceorientation'],
  ['deviceorientationabsolute', 'deviceorientation'],

  ['devicemotion', 'devicemotion'],
]);

/**
 * get the client point for click, move, etc
 * @param {Element} target - The DOM element 
 * @param {number} x - Horizontal coordinate of the pointer, relative to viewport (in pixels).
 *   Defaults to the target's horizontal center (half of the element's width) if not specified.
 * @param {number} y - Vertical coordinate of the pointer, relative to viewport (in pixels).
 *   Defaults to the target's vertical center (half of the element's height) if not specified.
 * @returns 
 */
function getClientPoint(target: Element, x?: number, y?: number): { clientX: number, clientY: number } {
  // Calculate coordinates: default to center if x/y are undefined
  if (Utils.isNullOrUndefined(x) || Utils.isNullOrUndefined(y)) {
    // Get target's position and dimensions relative to viewport
    const rect = target.getBoundingClientRect();
    const clientX = Utils.isNullOrUndefined(x) ? rect.left + (rect.width / 2) : x;
    const clientY = Utils.isNullOrUndefined(y) ? rect.top + (rect.height / 2) : y;
    return { clientX: clientX, clientY: clientY };
  }
  else {
    return { clientX: x, clientY: y };
  }
}

/**
 * convert the mouse button type string to enum type
 * @param {MouseButton} [button='left' | 'right' | 'middle'] - The mouse button to simulate (e.g., left, right, middle)
 * @returns {MouseButton} 
 */
function toMouseButton(button?: 'left' | 'right' | 'middle'): MouseButton {
  switch (button) {
    case 'left': {
      return MouseButton.Left;
    }
    case 'right': {
      return MouseButton.Right;
    }
    case 'middle': {
      return MouseButton.Middle;
    }
    default: {
      return MouseButton.Left;
    }
  }
}

/**
  * Dispatches an event of the specified type on the given node.
  *
  * @param {Node} node The node to dispatch the event on.
  * @param {string} type The type of event to dispatch.
  * @param {Object} eventInitObj An object containing properties to initialize the event with.
  */
export function dispatchEvent(node: Node, type: string, eventInitObj?: object): void {
  let event;
  const eventInit: Record<string, unknown> = { bubbles: true, cancelable: true, composed: true, ...eventInitObj };
  switch (eventTypes.get(type)) {
    case 'mouse': event = new MouseEvent(type, eventInit as MouseEventInit); break;
    case 'keyboard': event = new KeyboardEvent(type, eventInit as KeyboardEventInit); break;
    case 'touch': {
      // WebKit does not support Touch constructor, but has deprecated createTouch and createTouchList methods.
      if (typeof Touch === 'undefined'
        && 'createTouch' in document
        && 'createTouchList' in document
      ) {
        const createTouch = (t: Record<string, unknown> | Touch): Touch => {
          if (t instanceof Touch)
            return t;
          // createTouch does not accept clientX/clientY, so we have to use pageX/pageY.
          const tObj = t as { pageX?: number, clientX?: number, pageY?: number, clientY?: number, target?: EventTarget, identifier: number, screenX: number, screenY: number, radiusX: number, radiusY: number, rotationAngle: number, force: number };
          let pageX = tObj.pageX;
          if (pageX === undefined && tObj.clientX !== undefined)
            pageX = tObj.clientX + (document.scrollingElement?.scrollLeft || 0);
          let pageY = tObj.pageY;
          if (pageY === undefined && tObj.clientY !== undefined)
            pageY = tObj.clientY + (document.scrollingElement?.scrollTop || 0);
          const px = pageX ?? 0;
          const py = pageY ?? 0;
          return (document as unknown as LegacyDocument).createTouch(window, tObj.target ?? node, tObj.identifier, px, py, tObj.screenX, tObj.screenY, tObj.radiusX, tObj.radiusY, tObj.rotationAngle, tObj.force);
        };
        const createTouchList = (touches: unknown): TouchList => {
          if (touches instanceof TouchList || !touches)
            return touches as TouchList;
          return (document as unknown as LegacyDocument).createTouchList(...(touches as unknown[]).map((t) => createTouch(t as Record<string, unknown> | Touch)));
        };
        eventInit.target ??= node;
        eventInit.touches = createTouchList(eventInit.touches);
        eventInit.targetTouches = createTouchList(eventInit.targetTouches);
        eventInit.changedTouches = createTouchList(eventInit.changedTouches);
        event = new TouchEvent(type, eventInit as TouchEventInit);
      } else {
        eventInit.target ??= node;
        if (eventInit.touches) eventInit.touches = (eventInit.touches as unknown[]).map((t: unknown) => t instanceof Touch ? t : new Touch({ ...(t as TouchInit), target: (t as Touch).target ?? node }));
        if (eventInit.targetTouches) eventInit.targetTouches = (eventInit.targetTouches as unknown[]).map((t: unknown) => t instanceof Touch ? t : new Touch({ ...(t as TouchInit), target: (t as Touch).target ?? node }));
        if (eventInit.changedTouches) eventInit.changedTouches = (eventInit.changedTouches as unknown[]).map((t: unknown) => t instanceof Touch ? t : new Touch({ ...(t as TouchInit), target: (t as Touch).target ?? node }));
        event = new TouchEvent(type, eventInit as TouchEventInit);
      }
      break;
    }
    case 'pointer': event = new PointerEvent(type, eventInit as PointerEventInit); break;
    case 'focus': event = new FocusEvent(type, eventInit as FocusEventInit); break;
    case 'drag': event = new DragEvent(type, eventInit as DragEventInit); break;
    case 'wheel': event = new WheelEvent(type, eventInit as WheelEventInit); break;
    case 'deviceorientation':
      try {
        event = new DeviceOrientationEvent(type, eventInit as DeviceOrientationEventInit);
      } catch {
        const { bubbles, cancelable, alpha, beta, gamma, absolute } = eventInit as unknown as { bubbles: boolean, cancelable: boolean, alpha: number, beta: number, gamma: number, absolute: boolean };
        event = document.createEvent('DeviceOrientationEvent');
        (event as unknown as LegacyDeviceOrientationEvent).initDeviceOrientationEvent(type, bubbles, cancelable, alpha, beta, gamma, absolute);
      }
      break;
    case 'devicemotion':
      try {
        event = new DeviceMotionEvent(type, eventInit as DeviceMotionEventInit);
      } catch {
        const { bubbles, cancelable, acceleration, accelerationIncludingGravity, rotationRate, interval } = eventInit as unknown as { bubbles: boolean, cancelable: boolean, acceleration: DeviceMotionEventAcceleration, accelerationIncludingGravity: DeviceMotionEventAcceleration, rotationRate: DeviceMotionEventRotationRate, interval: number };
        event = document.createEvent('DeviceMotionEvent');
        (event as unknown as LegacyDeviceMotionEvent).initDeviceMotionEvent(type, bubbles, cancelable, acceleration, accelerationIncludingGravity, rotationRate, interval);
      }
      break;
    default: event = new Event(type, eventInit as EventInit); break;
  }
  node.dispatchEvent(event);
}

/**
 * Dispatches a synthetic PointerEvent to a target DOM element, simulating user interaction with pointer devices.
 * Creates and triggers a browser-compatible PointerEvent with configurable properties, using sensible defaults
 * when options are not explicitly provided.
 * 
 * @param {('pointerover' | 'pointerenter' | 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'pointerout' | 'pointerleave')} type - The type of pointer event to dispatch.
 *   Represents different stages of pointer interaction (e.g., 'pointerdown' for button press, 'pointermove' for position change).
 * 
 * @param {Element} target - The DOM element to which the event will be dispatched. The event's coordinates are calculated relative to this element.
 * 
 * @param {Object} [options] - Optional configuration object for the pointer event.
 * @param {number} [options.x] - Horizontal coordinate of the pointer, relative to viewport (in pixels).
 *   Defaults to the target's horizontal center (half of the element's width) if not specified.
 * @param {number} [options.y] - Vertical coordinate of the pointer, relative to viewport (in pixels).
 *   Defaults to the target's vertical center (half of the element's height) if not specified.
 * @param {MouseButton} [options.button] - The mouse button associated with the event (e.g., primary, secondary).
 *   Defaults to `MouseButton.Left` if not specified.
 * @param {number} [options.buttons] - Bitmask representing the state of all pressed mouse buttons (e.g., `1` for primary button pressed).
 *   Defaults to a bitmask derived from the `button` property (calculated as `1 << button`) if not specified.
 * @param {('mouse' | 'pen' | 'touch')} [options.pointerType] - The type of pointer device triggering the event.
 *   Defaults to `'mouse'` if not specified.
 * @param {number} [options.pressure] - Normalized pressure of the pointer input (range: 0 to 1).
 *   Defaults to `0` if `pointerType` is `'mouse'`, and `0.5` for `'pen'` or `'touch'` if not specified.
 * 
 * @returns {boolean} `true` if the event was not canceled by any listener; `false` otherwise (matches the return value of `EventTarget.dispatchEvent`).
 */
export function dispatchPointerEvent(
  type: 'pointerover' | 'pointerenter'
    | 'pointerdown' | 'pointermove' | 'pointerup'
    | 'pointercancel' | 'pointerout' | 'pointerleave',
  target: Element,
  options?: {
    x?: number;
    y?: number;
    button?: MouseButton;
    buttons?: number;
    pointerType?: 'mouse' | 'pen' | 'touch';
    pressure?: number;
  }
): boolean {
  const { x, y, button: btnOpt, buttons: btnsOpt, pointerType: ptOpt, pressure: prOpt } = options || {};
  const button = btnOpt ?? MouseButton.Left;
  // no buttons pressed unless type is pointermove or pointerdown
  const buttons = btnsOpt ?? (['pointermove', 'pointerdown'].includes(type) ? (1 << button) : 0);
  const pointerType = ptOpt ?? 'mouse';
  const pressure = prOpt ?? (pointerType === 'mouse' ? 0 : 0.5);

  const { clientX, clientY } = getClientPoint(target, x, y);

  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: clientX,
    clientY: clientY,
    pointerType,
    button,
    buttons,
    pressure,
    view: window
    // Omitted screenX/screenY to avoid scale-related inaccuracies
  });
  const result = target.dispatchEvent(event);
  return result;
}

/**
 * Dispatches a synthetic MouseEvent to a target DOM element, simulating user interaction with a mouse.
 * Creates and triggers a browser-compatible MouseEvent with configurable properties, including coordinates,
 * button states, and modifier keys, using sensible defaults for unspecified options.
 * 
 * @param {('click' | 'dblclick' | 'mousedown' | 'mouseenter' | 'mouseover' | 'mousemove' | 'mouseup' | 'mouseleave' | 'mouseout')} type - The type of mouse event to dispatch.
 *   Common event types include:
 *   - 'click': Single mouse button press and release
 *   - 'dblclick': Double mouse button press and release
 *   - 'mousedown': Mouse button press (starts interaction)
 *   - 'mouseup': Mouse button release (ends interaction)
 *   - 'mousemove': Mouse position change over the target
 *   - 'mouseenter'/'mouseleave': Mouse entering/exiting the target's bounding box (non-bubbling)
 *   - 'mouseover'/'mouseout': Mouse entering/exiting the target's hit test area (bubbling)
 * 
 * @param {Element} target - The DOM element to which the event will be dispatched. Event coordinates are calculated relative to this element.
 * 
 * @param {Object} options - Optional configuration object for the mouse event.
 * @param {number} [options.x] - Horizontal coordinate of the mouse, relative to viewport (in pixels).
 *   Defaults to the target's horizontal center (half of the element's width) if not specified.
 * @param {number} [options.y] - Vertical coordinate of the mouse, relative to viewport (in pixels).
 *   Defaults to the target's vertical center (half of the element's height) if not specified.
 * @param {MouseButton} [options.button] - The mouse button associated with the event (e.g., primary, secondary).
 *   Defaults to `MouseButton.Left` if not specified.
 * @param {number} [options.buttons] - Bitmask representing the state of all pressed mouse buttons (e.g., `1` for primary button pressed).
 *   Defaults to a bitmask derived from the `button` property (calculated as `1 << button`) if not specified.
 * @param {Object} [options.modifiers] - Configuration for modifier keys (Ctrl, Shift, Alt, Meta).
 * @param {boolean} [options.modifiers.ctrlKey=false] - Whether the Ctrl key is pressed during the event. Defaults to `false`.
 * @param {boolean} [options.modifiers.shiftKey=false] - Whether the Shift key is pressed during the event. Defaults to `false`.
 * @param {boolean} [options.modifiers.altKey=false] - Whether the Alt key is pressed during the event. Defaults to `false`.
 * @param {boolean} [options.modifiers.metaKey=false] - Whether the Meta key (e.g., Windows key, Command key) is pressed during the event. Defaults to `false`.
 * 
 * @returns {boolean} `true` if the event was not canceled by any listener; `false` otherwise (matches the return value of `EventTarget.dispatchEvent`).
 * 
 * @note Special behavior: 'mouseenter' and 'mouseleave' events do not bubble, while all other mouse event types in this method do.
 * @note The `detail` property of the event is automatically set to `2` for 'dblclick' events (indicating two clicks) and `1` for all other types.
 */
export function dispatchMouseEvent(
  type: 'click' | 'dblclick' | 'auxclick'
    | 'mousedown' | 'mouseenter' | 'mouseover' | 'mousemove'
    | 'mouseup' | 'mouseleave' | 'mouseout',
  target: Element,
  options?: {
    x?: number;
    y?: number;
    button?: MouseButton;
    buttons?: number;
    modifiers?: {
      ctrlKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
      metaKey?: boolean;
    }
  }
): boolean {
  const { x, y, button: btnOpt, buttons: btnsOpt, modifiers } = options || {};
  const button = btnOpt ?? MouseButton.Left;
  // no buttons pressed unless type is mousemove,mousedown
  const buttons = btnsOpt ?? (['mousemove', 'mousedown'].includes(type) ? (1 << button) : 0);

  // Destructure modifier keys with defaults (all false if not specified)
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false
  } = modifiers || {};

  const { clientX, clientY } = getClientPoint(target, x, y);

  // 'mouseenter' and 'mouseleave' do NOT bubble (unlike other mouse events)
  const bubbles = !['mouseenter', 'mouseleave'].includes(type);

  const event = new MouseEvent(type, {
    bubbles: bubbles,
    cancelable: true,
    clientX: clientX,
    clientY: clientY,
    button,
    buttons,
    // Modifier key states (common in interactions like Ctrl+click)
    ctrlKey,
    shiftKey,
    altKey,
    metaKey,
    // Detail: Number of clicks for click/dblclick (1 for single, 2 for double)
    detail: type === 'dblclick' ? 2 : 1, // detail=2 for double clicks
    view: window
    // Omitted screenX/screenY to avoid scale-related inaccuracies
  });
  const result = target.dispatchEvent(event);
  return result;
}

/**
 * Dispatches a synthetic DragEvent to a target DOM element, simulating drag-and-drop interactions.
 * Creates and triggers browser-compatible drag events (e.g., for initiating, processing, or ending drag operations),
 * with configurable coordinates and data transfer properties.
 * 
 * @param {('dragstart' | 'dragenter' | 'drag' | 'dragover' | 'drop' | 'dragend' | 'dragleave')} type - The type of drag event to dispatch.
 *   Key event types in the drag-and-drop lifecycle:
 *   - 'dragstart': Fired when a drag operation is initiated (e.g., user starts dragging an element).
 *   - 'drag': Fired continuously while an element is being dragged.
 *   - 'dragenter': Fired when a dragged element enters a potential drop target.
 *   - 'dragover': Fired continuously while a dragged element is over a potential drop target.
 *   - 'dragleave': Fired when a dragged element leaves a potential drop target.
 *   - 'drop': Fired when a dragged element is dropped on a valid target.
 *   - 'dragend': Fired when a drag operation is completed (successfully or not).
 * 
 * @param {Element} target - The DOM element to which the event will be dispatched. Event coordinates are calculated relative to this element.
 * 
 * @param {Object} [options] - Optional configuration object for the drag event.
 * @param {number} [options.x] - Horizontal coordinate of the drag position, relative to viewport (in pixels).
 *   Defaults to the target's horizontal center (half of the element's width) if not specified.
 * @param {number} [options.y] - Vertical coordinate of the drag position, relative to viewport (in pixels).
 *   Defaults to the target's vertical center (half of the element's height) if not specified.
 * @param {DataTransfer} [options.dataTransfer] - The DataTransfer object associated with the drag event (used to pass data during drag-and-drop).
 *   Defaults to a new DataTransfer instance created via `createDataTransfer()` if not specified.
 * 
 * @returns {boolean} `true` if the event was not canceled by any listener; `false` otherwise (matches the return value of `EventTarget.dispatchEvent`).
 * 
 * @note All drag events bubble (`bubbles: true`), as required by the DragEvent specification.
 * @note Cancelable behavior: Only 'dragstart', 'drag', and 'dragover' events are cancelable (critical for enabling drop operations). 
 *   'dragenter', 'dragleave', 'drop', and 'dragend' are not cancelable.
 */
export function dispatchDragEvent(
  type: 'dragstart' | 'dragenter'
    | 'drag' | 'dragover'
    | 'drop' | 'dragend' | 'dragleave',
  target: Element,
  options?: {
    x?: number;
    y?: number;
    dataTransfer?: DataTransfer;
  }
): boolean {
  const { x, y, dataTransfer } = options || {};
  const dt = dataTransfer ?? new DataTransfer();

  const { clientX, clientY } = getClientPoint(target, x, y);

  // Determine cancelable behavior per spec:
  // - dragover/dragstart/drag are cancelable (critical for drop permissions)
  // - drop/dragend are not cancelable
  const cancelable = ['dragstart', 'drag', 'dragover'].includes(type);

  const event = new DragEvent(type, {
    bubbles: true, // All drag events bubble per spec
    cancelable,
    clientX,
    clientY,
    dataTransfer: dt,
    view: window, // Maintain UIEvent compliance
    // Omitted screenX/screenY to avoid scale-related inaccuracies
  });

  // Dispatch and return cancellation status
  return target.dispatchEvent(event);
}

/**
 * Dispatches a synthetic WheelEvent to a target DOM element, simulating mouse wheel or scroll interactions.
 * Creates and triggers a browser-compatible WheelEvent with configurable scroll delta, coordinates, and modifier key states.
 * 
 * @param {Element} target - The DOM element to which the wheel event will be dispatched. Event coordinates are calculated relative to this element.
 * 
 * @param {Object} [options] - Optional configuration object for the wheel event.
 * @param {number} [options.x] - Horizontal coordinate of the wheel position, relative to viewport (in pixels).
 *   Defaults to the target's horizontal center (half of the element's width) if not specified.
 * @param {number} [options.y] - Vertical coordinate of the wheel position, relative to viewport (in pixels).
 *   Defaults to the target's vertical center (half of the element's height) if not specified.
 * @param {number} [options.deltaX=0] - Horizontal scroll delta (positive for rightward scroll, negative for leftward). Defaults to `0`.
 * @param {number} [options.deltaY=100] - Vertical scroll delta (positive for downward scroll, negative for upward). Defaults to `100`.
 * @param {WheelEvent['deltaMode']} [options.deltaMode=WheelEvent.DOM_DELTA_PIXEL] - The unit of measurement for `deltaX` and `deltaY`.
 *   Possible values:
 *   - `WheelEvent.DOM_DELTA_PIXEL` (default): Delta values in pixels.
 *   - `WheelEvent.DOM_DELTA_LINE`: Delta values in lines (typically ~16px).
 *   - `WheelEvent.DOM_DELTA_PAGE`: Delta values in pages (target element's height/width).
 * @param {Object} [options.modifiers] - Configuration for modifier keys (Ctrl, Shift, Alt, Meta) pressed during the wheel event.
 * @param {boolean} [options.modifiers.ctrlKey=false] - Whether the Ctrl key is pressed. Defaults to `false`.
 * @param {boolean} [options.modifiers.shiftKey=false] - Whether the Shift key is pressed. Defaults to `false`.
 * @param {boolean} [options.modifiers.altKey=false] - Whether the Alt key is pressed. Defaults to `false`.
 * @param {boolean} [options.modifiers.metaKey=false] - Whether the Meta key (e.g., Windows key, Command key) is pressed. Defaults to `false`.
 * 
 * @returns {boolean} `true` if the event was not canceled by any listener; `false` otherwise (matches the return value of `EventTarget.dispatchEvent`).
 * 
 * @note The event bubbles (`bubbles: true`) and is cancelable (`cancelable: true`) to mimic native wheel event behavior.
 * @note 3D scroll (z-axis) is not configurable here; `deltaZ` is fixed to `0` as it is less commonly used.
 * @note Screen coordinates (`screenX`/`screenY`) are omitted to avoid scale-related inaccuracies.
 */
export function dispatchWheelEvent(
  target: Element,
  options?: {
    x?: number;
    y?: number;
    deltaX?: number;
    deltaY?: number;
    deltaMode?: WheelEvent['deltaMode'];
    modifiers?: {
      ctrlKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
      metaKey?: boolean;
    }
  }
): boolean {
  const { x, y, deltaY: dyOpt, deltaX: dxOpt, deltaMode: dmOpt, modifiers } = options || {};
  const deltaX = dxOpt ?? 0;
  const deltaY = dyOpt ?? 100;
  const deltaMode = dmOpt ?? WheelEvent.DOM_DELTA_PIXEL;
  // Destructure modifier keys with safe defaults
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false
  } = modifiers || {};

  const { clientX, clientY } = getClientPoint(target, x, y);

  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    clientX: clientX,
    clientY: clientY,
    deltaX,
    deltaY,
    deltaMode,
    deltaZ: 0,  // 3D scroll (z-axis) - default to 0 as it's less common
    view: window,  // Maintain UIEvent compliance
    ctrlKey,
    shiftKey,
    altKey,
    metaKey,
    // Omitted screenX/screenY to avoid scale-related inaccuracies
  });
  const result = target.dispatchEvent(event);
  return result;
}

/**
 * Dispatches synthetic KeyboardEvents to simulate keyboard input.
 * Supports key presses with modifier states and follows W3C keyboard event specifications.
 * 
 * @param {'keydown' | 'keyup' | 'keypress'} type - The type of keyboard event to dispatch.
 * @param {Element} target - The DOM element to receive the event (typically an input/textarea).
 * @param {string} key - Logical key value (e.g., 'Enter', 'a', 'ArrowLeft') as per the spec.
 * @param {string} code - Physical key position code (e.g., 'KeyA', 'Enter') (layout-agnostic).
 * @param {Object} [modifiers] - Modifier key states during the event.
 * @param {boolean} [modifiers.ctrlKey=false] - Whether the Ctrl key is pressed.
 * @param {boolean} [modifiers.shiftKey=false] - Whether the Shift key is pressed.
 * @param {boolean} [modifiers.altKey=false] - Whether the Alt key is pressed.
 * @param {boolean} [modifiers.metaKey=false] - Whether the Meta key is pressed.
 * @param {boolean} [repeat=false] - Whether the event is from a repeated key press (long hold).
 * @param {boolean} [isComposing=false] - Whether the event occurs during input method composition (e.g., Chinese input).
 * 
 * @returns {boolean} `true` if the event was not canceled by listeners; `false` otherwise.
 */
export function dispatchKeyboardEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  target: Element,
  key: string,
  code: string,
  modifiers: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {},
  repeat: boolean = false,
  isComposing: boolean = false
): boolean {
  // Destructure modifier keys with default values (false if unspecified)
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false
  } = modifiers;

  // Create keyboard event with properties following W3C specifications
  const event = new KeyboardEvent(type, {
    bubbles: true,  // Keyboard events bubble by default
    cancelable: true,  // Most keyboard events are cancelable (e.g., preventing default key behavior)
    key,  // Logical key value (affected by Shift/input methods, e.g., 'A' vs 'a')
    code,  // Physical key code (unaffected by Shift, e.g., always 'KeyA')
    ctrlKey,
    shiftKey,
    altKey,
    metaKey,
    repeat,  // Whether triggered by long key press repetition
    isComposing,  // Whether in input method composition (e.g., during Chinese pinyin input)
    view: window,  // Associate with current window, compliant with UIEvent spec
    charCode: type === 'keypress' ? key.charCodeAt(0) : 0,  // charCode only relevant for keypress
    // keyCode: code ? (code.startsWith('Key') ? code.charCodeAt(3) : 0) : 0,  // Legacy property (prefer key/code in modern code)
    // which: code ? (code.startsWith('Key') ? code.charCodeAt(3) : 0) : 0  // Legacy API compatibility (e.g., jQuery events)
  });

  // Dispatch event and return cancellation status
  return target.dispatchEvent(event);
}

/**
 * Simulates smooth pointer movement (mouse/touch) from a start point to an end point,
 * with natural easing and periodic event dispatch. Mimics human-like movement by
 * accelerating at the start and decelerating at the end, and dispatches appropriate
 * pointer and mouse events at each movement step.
 * 
 * @param {Element} target - The primary element associated with the movement. 
 *   While the pointer may move over other elements during the movement, this element
 *   is used to calculate default start/end points if they're not explicitly provided.
 * 
 * @param {Object} [options] - Configuration options for the movement simulation.
 * @param {Point} [options.startPoint] - Initial position of the pointer in viewport coordinates (CSS pixels).
 *   Viewport coordinates are relative to the top-left corner of the visible viewport.
 *   Defaults to the top-left corner of the target element if not specified.
 * @param {Point} [options.endPoint] - Final position of the pointer in viewport coordinates (CSS pixels).
 *   Defaults to the center of the target element if not specified.
 * @param {number} [options.steps=1] - The total movement steps
 *   Determines how many move steps will be executed
 * 
 * @returns {Promise<void>} A promise that resolves when the entire movement sequence completes,
 *   including all intermediate steps and event dispatches.
 * 
 * @throws {Error} If `totalDuration` is less than or equal to 0 (must be a positive number).
 * @throws {Error} If `stepInterval` is less than or equal to 0, or greater than `totalDuration`
 *   (must be a positive number smaller than the total duration).
 * 
 * @remarks 
 * - Uses an easing function (ease-in-out cubic) to create natural-looking acceleration/deceleration.
 * - At each step, calculates the current position, finds the element under that position,
 *   and dispatches `pointermove` and `mousemove` events relative to that element.
 * - Coordinate conversion: Converts viewport-relative coordinates to element-relative offsets
 *   for each intermediate step to ensure accurate event targeting.
 * - Suitable for simulating drag previews, hover transitions, or any scenario requiring
 *   smooth pointer traversal between two points.
 */
export async function simulateMove(
  target: Element,
  options?: {
    button?: MouseButton;
    buttons?: number;
    startPoint?: Point;
    endPoint?: Point;
    steps?: number
  }
): Promise<void> {
  const { button, buttons, startPoint: spOpt, endPoint: epOpt, steps: stepsOpt = 1 } = options || {};
  let startPoint = spOpt;
  let endPoint = epOpt;
  const steps = stepsOpt;

  if (Utils.isNullOrUndefined(startPoint) || Utils.isNullOrUndefined(endPoint)) {
    const rect = target.getBoundingClientRect();
    startPoint = startPoint ?? { x: rect.left, y: rect.top };
    endPoint = endPoint ?? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  const defaultElement = document.documentElement;

  for (let i = 1; i <= steps; i++) {
    // Easing for natural acceleration/deceleration
    const t = i / steps;
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Update viewport-relative position
    const currentX = startPoint.x + (endPoint.x - startPoint.x) * easeT;
    const currentY = startPoint.y + (endPoint.y - startPoint.y) * easeT;

    // Find element under current viewport position
    const currentElement = document.elementFromPoint(currentX, currentY) as Element || defaultElement;

    // Dispatch movement events
    dispatchPointerEvent('pointermove', currentElement, { x: currentX, y: currentY, button: button, buttons: buttons });
    dispatchMouseEvent('mousemove', currentElement, { x: currentX, y: currentY, button: button, buttons: buttons });
  }
}

/**
 * Simulates focusing an element with proper focus event sequence
 * Uses both native focus() method and dispatches focus events for realism
 * 
 * @param {Element} target - Element to focus
 * @returns {boolean} Result of the focus event dispatch
 */
export function simulateFocus(
  target: Element
): boolean {
  const activeElement = (target.getRootNode() as (Document | ShadowRoot)).activeElement;
  const wasFocused = activeElement === target && !!target.ownerDocument && target.ownerDocument.hasFocus();
  if ((target as HTMLElement).isContentEditable && !wasFocused && activeElement && (activeElement as HTMLElement | SVGElement).blur) {
    (activeElement as HTMLElement | SVGElement).blur();
  }

  // First call native focus to ensure element state is updated
  if ('focus' in target /**&& !target.matches(":focus")*/) {
    (target as HTMLElement | SVGElement).focus();
    (target as HTMLElement | SVGElement).focus();
  }
  const focus = target.dispatchEvent(new FocusEvent('focus', {
    bubbles: false
  }));
  const focusIn = target.dispatchEvent(new FocusEvent('focusin', {
    bubbles: true
  }));
  return focusIn && focus;
}

/**
 * Simulates blurring an element with proper blur event sequence
 * Uses both native blur() method and dispatches blur events for realism
 * 
 * @param {Element} target - Element to blur
 * @returns {boolean} Result of the blur event dispatch
 */
export function simulateBlur(
  target: Element
): boolean {
  // First call native blur to ensure element state is updated
  if ('blur' in target) {
    (target as HTMLElement | SVGElement).blur();
  }
  // Dispatch focusout (bubbles) and blur (doesn't bubble) events
  const blur = target.dispatchEvent(new FocusEvent('blur', {
    bubbles: false
  }));
  const focusOut = target.dispatchEvent(new FocusEvent('focusout', {
    bubbles: true
  }));
  return focusOut && blur;
}

/**
 * Simulates the start of a hover interaction (mouse over element)
 * Dispatches both mouseenter (non-bubbling) and mouseover (bubbling) events
 * 
 * @param {Element} target - Element to hover over
 * @param {Object} [options] - Configuration for the hover start.
 * @param {number} [options.x] - X coordinate relative to viewport
 * @param {number} [options.y] - Y coordinate relative to viewport
 * @param {MouseButton} [options.button=MouseButton.Left] - Mouse button state
 * @returns {Object} Results of the event dispatches
 */
export function simulateHoverStart(
  target: Element,
  options?: {
    x?: number;
    y?: number;
    button?: MouseButton;
  }
): { mouseenter: boolean; mouseover: boolean } {
  const { x, y, button = MouseButton.Left } = options || {};

  const mouseover = dispatchMouseEvent('mouseover', target, {
    x,
    y,
    button
  });

  const mouseenter = dispatchMouseEvent('mouseenter', target, {
    x,
    y,
    button
  });

  return { mouseenter, mouseover };
}

/**
 * Simulates the end of a hover interaction (mouse leaving element)
 * Dispatches both mouseleave (non-bubbling) and mouseout (bubbling) events
 * 
 * @param {Element} target - Element to stop hovering over
 * @param {Object} [options] - Configuration for the hover end.
 * @param {number} [options.x] - X coordinate relative to viewport
 * @param {number} [options.y] - Y coordinate relative to viewport
 * @param {MouseButton} [options.button=MouseButton.Left] - Mouse button state
 * @returns {Object} Results of the event dispatches
 */
export function simulateHoverEnd(
  target: Element,
  options?: {
    x?: number;
    y?: number;
    button?: MouseButton;
  }
): { mouseleave: boolean; mouseout: boolean } {
  const { x, y, button = MouseButton.Left } = options || {};

  const mouseout = dispatchMouseEvent('mouseout', target, {
    x,
    y,
    button
  });

  const mouseleave = dispatchMouseEvent('mouseleave', target, {
    x,
    y,
    button
  });

  return { mouseleave, mouseout };
}

/**
 * Simulates a mouse click (single or double) on a target element, including all associated events
 * (pointer events, mouse events, focus states, and modifier key interactions).
 * 
 * The method replicates real user click behavior by:
 * - Triggering focus/blur states
 * - Simulating pointer movement (before/after click)
 * - Dispatching sequential pointer and mouse events (over, enter, down, up, click, etc.)
 * - Handling modifier keys (Shift, Alt, Control/Meta)
 * - Supporting configurable delays between phases
 * 
 * @param {Element} target - The DOM element to simulate the click on
 * @param {Object} [options] - Configuration options for the click simulation
 * @param {MouseButton} [options.button='left'] - The mouse button to simulate (e.g., left, right, middle)
 * @param {number} [options.clickCount=1] - Number of clicks to simulate (1 for single click, 2 for double click)
 * @param {boolean} [options.moveBeforeClick=true] - Whether to simulate pointer movement to the target before clicking
 * @param {Object} [options.position] - Coordinates for the click relative to viewport
 * @param {number} [options.position.x] - X coordinate of the click position
 * @param {number} [options.position.y] - Y coordinate of the click position
 * @param {number} [options.delayAfterMove=0] - Delay in milliseconds after move and before starting the click sequence
 * @param {Array<"Alt" | "Control" | "ControlOrMeta" | "Meta" | "Shift">} [options.modifiers] - 
 *   Key modifiers to hold during the click (e.g., Shift for Shift+Click). 
 *   "ControlOrMeta" auto-uses Meta (⌘) on macOS and Control (Ctrl) on Windows.
 * @param {number} [options.delayBetweenDownUp=0] - Delay in milliseconds between mousedown and mouseup events
 * @param {number} [options.delayBetweenClick=0] - Delay in milliseconds between clicks for double-click sequences
 * @param {boolean} [options.moveAfterClick=false] - Whether to simulate pointer movement away from the target after clicking
 * @returns {Promise<void>} Resolves when the entire click simulation sequence is complete
 * @throws {Error} Throws an error if clickCount is not 1 or 2 (only these values are supported)
 */
export async function simulateClick(
  target: Element,
  options?: ClickOptions
): Promise<void> {
  const {
    clickCount = 1,
    position,
    modifiers = [],
    delayBetweenDownUp = 0,
    delayBetweenClick = 0
  } = options || {};

  // Validate click count (only 1 or 2 clicks supported)
  if (![1, 2].includes(clickCount)) {
    throw new Error(`Invalid clickCount: ${clickCount}. Must be 1 or 2.`);
  }

  const button = toMouseButton(options?.button);

  // Get target's position and dimensions relative to viewport
  const { clientX, clientY } = getClientPoint(target, position?.x, position?.y);

  // simulate flow:
  // pointerover, mouseover, pointerenter, pointermove, mousemove, focus, 
  // performClickCycle: [{pointerdown, mousedown, pointerup, mouseup, click, dblclick }]
  // pointermove, mousemove, pointerout, mouseout, pointerleave, mouseleave, blur

  // 1. Pointer moves over the target (pre-click hover)
  dispatchPointerEvent('pointerover', target, { x: clientX, y: clientY });
  dispatchMouseEvent('mouseover', target, { x: clientX, y: clientY });

  // 2. Pointer enters the target (for boundary-sensitive logic)
  dispatchPointerEvent('pointerenter', target, { x: clientX, y: clientY });
  dispatchMouseEvent('mouseenter', target, { x: clientX, y: clientY });
  // move from top-left corner to center
  await simulateMove(target, { endPoint: { x: clientX, y: clientY } });

  // 3. focus
  simulateFocus(target);

  // keydown for the modifiers
  if (modifiers && modifiers.length > 0) {
    if (modifiers?.includes('ControlOrMeta')) {
      if (BrowserUtils.isMacOS()) {
        dispatchKeyboardEvent('keydown', target, 'Meta', 'MetaLeft', { metaKey: true });
      }
      else {
        dispatchKeyboardEvent('keydown', target, 'Control', 'ControlLeft', { ctrlKey: true });
      }
    }
    if (modifiers?.includes('Meta')) {
      dispatchKeyboardEvent('keydown', target, 'Meta', 'MetaLeft', { metaKey: true });
    }
    if (modifiers?.includes('Control')) {
      dispatchKeyboardEvent('keydown', target, 'Control', 'ControlLeft', { ctrlKey: true });
    }
    if (modifiers?.includes('Shift')) {
      dispatchKeyboardEvent('keydown', target, 'Shift', 'ShiftLeft', { shiftKey: true });
    }
    if (modifiers?.includes('Alt')) {
      dispatchKeyboardEvent('keydown', target, 'Alt', 'AltLeft', { altKey: true });
    }
  }

  // 4. Execute click cycles (1 for single, 2 for double)
  // Calculate button states (bitmask)
  const buttonsDown = 1 << button; // Button pressed state
  const buttonsUp = 0; // Button released state
  // Core click phase: simulates pressing and releasing the button
  const performClickCycle = async (): Promise<void> => {
    // 1) Press the button down
    dispatchPointerEvent('pointerdown', target, { x: clientX, y: clientY, button: button, buttons: buttonsDown });
    dispatchMouseEvent('mousedown', target, { x: clientX, y: clientY, button: button, buttons: buttonsDown });

    // 2) Hold the button for specified duration (mimics physical click delay)
    if (delayBetweenDownUp > 0) {
      await Utils.wait(delayBetweenDownUp);
    }

    // 3) Release the button
    dispatchPointerEvent('pointerup', target, { x: clientX, y: clientY, button: button, buttons: buttonsUp });
    dispatchMouseEvent('mouseup', target, { x: clientX, y: clientY, button: button, buttons: buttonsUp });

    // 4) Trigger standard click events (dispatched by browser after up)
    if (button === MouseButton.Left) {
      dispatchMouseEvent('click', target, { x: clientX, y: clientY, button: button, buttons: buttonsUp });
    }
    else if (button === MouseButton.Middle) {
      dispatchMouseEvent('auxclick', target, { x: clientX, y: clientY, button: button, buttons: buttonsUp });
    }
    else if (button === MouseButton.Right) {
      dispatchMouseEvent('auxclick', target, { x: clientX, y: clientY, button: button, buttons: buttonsUp });
      const contextEvent = new Event('contextmenu', {
        bubbles: true,
        cancelable: true
      });
      target.dispatchEvent(contextEvent);
    }
  };
  await performClickCycle();
  // double click
  if (clickCount === 2) {
    // Short delay between clicks (matches OS double-click timing expectations)
    if (delayBetweenClick > 0) {
      await Utils.wait(delayBetweenClick);
    }
    await performClickCycle();

    if (button === MouseButton.Left) {
      // Trigger standard dblclick events (dispatched by browser after up)
      dispatchMouseEvent('dblclick', target, { x: clientX, y: clientY, button: button, buttons: buttonsUp });
    }
  }

  // keyup for modifiers
  if (modifiers && modifiers.length > 0) {
    if (modifiers?.includes('ControlOrMeta')) {
      if (BrowserUtils.isMacOS()) {
        dispatchKeyboardEvent('keyup', target, 'Meta', 'MetaLeft', { metaKey: true });
      }
      else {
        dispatchKeyboardEvent('keyup', target, 'Control', 'ControlLeft', { ctrlKey: true });
      }
    }
    if (modifiers?.includes('Meta')) {
      dispatchKeyboardEvent('keyup', target, 'Meta', 'MetaLeft', { metaKey: true });
    }
    if (modifiers?.includes('Control')) {
      dispatchKeyboardEvent('keyup', target, 'Control', 'ControlLeft', { ctrlKey: true });
    }
    if (modifiers?.includes('Shift')) {
      dispatchKeyboardEvent('keyup', target, 'Shift', 'ShiftLeft', { shiftKey: true });
    }
    if (modifiers?.includes('Alt')) {
      dispatchKeyboardEvent('keyup', target, 'Alt', 'AltLeft', { altKey: true });
    }
  }

  // optional moveout & leave
  // {
  //   const rect = target.getBoundingClientRect();
  //   const startPoint = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  //   const endPoint = { x: rect.x + rect.width, y: rect.y + rect.height };
  //   await simulateMove(target, { startPoint: startPoint, endPoint: endPoint });

  //   dispatchPointerEvent('pointerout', target, { x: endPoint.x, y: endPoint.y });
  //   dispatchMouseEvent('mouseout', target, { x: endPoint.x, y: endPoint.y });

  //   dispatchPointerEvent('pointerleave', target, { x: endPoint.x, y: endPoint.y });
  //   dispatchMouseEvent('mouseleave', target, { x: endPoint.x, y: endPoint.y });

  //   simulateBlur(target);
  // }
}

/**
 * Simulates set text into editable controls, auto switch to type text into an input element with realistic keyboard events if not pure fill mode
 * Uses `KeyDefinitionUtils` for accurate key code mapping and triggers input/change events.
 * 
 * @param {Element} target - The input/textarea element to receive the text.
 * @param {string} text - The text to type into the target.
 * @param {Object} [options] - Configuration for the setText.
 * 
 * @throws {Error} If a character in `text` is not supported by `KeyDefinitionUtils.KeyDefinitions`.
 */
export async function simulateSetText(
  target: Element,
  text: string,
  options?: TextInputOptions
): Promise<void> {
  const { delayBetweenDownUp = 0, delayBetweenChar = 0 } = options || {};

  // pure fill (no click, clear old value, just input value, no commit)
  if (delayBetweenDownUp === 0 && delayBetweenChar === 0) {
    if (target.nodeName.toLowerCase() === 'input') {
      let value = text;
      const input = target as HTMLInputElement;
      const type = input.type.toLowerCase();
      const kInputTypesToSetValue = new Set(['color', 'date', 'time', 'datetime-local', 'month', 'range', 'week']);
      const kInputTypesToTypeInto = new Set(['', 'email', 'number', 'password', 'search', 'tel', 'text', 'url']);
      if (!kInputTypesToTypeInto.has(type) && !kInputTypesToSetValue.has(type)) {
        throw new Error(`Input of type "${type}" cannot be filled`);
      }
      if (type === 'number') {
        value = value.trim();
        if (isNaN(Number(value))) {
          throw new Error(`Cannot type text into input[type=number]`);
        }
      }
      if (kInputTypesToSetValue.has(type)) {
        input.focus();
        input.value = value;
        if (input.value !== value) {
          throw new Error('Malformed value');
        }
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    } else if (target.nodeName.toLowerCase() === 'textarea') {
      const textarea = target as HTMLTextAreaElement;
      textarea.focus();
      textarea.value = text;
      if (textarea.value !== text) {
        throw new Error('Malformed value');
      }
      textarea.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    } else if ((target as HTMLElement).isContentEditable) {
      const element = target as HTMLElement;
      element.focus();
      element.innerHTML = text;
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      return;
    }
    else {
      throw new Error('Element is not an <input>, <textarea> or [contenteditable] element');
    }
  }

  //  try simulateTypeText if not simple fill, or element type not supported, or customized ContentEditable element
  await simulateTypeText(target, text, options);
}

/**
 * Simulates typing text into an input element with realistic keyboard events.
 * Uses `KeyDefinitionUtils` for accurate key code mapping and triggers input/change events.
 * 
 * @param {Element} target - The input/textarea element to receive the text.
 * @param {string} text - The text to type into the target.
 * @param {Object} [options] - Configuration for the setText.
 * 
 * @throws {Error} If a character in `text` is not supported by `KeyDefinitionUtils.KeyDefinitions`.
 */
export async function simulateTypeText(
  target: Element,
  text: string,
  options?: TextInputOptions
): Promise<void> {
  const { delayBetweenDownUp = 0, delayBetweenChar = 0 } = options || {};
  // simulate flow:
  // focus,
  // performInputCycle: [ {keydown , keypress , textInput (Deprecated TextEvent) , input , keyup }], 
  // change, 
  // blur

  simulateFocus(target);

  // Clear existing content
  if (target.nodeName.toLowerCase() === 'input' || target.nodeName.toLowerCase() === 'textarea') {
    (target as HTMLInputElement | HTMLTextAreaElement).value = '';
    target.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }
  else if ((target as HTMLElement).isContentEditable) {
    (target as HTMLElement).innerHTML = '';
    target.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  const modifiers = new Set<KeyboardModifier>;
  // performInputCycle
  for (const char of text) {
    const description = KeyDefinitionUtils.getKeyDescription(char, modifiers);
    if (description) {
      await simulatePressKeys(target, char, { delayBetweenDownUp: delayBetweenDownUp });
    }
    else {
      if (delayBetweenDownUp > 0) {
        await Utils.wait(delayBetweenDownUp);
      }
      if (target.nodeName.toLowerCase() === 'input' || target.nodeName.toLowerCase() === 'textarea') {
        (target as HTMLInputElement | HTMLTextAreaElement).value += char;
      }
      else if ((target as HTMLElement).isContentEditable) {
        (target as HTMLElement).innerHTML += char;
      }
      target.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: char }));
    }

    if (delayBetweenChar > 0) {
      await Utils.wait(delayBetweenChar);
    }
  }

  // Trigger change event to complete the input sequence
  target.dispatchEvent(new Event('change', { bubbles: true }));

  // optional commit
  // {
  //   dispatchKeyboardEvent('keydown', target, 'Enter', 'Enter');
  //   if (delayBetweenDownUp > 0) {
  //     await Utils.wait(delayBetweenDownUp);
  //   }
  //   dispatchKeyboardEvent('keyup', target, 'Enter', 'Enter');

  //   simulateBlur(target);
  // }
}

export async function simulatePressKeys(target: Element, keys: string | string[], options?: { delayBetweenDownUp?: number; }): Promise<void> {
  const { delayBetweenDownUp = 0 } = options || {};
  const modifiers = new Set<KeyboardModifier>;
  simulateFocus(target);
  const tokens = Array.isArray(keys) ? keys : [keys];
  for (const token of tokens) {
    const description = KeyDefinitionUtils.getKeyDescription(token, modifiers);
    if (Utils.isNullOrUndefined(description)) {
      throw new Error(`Unknown key - ${token}`);
    }
    if (KeyDefinitionUtils.isKeyboardModifier(description.key)) {
      modifiers.add(description.key);
    }
    const { key, code, text } = description;
    const modifierOption = {
      altKey: modifiers.has('Alt'),
      ctrlKey: modifiers.has('Control'),
      metaKey: modifiers.has('Meta'),
      shiftKey: modifiers.has('Shift'),
    };
    // Dispatch standard key events in sequence
    dispatchKeyboardEvent('keydown', target, key, code, modifierOption);
    if (key.length === 1) { // Only dispatch keypress for printable characters
      dispatchKeyboardEvent('keypress', target, key, code, modifierOption);
    }
    if (text) {
      if (target.nodeName.toLowerCase() === 'input' || target.nodeName.toLowerCase() === 'textarea') {
        (target as HTMLInputElement | HTMLTextAreaElement).value += text;
      }
      else if ((target as HTMLElement).isContentEditable) {
        (target as HTMLElement).innerHTML += text;
      }
      target.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: text }));
    }
  }
  if (delayBetweenDownUp > 0) {
    await Utils.wait(delayBetweenDownUp);
  }
  const reverseTokens = Utils.deepClone(tokens);
  reverseTokens.reverse();
  for (const token of reverseTokens) {
    const description = KeyDefinitionUtils.getKeyDescription(token, modifiers);
    if (Utils.isNullOrUndefined(description)) {
      throw new Error(`Unknown key - ${token}`);
    }
    if (KeyDefinitionUtils.isKeyboardModifier(description.key)) {
      modifiers.delete(description.key);
    }
    const { key, code } = description;
    const modifierOption = {
      altKey: modifiers.has('Alt'),
      ctrlKey: modifiers.has('Control'),
      metaKey: modifiers.has('Meta'),
      shiftKey: modifiers.has('Shift'),
    };
    dispatchKeyboardEvent('keyup', target, key, code, modifierOption);
  }
  // target.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulates a complete drag-and-drop operation with natural movement and event sequencing.
 * Supports viewport-relative coordinates, custom data transfer, and configurable timing.
 * 
 * @param {Element} [source] - Element to start dragging from (required if `startPoint` is undefined).
 * @param {Element} [target] - Element to drop on (required if `endPoint` is undefined).
 * @param {Object} [options] - Configuration for the dragdrop.
 * @param {Point} [options.startPoint] - Viewport-relative starting coordinates (x/y). 
 *   Defaults to the source element's center if unspecified.
 * @param {Point} [options.endPoint] - Viewport-relative ending coordinates (x/y).
 *   Defaults to the target element's center if unspecified.
 * @param {number} [options.totalDuration=800] - Total time (ms) for the drag operation.
 * @param {number} [options.stepInterval=30] - Time (ms) between movement steps (smoother = smaller interval).
 * @param {Record<string, string>} [options.data={ 'text/plain': 'dragged-data' }] - Data to transfer (format → value).
 * @param {MouseButton} [options.button=MouseButton.Left] - Mouse button to use for dragging.
 * @param {number} [options.buttons=1 << button] - Bitmask of pressed buttons during drag.
 * 
 * @returns {Promise<void>} Resolves when the drag-and-drop sequence completes.
 * @throws {Error} If invalid duration/interval, or missing `startPoint`/`source`/`endPoint`/`target`.
 */
export async function simulateDragDrop(
  source?: Element,
  target?: Element,
  options?: {
    startPoint?: Point;
    endPoint?: Point;
    steps?: number;
    data?: Record<string, string>;
    button?: MouseButton;
    buttons?: number;
  }
): Promise<void> {
  const { startPoint: spOpt, endPoint: epOpt, steps: stepsOpt = 1, data: dataOpt, button: btnOpt, buttons: btnsOpt } = options || {};
  let startPoint = spOpt;
  let endPoint = epOpt;
  const steps = stepsOpt;
  const data = dataOpt ?? {};
  const button = btnOpt ?? MouseButton.Left;
  const buttons = btnsOpt ?? (1 << button);

  // Set default start point: use source's center if startPoint is undefined
  if (!startPoint) {
    if (!source) {
      throw new Error('Either startPoint or source must be provided');
    }
    const sourceRect = source.getBoundingClientRect();
    startPoint = {
      x: sourceRect.left + sourceRect.width / 2,  // Center X (viewport-relative)
      y: sourceRect.top + sourceRect.height / 2   // Center Y (viewport-relative)
    };
  }

  // Set default end point: use target's center if endPoint is undefined
  if (!endPoint) {
    if (!target) {
      throw new Error('Either endPoint or target must be provided');
    }
    const targetRect = target.getBoundingClientRect();
    endPoint = {
      x: targetRect.left + targetRect.width / 2,  // Center X (viewport-relative)
      y: targetRect.top + targetRect.height / 2   // Center Y (viewport-relative)
    };
  }

  // Default to document element for fallback
  const defaultElement = document.documentElement;

  // Infer source/target from coordinates if not explicitly provided
  const dragSource = source
    || (document.elementFromPoint(startPoint.x, startPoint.y) as Element)
    || defaultElement;
  const dropTarget = target
    || (document.elementFromPoint(endPoint.x, endPoint.y) as Element)
    || defaultElement;

  // { 'text/plain': dragSource.id ?? 'dragged-data' };

  // Create data transfer object
  const dataTransfer = new DataTransfer();
  Object.entries(data).forEach(([format, value]) => {
    dataTransfer.setData(format, value);
  });

  // monitorEvents:
  // pointerover, pointerenter, mouseover, pointermove, mousemove, pointerdown, mousedown, focus, 
  // dragstart, drag, dragenter, [{dragover, drag}], dragleave (source)
  // dragenter (droptarget) , [{dragover (droptarget), drag (source)}], dragover (droptarget), drop (droptarget)
  // blur, pointout, mouseout, pointleave, mouseleave, dragend (source)

  // 1. Initial hover and press events on source
  dispatchPointerEvent('pointerover', dragSource, { x: startPoint.x, y: startPoint.y });
  dispatchMouseEvent('mouseover', dragSource, { x: startPoint.x, y: startPoint.y });

  dispatchPointerEvent('pointerenter', dragSource, { x: startPoint.x, y: startPoint.y });
  dispatchMouseEvent('mouseenter', dragSource, { x: startPoint.x, y: startPoint.y });

  dispatchPointerEvent('pointerdown', dragSource, { x: startPoint.x, y: startPoint.y, button: button, buttons: buttons });
  dispatchMouseEvent('mousedown', dragSource, { x: startPoint.x, y: startPoint.y, button: button, buttons: buttons });

  simulateFocus(dragSource);

  // Natural delay after press
  await Utils.wait(50);

  // 2. Start drag operation
  dispatchDragEvent('dragstart', dragSource, { x: startPoint.x, y: startPoint.y, dataTransfer });
  dispatchDragEvent('drag', dragSource, { x: startPoint.x, y: startPoint.y, dataTransfer });
  dispatchDragEvent('dragenter', dragSource, { x: startPoint.x, y: startPoint.y, dataTransfer });

  // 3. Simulate movement along viewport-relative path
  let lastElement: Element = dragSource;
  let currentX = startPoint.x; // Viewport-relative X
  let currentY = startPoint.y; // Viewport-relative Y

  for (let i = 1; i <= steps; i++) {
    // Easing for natural acceleration/deceleration
    const t = i / steps;
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Update viewport-relative position
    currentX = startPoint.x + (endPoint.x - startPoint.x) * easeT;
    currentY = startPoint.y + (endPoint.y - startPoint.y) * easeT;

    // Find element under current viewport position
    const currentElement = document.elementFromPoint(currentX, currentY) as Element;

    if (currentElement === dropTarget) {
      if (currentElement !== lastElement) { // first time drag the source on top of the target
        dispatchDragEvent('dragleave', dragSource, { x: currentX, y: currentY, dataTransfer });
        dispatchDragEvent('dragenter', dropTarget, { x: currentX, y: currentY, dataTransfer });
        lastElement = dropTarget;
        dispatchDragEvent('dragover', dropTarget, { x: currentX, y: currentY, dataTransfer });
        dispatchDragEvent('drag', dragSource, { x: currentX, y: currentY, dataTransfer });
      }
      else if (i === steps) { // last step, drop target
        dispatchDragEvent('dragover', dropTarget, { x: currentX, y: currentY, dataTransfer });
        dispatchDragEvent('drop', dropTarget, { x: currentX, y: currentY, dataTransfer });
      }
      else { // overlapping phase (dragging source over the target)
        dispatchDragEvent('dragover', dropTarget, { x: currentX, y: currentY, dataTransfer });
        dispatchDragEvent('drag', dragSource, { x: currentX, y: currentY, dataTransfer });
      }
    }
    else { // dragging the source
      dispatchDragEvent('dragover', dragSource, { x: currentX, y: currentY, dataTransfer });
      dispatchDragEvent('drag', dragSource, { x: currentX, y: currentY, dataTransfer });
    }
  }

  // Natural delay after drop
  await Utils.wait(50);

  // 4. Release mouse button
  dispatchPointerEvent('pointerup', dragSource, { x: endPoint.x, y: endPoint.y, button: button });
  dispatchMouseEvent('mouseup', dragSource, { x: endPoint.x, y: endPoint.y, button: button });

  // 5. blur
  simulateBlur(dragSource);

  // 6. mouse out
  dispatchPointerEvent('pointerout', dragSource, { x: endPoint.x, y: endPoint.y });
  dispatchMouseEvent('mouseout', dragSource, { x: endPoint.x, y: endPoint.y });

  dispatchPointerEvent('pointerleave', dragSource, { x: endPoint.x, y: endPoint.y });
  dispatchMouseEvent('mouseleave', dragSource, { x: endPoint.x, y: endPoint.y });

  // 7. Complete drag operation
  dispatchDragEvent('dragend', dragSource, { x: endPoint.x, y: endPoint.y, dataTransfer });
}

/**
 * Simulates a touch tap on a mobile device
 * Follows the natural sequence: touchstart → touchend → click
 * 
 * @param {Element} target - Element to tap
 * @param {Object} [options] - Configuration for the tap.
 * @param {number} [options.x] - X coordinate relative to viewport
 * @param {number} [options.y] - Y coordinate relative to viewport
 * @param {number} [options.touchId=1] - Unique identifier for the touch point
 * 
 * @returns {Promise<void>} Resolves when the touchstart-touchend-click sequence completes.
 * @throws {Error} If invalid duration/interval, or missing `startPoint`/`source`/`endPoint`/`target`.
 */
export async function simulateTap(
  target: Element,
  options?: {
    x?: number;
    y?: number;
    holdDuration?: number;
    touchId?: number;
  }
): Promise<void> {
  const { x, y, holdDuration = 0, touchId = 1 } = options || {};

  const { clientX, clientY } = getClientPoint(target, x, y);

  const eventInit = {
    identifier: touchId,
    target: target,
    clientX: clientX,
    clientY: clientY,
    screenX: (clientX + window.screenX) * window.devicePixelRatio,
    screenY: (clientY + window.screenY) * window.devicePixelRatio,
    pageX: clientX + window.scrollX,
    pageY: clientY + window.scrollY,
    radiusX: 10,
    radiusY: 10,
    rotationAngle: 0,
    force: 0.5
  };

  const touch = new Touch(eventInit);
  // Touch start event
  target.dispatchEvent(
    new TouchEvent('touchstart', {
      touches: [touch],
      targetTouches: [touch],
      changedTouches: [touch],
      bubbles: true,
      cancelable: true,
      view: window
    })
  );

  if (holdDuration > 0) {
    await Utils.wait(holdDuration);
  }

  // Touch end event (removed unused wait function)
  target.dispatchEvent(
    new TouchEvent('touchend', {
      touches: [],
      targetTouches: [],
      changedTouches: [touch],
      bubbles: true,
      cancelable: true,
      view: window
    })
  );

  // Click event with safe coordinate handling
  await simulateClick(target, { position: { x: clientX, y: clientY } });
}

/**
 * Creates a simplified DataTransfer object for drag-and-drop simulations.
 * Implements core functionality of the DOM DataTransfer interface without unnecessary complexity.
 * 
 * @private
 * @returns {DataTransfer} A synthetic DataTransfer object supporting basic data operations.
 */
export function createDataTransfer(): DataTransfer {
  let data: Record<string, string> = {};
  return {
    data: { ...data },
    dropEffect: 'move',
    effectAllowed: 'all',
    types: ['text/plain'],
    files: [],
    items: [],
    setData: (type: string, value: string) => {
      data[type] = value;
    },
    getData: (type: string) => {
      return data[type] || '';
    },
    clearData: (type?: string) => {
      if (type) {
        Reflect.deleteProperty(data, type);
      } else {
        data = {};
      }
    },
    setDragImage: () => { },
  } as unknown as DataTransfer;
}
