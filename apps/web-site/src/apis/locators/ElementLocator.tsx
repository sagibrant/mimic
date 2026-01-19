import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function ElementLocatorDoc() {
  const items: Entry[] = [
    { name: 'element', kind: 'method', signature: '(selector?: ElementLocatorOptions | string): ElementLocator', returns: 'ElementLocator', desc: 'Chain element scoping.' },
    { name: 'text', kind: 'method', signature: '(selector?: TextLocatorOptions | string | RegExp): TextLocator', returns: 'TextLocator', desc: 'Chain text scoping.' },
  ];
  return (
    <Section title="ElementLocator">
      <Paragraph>Locator for elements with chainable element/text queries and actions.</Paragraph>
      <List items={items} />
      <Paragraph>
        This locator implements the full Element interface. For all Element properties and actions, see
        <a href="/apis/automation/element" style={{ marginLeft: 6 }}>Element</a>.
      </Paragraph>
      <Paragraph>
        Source: <a href="https://github.com/qagogogo/gogogo/blob/main/packages/browser-sdk/src/locators/ElementLocator.ts">ElementLocator.ts</a>
      </Paragraph>
    </Section>
  );
}
