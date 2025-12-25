// src/polyfills/async_hooks-zone.js
// Browser polyfill for node:async_hooks using zone.js
// Compatible with LangGraph/LangChain in web environments
// const Zone = require('zone.js');

// Ensure zone.js is imported before this file runs
// You must have: import 'zone.js'; at the top of your sidebar entry file (e.g. main.ts)

if (typeof Zone === 'undefined' || !Zone.current) {
  throw new Error(
    'zone.js is not loaded. Please import "zone.js" before importing LangChain/LangGraph in browser environments.'
  );
}

class AsyncLocalStorage {
  constructor() {
    this._key = `ALS_${Math.random().toString(36).slice(2)}`;
    this._disabled = false;
  }

  disable() {
    this._disabled = true;
  }

  getStore() {
    if (this._disabled) return undefined;
    return Zone.current.get(this._key);
  }

  run(store, callback, ...args) {
    if (this._disabled) {
      return callback(...args);
    }

    const zone = Zone.current.fork({
      name: 'async-local-storage',
      properties: { [this._key]: store },
    });

    return zone.run(callback, undefined, args);
  }

  enterWith(store) {
    if (this._disabled) return;

    Zone.current.fork({
      name: 'async-local-enter',
      properties: { [this._key]: store },
    }).run(() => {});
  }
}

// Export exactly what Node.js async_hooks does: { AsyncLocalStorage }
module.exports = {
  AsyncLocalStorage,
};