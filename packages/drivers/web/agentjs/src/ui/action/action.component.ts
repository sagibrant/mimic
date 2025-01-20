/**
 * ActionComponent - Extension popup with 3 main actions
 * 1. Open Market URL from settings
 * 2. Open sidebar panel
 * 3. Start recording user actions
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-action',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="action-container">
      <button mat-raised-button color="primary" (click)="openMarket()">
        <mat-icon>open_in_new</mat-icon> Open Market
      </button>
      
      <button mat-raised-button color="accent" (click)="openSidebar()">
        <mat-icon>menu</mat-icon> Open Sidebar
      </button>
      
      <button mat-raised-button color="warn" (click)="startRecording()">
        <mat-icon>fiber_manual_record</mat-icon> Start Recording
      </button>
    </div>
  `,
  styles: [`
    .action-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      min-width: 250px;
    }

    button {
      width: 100%;
      justify-content: flex-start;
    }

    mat-icon {
      margin-right: 8px;
    }
  `]
})
export class ActionComponent {
  /**
   * Open market URL from stored settings
   */
  openMarket(): void {
    chrome.storage.sync.get('marketUrl', (data) => {
      const url = data.marketUrl || 'https://example.com/market';
      chrome.tabs.create({ url });
    });
  }

  /**
   * Open the sidebar panel in the current window
   */
  openSidebar(): void {
    chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
      .catch(err => console.error('Failed to open sidebar:', err));
  }

  /**
   * Send message to background script to start recording
   * Closes the popup after sending the request
   */
  startRecording(): void {
    chrome.runtime.sendMessage({ action: 'startRecording' }, () => {
      window.close(); // Close popup after initiating recording
    });
  }
}
    