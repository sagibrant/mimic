import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function WindowDoc() {
  const items: Entry[] = [
    { name: 'page', kind: 'method', signature: '(selector?: PageLocatorOptions): PageLocator', returns: 'PageLocator', desc: 'Page locator.' },
    { name: 'browser', kind: 'method', signature: '(): Promise<Browser>', returns: 'Promise<Browser>', desc: 'Owning browser.' },
    { name: 'pages', kind: 'method', signature: '(): Promise<Page[]>', returns: 'Promise<Page[]>', desc: 'All pages in window.' },
    { name: 'activePage', kind: 'method', signature: '(): Promise<Page>', returns: 'Promise<Page>', desc: 'Active page.' },
    { name: 'state', kind: 'method', signature: '(): Promise<"normal" | "minimized" | "maximized" | "fullscreen" | "locked-fullscreen">', returns: 'Promise<"normal" | "minimized" | "maximized" | "fullscreen" | "locked-fullscreen">', desc: 'Window state.' },
    { name: 'focused', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Is focused.' },
    { name: 'incognito', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Is incognito.' },
    { name: 'closed', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Is closed.' },
    { name: 'openNewPage', kind: 'method', signature: '(url?: string): Promise<Page>', returns: 'Promise<Page>', desc: 'Open new page.' },
    { name: 'focus', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Focus window.' },
    { name: 'close', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Close window.' },
    { name: 'minimize', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Minimize window.' },
    { name: 'maximize', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Maximize window.' },
    { name: 'restore', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Restore window.' },
    { name: 'fullscreen', kind: 'method', signature: '(toggle?: boolean): Promise<void>', returns: 'Promise<void>', desc: 'Toggle fullscreen.' },
    { name: 'on', kind: 'event', signature: '(event: "page", listener: (page: Page) => (unknown | Promise<unknown>)): this', returns: 'this', desc: 'Listen to page events.' },
    { name: 'on', kind: 'event', signature: '(event: "close", listener: (window: Window) => (unknown | Promise<unknown>)): this', returns: 'this', desc: 'Listen to close events.' },
  ];
  return (
    <Section title="Window">
      <Paragraph>Represents a browser window.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/qagogogo/gogogo/blob/main/packages/browser-sdk/src/aos/Window.ts">Window.ts</a>
      </Paragraph>
    </Section>
  );
}
