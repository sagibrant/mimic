import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function TextLocatorDoc() {
  const items: Entry[] = [];
  return (
    <Section title="TextLocator">
      <Paragraph>Locator for text nodes by text or RegExp.</Paragraph>
      <List items={items} />
      <Paragraph>
        This locator implements the full Text interface. For all Text properties and actions, see
        <a href="/apis/automation/text" style={{ marginLeft: 6 }}>Text</a>.
      </Paragraph>
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/gogogo/blob/main/packages/browser-sdk/src/locators/TextLocator.ts">TextLocator.ts</a>
      </Paragraph>
    </Section>
  );
}
