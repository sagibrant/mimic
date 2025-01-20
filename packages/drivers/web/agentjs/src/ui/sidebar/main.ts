/**
 * Sidebar page entry point - AOT version
 * Bootstraps the Angular application for the extension sidebar
 * Uses AOT-generated module factory
 */
import '@angular/compiler';
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SidebarComponent } from './sidebar.component';

bootstrapApplication(SidebarComponent, {
  providers: [
    provideAnimations(), // provide animations for material
  ]
}).then(() => console.log('Sidebar component initialized successfully'))
  .catch(err => console.error('Sidebar component initialization error:', err));