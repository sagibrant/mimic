import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function WindowLocatorDoc() {
  const items: Entry[] = [
    { name: 'page', kind: 'method', signature: '(selector?: PageLocatorOptions): PageLocator', returns: 'PageLocator', desc: 'Page locator.' },
  ];
  return (
    <Section title="WindowLocator">
      <Paragraph>Locator for windows; select last-focused or list all.</Paragraph>
      <List items={items} />
      <Paragraph>
        This locator implements the full Window interface. For all Window properties, methods and events, see
        <a href="/apis/automation/window" style={{ marginLeft: 6 }}>Window</a>.
      </Paragraph>
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/gogogo/blob/main/packages/browser-sdk/src/locators/WindowLocator.ts">WindowLocator.ts</a>
      </Paragraph>
    </Section>
  );
}
