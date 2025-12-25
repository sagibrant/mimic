<template>
  <div class="settings-container">
    <h1>{{ t('options_label_settings') }}</h1>

    <form @submit.prevent="saveSettings">
      <!-- Store URL Field -->
      <div class="settings-group">
        <label class="setting-label" for="storeURL">
          {{ t('options_label_storeURL') }}
        </label>
        <div class="input-container">
          <input id="storeURL" v-model="settings.storeURL" type="url" class="setting-input"
            :placeholder="t('options_placeholder_storeURL')">
        </div>
      </div>

      <!-- AI BaseURL Field -->
      <div class="settings-group">
        <label class="setting-label" for="ai_baseURL">
          {{ t('options_label_ai_baseURL') }}
        </label>
        <div class="input-container">
          <input id="ai_baseURL" v-model="settings.aiSettings.baseURL" type="url" class="setting-input"
            :placeholder="t('options_placeholder_ai_baseURL')">
        </div>
      </div>

      <!-- AI Models Field -->
      <div class="settings-group">
        <label class="setting-label" for="ai_models">
          {{ t('options_label_ai_models') }}
        </label>
        <div class="input-input">
          <input id="ai_models" v-model="settings.aiSettings.models" type="text" class="setting-input"
            :placeholder="t('options_placeholder_ai_models')">
        </div>
      </div>

      <!-- AI API Key Field -->
      <div class="settings-group">
        <label class="setting-label" for="ai_apiKey">
          {{ t('options_label_ai_apiKey') }}
        </label>
        <div class="input-container">
          <input id="ai_apiKey" v-model="settings.aiSettings.apiKey" type="password" class="setting-input"
            :placeholder="t('options_placeholder_ai_apiKey')">
        </div>
      </div>

      <!-- Log Level Select -->
      <div class="settings-group">
        <label class="setting-label" for="logLevel">
          {{ t('options_label_logLevel') }}
        </label>
        <div class="select-container">
          <select id="logLevel" v-model="settings.logLevel" class="setting-select">
            <option value="TRACE">TRACE</option>
            <option value="DEBUG">DEBUG</option>
            <option value="LOG">LOG</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
          <div class="select-arrow"></div>
        </div>
      </div>

      <!-- Replay Settings -->
      <div class="settings-group">
        <label class="setting-label" for="replaySettings">
          {{ t('options_label_replaySettings') }}
        </label>
        <div class="textarea-container">
          <textarea id="replaySettings" v-model="replaySettings" class="setting-textarea" rows="5"
            :placeholder="t('options_placeholder_json')"></textarea>
        </div>
      </div>

      <!-- Record Settings -->
      <div class="settings-group">
        <label class="setting-label" for="recordSettings">
          {{ t('options_label_recordSettings') }}
        </label>
        <div class="textarea-container">
          <textarea id="recordSettings" v-model="recordSettings" class="setting-textarea" rows="5"
            :placeholder="t('options_placeholder_json')"></textarea>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="settings-actions">
        <button type="submit" class="btn btn-primary">
          {{ t('options_btn_label_apply') }}
        </button>
        <button type="button" class="btn btn-secondary" @click="resetSettings">
          {{ t('options_btn_label_reset') }}
        </button>
      </div>
    </form>

    <!-- Notification Snackbar -->
    <div class="snackbar" :class="{
      'snackbar-visible': notification.visible,
      'snackbar-success': notification.type === 'success',
      'snackbar-error': notification.type === 'error',
      'snackbar-info': notification.type === 'info'
    }">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Utils, Settings, SettingUtils, CryptoUtil } from "@gogogo/shared";

// Define notification interface
interface Notification {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Settings
const settings = ref<Settings>(SettingUtils.getSettings());

// Store original settings for reset functionality
const originalSettings = ref<Settings>(Utils.deepClone(settings.value));

// sub settings text
const replaySettings = ref('');
const recordSettings = ref('');

// Notification state
const notification = ref<Notification>({
  visible: false,
  message: '',
  type: 'info'
});

// Translation function
const t = (key: string): string => {
  return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
};

// Initialize component
onMounted(() => {
  // Initialize theme based on system preferences
  updateTheme();

  // Setup theme change listener
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', updateTheme);

  // Load settings
  loadSettings();
});

/**
 * Update theme class based on system preference
 */
const updateTheme = () => {
  document.documentElement.classList.toggle('dark-theme',
    window.matchMedia('(prefers-color-scheme: dark)').matches);
};

/**
 * Load settings directly from chrome.storage.local
 */
const loadSettings = async (): Promise<void> => {
  try {
    const result = SettingUtils.getSettings();
    if (!result) {
      throw new Error('fail to load settings by calling SettingUtils.getSettings');
    }
    settings.value = result;
    originalSettings.value = Utils.deepClone(result);
    replaySettings.value = JSON.stringify(settings.value.replaySettings, null, 2);
    recordSettings.value = JSON.stringify(settings.value.recordSettings, null, 2);
  } catch (error) {
    console.error('Error loading settings:', error);
    showNotification(t('options_notification_failedToLoadSettings'), 'error');
  }
};

/**
 * Save settings directly to chrome.storage.local
 */
const saveSettings = async (): Promise<void> => {
  try {
    const newSettings = Utils.deepClone(settings.value);

    newSettings.replaySettings = parseReplaySettings(replaySettings.value);
    if (!newSettings.replaySettings) {
      showNotification(t('options_notification_invalidJsonReplay'), 'error');
      return;
    }

    newSettings.recordSettings = parseRecordSettings(recordSettings.value);
    if (!newSettings.recordSettings) {
      showNotification(t('options_notification_invalidJsonRecord'), 'error');
      return;
    }

    const newSettingsVal = JSON.stringify(newSettings, null, 2);
    if (SettingUtils.parse2Settings(newSettingsVal) === null) {
      throw new Error('The input settings are invalid.')
    }
    // encrypt the sensitive values before storage
    if (newSettings.aiSettings.apiKey) {
      newSettings.aiSettings.apiKey = await CryptoUtil.encrypt(newSettings.aiSettings.apiKey);
    }
    const result = await SettingUtils.save(newSettings);
    if (!result) {
      throw new Error('fail to save settings by calling SettingUtils.save');
    }

    settings.value = result;
    originalSettings.value = Utils.deepClone(result);
    recordSettings.value = JSON.stringify(settings.value.recordSettings, null, 2);
    replaySettings.value = JSON.stringify(settings.value.replaySettings, null, 2);
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
  settings.value = Utils.deepClone(originalSettings.value);
  recordSettings.value = JSON.stringify(settings.value.recordSettings, null, 2);
  replaySettings.value = JSON.stringify(settings.value.replaySettings, null, 2);
  showNotification(t('options_notification_settingsReset'), 'info');
};

/**
 * parese the replaySettings
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
 * parese the recordSettings
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
  notification.value = {
    visible: true,
    message,
    type
  };

  // Hide after 3 seconds
  setTimeout(() => {
    notification.value.visible = false;
  }, 3000);
};
</script>

<style scoped>
/* Base styles with theme variables */
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: var(--background-color, #ffffff);
  color: var(--text-color, #333333);
  transition: background-color 0.3s, color 0.3s;
}

h1 {
  color: var(--primary-color, #6200ee);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  font-weight: 500;
}

.settings-group {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--secondary-text-color, #555555);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Input styles */
.input-container,
.select-container,
.textarea-container {
  position: relative;
}

.setting-input,
.setting-select,
.setting-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--input-background, #ffffff);
  color: var(--text-color, #333);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.setting-input:focus,
.setting-select:focus,
.setting-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #6200ee);
  box-shadow: 0 0 0 2px rgba(98, 0, 238, 0.2);
}

.setting-textarea {
  font-family: monospace;
  resize: vertical;
  min-height: 100px;
}

/* Select styles */
.setting-select {
  appearance: none;
  padding-right: 2.5rem;
}

.select-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--text-color, #333);
}

/* Button styles */
.settings-actions {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background-color: var(--primary-color, #6200ee);
  color: white;
}

.btn-primary:hover {
  background-color: #5000d1;
}

.btn-secondary {
  background-color: var(--secondary-background, #f5f5f5);
  color: var(--text-color, #333);
}

.btn-secondary:hover {
  background-color: var(--secondary-hover, #e0e0e0);
}

/* Snackbar notification */
.snackbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  padding: 1rem 1.5rem;
  border-radius: 4px;
  color: white;
  z-index: 1000;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s, opacity 0.3s;
  opacity: 0;
  font-size: 0.9rem;
}

.snackbar-visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.snackbar-success {
  background-color: #4caf50;
}

.snackbar-error {
  background-color: #f44336;
}

.snackbar-info {
  background-color: #2196f3;
}

/* Dark theme adaptations */
:global(.dark-theme) .settings-container {
  --background-color: #121212;
  --text-color: #ffffff;
  --secondary-text-color: #bbbbbb;
  --border-color: #333333;
  --input-background: #1e1e1e;
  --secondary-background: #333333;
  --secondary-hover: #444444;
  --primary-color: #bb86fc;
}
</style>