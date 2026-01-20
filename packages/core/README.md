# @mimic-sdk/core

Shared utilities for the mimic project that work across web, node, and extension environments.

## Overview

This package contains shared utilities that can be used across different environments:
- Chrome Extensions
- Web Applications
- Node.js Applications

The package is built with multiple output formats to support different module systems and environments.

## Installation

```bash
npm install @mimic-sdk/core
```

## Usage

### ES Modules (Recommended)

```javascript
import { StorageUtils, SettingUtils } from '@mimic-sdk/core';

// Use the utilities
const value = await StorageUtils.get('key');
await StorageUtils.set('key', 'value');

const settings = SettingUtils.getSettings();
```

### CommonJS

```javascript
const { StorageUtils, SettingUtils } = require('@mimic-sdk/core');

// Use the utilities
const value = await StorageUtils.get('key');
await StorageUtils.set('key', 'value');
```

### Browser (UMD)

```html
<script src="node_modules/@mimic-sdk/core/dist/browser/index.js"></script>
<script>
  // The library is available as MimicSDKCore
  const { StorageUtils, SettingUtils } = MimicSDKCore;
  
  // Use the utilities
  const value = await StorageUtils.get('key');
  await StorageUtils.set('key', 'value');
</script>
```

## Features

### StorageUtils
Cross-environment storage utility that works with both Chrome extension storage and localStorage:

- `StorageUtils.get(key)` - Get a value from storage
- `StorageUtils.set(key, value)` - Set a value in storage
- `StorageUtils.AddOnChangedListener(listener)` - Add a listener for storage changes

### SettingUtils
Utility for managing application settings with cross-environment support:

- `SettingUtils.getSettings()` - Get current settings
- `SettingUtils.save(settings)` - Save settings
- `SettingUtils.load()` - Load settings
- `SettingUtils.init()` - Initialize settings system

## Build Targets

This package provides multiple build targets:

- **ES Modules**: `dist/es/index.mjs` - For modern bundlers
- **CommonJS**: `dist/cjs/index.js` - For Node.js and older bundlers
- **Browser (UMD)**: `dist/browser/index.js` - For direct browser usage

## Development

### Prerequisites

- Node.js >= 23.11.0
- pnpm >= 10.26.2

### Setup

```bash
# Install dependencies
pnpm install

# Build the package
pnpm run build

# Watch for changes during development
pnpm run dev
```

### Scripts

- `pnpm run build` - Build the package for all targets
- `pnpm run dev` - Watch for changes and rebuild
- `pnpm run type-check` - Check TypeScript types
- `pnpm run lint` - Lint the code

## Compatibility

- Chrome Extensions (v3)
- Modern browsers (ES2020+)
- Node.js (ES2020+)
- All modern module bundlers (Webpack, Rollup, Vite, etc.)

## Architecture

The package is designed to work seamlessly across different environments:

- Uses conditional checks for `chrome` and `localStorage` availability
- Provides fallback mechanisms for different storage APIs
- Maintains consistent API across all environments
- Includes proper TypeScript type definitions

## License

Apache-2.0