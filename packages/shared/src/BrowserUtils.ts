/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file BrowserUtils.ts
 * @description 
 * Shared utility classes and functions
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

/**
 * Browser detection result interface
 */
export interface BrowserInfo {
  name: 'chrome' | 'edge' | 'firefox' | 'safari' | 'unknown';
  version: string;
  majorVersion: number;
};

/** the device scale factor is decided by --force-device-scale-factor or same as the desktop scale */
export const deviceScaleFactor: number | undefined = undefined;
/**
 * Detects the current browser name and version
 * Compatible with Chrome, Edge, Firefox, and Safari
 * @returns BrowserInfo object containing name, version, and major version
 */
export function getBrowserInfo(): BrowserInfo {
  const result: BrowserInfo = {
    name: 'unknown',
    version: 'unknown',
    majorVersion: 0
  };

  const userAgent = navigator.userAgent.toLowerCase();
  const vendor = navigator.vendor?.toLowerCase() || '';

  // Helper to extract major version from a version string
  const getMajorVersion = (versionStr: string): number => {
    if (!versionStr || versionStr === 'unknown') return 0;
    const majorStr = versionStr.split('.')[0];
    return parseInt(majorStr, 10) || 0;
  };

  // 1. Detect Firefox (fixed regex for full version)
  if (userAgent.includes('firefox')) {
    result.name = 'firefox';
    // Regex: Capture "129", "129.0", or "129.0.1" (no mandatory dot)
    const match = userAgent.match(/firefox\/(\d+(?:\.\d+)*)/);
    if (match?.[1]) {
      result.version = match[1];
      result.majorVersion = getMajorVersion(result.version);
    }
    return result;
  }

  // 2. Detect Edge (simplified regex + unified version capture)
  if (userAgent.includes('edg') || userAgent.includes('edge')) {
    result.name = 'edge';
    // New Edge: Matches "edg/128.0.2739.50" (no space check)
    const newEdgeMatch = userAgent.match(/edg\/(\d+(?:\.\d+)*)/);
    // Legacy Edge: Matches "edge/13.10586"
    const legacyEdgeMatch = userAgent.match(/edge\/(\d+(?:\.\d+)*)/);
    // Use new Edge first, fall back to legacy
    const match = newEdgeMatch || legacyEdgeMatch;

    if (match?.[1]) {
      result.version = match[1]; // Unified capture group (group 1 for both)
      result.majorVersion = getMajorVersion(result.version);
    }
    return result;
  }

  // 3. Detect Safari (fixed regex for full version)
  if (vendor.includes('apple') && userAgent.includes('safari') && !userAgent.includes('chrome')) {
    result.name = 'safari';
    // Regex: Capture "17", "17.6", or "17.6.1"
    const match = userAgent.match(/version\/(\d+(?:\.\d+)*)/);
    if (match?.[1]) {
      result.version = match[1];
      result.majorVersion = getMajorVersion(result.version);
    }
    return result;
  }

  // 4. Detect Chrome (fixed regex for full version)
  if (userAgent.includes('chrome') && vendor.includes('google')) {
    result.name = 'chrome';
    // Regex: Capture "128", "128.0", or "128.0.0.0"
    const match = userAgent.match(/chrome\/(\d+(?:\.\d+)*)/);
    if (match?.[1]) {
      result.version = match[1];
      result.majorVersion = getMajorVersion(result.version);
    }
    return result;
  }

  // Extract major version (robust to edge cases)
  if (result.version !== 'unknown') {
    result.majorVersion = getMajorVersion(result.version);
  }

  return result;
}

export function isWindows(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();

  // Common Windows identifiers in userAgent or platform
  return (
    userAgent.includes('windows') ||
    platform.includes('win32') ||
    platform.includes('win64')
  );
}

// Check if the platform is macOS
export function isMacOS(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();

  // Common macOS identifiers in userAgent or platform
  return (
    userAgent.includes('macintosh') ||
    userAgent.includes('mac os x') ||
    platform.includes('mac')
  );
}

