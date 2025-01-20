/**
 * Action page entry point with fixed AOT compilation
 * Properly bootstraps Angular with compiler support
 */
import '@angular/compiler';
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { ActionComponent } from './action.component';
import { provideAnimations } from '@angular/platform-browser/animations';

bootstrapApplication(ActionComponent, {
  providers: [
    provideAnimations() // provide animations for material
  ]
}).then(() => console.log('Action component initialized successfully'))
  .catch(err => console.error('Action component initialization error:', err));