(function () {
  // 强制覆盖所有可能的eval入口
  const safeEval = function (...args) {
    console.warn('已阻止eval执行:', args);
    // 针对Angular编译器的特定返回值处理
    if (args[0] && args[0].includes && args[0].includes('function')) {
      return function () { return {}; };
    }
    if (args[0] && args[0].constructor.name === 'TrustedScript') {
      return function () { return {}; };
    }
    return {};
  };

  // 覆盖所有可能的eval引用点
  window.eval = safeEval;
  globalThis.eval = safeEval;

  const safeFunction = function (...args) {
    console.warn('已阻止new Function执行:', args);
    return function () { return {}; };
  };

  // 处理可能的间接调用
  if (typeof Function === 'function' && Function.prototype.constructor) {
    const originalFunction = Function.prototype.constructor;
    Function.prototype.constructor = safeFunction
  }
  if (globalThis.Function && globalThis.Function.prototype.constructor) {
    globalThis.Function.constructor = safeFunction
  }
  if (window.Function && window.Function.prototype.constructor) {
    window.Function.constructor = safeFunction
  }

  console.log('eval覆盖脚本已生效');
})();
