/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file CDPOverlay.ts
 * @description 
 * Provide wrapper class for Overlay in Chrome DevTool Protocol APIs
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

import { ChromeDevToolsProtocol } from "./ChromeDevToolsProtocol";

/**
 * Wrapper for CDP Overlay operations.
 * Provides methods for visual overlays (e.g., highlighting).
 */
export class CDPOverlay {
  private _tabId: number;
  private _cdp: ChromeDevToolsProtocol;

  /**
   * Create an overlay controller for a tab.
   * @param tabId - Tab ID to control
   * @param cdp - CDP instance
   */
  constructor(tabId: number, cdp: ChromeDevToolsProtocol) {
    this._tabId = tabId;
    this._cdp = cdp;
  }

  /**
   * Enters the 'inspect' mode. In this mode, elements that user is hovering over are highlighted. 
   * Backend then generates 'inspectNodeRequested' event upon element selection.
   * @param mode Set an inspection mode
   */
  async setInspectMode(mode: 'searchForNode' | 'searchForUAShadowDOM' | 'captureAreaScreenshot' | 'none' = 'searchForNode'): Promise<void> {
    const targets = await this._cdp.getTargets(this._tabId);
    targets.reverse();
    for (const target of targets) {
      if (!target.session) continue;
      await this._cdp.sendCommand(target.session, "Overlay.setInspectMode", {
        mode: mode,
        highlightConfig: {
          showInfo: true,
          showStyles: true,
          showRulers: false,
          showAccessibilityInfo: true,
          showExtensionLines: false,
          contentColor: { r: 18, g: 110, b: 198, a: 0.4 },
          paddingColor: { r: 108, g: 170, b: 78, a: 0.4 },
          borderColor: { r: 255, g: 210, b: 10, a: 0.4 },
          marginColor: { r: 240, g: 125, b: 10, a: 0.4 },
        }
      });
    }
  }

  /**
   * Highlight a rectangle using the Overlay domain.
   * @param rect - Rectangle coordinates and style
   */
  async highlightRect(
    rect: unknown
  ): Promise<void> {
    // default color picked from chrome:
    // Formula for foreground color: 
    // c_final = (1-a)*c_background + a*c_foreground
    // c_background = #FFFFFF = rgb(255, 255, 255)
    // c_foreground = (c_final - (1-a)*c_background)/a
    // 1. inspected item:c_final = #A0C5E8 rgb(160, 197, 232), c_foreground = rgba(18, 110, 198, 0.4)
    // 2: padding: c_final = #C4DDB8 rgb(196, 221, 184), c_foreground = rgba(108, 170, 78, 0.4)
    // 3: border: c_final = #FFEDBC rgb(255, 237, 188) , c_foreground = rgba(255, 210, 88, 0.4)
    // 4: margin: c_final = #F9CB9D rgb(249, 203, 157), c_foreground = rgba(240, 125, 10, 0.4)
    const rectWithDefaults = {
      outlineColor: { r: 18, g: 110, b: 198, a: 0 },
      color: { r: 18, g: 110, b: 198, a: 0.4 },
      ...rect as any
    };
    await this._cdp.sendCommand(this._tabId, "Overlay.highlightRect", rectWithDefaults);
  }

  /**
   * Hide any active overlay highlight.
   */
  async hideHighlight(): Promise<void> {
    await this._cdp.sendCommand(this._tabId, "Overlay.hideHighlight", undefined);
  }
};