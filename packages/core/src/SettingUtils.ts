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

export class SettingUtils {
  // bypass the lint error
  // error  Unexpected class with only static properties  @typescript-eslint/no-extraneous-class
  doNothing(): void { }

  private static settings: Settings = SettingUtils.defaultSettings();
  private static onChangedListener: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => void;

  static isSettings(data: unknown): data is Settings {
    if (Utils.isNullOrUndefined(data)) {
      return false;
    }
    const settings = data as Record<string, unknown>;
    const defaultSettings = SettingUtils.defaultSettings();
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

  static parse2Settings(text: string): Settings | null {
    try {
      const settings = JSON.parse(text) as unknown;
      if (!SettingUtils.isSettings(settings)) {
        return null;
      }
      return settings as Settings;
    } catch (error) {
      console.error('parse2Settings Error:', error, ' text:', text);
      return null;
    }
  }

  static defaultSettings(): Settings {
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

  static async init(): Promise<void> {
    try {
      if (!SettingUtils.onChangedListener) {
        SettingUtils.onChangedListener = (changes, areaName): void => {
          if (areaName !== 'local') {
            return;
          }
          if ('settings' in changes) {
            const newValue = changes['settings'].newValue;
            if (newValue && typeof newValue === 'string') {
              const newSettings = SettingUtils.parse2Settings(newValue);
              if (newSettings) {
                SettingUtils.settings = newSettings;
              }
            }
            else {
              SettingUtils.settings = SettingUtils.defaultSettings();
            }
          }
        };
        StorageUtils.AddOnChangedListener(SettingUtils.onChangedListener);
      }
      await SettingUtils.load();
    } catch (error) {
      console.error('init Error:', error);
    }
  }

  static async load(data?: Settings): Promise<Settings | undefined> {
    try {
      if (data && SettingUtils.isSettings(data)) {
        const newSettings = data as Settings;
        SettingUtils.settings = newSettings;
      }
      else {
        const result = await StorageUtils.get('settings');
        if (result) {
          const newSettings = SettingUtils.parse2Settings(result);
          if (newSettings) {
            SettingUtils.settings = newSettings;
          }
        }
      }
      return SettingUtils.settings;
    } catch (error) {
      console.error('load Error:', error, ' data:', data);
      return SettingUtils.settings;
    }
  }

  static async save(settings?: Settings): Promise<Settings> {
    try {
      if (settings && !SettingUtils.isSettings(settings)) {
        throw new Error('Invalid Settings');
      }
      settings = settings || SettingUtils.settings;
      const strValue = JSON.stringify(settings, null, 2);
      await StorageUtils.set('settings', strValue);
      SettingUtils.settings = settings;
      return SettingUtils.settings;
    } catch (error) {
      console.error('save Error:', error, ' settings:', settings);
      return SettingUtils.settings;
    }
  }

  static getSettings(): Settings {
    return SettingUtils.settings;
  }

  static getStoreURL(): string {
    return SettingUtils.settings.storeURL;
  }

  static getLogLevel(): string {
    return SettingUtils.settings.logLevel;
  }

  static getReplaySettings(): ReplaySettings {
    return SettingUtils.settings.replaySettings;
  }

  static getRecordSettings(): RecordSettings {
    return SettingUtils.settings.recordSettings;
  }
}
