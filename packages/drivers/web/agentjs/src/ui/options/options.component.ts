/**
 * OptionsComponent - Manages extension configuration settings
 * Provides form fields for:
 * 1. Market URL
 * 2. Client ID
 * 3. Client Secret
 * 4. Logger Level (dropdown)
 * 5. Identification Settings (multi-line)
 * 6. Record Settings (multi-line)
 * 7. Replay Settings (multi-line)
 * Saves settings to chrome.storage.sync
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="options-container">
      <mat-card-header>
        <mat-card-title>AgentJS Configuration</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <form [formGroup]="optionsForm" (ngSubmit)="saveOptions()">
          <!-- Market URL -->
          <mat-form-field appearance="fill">
            <mat-label>Market URL</mat-label>
            <input matInput formControlName="marketUrl" placeholder="https://example.com/market">
          </mat-form-field>

          <!-- Client ID -->
          <mat-form-field appearance="fill">
            <mat-label>Client ID</mat-label>
            <input matInput formControlName="clientId">
          </mat-form-field>

          <!-- Client Secret -->
          <mat-form-field appearance="fill">
            <mat-label>Client Secret</mat-label>
            <input matInput type="password" formControlName="clientSecret">
          </mat-form-field>

          <!-- Logger Level -->
          <mat-form-field appearance="fill">
            <mat-label>Logger Level</mat-label>
            <mat-select formControlName="loggerLevel">
              <mat-option value="INFO">INFO</mat-option>
              <mat-option value="WARN">WARN</mat-option>
              <mat-option value="ERROR">ERROR</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Identification Settings -->
          <mat-form-field appearance="fill">
            <mat-label>Identification Settings</mat-label>
            <textarea matInput formControlName="identificationSettings" rows="3"></textarea>
          </mat-form-field>

          <!-- Record Settings -->
          <mat-form-field appearance="fill">
            <mat-label>Record Settings</mat-label>
            <textarea matInput formControlName="recordSettings" rows="3"></textarea>
          </mat-form-field>

          <!-- Replay Settings -->
          <mat-form-field appearance="fill">
            <mat-label>Replay Settings</mat-label>
            <textarea matInput formControlName="replaySettings" rows="3"></textarea>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit">Save Settings</button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .options-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-card-title {
      font-size: 24px;
      margin-bottom: 16px;
    }
  `]
})
export class OptionsComponent implements OnInit {
  // Form group containing all configuration fields
  optionsForm: FormGroup;

  /**
   * Initialize form builder and snackbar for notifications
   */
  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.optionsForm = this.fb.group({
      marketUrl: ['', Validators.required],
      clientId: [''],
      clientSecret: [''],
      loggerLevel: ['ERROR', Validators.required], // Default to ERROR
      identificationSettings: [''],
      recordSettings: [''],
      replaySettings: ['']
    });
  }

  /**
   * Load saved settings from chrome.storage.sync when component initializes
   */
  ngOnInit(): void {
    chrome.storage.sync.get(null, (data) => {
      if (data) {
        this.optionsForm.patchValue(data);
      }
    });
  }

  /**
   * Save current form values to chrome.storage.sync
   * Shows success notification after saving
   */
  saveOptions(): void {
    if (this.optionsForm.valid) {
      chrome.storage.sync.set(this.optionsForm.value, () => {
        this.snackBar.open('Settings saved successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      });
    }
  }
}
    