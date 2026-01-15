import { useState } from 'react';
import { BrowserUtils, SettingUtils } from "@gogogo/shared";
import { ThemeProvider } from '../components/theme-provider';
import { Command, CommandList, CommandItem } from '../components/ui/command';
import { PanelRight, SquareCheck, Store } from 'lucide-react';

interface AppProps {
}

export default function App({ }: AppProps) {
  const [isStoreSupported, _setIsStoreSupported] = useState<boolean>(false);

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
        lastFocusedWindow: true
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
      priority: 2
    });
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Command className="action-container">
        <CommandList>
          <CommandItem onSelect={openStore} disabled={!isStoreSupported}>
            <span>
              <Store size={16} className="text-popover-foreground" />
            </span>
            <span>{t('action_btn_label_store')}</span>
          </CommandItem>
          <CommandItem onSelect={openSidebar}>
            <span>
              <PanelRight size={16} className="text-popover-foreground" />
            </span>
            <span>{t('action_btn_label_sidebar')}</span>
          </CommandItem>
          <CommandItem onSelect={openOptions}>
            <span>
              <SquareCheck size={16} className="text-popover-foreground" />
            </span>
            <span>{t('action_btn_label_options')}</span>
          </CommandItem>
        </CommandList>
      </Command>
    </ThemeProvider>
  );
};
