/**
 * Options page entry point - AOT version
 * Bootstraps the Angular application for extension settings
 * Uses AOT-generated module factory
 */
// (window as any).eval = (..._args: any[]) => {
//   console.warn('eval is not allowed in this context111');
//   return undefined;
// }
// globalThis['eval'] = (..._args: any[]) => {
//   console.warn('eval is not allowed in this context');
//   return undefined;  
// }
// // --- IGNORE ---
// console.error('Action page initialized with fixed AOT compilation');

import '@angular/compiler';
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OptionsComponent } from './options.component';


bootstrapApplication(OptionsComponent, {
  providers: [
    provideAnimations() // provide animations for material
  ]
}).then(() => console.log('Options component initialized successfully'))
  .catch(err => console.error('Options component initialization error:', err));
