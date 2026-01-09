import React, { useState, useEffect } from 'react';
import { BrowserUtils, Utils, SettingUtils } from "@gogogo/shared";

// 定义组件props类型
interface AppProps {
  // 这里可以添加组件需要的props
}

export default function App({}: AppProps) {
  // State with proper typing
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isRecordSupported, _setIsRecordSupported] = useState<boolean>(false);
  const [isStoreSupported, _setIsStoreSupported] = useState<boolean>(false);

  // Fixed translation function with proper typing
  const t = (key: string): string => {
    return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
  };

  // Setup storage change listener
  useEffect(() => {
    // Load initial state from storage
    chrome.storage.local.get(['isRecording']).then((result) => {
      setIsRecording(result.isRecording as boolean || false);
    });

    const storageChangeListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && 'isRecording' in changes) {
        setIsRecording(changes.isRecording.newValue as boolean);
      }
    };

    chrome.storage.onChanged.addListener(storageChangeListener);

    // Cleanup on component unmount
    return () => {
      chrome.storage.onChanged.removeListener(storageChangeListener);
    };
  }, []);

  /**
   * Open the store URL in a new tab using direct Chrome API
   */
  const openStore = async (): Promise<void> => {
    try {
      if (!isStoreSupported) {
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
      const url = `${prefix}://${chrome.runtime.id}/ui/options/index.html`;
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
      if (!isRecordSupported) {
        showError(t('action_error_recordingNotSupported'));
        return;
      }
      const newState = !isRecording;
      // Update storage with new state
      await chrome.storage.local.set({ isRecording: newState });
      // Local state will be updated via storage change listener
      showNotification(newState ? t('action_notification_recordingStarted') : t('action_notification_recordingStopped'));
      if (newState) {
        await Utils.wait(2000);
        showError(t('action_error_recordingNotSupported'));
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
      iconUrl: chrome.runtime.getURL('assets/icons/icon_48x48.png'),
      title: t('action_notification'),
      message,
      priority: 2
    });
  };

  return (
    <div className="action-container">
      <button className="menu-item" onClick={openStore} disabled={!isStoreSupported}>
        <i className="icon store-icon"></i>
        <span>{t('action_btn_label_store')}</span>
      </button>

      <button className="menu-item" onClick={openSidebar}>
        <i className="icon sidebar-icon"></i>
        <span>{t('action_btn_label_sidebar')}</span>
      </button>

      <button className="menu-item" onClick={openOptions}>
        <i className="icon options-icon"></i>
        <span>{t('action_btn_label_options')}</span>
      </button>

      <button 
        className={`menu-item ${isRecording ? 'recording' : ''}`} 
        disabled={!isRecordSupported}
        onClick={toggleRecording}
        hidden={true}
      >
        <i className={`icon ${!isRecording ? 'record-icon' : 'stop-icon'}`}></i>
        <span>{isRecording ? t('action_btn_label_stop') : t('action_btn_label_record')}</span>
      </button>
    </div>
  );
};
