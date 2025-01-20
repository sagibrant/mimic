import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function MouseDoc() {
  const items: Entry[] = [
    { name: 'click', kind: 'method', signature: '(x: number, y: number, options?: Omit<ClickOptions, "position">): Promise<void>', returns: 'Promise<void>', desc: 'Click at coordinates.' },
    { name: 'down', kind: 'method', signature: '(options?: { button?: "left" | "right" | "middle"; clickCount?: number; }): Promise<void>', returns: 'Promise<void>', desc: 'Press mouse button.' },
    { name: 'up', kind: 'method', signature: '(options?: { button?: "left" | "right" | "middle"; clickCount?: number; }): Promise<void>', returns: 'Promise<void>', desc: 'Release mouse button.' },
    { name: 'move', kind: 'method', signature: '(x: number, y: number, options?: { steps?: number }): Promise<void>', returns: 'Promise<void>', desc: 'Move pointer.' },
    { name: 'wheel', kind: 'method', signature: '(deltaX: number, deltaY: number): Promise<void>', returns: 'Promise<void>', desc: 'Wheel scrolling.' },
  ];
  return (
    <Section title="Mouse">
      <Paragraph>Mouse automation bound to a page.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/gogogo/blob/main/packages/browser-sdk/src/aos/Mouse.ts">Mouse.ts</a>
      </Paragraph>
    </Section>
  );
}
