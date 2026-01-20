import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function FrameDoc() {
  const items: Entry[] = [
    { name: 'element', kind: 'method', signature: '(selector?: ElementLocatorOptions | string): ElementLocator', returns: 'ElementLocator', desc: 'Element locator.' },
    { name: 'text', kind: 'method', signature: '(selector?: TextLocatorOptions | string | RegExp): TextLocator', returns: 'TextLocator', desc: 'Text locator.' },
    { name: 'page', kind: 'method', signature: '(): Promise<Page>', returns: 'Promise<Page>', desc: 'Owning page.' },
    { name: 'parentFrame', kind: 'method', signature: '(): Promise<Frame | null>', returns: 'Promise<Frame | null>', desc: 'Parent frame.' },
    { name: 'childFrames', kind: 'method', signature: '(): Promise<Frame[]>', returns: 'Promise<Frame[]>', desc: 'Child frames.' },
    { name: 'ownerElement', kind: 'method', signature: '(): Promise<Element | null>', returns: 'Promise<Element | null>', desc: 'Iframe element in parent.' },
    { name: 'url', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Frame URL.' },
    { name: 'content', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'HTML content.' },
    { name: 'status', kind: 'method', signature: '(): Promise<"BeforeNavigate" | "Committed" | "DOMContentLoaded" | "Completed" | "ErrorOccurred" | "Removed">', returns: 'Promise<"BeforeNavigate" | "Committed" | "DOMContentLoaded" | "Completed" | "ErrorOccurred" | "Removed">', desc: 'Lifecycle status.' },
    { name: 'readyState', kind: 'method', signature: '(): Promise<"loading" | "interactive" | "complete">', returns: 'Promise<"loading" | "interactive" | "complete">', desc: 'DOM readyState.' },
    { name: 'sync', kind: 'method', signature: '(timeout?: number): Promise<void>', returns: 'Promise<void>', desc: 'Wait to complete.' },
    { name: 'executeScript', kind: 'method', signature: '<Args extends unknown[], Result>(func: (...args: Args) => Result, args?: Args): Promise<Result>', returns: 'Promise<Result>', desc: 'Execute script in frame.' },
    { name: 'querySelectorAll', kind: 'method', signature: '(selector: string): Promise<Element[]>', returns: 'Promise<Element[]>', desc: 'Query elements.' },
  ];
  return (
    <Section title="Frame">
      <Paragraph>Represents a document frame.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/mimic/blob/main/packages/browser-sdk/src/aos/Frame.ts">Frame.ts</a>
      </Paragraph>
    </Section>
  );
}
