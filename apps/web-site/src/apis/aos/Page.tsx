import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function PageDoc() {
  const items: Entry[] = [
    { name: 'frame', kind: 'method', signature: '(selector?: FrameLocatorOptions | string): FrameLocator', returns: 'FrameLocator', desc: 'Frame locator.' },
    { name: 'element', kind: 'method', signature: '(selector?: ElementLocatorOptions | string): ElementLocator', returns: 'ElementLocator', desc: 'Element locator.' },
    { name: 'text', kind: 'method', signature: '(selector?: TextLocatorOptions | string | RegExp): TextLocator', returns: 'TextLocator', desc: 'Text locator.' },
    { name: 'window', kind: 'method', signature: '(): Promise<Window | null>', returns: 'Promise<Window | null>', desc: 'Owning window.' },
    { name: 'mainFrame', kind: 'method', signature: '(): Promise<Frame | null>', returns: 'Promise<Frame | null>', desc: 'Main frame.' },
    { name: 'frames', kind: 'method', signature: '(): Promise<Frame[]>', returns: 'Promise<Frame[]>', desc: 'All frames.' },
    { name: 'mouse', kind: 'method', signature: '(): Mouse', returns: 'Mouse', desc: 'Mouse helper.' },
    { name: 'keyboard', kind: 'method', signature: '(): Keyboard', returns: 'Keyboard', desc: 'Keyboard helper.' },
    { name: 'dialog', kind: 'method', signature: '(): Dialog', returns: 'Dialog', desc: 'Dialog helper.' },
    { name: 'url', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Page URL.' },
    { name: 'title', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Page title.' },
    { name: 'content', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'HTML content.' },
    { name: 'status', kind: 'method', signature: '(): Promise<"unloaded" | "loading" | "complete">', returns: 'Promise<"unloaded" | "loading" | "complete">', desc: 'Loading status.' },
    { name: 'active', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Active state.' },
    { name: 'closed', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Closed state.' },
    { name: 'activate', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Activate tab.' },
    { name: 'bringToFront', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Focus window and activate tab.' },
    { name: 'sync', kind: 'method', signature: '(timeout?: number): Promise<void>', returns: 'Promise<void>', desc: 'Wait until load complete.' },
    { name: 'openNewPage', kind: 'method', signature: '(url?: string): Promise<Page>', returns: 'Promise<Page>', desc: 'Open new page.' },
    { name: 'navigate', kind: 'method', signature: '(url?: string): Promise<void>', returns: 'Promise<void>', desc: 'Navigate.' },
    { name: 'refresh', kind: 'method', signature: '(bypassCache?: boolean): Promise<void>', returns: 'Promise<void>', desc: 'Reload.' },
    { name: 'back', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Go back.' },
    { name: 'forward', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Go forward.' },
    { name: 'close', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Close page.' },
    { name: 'zoom', kind: 'method', signature: '(factor: number): Promise<void>', returns: 'Promise<void>', desc: 'Zoom.' },
    { name: 'moveToWindow', kind: 'method', signature: '(window: Window, index?: number): Promise<void>', returns: 'Promise<void>', desc: 'Move tab.' },
    { name: 'captureScreenshot', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Screenshot base64.' },
    { name: 'executeScript', kind: 'method', signature: '<Args extends unknown[], Result>(func: (...args: Args) => Result, args?: Args): Promise<Result>', returns: 'Promise<Result>', desc: 'Execute script in page.' },
    { name: 'querySelectorAll', kind: 'method', signature: '(selector: string): Promise<Element[]>', returns: 'Promise<Element[]>', desc: 'Elements in main frame.' },
    { name: 'on', kind: 'event', signature: '(event: "dialog", listener: (dialog: Dialog) => (unknown | Promise<unknown>)): this', returns: 'this', desc: 'Listen to dialog events.' },
    { name: 'on', kind: 'event', signature: '(event: "domcontentloaded" | "close", listener: (page: Page) => (unknown | Promise<unknown>)): this', returns: 'this', desc: 'Listen to page lifecycle events.' },
  ];
  return (
    <Section title="Page">
      <Paragraph>Represents a tab/page with full navigation and interaction.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/gogogo/blob/main/packages/browser-sdk/src/aos/Page.ts">Page.ts</a>
      </Paragraph>
    </Section>
  );
}
