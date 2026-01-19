import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function AIClientDoc() {
  const items: Entry[] = [
    { name: 'init', kind: 'method', signature: '(options?: Record<string, unknown>): this', returns: 'this', desc: 'Initialize client.' },
    { name: 'setModel', kind: 'method', signature: '(model: string): this', returns: 'this', desc: 'Set model name.' },
    { name: 'setSystemPrompt', kind: 'method', signature: '(prompt: string): this', returns: 'this', desc: 'Set system prompt.' },
    { name: 'chat', kind: 'method', signature: '(message: string): Promise<string | null>', returns: 'Promise<string | null>', desc: 'Send a chat and get assistant response.' },
  ];
  return (
    <Section title="AIClient">
      <Paragraph>Chat client for integrating LLM-driven assistance in automation flows.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/qagogogo/gogogo/blob/main/packages/browser-sdk/src/aos/AIClient.ts">AIClient.ts</a>
      </Paragraph>
    </Section>
  );
}
