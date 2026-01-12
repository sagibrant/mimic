
/**
 * This is the webpack configuration for the browser extension.

build extension from source:
- src
  -- _locales/**			# mlu files
  -- assets/**  		# css & icons
  -- common/**			# common libs
  -- background.js
  -- background/**		# import by the background.js
  -- content.js
  -- content/**			# import by the content.js
  -- execution/**		# files for task execution (replay/record)
  -- sdk/**		      # the user sdk
  -- types/**		    # the user sdk types
  -- ui/**		      # the extension ui
- build
  -- chrome | edge | firefox
    --- manifest
     ---- v2
       ----- manifest.json
     ---- v3
       ----- manifest.json
    --- version
     ---- default
       ----- privateKey.pem (for chrome, edge packed version => .crx)
       ----- publicKey.txt (for chrome, edge unpacked version)
       ----- apiKey.txt (for firefox packed version => .xpi)
       ----- apiSecret.txt (for firefox packed version => .xpi)
     ---- 2025
       ----- privateKey.pem (for chrome, edge packed version => .crx)
       ----- publicKey.txt (for chrome, edge unpacked version)
       ----- apiKey.txt (for firefox packed version => .xpi)
       ----- apiSecret.txt (for firefox packed version => .xpi)
into the dest:
- dist
  -- chrome | edge | firefox
    --- v2  (manifest version) 
      ---- unpacked
      ---- Extension	# unpacked extension folder. the manifest.json should load the publicKey into th key field
      ---- packed (.crx/.xpi)
      ---- Extension.crx/Extension.xpi  # the packed extension, use crx with privateKey.pem for chrome&edge and do not put the publicKey into th key field in manifest.json, use xpi with apiKey.txt&apiSecret.txt for firefox 
      ---- store (for upload usage)
      ---- Extension.zip     # the zipped unpacked extension file for store upload (need to put privateKey.pem into the zip file and change name to key.pem, and do not put the publicKey into th key field in manifest.json)
    --- v3  (manifest version) 
      ---- unpacked
      ---- Extension	# unpacked extension folder. the manifest.json should load the publicKey into th key field
      ---- packed (.crx/.xpi)
      ---- Extension.crx/Extension.xpi  # the packed extension, use crx with privateKey.pem for chrome&edge  and do not put the publicKey into th key field in manifest.json, use xpi with apiKey.txt&apiSecret.txt for firefox 
      ---- store (for upload usage)
      ---- Extension.zip     # the zipped unpacked extension file for store upload (need to put privateKey.pem into the zip file and change name to key.pem, and do not put the publicKey into th key field in manifest.json)

*/


const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CrxPackPlugin = require('./CrxPackPlugin');
const XpiPackPlugin = require('./XpiPackPlugin');
const ZipStorePlugin = require('./ZipStorePlugin');
const UnpackedExtensionPlugin = require('./UnpackedExtensionPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const EvalCheckPlugin = require('./EvalCheckPlugin');
const { VueLoaderPlugin } = require('vue-loader');

const fs = require('fs');
const fse = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
// __dirname is the build folder
const rootDir = path.resolve(__dirname, '..'); // Project root = extension folder
const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;

// Function to get key path (for plugins that require file paths)
const getKeyPath = (keyType, browser, tempDir) => {
  // Check if we have environment variable for this key
  const envKey = `EXTENSION_${browser.toUpperCase()}_${keyType.toUpperCase()}`;
  if (process.env[envKey]) {
    // Create temporary key file if using environment variable
    const tempKeyDir = path.resolve(tempDir, 'secret');
    if (!fs.existsSync(tempKeyDir)) {
      fs.mkdirSync(tempKeyDir, { recursive: true });
    }
    
    const keyFileMap = {
      privateKey: 'privateKey.pem',
      publicKey: 'publicKey.txt',
      apiKey: 'apiKey.txt',
      apiSecret: 'apiSecret.txt'
    };
    
    const keyFileName = keyFileMap[keyType];
    const tempKeyPath = path.resolve(tempKeyDir, `${browser}_${keyFileName}`);
    
    fs.writeFileSync(tempKeyPath, process.env[envKey], 'utf8');
    console.log(`${timestamp()} webpack.config.cjs:: created temporary key file: ${tempKeyPath}`);
    return tempKeyPath;
  }
  
  return null;
};

// Generate default version: year.month.day.0
const now = new Date();
const defaultVersion = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}.${String(now.getHours()).padStart(2, '0')}`;

module.exports = (env) => {
  console.log(`${timestamp()} webpack.config.cjs:: ==>`);
  console.log(`${timestamp()} env: ${JSON.stringify(env)}`);
  console.log(`${timestamp()} args: ${JSON.stringify(process.argv)}`);

  const browser = env.browser; // 'chrome', 'edge', 'firefox'
  const manifestVersion = env.manifestVersion; // 'v2', 'v3'
  const target = env.target; // 'unpacked', 'packed', 'store'
  const version = env.version || defaultVersion; // Use provided version or dynamic default
  const outputPath = path.resolve(rootDir, `dist/${browser}/${manifestVersion}`); // Base directory
  const tempDir = path.resolve(rootDir, `dist/${browser}/${manifestVersion}/temp-${uuidv4()}`); // Unique temp folder

  // Clean tempDir if it exists
  if (fs.existsSync(tempDir)) {
    console.log(`${timestamp()} webpack.config.cjs:: deleting existing temp directory - ${tempDir}`);
    fse.removeSync(tempDir);
  }

  console.log(`${timestamp()} webpack.config.cjs:: configuring - browser: ${browser}, manifestVersion: ${manifestVersion}, target: ${target}, version: ${version}, outputPath: ${outputPath}, tempDir: ${tempDir}`);

  const publicKeyPath = browser !== 'firefox' ? getKeyPath('publicKey', browser, tempDir) : null;
  const privateKeyPath = browser !== 'firefox' ? getKeyPath('privateKey', browser, tempDir) : null;
  console.log(`${timestamp()} webpack.config.cjs:: key paths - publicKeyPath: ${publicKeyPath || 'none'}, privateKeyPath: ${privateKeyPath || 'none'}`);

  const config = {
    // Set development mode for easier debugging
    mode: 'production',
    // Enable source maps for debugging
    // devtool: 'inline-source-map',
    // Disable source maps in all environments to prevent eval usage
    // Source maps can introduce eval() calls which violate CSP
    devtool: target === 'unpacked' ? 'inline-source-map' : false,
    /**
     * Target environment
     * Specifies the environment Webpack should compile for
     * Other possible values:
     * - 'node': Compiles for Node.js environment
     * - 'webworker': Compiles for Web Workers
     * - 'electron-main': Compiles for Electron main process
     * - 'electron-renderer': Compiles for Electron renderer process
     * - 'node-webkit': Compiles for NW.js
     */
    target: 'web',

    /**
     * Entry points configuration
     * Specifies the root files that Webpack will use to build its dependency graph
     * Each entry generates a separate bundle
     */
    entry: {
      background: path.resolve(rootDir, 'src/background.ts'),
      content: path.resolve(rootDir, 'src/content.ts'),
      'frame-in-main-loader': path.resolve(rootDir, 'src/content/FrameInMAINLoader.ts'),
      'ui/action/main': path.resolve(rootDir, 'src/ui/action/index.tsx'),
      'ui/options/main': path.resolve(rootDir, 'src/ui/options/index.tsx'),
      'ui/sidebar/main': path.resolve(rootDir, 'src/ui/sidebar/index.tsx'),
      'ui/sidebar/sandbox': path.resolve(rootDir, 'src/ui/sidebar/sandbox.ts')
    },

    /**
     * Output configuration
     * Defines where and how Webpack emits the built files
     */
    output: {
      // Use [name] placeholder to preserve entry point names
      filename: '[name].js',
      // Unique temp folder for each task
      path: path.join(tempDir, 'Extension'),
      // Clean the dist folder before each build
      clean: true
    },

    /**
     * Module resolution configuration
     * Controls how Webpack finds modules imported in the code
     */
    resolve: {
      // File extensions to resolve automatically
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.vue', '.json'],
      alias: {
        /**
         * Path alias configuration
         * '@' is a common convention in Vue projects to represent the source directory
         * Benefits:
         * - Simplifies imports (e.g., import Component from '@/ui/action/Action.vue')
         * - Makes imports more robust to directory structure changes
         * - Widely adopted convention in Vue ecosystem (used in Vue CLI, Vite)
         */
        '@': path.resolve(rootDir, 'src'),
        'node:async_hooks': path.resolve(rootDir, 'build/async_hooks-zone.js.cjs'),
        'async_hooks': path.resolve(rootDir, 'build/async_hooks-zone.js.cjs'),
      },
      fallback: {
        assert: false, // ignore these errors to use jshint in sidebar
        util: false,
        path: false,
        url: false,
        fs: false,
        crypto: false,
        zlib: false,
        http: false,
        https: false
      }
    },

    /**
     * Module rules
     * Define how different types of modules are processed
     */
    module: {
      rules: [
        // 1. Process TypeScript files (including React JSX)
        {
          test: /\.(ts|tsx)$/,
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/],
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext',
              jsx: 'react-jsx'
            }
          },
          exclude: /node_modules/, // Exclude node_modules to improve build performance
        },
        // 2. Process Vue single-file components
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          exclude: /node_modules/
        },
        // 3. HTML loader
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: { sources: false },
          include: path.resolve(rootDir, 'src/ui'), // Only ui html
          exclude: /node_modules/,
        },
        // 4. css
        {
          test: /\.css$/,
          use: [
            'style-loader', // Injects CSS into the DOM via <style> tags
            'css-loader',    // Translates CSS into CommonJS
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: path.resolve(rootDir, "postcss.config.mjs")
                }
              }
            }
          ],
          include: [
            path.resolve(rootDir, 'src/assets'),  // assets css must before the ui css
            path.resolve(rootDir, 'src/ui'),      // ui css
            /node_modules\/primevue/,             // Allow PrimeVue/PrimeIcons styles from node_modules
            /node_modules\/primeicons/
          ]
        },
        // 5. Load font assets for PrimeIcons
        {
          test: /\.(woff2?|ttf|eot|svg)$/,
          type: 'asset/resource',
          include: [
            /node_modules\/primeicons/
          ]
        }
      ],
    },

    /**
     * Plugins
     * Extend Webpack functionality for specific tasks
     */
    plugins: [
      new webpack.DefinePlugin({
        'process.env.BROWSER': JSON.stringify(browser),
        'process.env.MANIFEST_VERSION': JSON.stringify(manifestVersion),
        'process.env.BUILD_TARGET': JSON.stringify(target),
        'process.env.VERSION': JSON.stringify(version),
      }),
      new webpack.NormalModuleReplacementPlugin(
        /^node:async_hooks$/,
        (resource) => {
          // Replace with the absolute path to your polyfill
          resource.request = path.resolve(rootDir, 'build/async_hooks-zone.cjs');  // Adjust if path differs
        }
      ),
      // Required for Vue single-file component(SFC) support 
      new VueLoaderPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(rootDir, `build/${browser}/manifest/${manifestVersion}/manifest.json`),
            to: 'manifest.json',
            transform(content) {
              console.log(`${timestamp()} webpack.config.cjs:: transforming manifest - from: ${path.resolve(rootDir, `build/${browser}/manifest/${manifestVersion}/manifest.json`)}`);
              const manifest = JSON.parse(content);
              console.log(`${timestamp()} webpack.config.cjs:: updating manifest version - ${version}`);
              manifest.version = version;
              return JSON.stringify(manifest, null, 2);
            },
          },
          {
            from: path.resolve(rootDir, 'src/assets'),
            to: 'assets/',
            noErrorOnMissing: true,
          },
          {
            from: path.resolve(rootDir, 'src/_locales'),
            to: '_locales/',
            noErrorOnMissing: true,
          },
          {
            from: path.resolve(rootDir, '../../docs/README.md'),
            to: 'assets/docs/',
            noErrorOnMissing: true,
          },
          {
            from: path.resolve(rootDir, '../../packages/shared/src/types/types.d.ts'),
            to: 'assets/types/',
            noErrorOnMissing: true,
          },
          // {
          //   from: path.resolve(rootDir, 'src/ui/**/*.html'),
          //   to: ({ absoluteFilename }) => {
          //     // remove the prefix of "src/" and output to dist/ui/...
          //     const relativePath = path.relative(path.join(rootDir, 'src'), absoluteFilename);
          //     return relativePath;
          //   }
          // },
        ],
      }),
      new HtmlWebpackPlugin({
        filename: 'ui/action/index.html',
        template: path.resolve(rootDir, 'src/ui/action/index.html'),
        chunks: ['ui/action/main'],
        // inject the js to body, ensure the DOM is loaded
        inject: 'body',
        minify: false,
        publicPath: '../../' // adjust the publicPath for action to load resources correctly
      }),
      new HtmlWebpackPlugin({
        filename: 'ui/options/index.html',
        template: path.resolve(rootDir, 'src/ui/options/index.html'),
        chunks: ['ui/options/main'],
        inject: 'body',
        minify: false,
        publicPath: '../../' // adjust the publicPath for options to load resources correctly
      }),
      new HtmlWebpackPlugin({
        filename: 'ui/sidebar/index.html',
        template: path.resolve(rootDir, 'src/ui/sidebar/index.html'),
        chunks: ['ui/sidebar/main'],
        inject: 'body',
        minify: false,
        publicPath: '../../' // adjust the publicPath for sidebar to load resources correctly
      }),
      new HtmlWebpackPlugin({
        filename: 'ui/sidebar/sandbox.html',
        template: path.resolve(rootDir, 'src/ui/sidebar/sandbox.html'),
        chunks: ['ui/sidebar/sandbox'],
        inject: 'body',
        minify: false,
        publicPath: '../../' // adjust the publicPath for sidebar to load resources correctly
      }),
      // Check for potential CSP violations in output
      new EvalCheckPlugin(),
      // new NonceInjectorPlugin('sha256-1a+QSYaIcbLzT8/xYNz/8ej9tw5aFA+7aw83m2KBrxE='), // Replace with the nonce value
      ...(target === 'unpacked'
        ? [
          console.log(`${timestamp()} webpack.config.cjs:: adding UnpackedExtensionPlugin`),
          new UnpackedExtensionPlugin({ outputPath, tempDir, publicKeyPath }),
        ]
        : []),
      ...(browser === 'chrome' || browser === 'edge'
        ? [
          ...(target === 'packed'
            ? [
              console.log(`${timestamp()} webpack.config.cjs:: adding CrxPackPlugin`),
              new CrxPackPlugin({ browser, manifestVersion, outputPath, keyPath: privateKeyPath, tempDir }),
            ]
            : target === 'store'
              ? [
                console.log(`${timestamp()} webpack.config.cjs:: adding ZipStorePlugin for store`),
                new ZipStorePlugin({ browser, manifestVersion, outputPath, privateKeyPath, tempDir }),
              ]
              : []),
        ]
        : browser === 'firefox' && target === 'packed'
          ? [
            console.log(`${timestamp()} webpack.config.cjs:: adding XpiPackPlugin`),
            new XpiPackPlugin({
              outputPath,
              apiKeyPath: getKeyPath('apiKey', 'firefox', tempDir),
              apiSecretPath: getKeyPath('apiSecret', 'firefox', tempDir),
              tempDir,
            }),
          ]
          : browser === 'firefox' && target === 'store'
            ? [
              console.log(`${timestamp()} webpack.config.cjs:: adding ZipStorePlugin for store (Firefox)`),
              new ZipStorePlugin({ browser, manifestVersion, outputPath, tempDir }),
            ]
            : []),
    ],

    /**
    * Optimization configuration
    * Controls how Webpack optimizes the output bundles
    */
    optimization: {
      // Critical: Disable code splitting which can cause script order issues in extensions
      splitChunks: false,
      // Disable optimization that removes unused exports
      // Prevents accidental removal of code that might be called dynamically
      usedExports: false,
      // Disable module concatenation
      // Ensures eval override scripts aren't optimized away
      concatenateModules: false,
      // Minimize output only in production environment
      minimize: true,
      // Configure minification process
      minimizer: [
        // Override default Terser configuration
        (compiler) => {
          // Use TerserPlugin for minification
          const TerserPlugin = require('terser-webpack-plugin');
          new TerserPlugin({
            terserOptions: {
              keep_classnames: true, // Preserve class names
              keep_fnames: true,     // Preserve function names (including constructors)
            }
          }).apply(compiler);
        },
      ],
    },

    /**
     * Performance configuration
     * Controls warnings about asset size limits
     */
    // performance: {
    //   hints: false, // Disable performance hints (not critical for extensions)
    //   maxEntrypointSize: 512000, // Maximum size (in bytes) for entry point bundles
    //   maxAssetSize: 512000 // Maximum size (in bytes) for any individual asset
    // }
  };

  // Clean up temp folder after successful build
  config.plugins.push({
    apply: (compiler) => {
      compiler.hooks.done.tap('CleanupTempPlugin', (stats) => {
        if (stats.hasErrors()) {
          console.log(`${timestamp()} webpack.config.cjs:: build failed, keeping temp directory - ${tempDir}`);
        } else {
          console.log(`${timestamp()} webpack.config.cjs:: build succeeded, removing temp directory - ${tempDir}`);
          fse.removeSync(tempDir);
        }
      });
    },
  });

  console.log(`${timestamp()} webpack.config.cjs:: <==`);
  return config;
};