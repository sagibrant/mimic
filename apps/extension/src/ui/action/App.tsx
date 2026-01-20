/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file App.tsx
 * @description 
 * Action popup UI root component
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

import { useState } from 'react';
import { BrowserUtils, SettingUtils } from '@mimic-sdk/core';
import { ThemeProvider } from '../components/theme-provider';
import { Command, CommandList, CommandItem } from '../components/ui/command';
import { PanelRight, SquareCheck, Store } from 'lucide-react';

export default function App() {
  const [isStoreSupported] = useState<boolean>(false);

  const t = (key: string): string => {
    return chrome.i18n.getMessage(key) || key;
  };

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

  const openSidebar = async (): Promise<void> => {
    try {
      if (!chrome.sidePanel && typeof browser !== 'undefined' && browser.sidebarAction) {
        await browser.sidebarAction.open();
        return;
      }
      const [currentTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });

      if (currentTab?.id) {
        await chrome.sidePanel.open({ tabId: currentTab.id });
      } else {
        throw new Error('The current tab id is missing.');
      }
    } catch (error) {
      console.error('Error opening sidebar:', error);
      showError(t('action_error_failedToOpenSidebar'));
    }
  };

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

  const showError = (message: string): void => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon_48x48.png'),
      title: t('action_error'),
      message,
      priority: 2,
    });
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Command className="action-container font-sans text-sm">
        <CommandList>
          <CommandItem onSelect={openStore} disabled={!isStoreSupported}>
            <Store size={16} className="text-popover-foreground" />
            <span>{t('action_btn_label_store')}</span>
          </CommandItem>
          <CommandItem onSelect={openSidebar}>
            <PanelRight size={16} className="text-popover-foreground" />
            <span>{t('action_btn_label_sidebar')}</span>
          </CommandItem>
          <CommandItem onSelect={openOptions}>
            <SquareCheck size={16} className="text-popover-foreground" />
            <span>{t('action_btn_label_options')}</span>
          </CommandItem>
        </CommandList>
      </Command>
    </ThemeProvider>
  );
}
