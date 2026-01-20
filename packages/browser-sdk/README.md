# mimic-sdk

Mimic automation SDK for browser environments. This package targets front-end browser environments (including front-end bundlers like Vite/Webpack), and currently does not support Node.js server-side or SSR usage.

## Installation

```bash
npm install mimic-sdk
# or
pnpm add mimic-sdk
```

## Usage (Front-end Bundler, Recommended)

Use with front-end bundlers in browser environments:

```javascript
import { BrowserLocator, AIClient, expect, RuntimeUtils } from 'mimic-sdk';

// Clear cache objects (optional)
RuntimeUtils.repo.clear();

// Get current browser and page
const browser = await new BrowserLocator().get();
const page = await browser.lastActivePage();

// Example: Click button
await page.element('#submit-btn').first().click();

// Example: Use AIClient
const ai = new AIClient();
await ai.init({baseURL: 'xxx', apiKey: 'xxx'}).setModel('gpt-4o').chat('hello');
```

## Usage (Direct UMD Import)

No bundling required, directly import the UMD build in your page:

```html
<script src="node_modules/mimic-sdk/dist/browser/index.js"></script>
<script>
  const { BrowserLocator, AIClient, expect, RuntimeUtils } = MimicSDK;
  (async () => {
    RuntimeUtils.repo.clear();
    const browser = await new BrowserLocator().get();
    const page = await browser.lastActivePage();
    await page.element('#submit-btn').first().click();
  })();
<\/script>
```

## Environment Notes

- Currently only supported in browser environments; please do not import or use in Node.js server-side or SSR
- The package's `exports` only exposes `browser` and `types`; modern tools will prioritize the browser entry
- `main` / `module` fields are for compatibility with some older tools, but do not indicate Node runtime support

## License

Apache-2.0
