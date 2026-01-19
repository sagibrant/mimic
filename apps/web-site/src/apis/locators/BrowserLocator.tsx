import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function BrowserLocatorDoc() {
  const items: Entry[] = [
    { name: 'window', kind: 'method', signature: '(selector?: WindowLocatorOptions): WindowLocator', returns: 'WindowLocator', desc: 'Window locator.' },
    { name: 'page', kind: 'method', signature: '(selector?: PageLocatorOptions): PageLocator', returns: 'PageLocator', desc: 'Page locator (defaults to last-focused window).' },
  ];
  return (
    <Section title="BrowserLocator">
      <Paragraph>Locator to access the current browser and its windows/pages.</Paragraph>
      <List items={items} />
      <Paragraph>
        This locator implements the full Browser interface. For all Browser properties, methods and events, see
        <a href="/apis/automation/browser" style={{ marginLeft: 6 }}>Browser</a>.
      </Paragraph>
      <Paragraph>
        Source: <a href="https://github.com/qagogogo/gogogo/blob/main/packages/browser-sdk/src/locators/BrowserLocator.ts">BrowserLocator.ts</a>
      </Paragraph>
    </Section>
  );
}
