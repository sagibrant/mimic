
/**
 * This is the webpack configuration for the browser extension.

build extension from source:
- src
  -- background.js
  -- background/**		# import by the background.js
  -- content.js
  -- content/**			# import by the content.js
  -- common/**			# import by the content.js & background.js
  -- resources/**  		# static resources: images, CSS, htmls for option page, action page, etc
  -- thirdparty/**		# 3rd party libs
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
const { AngularWebpackPlugin } = require('@ngtools/webpack');
const NonceInjectorPlugin = require('./NonceInjectorPlugin');

const fs = require('fs');
const fse = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
// __dirname is the build folder
const rootDir = path.resolve(__dirname, '..'); // Project root = agentjs folder
const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;

// Generate default version: year.month.day.0
const now = new Date();
const defaultVersion = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.0`;

module.exports = (env) => {
  console.log(`${timestamp()} webpack.config.js:: start - env: ${JSON.stringify(env)}`);

  const browser = env.browser; // 'chrome', 'edge', 'firefox'
  const manifestVersion = env.manifestVersion; // 'v2', 'v3'
  const target = env.target; // 'unpacked', 'packed', 'store'
  const version = env.version || defaultVersion; // Use provided version or dynamic default
  const keyVersion = version.split('.')[0]; // e.g., '2025'
  const outputPath = path.resolve(rootDir, `dist/${browser}/${manifestVersion}`); // Base directory
  const tempDir = path.resolve(rootDir, `dist/${browser}/${manifestVersion}/temp-${uuidv4()}`); // Unique temp folder

  // Clean tempDir if it exists
  if (fs.existsSync(tempDir)) {
    console.log(`${timestamp()} webpack.config.js:: deleting existing temp directory - ${tempDir}`);
    fse.removeSync(tempDir);
  }

  console.log(`${timestamp()} webpack.config.js:: configuring - browser: ${browser}, manifestVersion: ${manifestVersion}, target: ${target}, version: ${version}, keyVersion: ${keyVersion}, outputPath: ${outputPath}, tempDir: ${tempDir}`);

  const publicKeyPath = browser !== 'firefox' ? path.resolve(rootDir, `build/${browser}/version/${keyVersion}/publicKey.txt`) : null;
  const privateKeyPath = browser !== 'firefox' ? path.resolve(rootDir, `build/${browser}/version/${keyVersion}/privateKey.pem`) : null;
  console.log(`${timestamp()} webpack.config.js:: key paths - publicKeyPath: ${publicKeyPath || 'none'}, privateKeyPath: ${privateKeyPath || 'none'}`);

  const config = {
    // Set development mode for easier debugging
    mode: 'production',
    // Enable source maps for debugging
    devtool: target === 'unpacked' ? 'inline-source-map' : false,
    // Entry points - preserving original background and content scripts
    // while adding new entries for Angular UI pages
    entry: {
      background: path.resolve(rootDir, 'src/background.ts'),
      content: path.resolve(rootDir, 'src/content.ts'),
      'ui/action/main': path.resolve(rootDir, 'src/ui/action/main.ts'),
      'ui/options/main': path.resolve(rootDir, 'src/ui/options/main.ts'),
      'ui/sidebar/main': path.resolve(rootDir, 'src/ui/sidebar/main.ts'),
    },
    output: {
      // Use [name] placeholder to preserve entry point names
      filename: '[name].js',
      // Unique temp folder for each task
      path: path.join(tempDir, 'Extension'),
      // use relative path to support local files
      publicPath: './',
      // Clean the dist folder before each build
      clean: true
    },
    resolve: {
      // Handle Angular 19's module formats
      extensions: ['.ts', '.js', '.mjs', '.html'],
      alias: {
        // Create shortcut for UI imports
        '@ui': path.resolve(rootDir, 'src/ui'),
      }
    },
    module: {
      rules: [
        // 1. Rule for Angular TypeScript files (use @ngtools/webpack)
        {
          test: /\.ts$/,
          loader: '@ngtools/webpack',
          // Only apply to Angular UI files (adjust path as needed)
          include: path.resolve(rootDir, 'src/ui'),
          exclude: /node_modules/,
        },
        // 2. Rule for non-Angular TypeScript files (use ts-loader)
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          // Exclude Angular UI files (handled by the first rule)
          exclude: [
            path.resolve(rootDir, 'src/ui'), // Angular files
            /node_modules/
          ]
        },
        // 3. HTML loader (for Angular templates)
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: { sources: false },
          include: path.resolve(rootDir, 'src/ui'), // Only Angular templates
          exclude: /node_modules/,
        },
        // 4. CSS loader (shared for both Angular and non-Angular)
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
          include: [
            path.resolve(rootDir, 'src/ui'),
            path.resolve(rootDir, 'node_modules/@angular/material')
          ],
          exclude: /node_modules/,
        },
        // 处理SCSS文件（用于Angular Material）
        {
          test: /\.scss$/,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /eval-override\.js$/,
          use: 'raw-loader'
        }
        // {
        //   test: /\.ts$/,
        //   use: 'ts-loader',
        //   exclude: /node_modules/,
        // },
      ],
    },
    optimization: {
      // 关键：禁止代码分割导致的脚本顺序变化
      splitChunks: false,
      // 禁用可能导致覆盖代码被移除的优化
      usedExports: false,
      // 确保eval覆盖脚本不被优化掉
      concatenateModules: false,
      minimizer: [
        // 覆盖默认的 Terser 配置
        (compiler) => {
          const TerserPlugin = require('terser-webpack-plugin');
          new TerserPlugin({
            exclude: /eval-override\.js$/,
            terserOptions: {
              keep_classnames: true, // 保留类名
              keep_fnames: true,     // 保留函数名（包括构造函数）
            },
          }).apply(compiler);
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.BROWSER': JSON.stringify(browser),
        'process.env.MANIFEST_VERSION': JSON.stringify(manifestVersion),
        'process.env.BUILD_TARGET': JSON.stringify(target),
        'process.env.VERSION': JSON.stringify(version),
      }),
      // Angular compiler plugin (required for Angular files)
      new AngularWebpackPlugin({
        tsconfig: path.resolve(rootDir, 'tsconfig.json'),
        aot: true, // Enable Ahead-of-Time compilation
        jitMode: false, // do not use JIT as it is not supported in Chrome extension
        "sourceMap": false,
        directTemplateLoading: true,
        "buildOptimizer": true,
        "vendorChunk": false,
        "extractLicenses": true,
        "optimization": true,
        "outputHashing": "all",
        // 禁用可能触发动态代码的特性
        "allowedCommonJsDependencies": [],  // 限制 CommonJS 依赖（减少动态导入）
        "strictInjectionParameters": true,
        compilerOptions: {
          enableIvy: true,
          strictTemplates: true,
          "skipMetadataEmit" : true
        }
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(rootDir, `build/${browser}/manifest/${manifestVersion}/manifest.json`),
            to: 'manifest.json',
            transform(content) {
              console.log(`${timestamp()} webpack.config.js:: transforming manifest - from: ${path.resolve(rootDir, `build/${browser}/manifest/${manifestVersion}/manifest.json`)}`);
              const manifest = JSON.parse(content);
              console.log(`${timestamp()} webpack.config.js:: updating manifest version - ${version}`);
              manifest.version = version;
              return JSON.stringify(manifest, null, 2);
            },
          },
          {
            from: path.resolve(rootDir, 'src/resources'),
            to: 'resources/',
            noErrorOnMissing: true,
          },
          {
            from: path.resolve(rootDir, 'src/assets'),
            to: 'assets/',
            noErrorOnMissing: true,
          },
          {
            from: path.resolve(rootDir, 'src/ui/eval-override.js'),
            to: 'ui/',
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
        template: path.resolve(rootDir, 'src/ui/action/index.html'),
        filename: 'ui/action/index.html',
        chunks: ['ui/action/main'],
        // inject the js to body, ensure the DOM is loaded
        inject: 'body',
        publicPath: '../../' // adjust the publicPath for action to load resources correctly
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(rootDir, 'src/ui/options/index.html'),
        filename: 'ui/options/index.html',
        chunks: ['ui/options/main'],
        inject: 'body',
        publicPath: '../../' // adjust the publicPath for options to load resources correctly
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(rootDir, 'src/ui/sidebar/index.html'),
        filename: 'ui/sidebar/index.html',
        chunks: ['ui/sidebar/main'],
        inject: 'body',
        publicPath: '../../' // adjust the publicPath for sidebar to load resources correctly
      }),
      new NonceInjectorPlugin('sha256-1a+QSYaIcbLzT8/xYNz/8ej9tw5aFA+7aw83m2KBrxE='), // Replace with the nonce value
      ...(target === 'unpacked'
        ? [
          console.log(`${timestamp()} webpack.config.js:: adding UnpackedExtensionPlugin`),
          new UnpackedExtensionPlugin({ outputPath, tempDir, publicKeyPath }),
        ]
        : []),
      ...(browser === 'chrome' || browser === 'edge'
        ? [
          ...(target === 'packed'
            ? [
              console.log(`${timestamp()} webpack.config.js:: adding CrxPackPlugin`),
              new CrxPackPlugin({ browser, manifestVersion, keyVersion, outputPath, keyPath: privateKeyPath, tempDir }),
            ]
            : target === 'store'
              ? [
                console.log(`${timestamp()} webpack.config.js:: adding ZipStorePlugin for store`),
                new ZipStorePlugin({ browser, manifestVersion, keyVersion, outputPath, privateKeyPath, tempDir }),
              ]
              : []),
        ]
        : browser === 'firefox' && target === 'packed'
          ? [
            console.log(`${timestamp()} webpack.config.js:: adding XpiPackPlugin`),
            new XpiPackPlugin({
              outputPath,
              apiKeyPath: path.resolve(rootDir, `build/firefox/version/${keyVersion}/apiKey.txt`),
              apiSecretPath: path.resolve(rootDir, `build/firefox/version/${keyVersion}/apiSecret.txt`),
              tempDir,
            }),
          ]
          : browser === 'firefox' && target === 'store'
            ? [
              console.log(`${timestamp()} webpack.config.js:: adding ZipStorePlugin for store (Firefox)`),
              new ZipStorePlugin({ browser, manifestVersion, keyVersion, outputPath, tempDir }),
            ]
            : []),
    ],
  };

  // Clean up temp folder after successful build
  config.plugins.push({
    apply: (compiler) => {
      compiler.hooks.done.tap('CleanupTempPlugin', (stats) => {
        if (stats.hasErrors()) {
          console.log(`${timestamp()} webpack.config.js:: build failed, keeping temp directory - ${tempDir}`);
        } else {
          console.log(`${timestamp()} webpack.config.js:: build succeeded, removing temp directory - ${tempDir}`);
          fse.removeSync(tempDir);
        }
      });
    },
  });

  console.log(`${timestamp()} webpack.config.js:: end`);
  return config;
};