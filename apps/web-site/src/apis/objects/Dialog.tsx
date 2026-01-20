import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function DialogDoc() {
  const items: Entry[] = [
    { name: 'page', kind: 'method', signature: '(): Promise<Page>', returns: 'Promise<Page>', desc: 'Owning page.' },
    { name: 'opened', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Whether a dialog is open.' },
    { name: 'type', kind: 'method', signature: '(): Promise<"alert" | "confirm" | "prompt" | "beforeunload">', returns: 'Promise<"alert" | "confirm" | "prompt" | "beforeunload">', desc: 'Dialog type.' },
    { name: 'defaultValue', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Default prompt value.' },
    { name: 'message', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Dialog message.' },
    { name: 'accept', kind: 'method', signature: '(promptText?: string): Promise<void>', returns: 'Promise<void>', desc: 'Accept dialog.' },
    { name: 'dismiss', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Dismiss dialog.' },
  ];
  return (
    <Section title="Dialog">
      <Paragraph>JavaScript dialog automation on a page.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/mimic/blob/main/packages/browser-sdk/src/aos/Dialog.ts">Dialog.ts</a>
      </Paragraph>
    </Section>
  );
}
