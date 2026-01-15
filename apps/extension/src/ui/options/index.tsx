import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../../assets/css/global.css';
import './App.css';
import { SettingUtils } from '@gogogo/shared';

await SettingUtils.init();

const root = ReactDOM.createRoot(
  document.getElementById('app') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
