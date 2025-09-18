<template>
  <div class="action-container">
    <button class="menu-item" @click="openStore" :disabled="!isStoreSupported">
      <i class="icon store-icon"></i>
      <span>{{ t('action_btn_label_store') }}</span>
    </button>

    <button class="menu-item" @click="openSidebar">
      <i class="icon sidebar-icon"></i>
      <span>{{ t('action_btn_label_sidebar') }}</span>
    </button>

    <button class="menu-item" @click="openOptions">
      <i class="icon options-icon"></i>
      <span>{{ t('action_btn_label_options') }}</span>
    </button>

    <button class="menu-item" :class="{ 'recording': isRecording }" :disabled="!isRecordSupported"
      @click="toggleRecording" :hidden="true">
      <i class="icon" :class="{ 'record-icon': !isRecording, 'stop-icon': isRecording }"></i>
      <span>{{ isRecording ? t('action_btn_label_stop') : t('action_btn_label_record') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { BrowserUtils, Utils } from '@/common/Common';
import { SettingUtils } from '@/common/Settings';
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

// State with proper typing
const isRecording = ref(false);

const isRecordSupported = ref(false);
const isStoreSupported = ref(false);

// Cleanup function for storage listener
let storageChangeListener: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void;

// Fixed translation function with proper typing
const t = (key: string): string => {
  return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
};

// Initialize component
onMounted(() => {
  // Load initial state from storage
  chrome.storage.local.get(['isRecording']).then((result) => {
    isRecording.value = result.isRecording || false;
  });

  // Setup storage change listener
  storageChangeListener = (changes, areaName) => {
    if (areaName === 'local' && 'isRecording' in changes) {
      isRecording.value = changes.isRecording.newValue;
    }
  };

  chrome.storage.onChanged.addListener(storageChangeListener);
});

// Cleanup on component unmount
onUnmounted(() => {
  if (storageChangeListener) {
    chrome.storage.onChanged.removeListener(storageChangeListener);
  }
});

/**
 * Open the store URL in a new tab using direct Chrome API
 */
const openStore = async (): Promise<void> => {
  try {
    if (!isStoreSupported.value) {
      return;
    }
    const result = SettingUtils.getSettings();
    if (result && result.storeURL) {
      await chrome.tabs.create({ url: result.storeURL });
    } else {
      showError(t('action_error_storeURLNotConfigured'));
    }
  } catch (error) {
    console.error('Error opening store:', error);
    showError(t('action_error_failedToOpenStore'));
  }
};

/**
 * Open sidebar panel for current active tab
 */
const openSidebar = async (): Promise<void> => {
  try {
    if (!chrome.sidePanel && typeof browser !== 'undefined' && browser.sidebarAction) {
      // Fallback for browsers that don't support sidePanel API
      await browser.sidebarAction.open();
      return;
    }
    // Get current active tab
    const [currentTab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });

    if (currentTab?.id) {
      // Open side panel for current tab
      await chrome.sidePanel.open({ tabId: currentTab.id });
    } else {
      throw new Error('The current tab id is missing.');
    }
  } catch (error) {
    console.error('Error opening sidebar:', error);
    showError(t('action_error_failedToOpenSidebar'));
  }
};

/**
 * Open sidebar panel for current active tab
 */
const openOptions = async (): Promise<void> => {
  try {
    const browserInfo = BrowserUtils.getBrowserInfo();
    const prefix = browserInfo.name === 'edge' ? 'extension' : 'chrome-extension';
    const url = `${prefix}://${chrome.runtime.id}/ui/options/index.html`
    await chrome.tabs.create({ url: url });
  } catch (error) {
    console.error('Error opening options:', error);
    showError(t('action_error_failedToOpenOptions'));
  }
};


/**
 * Toggle recording state and update storage
 */
const toggleRecording = async (): Promise<void> => {
  try {
    if (!isRecordSupported.value) {
      showError(t('action_error_recordingNotSupported'));
      return;
    }
    const newState = !isRecording.value;
    // Update storage with new state
    await chrome.storage.local.set({ isRecording: newState });
    // Local state will be updated via storage change listener
    showNotification(newState ? t('action_notification_recordingStarted') : t('action_notification_recordingStopped'));
    if (newState) {
      await Utils.wait(2000);
      nextTick(() => {
        showError(t('action_error_recordingNotSupported'));
      });
    }
  } catch (error) {
    console.error('Error toggling recording:', error);
    showError(t('action_error_failedToToggleRecording'));
  }
};

/**
 * Show error notification
 */
const showError = (message: string): void => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icons/icon_48x48.png'),
    title: t('action_error'),
    message,
    priority: 2
  });
};

/**
 * Show success notification
 */
const showNotification = (message: string): void => {
  chrome.notifications.create({
    type: 'basic',
    // iconUrl: '../../assets/icons/icon_48x48.png',
    iconUrl: chrome.runtime.getURL('assets/icons/icon_48x48.png'),
    title: t('action_notification'),
    message,
    priority: 2
  });
};
</script>

<style scoped>
[hidden] {
  display: none !important;
}

/* Menu/list inspired design for Chrome extension popup */
.action-container {
  display: flex;
  flex-direction: column;
  width: 150px;
  background-color: var(--chrome-bg-color, #ffffff);
  color: var(--chrome-text-color, #333333);
}

/* Menu item styling inspired by Vuetify lists */
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  width: 100%;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Hover state - subtle highlight */
.menu-item:hover {
  background-color: var(--chrome-hover-color, #f0f0f0);
}

/* Active/click state animation */
.menu-item:active {
  background-color: var(--chrome-active-color, #e0e0e0);
  transform: scale(0.99);
  transition: all 0.05s ease;
}

/* Recording state styling */
.menu-item.recording {
  color: #d32f2f;
}

.menu-item.recording:hover {
  background-color: rgba(211, 47, 47, 0.1);
}

.menu-item.recording:active {
  background-color: rgba(211, 47, 47, 0.2);
}

.menu-item:disabled {
  cursor: not-allowed;
}


/* Icon styling */
.icon {
  display: inline-block;
  width: 20px;
  text-align: center;
  font-size: 16px;
  font-style: normal;
}

.store-icon::before {
  content: '⚖';
}

.options-icon::before {
  content: '☑';
}

.sidebar-icon::before {
  content: '◨';
}

.record-icon::before {
  content: '◉';
}

.stop-icon::before {
  content: '■';
}

/* Theme adaptation for Chrome */
@media (prefers-color-scheme: dark) {
  .action-container {
    --chrome-bg-color: #2d2d2d;
    --chrome-text-color: #f0f0f0;
    --chrome-hover-color: #3d3d3d;
    --chrome-active-color: #4a4a4a;
  }
}
</style>