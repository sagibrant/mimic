/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file BrowserWrapperTypes.ts
 * @description 
 * Provide wrapped types based on types defined in chrome extension api 
 * We wrapper the known types again so that we can use it crossing the browser types
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

/** ==================================================================================================================== */
/** ================================================== Wrapper types =================================================== */
/** ==================================================================================================================== */

/**
 * the wrapper interface for chrome.tabs.Tab
 */
export interface TabInfo {
  /** The tab's loading status. */
  status?: `${TabStatus}` | undefined;
  /** The zero-based index of the tab within its window. */
  index: number;
  /** The ID of the tab that opened this tab, if any. This property is only present if the opener tab still exists. */
  openerTabId?: number | undefined;
  /** The title of the tab. This property is only present if the extension has the `"tabs"` permission or has host permissions for the page. */
  title?: string | undefined;
  /** The last committed URL of the main frame of the tab. This property is only present if the extension has the `"tabs"` permission or has host permissions for the page. May be an empty string if the tab has not yet committed. See also {@link Tab.pendingUrl}. */
  url?: string | undefined;
  /**
   * The URL the tab is navigating to, before it has committed. This property is only present if the extension has the `"tabs"` permission or has host permissions for the page and there is a pending navigation.
   * @since Chrome 79
   */
  pendingUrl?: string | undefined;
  /** Whether the tab is pinned. */
  pinned: boolean;
  /** Whether the tab is highlighted. */
  highlighted: boolean;
  /** The ID of the window that contains the tab. */
  windowId: number;
  /** Whether the tab is active in its window. Does not necessarily mean the window is focused. */
  active: boolean;
  /** The URL of the tab's favicon. This property is only present if the extension has the `tabs` permission or has host permissions for the page. It may also be an empty string if the tab is loading. */
  favIconUrl?: string | undefined;
  /**
   * Whether the tab is frozen. A frozen tab cannot execute tasks, including event handlers or timers. It is visible in the tab strip and its content is loaded in memory. It is unfrozen on activation.
   * @since Chrome 132
   */
  frozen: boolean;
  /** The ID of the tab. Tab IDs are unique within a browser session. Under some circumstances a tab may not be assigned an ID; for example, when querying foreign tabs using the {@link sessions} API, in which case a session ID may be present. Tab ID can also be set to `chrome.tabs.TAB_ID_NONE` for apps and devtools windows. */
  id?: number | undefined;
  /** Whether the tab is in an incognito window. */
  incognito: boolean;
  /**
   * Whether the tab is selected.
   * @deprecated since Chrome 33. Please use {@link Tab.highlighted}.
   */
  selected: boolean;
  /**
   * Whether the tab has produced sound over the past couple of seconds (but it might not be heard if also muted). Equivalent to whether the 'speaker audio' indicator is showing.
   * @since Chrome 45
   */
  audible?: boolean | undefined;
  /**
   * Whether the tab is discarded. A discarded tab is one whose content has been unloaded from memory, but is still visible in the tab strip. Its content is reloaded the next time it is activated.
   * @since Chrome 54
   */
  discarded: boolean;
  /**
   * Whether the tab can be discarded automatically by the browser when resources are low.
   * @since Chrome 54
   */
  autoDiscardable: boolean;
  /**
   * The tab's muted state and the reason for the last state change.
   * @since Chrome 46
   */
  mutedInfo?: MutedInfo | undefined;
  /** The width of the tab in pixels. */
  width?: number | undefined;
  /** The height of the tab in pixels. */
  height?: number | undefined;
  /** The session ID used to uniquely identify a tab obtained from the {@link sessions} API. */
  sessionId?: string | undefined;
  /**
   * The ID of the group that the tab belongs to.
   * @since Chrome 88
   */
  groupId: number;
  /**
   * The last time the tab became active in its window as the number of milliseconds since epoch.
   * @since Chrome 121
   */
  lastAccessed?: number | undefined;
}
/** The tab's loading status. */
export enum TabStatus {
  UNLOADED = "unloaded",
  LOADING = "loading",
  COMPLETE = "complete",
}

/**
* The tab's muted state and the reason for the last state change.
* @since Chrome 46
*/
export interface MutedInfo {
  /** Whether the tab is muted (prevented from playing sound). The tab may be muted even if it has not played or is not currently playing sound. Equivalent to whether the 'muted' audio indicator is showing. */
  muted: boolean;
  /* The reason the tab was muted or unmuted. Not set if the tab's mute state has never been changed. */
  reason?: `${MutedInfoReason}` | undefined;
  /** The ID of the extension that changed the muted state. Not set if an extension was not the reason the muted state last changed. */
  extensionId?: string | undefined;
}

/**
 * An event that caused a muted state change.
 * @since Chrome 46
 */
export enum MutedInfoReason {
  /** A user input action set the muted state. */
  USER = "user",
  /** Tab capture was started, forcing a muted state change. */
  CAPTURE = "capture",
  /** An extension set the muted state. */
  EXTENSION = "extension",
}

/** The type of window. */
export enum WindowType {
  NORMAL = "normal",
  POPUP = "popup",
  PANEL = "panel",
  APP = "app",
  DEVTOOLS = "devtools",
}

/** Defines how zoom changes in a tab are handled and at what scope. */
export interface ZoomSettings {
  /** Defines how zoom changes are handled, i.e., which entity is responsible for the actual scaling of the page; defaults to `automatic`. */
  mode?: `${ZoomSettingsMode}` | undefined;
  /** Defines whether zoom changes persist for the page's origin, or only take effect in this tab; defaults to `per-origin` when in `automatic` mode, and `per-tab` otherwise. */
  scope?: `${ZoomSettingsScope}` | undefined;
  /**
   * Used to return the default zoom level for the current tab in calls to {@link tabs.getZoomSettings}.
   * @since Chrome 43
   */
  defaultZoomFactor?: number | undefined;
}

/**
 * Defines how zoom changes are handled, i.e., which entity is responsible for the actual scaling of the page; defaults to `automatic`.
 * @since Chrome 44
 */
export enum ZoomSettingsMode {
  /** Zoom changes are handled automatically by the browser. */
  AUTOMATIC = "automatic",
  /** Overrides the automatic handling of zoom changes. The `onZoomChange` event will still be dispatched, and it is the extension's responsibility to listen for this event and manually scale the page. This mode does not support `per-origin` zooming, and thus ignores the `scope` zoom setting and assumes `per-tab`. */
  MANUAL = "manual",
  /** Disables all zooming in the tab. The tab reverts to the default zoom level, and all attempted zoom changes are ignored. */
  DISABLED = "disabled",
}

/**
 * Defines whether zoom changes persist for the page's origin, or only take effect in this tab; defaults to `per-origin` when in `automatic` mode, and `per-tab` otherwise.
 * @since Chrome 44
 */
export enum ZoomSettingsScope {
  /** Zoom changes persist in the zoomed page's origin, i.e., all other tabs navigated to that same origin are zoomed as well. Moreover, `per-origin` zoom changes are saved with the origin, meaning that when navigating to other pages in the same origin, they are all zoomed to the same zoom factor. The `per-origin` scope is only available in the `automatic` mode. */
  PER_ORIGIN = "per-origin",
  /** Zoom changes only take effect in this tab, and zoom changes in other tabs do not affect the zooming of this tab. Also, `per-tab` zoom changes are reset on navigation; navigating a tab always loads pages with their `per-origin` zoom factors. */
  PER_TAB = "per-tab",
}

/**
 * the wrapper interface for chrome.windows.Window
 */
export interface WindowInfo {
  /** Array of {@link tabs.Tab} objects representing the current tabs in the window. */
  tabs?: TabInfo[] | undefined;
  /** The offset of the window from the top edge of the screen in pixels. In some circumstances a window may not be assigned a `top` property; for example, when querying closed windows from the {@link sessions} API. */
  top?: number | undefined;
  /** The height of the window, including the frame, in pixels. In some circumstances a window may not be assigned a `height` property, for example when querying closed windows from the {@link sessions} API. */
  height?: number | undefined;
  /** The width of the window, including the frame, in pixels. In some circumstances a window may not be assigned a `width` property; for example, when querying closed windows from the {@link sessions} API. */
  width?: number | undefined;
  /** The state of this browser window. */
  state?: `${WindowState}` | undefined;
  /** Whether the window is currently the focused window. */
  focused: boolean;
  /** Whether the window is set to be always on top. */
  alwaysOnTop: boolean;
  /** Whether the window is incognito. */
  incognito: boolean;
  /** The type of browser window this is. */
  type?: `${WindowType}` | undefined;
  /** The ID of the window. Window IDs are unique within a browser session. In some circumstances a window may not be assigned an `ID` property; for example, when querying windows using the {@link sessions} API, in which case a session ID may be present. */
  id?: number | undefined;
  /** The offset of the window from the left edge of the screen in pixels. In some circumstances a window may not be assigned a `left` property; for example, when querying closed windows from the {@link sessions} API. */
  left?: number | undefined;
  /** The session ID used to uniquely identify a window, obtained from the {@link sessions} API. */
  sessionId?: string | undefined;
}

/**
 * The state of this browser window. In some circumstances a window may not be assigned a `state` property; for example, when querying closed windows from the {@link sessions} API.
 * @since Chrome 44
 */
export enum WindowState {
  /** Normal window state (not minimized, maximized, or fullscreen). */
  NORMAL = "normal",
  /** Minimized window state. */
  MINIMIZED = "minimized",
  /** Maximized window state. */
  MAXIMIZED = "maximized",
  /** Fullscreen window state. */
  FULLSCREEN = "fullscreen",
  /** Locked fullscreen window state. This fullscreen state cannot be exited by user action and is available only to allowlisted extensions on Chrome OS. */
  LOCKED_FULLSCREEN = "locked-fullscreen",
}

/**
 * the wrapper interface to wrap the Frame struct
 */
export interface FrameInfo {
  /** The ID of the process runs the renderer for this tab. */
  processId?: number;
  /** The URL currently associated with this frame, if the frame identified by the frameId existed at one point in the given tab. The fact that an URL is associated with a given frameId does not imply that the corresponding frame still exists. */
  url: string;
  /** The ID of the tab in which the navigation is about to occur. */
  tabId: number;
  /** The ID of the frame. 0 indicates that this is the main frame; a positive value indicates the ID of a subframe. */
  frameId: number;
  /** The type of frame the navigation occurred in. */
  frameType?: "outermost_frame" | "fenced_frame" | "sub_frame";
  /** ID of frame that wraps the frame. Set to -1 of no parent frame exists. */
  parentFrameId?: number;
  /** A UUID of the document loaded. (This is not set for onBeforeNavigate callbacks.) */
  documentId?: string;
  /** A UUID of the parent document owning this frame. This is not set if there is no parent. */
  parentDocumentId?: string;
  /** True if the last navigation in this frame was interrupted by an error, i.e. the onErrorOccurred event fired. */
  errorOccurred?: boolean;
  /** child frames for this frame. */
  children?: FrameInfo[];
}