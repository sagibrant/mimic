class AsyncLocalStorage {
  constructor() {
    this.storeMap = new Map();
  }
  run = async (store, callback, ...args) => {
    const executionContext = Symbol();
    this.storeMap.set(executionContext, store);
    try {
      return await callback(...args);
    } finally {
      this.storeMap.delete(executionContext);
    }
  }
  getStore = () => {
    for (const value of this.storeMap.values()) {
      return value;
    }
    return undefined;
  }
  enterWith = (store) => {
    const executionContext = Symbol();
    this.storeMap.set(executionContext, store);
  }
}

module.exports = { AsyncLocalStorage };