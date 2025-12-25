/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file main.ts
 * @description 
 * Entry point for Sidebar component
 * Initializes and mounts the Vue application
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
import "zone.js"
import { createApp } from 'vue';
// PrimeVue
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { Form } from '@primevue/forms';
import ConfirmDialog from 'primevue/confirmdialog';
import ConfirmationService from 'primevue/confirmationservice';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import Message from 'primevue/message';
import 'primeicons/primeicons.css';
import '../../assets/css/global.css';

import { SettingUtils } from "@gogogo/shared";
import Sidebar from './Sidebar.vue';
import { SidebarDispatcher } from './SidebarDispatcher';
import { SidebarHandler } from './SidebarHandler';
import { StepEngine } from './StepEngine';
import { SidebarUtils } from './SidebarUtils';


await SettingUtils.init();
const dispatcher = new SidebarDispatcher();
const handler = new SidebarHandler();
dispatcher.addHandler(handler);
const engine = new StepEngine(dispatcher);
SidebarUtils.engine = engine;
SidebarUtils.dispatcher = dispatcher;
SidebarUtils.handler = handler;
await dispatcher.init();

// Create and mount the Vue application
const app = createApp(Sidebar);
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'system',
      order: 'theme, base, primevue'
    }
  }
}).use(ConfirmationService).use(ToastService);
// Register PrimeVue components globally to avoid repetitive imports
app.component('Button', Button);
app.component('InputText', InputText);
app.component('Select', Select);
app.component('Form', Form);
app.component('Dialog', Dialog);
app.component('ConfirmDialog', ConfirmDialog);
app.component('Toast', Toast);
app.component('Message', Message);
app.mount('#app');
