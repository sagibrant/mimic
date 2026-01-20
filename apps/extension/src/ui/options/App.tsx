/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file App.tsx
 * @description 
 * Options UI root component
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

import React, { useState } from 'react';
import { Utils, Settings, SettingUtils, CryptoUtil } from '@mimic-sdk/core';
import { ThemeProvider } from '../components/theme-provider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast, Toaster } from 'sonner';

export default function App() {
  // Settings state
  const [settings, setSettings] = useState<Settings>(SettingUtils.getSettings());

  const [originalSettings, setOriginalSettings] = useState<Settings>(Utils.deepClone(SettingUtils.getSettings()));

  // sub settings text
  const [replaySettings, setReplaySettings] = useState<string>(JSON.stringify(settings.replaySettings, null, 2));
  const [recordSettings, setRecordSettings] = useState<string>(JSON.stringify(settings.recordSettings, null, 2));

  // Translation function
  const t = (key: string): string => {
    return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
  };

  /**
   * Save settings directly to chrome.storage.local
   */
  const saveSettings = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      const newSettings = Utils.deepClone(settings);

      newSettings.replaySettings = parseReplaySettings(replaySettings);
      if (!newSettings.replaySettings) {
        showNotification(t('options_notification_invalidJsonReplay'), 'error');
        return;
      }

      newSettings.recordSettings = parseRecordSettings(recordSettings);
      if (!newSettings.recordSettings) {
        showNotification(t('options_notification_invalidJsonRecord'), 'error');
        return;
      }

      const newSettingsVal = JSON.stringify(newSettings, null, 2);
      if (SettingUtils.parse2Settings(newSettingsVal) === null) {
        throw new Error('The input settings are invalid.');
      }

      // if apiKey is same, we do not encrypt it again
      if (newSettings.aiSettings.apiKey !== originalSettings.aiSettings.apiKey) {
        // encrypt the sensitive values before storage
        newSettings.aiSettings.apiKey = await CryptoUtil.encrypt(newSettings.aiSettings.apiKey);
      }

      const result = await SettingUtils.save(newSettings);
      if (!result) {
        throw new Error('fail to save settings by calling SettingUtils.save');
      }

      setSettings(result);
      setOriginalSettings(Utils.deepClone(result));
      setRecordSettings(JSON.stringify(result.recordSettings, null, 2));
      setReplaySettings(JSON.stringify(result.replaySettings, null, 2));
      showNotification(t('options_notification_settingsSavedSuccessfully'), 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification(t('options_notification_failedToSaveSettings'), 'error');
    }
  };

  /**
   * Reset settings to original values
   */
  const resetSettings = (): void => {
    setSettings(Utils.deepClone(originalSettings));
    setRecordSettings(JSON.stringify(originalSettings.recordSettings, null, 2));
    setReplaySettings(JSON.stringify(originalSettings.replaySettings, null, 2));
    showNotification(t('options_notification_settingsReset'), 'info');
  };

  /**
   * Parse the replaySettings
   */
  const parseReplaySettings = (jsonString: string) => {
    try {
      if (!jsonString.trim()) return null;
      const settings = JSON.parse(jsonString);
      const check = [
        typeof settings.attachDebugger === 'boolean',
        typeof settings.autoSync === 'boolean',
        typeof settings.stepTimeout === 'number',
        typeof settings.stepInterval === 'number',
        typeof settings.captureScreenshot === 'boolean',
      ];
      if (check.some(c => !c)) {
        return null;
      }
      return settings;
    } catch {
      return null;
    }
  };

  /**
   * Parse the recordSettings
   */
  const parseRecordSettings = (jsonString: string) => {
    try {
      if (!jsonString.trim()) return null;
      const settings = JSON.parse(jsonString);
      const check = [typeof settings.recordNavigation === 'boolean'];
      if (check.some(c => !c)) {
        return null;
      }
      return settings;
    } catch {
      return null;
    }
  };

  /**
   * Show notification using sonner toast
   */
  const showNotification = (message: string, type: 'success' | 'error' | 'info'): void => {
    const fn = type === 'success' ? toast.success : type === 'error' ? toast.error : toast.info;
    fn(message, { duration: 3000 });
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="settings-container font-sans text-sm">
        <Toaster position="bottom-right" className="max-w-xs p-2 text-sm" />
        <h1>{t('options_label_settings')}</h1>

        <form onSubmit={saveSettings}>
          <div className="settings-group">
            <Label className="setting-label" htmlFor="storeURL">
              {t('options_label_storeURL')}
            </Label>
            <div className="input-container">
              <Input
                id="storeURL"
                value={settings.storeURL}
                onChange={e => setSettings(prev => ({ ...prev, storeURL: e.target.value }))}
                type="url"
                className="w-full"
                placeholder={t('options_placeholder_storeURL')}
              />
            </div>
          </div>

          <div className="settings-group">
            <Label className="setting-label" htmlFor="ai_baseURL">
              {t('options_label_ai_baseURL')}
            </Label>
            <div className="input-container">
              <Input
                id="ai_baseURL"
                value={settings.aiSettings.baseURL}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    aiSettings: { ...prev.aiSettings, baseURL: e.target.value },
                  }))
                }
                type="url"
                className="w-full"
                placeholder={t('options_placeholder_ai_baseURL')}
              />
            </div>
          </div>

          <div className="settings-group">
            <Label className="setting-label" htmlFor="ai_models">
              {t('options_label_ai_models')}
            </Label>
            <div className="input-container">
              <Input
                id="ai_models"
                value={settings.aiSettings.models}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    aiSettings: { ...prev.aiSettings, models: e.target.value },
                  }))
                }
                type="text"
                className="w-full"
                placeholder={t('options_placeholder_ai_models')}
              />
            </div>
          </div>

          <div className="settings-group">
            <Label className="setting-label" htmlFor="ai_apiKey">
              {t('options_label_ai_apiKey')}
            </Label>
            <div className="input-container">
              <Input
                id="ai_apiKey"
                value={settings.aiSettings.apiKey}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    aiSettings: { ...prev.aiSettings, apiKey: e.target.value },
                  }))
                }
                type="password"
                className="w-full"
                placeholder={t('options_placeholder_ai_apiKey')}
              />
            </div>
          </div>

          <div className="settings-group">
            <Label className="setting-label" htmlFor="logLevel">
              {t('options_label_logLevel')}
            </Label>
            <div className="select-container">
              <Select
                value={settings.logLevel}
                onValueChange={value => setSettings(prev => ({ ...prev, logLevel: value as Settings['logLevel'] }))}
              >
                <SelectTrigger className="w-full" id="logLevel">
                  <SelectValue placeholder="Select log level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRACE">TRACE</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="LOG">LOG</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="settings-group">
            <Label className="setting-label" htmlFor="replaySettings">
              {t('options_label_replaySettings')}
            </Label>
            <div className="textarea-container">
              <Textarea
                id="replaySettings"
                value={replaySettings}
                onChange={e => setReplaySettings(e.target.value)}
                rows={5}
                placeholder={t('options_placeholder_json')}
                className="w-full"
              />
            </div>
          </div>

          <div className="settings-group">
            <Label className="setting-label" htmlFor="recordSettings">
              {t('options_label_recordSettings')}
            </Label>
            <div className="textarea-container">
              <Textarea
                id="recordSettings"
                value={recordSettings}
                onChange={e => setRecordSettings(e.target.value)}
                rows={5}
                placeholder={t('options_placeholder_json')}
                className="w-full"
              />
            </div>
          </div>

          <div className="settings-actions">
            <Button type="submit">{t('options_btn_label_apply')}</Button>
            <Button type="button" variant="outline" onClick={resetSettings}>
              {t('options_btn_label_reset')}
            </Button>
          </div>
        </form>
      </div>
    </ThemeProvider>
  );
}
