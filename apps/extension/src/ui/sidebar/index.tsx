/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file index.tsx
 * @description 
 * Sidebar UI entry point
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
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../../assets/css/global.css';
import './App.css';
import { SettingUtils } from "@gogogo/shared";
import { SidebarDispatcher } from "./SidebarDispatcher";
import { SidebarHandler } from "./SidebarHandler";
import { StepEngine } from "./StepEngine";
import { SidebarUtils } from "./SidebarUtils";

// init the 
await SettingUtils.init();
const dispatcher = new SidebarDispatcher();
const handler = new SidebarHandler();
dispatcher.addHandler(handler);
const engine = new StepEngine(dispatcher);
SidebarUtils.engine = engine;
SidebarUtils.dispatcher = dispatcher;
SidebarUtils.handler = handler;
await dispatcher.init();

// Check if recording is in progress
const isRecording = await engine.isRecording();
if (isRecording) {
  await engine.stopRecording();
}

const root = ReactDOM.createRoot(
  document.getElementById('app') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
