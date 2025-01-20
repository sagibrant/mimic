/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file ChromeContentUtils.ts
 * @description 
 * Shared utility classes and functions for content in chrome
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

import { BrowserUtils, Utils, RectInfo } from "@gogogo/shared";


/** the page's window offset x */
let pageWindowOffsetX: number | undefined = undefined;
/** the page's window offset y */
let pageWindowOffsetY: number | undefined = undefined;
let onMouseOverListener: ((ev: MouseEvent) => void) | undefined = undefined;
let onResizeListener: ((ev: UIEvent) => void) | undefined = undefined;

export function turnOnUserInteractiveMode(deviceScaleFactor: number): void {
  onMouseOverListener = (ev: MouseEvent): void => {
    if (window.parent !== window) {
      return; // check if in page
    }
    if (typeof (ev.isTrusted) === "boolean" && ev.isTrusted === true &&
      typeof (ev.screenX) === "number" && typeof (ev.screenY) === "number" &&
      typeof (ev.clientX) === "number" && typeof (ev.clientY) === "number") {
      const devicePixelRatio = window.devicePixelRatio;
      pageWindowOffsetX = Math.floor(((ev.screenX - window.screenX) * deviceScaleFactor) - (ev.clientX * devicePixelRatio));
      pageWindowOffsetY = Math.floor(((ev.screenY - window.screenY) * deviceScaleFactor) - (ev.clientY * devicePixelRatio));
      if (pageWindowOffsetX < 0 || pageWindowOffsetY < 0) {
        pageWindowOffsetX = undefined;
        pageWindowOffsetY = undefined;
      }
    }
  };
  onResizeListener = (_ev: UIEvent): void => {
    if (window.parent !== window) {
      return; // check if in page
    }
    pageWindowOffsetX = undefined;
    pageWindowOffsetY = undefined;
  };
  window.addEventListener("mouseover", onMouseOverListener, true);
  window.addEventListener("resize", onResizeListener, true);
}
export function turnOffUserInteractiveMode(): void {
  if (onMouseOverListener) {
    window.removeEventListener('mouseover', onMouseOverListener);
  }
  onResizeListener = undefined;
  if (onResizeListener) {
    window.removeEventListener('resize', onResizeListener);
  }
  onResizeListener = undefined;
}

export function getPageRectUsingUserInteractiveMode(pageZoomFactor: number): RectInfo {
  // user interactive mode: user action help us to fix the offset issue
  if (Utils.isNullOrUndefined(pageWindowOffsetX) || Utils.isNullOrUndefined(pageWindowOffsetY)) {
    throw new Error('pageWindowOffsetX & pageWindowOffsetY is not valid');
  }

  const pageRect: Partial<RectInfo> = {};
  const devicePixelRatio = window.devicePixelRatio;
  const deviceScaleFactor = window.devicePixelRatio / pageZoomFactor;
  pageRect.left = window.screenX * deviceScaleFactor + pageWindowOffsetX;
  pageRect.top = window.screenY * deviceScaleFactor + pageWindowOffsetY;

  pageRect.right = pageRect.left + window.innerWidth * devicePixelRatio;
  pageRect.bottom = pageRect.top + window.innerHeight * devicePixelRatio;

  pageRect.left = Math.floor(pageRect.left);
  pageRect.top = Math.floor(pageRect.top);
  pageRect.right = Math.ceil(pageRect.right);
  pageRect.bottom = Math.ceil(pageRect.bottom);

  return Utils.fixRectangle(pageRect);
}

/** check if the page is in full screen mode */
export function isFullscreen(): boolean {
  return !!(document.fullscreenElement);
  // Support all major browsers (including prefixes for Safari/IE)
  // document.fullscreenElement ||
  // document.webkitFullscreenElement || // Safari
  // document.msFullscreenElement ||     // IE/Edge (legacy)
  // document.mozFullscreenElement       // Firefox (legacy)
}

/** check if the page is minimized or inactive */
export function isBrowserMinimizedOrInactive(): boolean {
  return document.hidden;
}

/** check if the page is maximized, not very reliable */
export function isBrowserMaximized(tolerance = 0): boolean {
  // Skip check if in fullscreen (fullscreen is a separate state)
  if (isFullscreen()) return false;

  // screenX and screenY may be affected by the system toolbar
  // (window.screenX === 0) && (window.screenY === 0)
  // if scale is not 100%, the following check also fail because the outerWidth and outerHeight will be changed
  // (window.outerWidth === window.screen.availWidth) && (window.outerHeight === window.screen.availHeight)

  // Compare window dimensions to available screen space (with tolerance)
  const widthMatch = Math.abs(window.outerWidth - window.screen.availWidth) <= tolerance;
  const heightMatch = Math.abs(window.outerHeight - window.screen.availHeight) <= tolerance;

  return widthMatch && heightMatch;
}

/**
 * Calculate the bound size based on the known scales and bounds
 * @param {number} scale - the start index
 * @param {number} scales - the known scales array
 * @param {number} bounds - the known bounds array
 * @returns the bound size
 */
export function calculateBound(scale: number, scales: number[], bounds: number[]): number {
  let bound = 8;
  if (scale > scales[scales.length - 1] || scale < scales[0]) {
    throw new Error('the given scale exceeded the known bounds');
  }
  for (let i = 0; i < scales.length; i++) {
    const cur = scales[i];
    const next = scales[i + 1] || cur;
    if (scale > next) {
      continue;
    }
    const deltaCur = Math.abs(scale - cur);
    const deltaNext = Math.abs(next - scale);
    if (deltaCur <= deltaNext) {
      bound = bounds[i];
      break;
    } else {
      bound = bounds[i + 1] || bounds[i];
      break;
    }
  }
  return bound;
}

export function calculatePagePadding(scale: number): number {
  const browserInfo = BrowserUtils.getBrowserInfo();
  if (browserInfo.name === 'edge') {
    return calculateEdgePagePadding(scale);
  }
  return 0;
}

export function calculateEdgePagePadding(scale: number): number {
  if (scale === 1) {
    return 4;
  }
  const scales = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4];
  const paddings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const padding = calculateBound(scale, scales, paddings);
  return padding;
};

export function calculatePageBorder(scale: number): number {
  if (scale === 1) {
    return 8;
  }
  const scales = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4];
  const borders = [4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23];
  const border = calculateBound(scale, scales, borders);
  return border;
}

export function getPageRect(pageZoomFactor: number, isMaximized?: boolean, desktopScaleFactor?: number): RectInfo {
  const pageRect: Partial<RectInfo> = {};
  const devicePixelRatio = window.devicePixelRatio;
  // device scale factor describe the scale factor for the window but not the page
  // it can be set by launching chrome with --force-device-scale-factor or auto inherit the desktop scale factor (DEVICE_SCALE_FACTOR)
  // devicePixelRatio = pageZoomFactor * deviceScaleFactor
  const deviceScaleFactor = window.devicePixelRatio / pageZoomFactor;
  // if user use --force-device-scale-factor, the desktopScaleFactor != deviceScaleFactor
  // by default, assume the desktopScaleFactor = deviceScaleFactor
  desktopScaleFactor = desktopScaleFactor ?? deviceScaleFactor;

  if (isMaximized === undefined || isMaximized === null) {
    isMaximized = isBrowserMaximized();
  }
  const paddingPixels = calculatePagePadding(deviceScaleFactor);
  const borderPixels = calculatePageBorder(deviceScaleFactor);
  const screenX_maximized_browser = 0 - calculatePageBorder(desktopScaleFactor);

  if (isMaximized) {
    pageRect.left = screenX_maximized_browser + borderPixels + paddingPixels;
  } else {
    pageRect.left = window.screenX * deviceScaleFactor + borderPixels + paddingPixels;
  }

  let deltaHeight = window.outerHeight * deviceScaleFactor - window.innerHeight * devicePixelRatio;
  if (deltaHeight < 0) {
    deltaHeight = 0;
  }
  // outerHeight = innerHeight + banner + border*2 + padding*2
  // deltaHeight = outerHeight - innerHeight = banner + border*2 + padding*2
  // top = screenY + border + banner + padding = screenY + deltaHeight - border - padding
  if (isMaximized) {
    const adjustedBorderPixels = screenX_maximized_browser + borderPixels;
    pageRect.top = window.screenY * deviceScaleFactor + deltaHeight - adjustedBorderPixels - paddingPixels;
  } else {
    pageRect.top = window.screenY * deviceScaleFactor + deltaHeight - borderPixels - paddingPixels;
  }

  pageRect.right = pageRect.left + window.innerWidth * devicePixelRatio;
  pageRect.bottom = pageRect.top + window.innerHeight * devicePixelRatio;

  // Math.floor
  pageRect.left = Math.floor(pageRect.left);
  pageRect.top = Math.floor(pageRect.top);
  pageRect.right = Math.ceil(pageRect.right);
  pageRect.bottom = Math.ceil(pageRect.bottom);

  return Utils.fixRectangle(pageRect);
}
