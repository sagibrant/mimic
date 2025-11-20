/**
 * Custom plugin to check for potential CSP violations in output files
 * Warns if any eval() or new Function() calls are found in the generated code
 * 
 * Fixed issue with SizeOnlySource by using compilation.getAsset() method
 */
class EvalCheckPlugin {
  constructor() { }
  
  /**
   * Apply the plugin to the compiler
   * @param {Object} compiler - The webpack compiler instance
   */
  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise('EvalCheckPlugin', async (compilation) => {
      // Get all emitted assets
      const assets = compilation.getAssets();
      
      for (const { name, source } of assets) {
        // Check only JavaScript files
        if (!name.endsWith('.js')) continue;
        
        try {
          // Get the source content safely
          const content = source.source().toString();
          
          // Check for CSP-violating code patterns
          if (content.includes('eval(') || content.includes('new Function(')) {
            console.warn(`\x1b[33m[EvalCheck] Potential CSP violation detected in ${name}\x1b[0m`);
          }
        } catch (error) {
          // Handle cases where source might not be available
          console.warn(`\x1b[33m[EvalCheck] Could not check ${name}: ${error.message}\x1b[0m`);
        }
      }
    });
  }
}

module.exports = EvalCheckPlugin;