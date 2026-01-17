/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Settings.ts
 * @description 
 * Shared utility classes for settings
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

import * as Utils from "./Utils";
import * as StorageUtils from "./StorageUtils";

export interface AISettings {
  apiKey: string;
  baseURL: string;
  models: string;
}

export interface ReplaySettings {
  attachDebugger: boolean;
  autoSync: boolean;
  autoActionCheck: boolean;
  inputMode: 'auto' | 'event' | 'cdp';
  stepTimeout: number;
  stepInterval: number;
  locatorTimeout: number;
  captureScreenshot: boolean;
}

export interface RecordSettings {
  recordNavigation: boolean;
}

export interface Settings {
  storeURL: string;
  logLevel: 'TRACE' | 'DEBUG' | 'LOG' | 'INFO' | 'WARN' | 'ERROR';
  aiSettings: AISettings;
  replaySettings: ReplaySettings;
  recordSettings: RecordSettings;
}

function getDefaultSettings(): Settings {
  return {
    storeURL: '',
    logLevel: 'WARN',
    aiSettings: {
      baseURL: '',
      apiKey: '',
      models: ''
    },
    replaySettings: {
      attachDebugger: true,
      autoSync: true,
      autoActionCheck: true,
      inputMode: 'auto',
      stepTimeout: 300000,
      stepInterval: 1000,
      locatorTimeout: 5000,
      captureScreenshot: false
    },
    recordSettings: {
      recordNavigation: true
    }
  };
}

function isSettings(data: unknown): data is Settings {
  if (Utils.isNullOrUndefined(data)) {
    return false;
  }
  const settings = data as Record<string, unknown>;
  const defaultSettings = getDefaultSettings();
  Utils.fillWithDefaultValues(settings, defaultSettings);
  const checks = [
    typeof settings.storeURL === 'string',
    typeof settings.logLevel === 'string' && ['TRACE', 'DEBUG', 'LOG', 'INFO', 'WARN', 'ERROR'].includes(settings.logLevel),
    typeof settings.aiSettings === 'object',
    typeof settings.replaySettings === 'object',
    typeof settings.recordSettings === 'object',
  ];
  if (checks.some(c => !c)) {
    return false;
  }

  const check_aiSettings = [
    typeof (settings.aiSettings as AISettings).apiKey === 'string',
    typeof (settings.aiSettings as AISettings).baseURL === 'string',
    typeof (settings.aiSettings as AISettings).models === 'string',
  ];
  if (check_aiSettings.some(c => !c)) {
    return false;
  }

  const check_replaySettings = [
    typeof (settings.replaySettings as ReplaySettings).attachDebugger === 'boolean',
    typeof (settings.replaySettings as ReplaySettings).autoSync === 'boolean',
    typeof (settings.replaySettings as ReplaySettings).autoActionCheck === 'boolean',
    typeof (settings.replaySettings as ReplaySettings).inputMode === 'string' && ['auto', 'event', 'cdp'].includes((settings.replaySettings as ReplaySettings).inputMode),
    typeof (settings.replaySettings as ReplaySettings).stepTimeout === 'number',
    typeof (settings.replaySettings as ReplaySettings).stepInterval === 'number',
    typeof (settings.replaySettings as ReplaySettings).locatorTimeout === 'number',
    typeof (settings.replaySettings as ReplaySettings).captureScreenshot === 'boolean'
  ];
  if (check_replaySettings.some(c => !c)) {
    return false;
  }

  const check_recordSettings = [
    typeof (settings.recordSettings as RecordSettings).recordNavigation === 'boolean',
  ];
  if (check_recordSettings.some(c => !c)) {
    return false;
  }

  return true;
}

function parse2Settings(text: string): Settings | null {
  try {
    const settings = JSON.parse(text) as unknown;
    if (!isSettings(settings)) {
      return null;
    }
    return settings as Settings;
  } catch (error) {
    console.error('parse2Settings Error:', error, ' text:', text);
    return null;
  }
}

interface InternalSettingsCache {
  settings: Settings;
  onChangedListener?: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => void;
}

const cachedSettings: InternalSettingsCache = {
  settings: getDefaultSettings()
};

export const SettingUtils = {
  isSettings: isSettings,
  parse2Settings: parse2Settings,
  async init(): Promise<void> {
    try {
      if (!cachedSettings.onChangedListener) {
        cachedSettings.onChangedListener = (changes, areaName): void => {
          if (areaName !== 'local') {
            return;
          }
          if ('settings' in changes) {
            const newValue = changes['settings'].newValue;
            if (newValue && typeof newValue === 'string') {
              const newSettings = parse2Settings(newValue);
              if (newSettings) {
                cachedSettings.settings = newSettings;
              }
            }
            else {
              cachedSettings.settings = getDefaultSettings();
            }
          }
        };
        StorageUtils.AddOnChangedListener(cachedSettings.onChangedListener);
      }
      await SettingUtils.load();
    } catch (error) {
      console.error('init Error:', error);
    }
  },
  async load(data?: Settings): Promise<Settings | undefined> {
    try {
      if (data && isSettings(data)) {
        const newSettings = data as Settings;
        cachedSettings.settings = newSettings;
      }
      else {
        const result = await StorageUtils.get('settings');
        if (result) {
          const newSettings = parse2Settings(result);
          if (newSettings) {
            cachedSettings.settings = newSettings;
          }
        }
      }
      return cachedSettings.settings;
    } catch (error) {
      console.error('load Error:', error, ' data:', data);
      return cachedSettings.settings;
    }
  },
  async save(settings?: Settings): Promise<Settings> {
    try {
      if (settings && !isSettings(settings)) {
        throw new Error('Invalid Settings');
      }
      settings = settings || cachedSettings.settings;
      const strValue = JSON.stringify(settings, null, 2);
      await StorageUtils.set('settings', strValue);
      cachedSettings.settings = settings;
      return cachedSettings.settings;
    } catch (error) {
      console.error('save Error:', error, ' settings:', settings);
      return cachedSettings.settings;
    }
  },
  getSettings(): Settings {
    return cachedSettings.settings;
  },
  getStoreURL(): string {
    return cachedSettings.settings.storeURL;
  },
  getLogLevel(): string {
    return cachedSettings.settings.logLevel;
  },
  getReplaySettings(): ReplaySettings {
    return cachedSettings.settings.replaySettings;
  },
  getRecordSettings(): RecordSettings {
    return cachedSettings.settings.recordSettings;
  }
}
