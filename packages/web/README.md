# @gogogo/web

Web automation SDK for the Gogogo project. This package provides a comprehensive set of tools for web automation that works across different environments including node, web, and browser extensions.

## Installation

```bash
npm install @gogogo/web
```

Or with pnpm:

```bash
pnpm add @gogogo/web
```

## Usage

The package provides a fluent API for web automation, similar to:

```typescript
import { Page } from '@gogogo/web';

// Example usage
const page = new Page();
await page.element().first().click();
```

## Features

- Cross-environment compatibility (node, web, extension)
- Fluent API for web automation
- Comprehensive element selection and interaction
- Support for frames, windows, dialogs, and other browser contexts

## API Reference

The package exports the following main classes:

- `AIClient` - AI-powered automation client
- `Browser` - Browser instance management
- `Page` - Page interaction and navigation
- `Element` - Element selection and interaction
- `Frame` - Frame context management
- `Window` - Window management
- `Keyboard` - Keyboard input simulation
- `Mouse` - Mouse input simulation
- `Locator` - Element location strategies
- `Channel` - Communication channel management
- `Dialog` - Dialog handling
- `Expect` - Assertion and expectation utilities
- `RuntimeUtils` - Runtime utilities
- And more...

## Environments

This package is built to work in multiple environments:
- Node.js applications
- Web browsers
- Browser extensions

## License

Apache-2.0