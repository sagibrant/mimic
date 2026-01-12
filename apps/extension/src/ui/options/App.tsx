import React, { useState, useEffect } from 'react';
import { Utils, Settings, SettingUtils, CryptoUtil } from "@gogogo/shared";

// Define notification interface
interface Notification {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Settings state
  const [settings, setSettings] = useState<Settings>(SettingUtils.getSettings());

  const [originalSettings, setOriginalSettings] = useState<Settings>(Utils.deepClone(SettingUtils.getSettings()));

  // sub settings text
  const [replaySettings, setReplaySettings] = useState<string>(JSON.stringify(settings.replaySettings, null, 2));
  const [recordSettings, setRecordSettings] = useState<string>(JSON.stringify(settings.recordSettings, null, 2));

  // Notification state
  const [notification, setNotification] = useState<Notification>({
    visible: false,
    message: '',
    type: 'info'
  });

  // Translation function
  const t = (key: string): string => {
    return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
  };

  // Initialize component
  useEffect(() => {
    // Initialize theme based on system preferences
    updateTheme();

    // Setup theme change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => updateTheme();
    mediaQuery.addEventListener('change', handleThemeChange);

    // Cleanup event listener
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  /**
   * Update theme class based on system preference
   */
  const updateTheme = () => {
    document.documentElement.classList.toggle('dark-theme',
      window.matchMedia('(prefers-color-scheme: dark)').matches);
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

      // encrypt the sensitive values before storage
      if (newSettings.aiSettings.apiKey) {
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
    } catch (e) {
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
      const check = [
        typeof settings.recordNavigation === 'boolean',
      ];
      if (check.some(c => !c)) {
        return null;
      }
      return settings;
    } catch (e) {
      return null;
    }
  };

  /**
   * Show notification using snackbar
   */
  const showNotification = (message: string, type: 'success' | 'error' | 'info'): void => {
    setNotification({
      visible: true,
      message,
      type
    });

    // Hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  return (
    <div className="settings-container">
      <h1>{t('options_label_settings')}</h1>

      <form onSubmit={saveSettings}>
        {/* Store URL Field */}
        <div className="settings-group">
          <label className="setting-label" htmlFor="storeURL">
            {t('options_label_storeURL')}
          </label>
          <div className="input-container">
            <input
              id="storeURL"
              value={settings.storeURL}
              onChange={(e) => setSettings(prev => ({ ...prev, storeURL: e.target.value }))}
              type="url"
              className="setting-input"
              placeholder={t('options_placeholder_storeURL')}
            />
          </div>
        </div>

        {/* AI BaseURL Field */}
        <div className="settings-group">
          <label className="setting-label" htmlFor="ai_baseURL">
            {t('options_label_ai_baseURL')}
          </label>
          <div className="input-container">
            <input
              id="ai_baseURL"
              value={settings.aiSettings.baseURL}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                aiSettings: { ...prev.aiSettings, baseURL: e.target.value }
              }))}
              type="url"
              className="setting-input"
              placeholder={t('options_placeholder_ai_baseURL')}
            />
          </div>
        </div>

        {/* AI Models Field */}
        <div className="settings-group">
          <label className="setting-label" htmlFor="ai_models">
            {t('options_label_ai_models')}
          </label>
          <div className="input-container">
            <input
              id="ai_models"
              value={settings.aiSettings.models}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                aiSettings: { ...prev.aiSettings, models: e.target.value }
              }))}
              type="text"
              className="setting-input"
              placeholder={t('options_placeholder_ai_models')}
            />
          </div>
        </div>

        {/* AI API Key Field */}
        <div className="settings-group">
          <label className="setting-label" htmlFor="ai_apiKey">
            {t('options_label_ai_apiKey')}
          </label>
          <div className="input-container">
            <input
              id="ai_apiKey"
              value={settings.aiSettings.apiKey}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                aiSettings: { ...prev.aiSettings, apiKey: e.target.value }
              }))}
              type="password"
              className="setting-input"
              placeholder={t('options_placeholder_ai_apiKey')}
            />
          </div>
        </div>

        {/* Log Level Select */}
        <div className="settings-group">
          <label className="setting-label" htmlFor="logLevel">
            {t('options_label_logLevel')}
          </label>
          <div className="select-container">
            <select
              id="logLevel"
              value={settings.logLevel}
              onChange={(e) => setSettings(prev => ({ ...prev, logLevel: e.target.value as any }))}
              className="setting-select"
            >
              <option value="TRACE">TRACE</option>
              <option value="DEBUG">DEBUG</option>
              <option value="LOG">LOG</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
            <div className="select-arrow"></div>
          </div>
        </div>

        {/* Replay Settings */}
        <div className="settings-group">
          <label className="setting-label" htmlFor="replaySettings">
            {t('options_label_replaySettings')}
          </label>
          <div className="textarea-container">
            <textarea
              id="replaySettings"
              value={replaySettings}
              onChange={(e) => setReplaySettings(e.target.value)}
              className="setting-textarea"
              rows={5}
              placeholder={t('options_placeholder_json')}
            ></textarea>
          </div>
        </div>

        {/* Record Settings */}
        <div className="settings-group">
          <label className="setting-label" htmlFor="recordSettings">
            {t('options_label_recordSettings')}
          </label>
          <div className="textarea-container">
            <textarea
              id="recordSettings"
              value={recordSettings}
              onChange={(e) => setRecordSettings(e.target.value)}
              className="setting-textarea"
              rows={5}
              placeholder={t('options_placeholder_json')}
            ></textarea>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button type="submit" className="btn btn-primary">
            {t('options_btn_label_apply')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetSettings}>
            {t('options_btn_label_reset')}
          </button>
        </div>
      </form>

      {/* Notification Snackbar */}
      <div
        className={`snackbar ${notification.visible ? 'snackbar-visible' : ''} ${notification.type === 'success' ? 'snackbar-success' : ''} ${notification.type === 'error' ? 'snackbar-error' : ''} ${notification.type === 'info' ? 'snackbar-info' : ''}`}
      >
        {notification.message}
      </div>
    </div>
  );
};
