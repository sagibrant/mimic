import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function TextDoc() {
  const items: Entry[] = [
    { name: 'ownerFrame', kind: 'method', signature: '(): Promise<Frame>', returns: 'Promise<Frame>', desc: 'Owning frame.' },
    { name: 'ownerElement', kind: 'method', signature: '(): Promise<Element | null>', returns: 'Promise<Element | null>', desc: 'Owning element.' },
    { name: 'nodeName', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Node name.' },
    { name: 'nodeType', kind: 'method', signature: '(): Promise<number>', returns: 'Promise<number>', desc: 'Node type.' },
    { name: 'nodeValue', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Node value.' },
    { name: 'isConnected', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Connected to DOM.' },
    { name: 'textContent', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Text content.' },
    { name: 'boundingBox', kind: 'method', signature: '(): Promise<RectInfo | null>', returns: 'Promise<RectInfo | null>', desc: 'Bounding box.' },
    { name: 'highlight', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Highlight.' },
    { name: 'getProperty', kind: 'method', signature: '(name: string): Promise<unknown>', returns: 'Promise<unknown>', desc: 'Get property.' },
    { name: 'setProperty', kind: 'method', signature: '(name: string, value: unknown): Promise<void>', returns: 'Promise<void>', desc: 'Set property.' },
    { name: 'dispatchEvent', kind: 'method', signature: '(type: string, options?: object): Promise<void>', returns: 'Promise<void>', desc: 'Dispatch event.' },
    { name: 'sendCDPCommand', kind: 'method', signature: '(method: string, commandParams?: { [key: string]: unknown }): Promise<void>', returns: 'Promise<void>', desc: 'Send CDP command.' },
    { name: 'getBoundingClientRect', kind: 'method', signature: '(): Promise<RectInfo>', returns: 'Promise<RectInfo>', desc: 'Client rect.' },
    { name: 'click', kind: 'method', signature: '(options?: ClickOptions & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Click.' },
    { name: 'dblclick', kind: 'method', signature: '(options?: Omit<ClickOptions, "clickCount"> & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Double click.' },
    { name: 'wheel', kind: 'method', signature: '(options?: { deltaX?: number, deltaY?: number } & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Wheel.' },
    { name: 'dragTo', kind: 'method', signature: '(target: Element | Text, options?: { sourcePosition?: Point, targetPosition?: Point, steps?: number } & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Drag to target.' },
    { name: 'hover', kind: 'method', signature: '(options?: { position?: Point } & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Hover.' },
    { name: 'tap', kind: 'method', signature: '(options?: { position?: Point } & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Tap.' },
  ];
  return (
    <Section title="Text">
      <Paragraph>Text node automation and interactions via owner element. Includes Node base members.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/mimic/blob/main/packages/browser-sdk/src/aos/Text.ts">Text.ts</a>
      </Paragraph>
    </Section>
  );
}
