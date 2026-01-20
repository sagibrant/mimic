import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function KeyboardDoc() {
  const items: Entry[] = [
    { name: 'type', kind: 'method', signature: '(text: string, options?: TextInputOptions): Promise<void>', returns: 'Promise<void>', desc: 'Type text with optional delays.' },
    { name: 'down', kind: 'method', signature: '(key: string): Promise<void>', returns: 'Promise<void>', desc: 'Key down.' },
    { name: 'up', kind: 'method', signature: '(key: string): Promise<void>', returns: 'Promise<void>', desc: 'Key up.' },
    { name: 'press', kind: 'method', signature: '(keys: string | string[], options?: { delayBetweenDownUp?: number }): Promise<void>', returns: 'Promise<void>', desc: 'Press one or multiple keys.' },
  ];
  return (
    <Section title="Keyboard">
      <Paragraph>Keyboard automation bound to a page.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/mimic/blob/main/packages/browser-sdk/src/aos/Keyboard.ts">Keyboard.ts</a>
      </Paragraph>
    </Section>
  );
}
