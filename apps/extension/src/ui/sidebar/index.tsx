import "zone.js"
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
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

const root = ReactDOM.createRoot(
  document.getElementById('app') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
