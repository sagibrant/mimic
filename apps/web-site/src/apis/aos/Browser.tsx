import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function Browser() {
  const items: Entry[] = [
    { name: 'name', kind: 'method', signature: '(): string', returns: 'string', desc: 'Browser name.' },
    { name: 'version', kind: 'method', signature: '(): string', returns: 'string', desc: 'Browser version.' },
    { name: 'majorVersion', kind: 'method', signature: '(): number', returns: 'number', desc: 'Major version.' },
    { name: 'attachDebugger', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Attach CDP debugger.' },
    { name: 'detachDebugger', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Detach debugger.' },
    { name: 'setDefaultTimeout', kind: 'method', signature: '(timeout: number): Promise<void>', returns: 'Promise<void>', desc: 'Set default timeout.' },
    { name: 'cookies', kind: 'method', signature: '(urls?: string | string[]): Promise<Cookie[]>', returns: 'Promise<Cookie[]>', desc: 'Get cookies.' },
    { name: 'addCookies', kind: 'method', signature: '(cookies: (Cookie & { url?: string }) | (Cookie & { url?: string })[]): Promise<void>', returns: 'Promise<void>', desc: 'Add cookies.' },
    { name: 'clearCookies', kind: 'method', signature: '(options?: { name?: string | RegExp, domain?: string | RegExp, path?: string | RegExp }): Promise<void>', returns: 'Promise<void>', desc: 'Clear cookies by filters.' },
    { name: 'openNewWindow', kind: 'method', signature: '(url?: string): Promise<Window>', returns: 'Promise<Window>', desc: 'Open new window.' },
    { name: 'openNewPage', kind: 'method', signature: '(url?: string): Promise<Page>', returns: 'Promise<Page>', desc: 'Open new tab.' },
    { name: 'close', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Close automation session.' },
    { name: 'windows', kind: 'method', signature: '(): Promise<Window[]>', returns: 'Promise<Window[]>', desc: 'All windows.' },
    { name: 'pages', kind: 'method', signature: '(): Promise<Page[]>', returns: 'Promise<Page[]>', desc: 'All pages.' },
    { name: 'lastFocusedWindow', kind: 'method', signature: '(): Promise<Window>', returns: 'Promise<Window>', desc: 'Last-focused window.' },
    { name: 'lastActivePage', kind: 'method', signature: '(): Promise<Page>', returns: 'Promise<Page>', desc: 'Last active page.' },
    { name: 'window', kind: 'method', signature: '(selector?: WindowLocatorOptions): WindowLocator', returns: 'WindowLocator', desc: 'Window locator.' },
    { name: 'page', kind: 'method', signature: '(selector?: PageLocatorOptions): PageLocator', returns: 'PageLocator', desc: 'Page locator.' },
    { name: 'on', kind: 'event', signature: '(event: "window", listener: (window: Window) => (unknown | Promise<unknown>)): this', returns: 'this', desc: 'Listen to window events.' },
    { name: 'on', kind: 'event', signature: '(event: "page", listener: (page: Page) => (unknown | Promise<unknown>)): this', returns: 'this', desc: 'Listen to page events.' },
  ];
  return (
    <Section title="Browser">
      <Paragraph>Top-level automation entry representing the current browser.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/mimic/blob/main/packages/browser-sdk/src/aos/Browser.ts">Browser.ts</a>
      </Paragraph>
    </Section>
  );
}
