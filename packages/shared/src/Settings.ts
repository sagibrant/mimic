/**
 * @copyright 2025 Sagi All Rights Reserved.
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

import { Utils } from "./Common";
import { StorageUtils } from "./Storage";

export interface Settings {
  storeURL: string;
  logLevel: 'TRACE' | 'DEBUG' | 'LOG' | 'INFO' | 'WARN' | 'ERROR';
  aiSettings: {
    apiKey: string;
    baseURL: string;
    models: string;
  };
  replaySettings: {
    attachDebugger: boolean;
    autoSync: boolean;
    autoActionCheck: boolean;
    inputMode: 'auto' | 'event' | 'cdp';
    stepTimeout: number;
    stepInterval: number;
    locatorTimeout: number;
    captureScreenshot: boolean;
  };
  recordSettings: {
    recordNavigation: boolean;
  };
}

export class SettingUtils {

  private static settings: Settings = SettingUtils.defaultSettings();
  private static onChangedListener: (changes: any, areaName: any) => void;

  public static isSettings(data: unknown): data is Settings {
    if (Utils.isNullOrUndefined(data)) {
      return false;
    }
    const settings = data as any;
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
      typeof settings.aiSettings.apiKey === 'string',
      typeof settings.aiSettings.baseURL === 'string',
      typeof settings.aiSettings.models === 'string',
    ];
    if (check_aiSettings.some(c => !c)) {
      return false;
    }

    const check_replaySettings = [
      typeof settings.replaySettings.attachDebugger === 'boolean',
      typeof settings.replaySettings.autoSync === 'boolean',
      typeof settings.replaySettings.autoActionCheck === 'boolean',
      typeof settings.replaySettings.inputMode === 'string' && ['auto', 'event', 'cdp'].includes(settings.replaySettings.inputMode),
      typeof settings.replaySettings.stepTimeout === 'number',
      typeof settings.replaySettings.stepInterval === 'number',
      typeof settings.replaySettings.locatorTimeout === 'number',
      typeof settings.replaySettings.captureScreenshot === 'boolean'
    ];
    if (check_replaySettings.some(c => !c)) {
      return false;
    }

    const check_recordSettings = [
      typeof settings.recordSettings.recordNavigation === 'boolean',
    ];
    if (check_recordSettings.some(c => !c)) {
      return false;
    }

    return true;
  }

  public static parse2Settings(text: string): Settings | null {
    try {
      const settings = JSON.parse(text);
      if (!SettingUtils.isSettings(settings)) {
        return null;
      }
      return settings as Settings;
    } catch (error) {
      console.error('parse2Settings Error:', error, ' text:', text);
      return null;
    }
  }

  public static defaultSettings(): Settings {
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
        SettingUtils.onChangedListener = (changes, areaName) => {
          if (areaName !== 'local') {
            return;
          }
          if ('settings' in changes) {
            const newValue = changes['settings'].newValue;
            if (newValue) {
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
    } catch (error) {
      console.error('load Error:', error, ' data:', data);
    }
    finally {
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
    } catch (error) {
      console.error('save Error:', error, ' settings:', settings);
    }
    finally {
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

  static getReplaySettings() {
    return SettingUtils.settings.replaySettings;
  }

  static getRecordSettings() {
    return SettingUtils.settings.recordSettings;
  }
}