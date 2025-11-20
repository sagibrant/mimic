// NonceInjectorPlugin.js
const HtmlWebpackPlugin = require('html-webpack-plugin');

class NonceInjectorPlugin {
  /**
   * Creates a NonceInjectorPlugin instance
   * @param {string} nonce - The nonce value to inject
   */
  constructor(nonce) {
    if (typeof nonce !== 'string' || !nonce) {
      throw new Error('Nonce must be a non-empty string');
    }
    this.nonce = nonce;
  }

  /**
   * Apply the plugin to the compiler
   * @param {import('webpack').Compiler} compiler - Webpack compiler instance
   */
  apply(compiler) {
    // Verify html-webpack-plugin is installed
    if (!HtmlWebpackPlugin) {
      throw new Error('html-webpack-plugin is required for NonceInjectorPlugin');
    }

    // Handle different html-webpack-plugin versions
    const getHooks = HtmlWebpackPlugin.getHooks || HtmlWebpackPlugin.getCompilationHooks;
    
    if (typeof getHooks !== 'function') {
      throw new Error(
        'Unsupported html-webpack-plugin version. ' +
        'Please use html-webpack-plugin@^4.0.0 || ^5.0.0'
      );
    }

    // Register compilation hook
    compiler.hooks.compilation.tap('NonceInjectorPlugin', (compilation) => {
      try {
        const hooks = getHooks(compilation);
        
        // Register alterAssetTags hook
        hooks.alterAssetTags.tapAsync(
          'NonceInjectorPlugin',
          (data, callback) => {
            try {
              // Add nonce to script tags
              if (data.assetTags.scripts) {
                data.assetTags.scripts = data.assetTags.scripts.map(tag => ({
                  ...tag,
                  attributes: {
                    ...tag.attributes,
                    nonce: this.nonce
                  }
                }));
              }
              
              // Add nonce to style tags
              if (data.assetTags.styles) {
                data.assetTags.styles = data.assetTags.styles.map(tag => ({
                  ...tag,
                  attributes: {
                    ...tag.attributes,
                    nonce: this.nonce
                  }
                }));
              }
              
              // Add nonce to preload tags (optional but recommended)
              if (data.assetTags.meta) {
                data.assetTags.meta = data.assetTags.meta.map(tag => {
                  if (tag.attributes.rel === 'preload' && 
                      (tag.attributes.as === 'script' || tag.attributes.as === 'style')) {
                    return {
                      ...tag,
                      attributes: {
                        ...tag.attributes,
                        nonce: this.nonce
                      }
                    };
                  }
                  return tag;
                });
              }
              
              callback(null, data);
            } catch (error) {
              callback(error);
            }
          }
        );
      } catch (error) {
        console.error('[NonceInjectorPlugin] Error during compilation hook:', error);
      }
    });
  }
}

module.exports = NonceInjectorPlugin;