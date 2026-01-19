import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function FrameLocatorDoc() {
  const items: Entry[] = [
    { name: 'element', kind: 'method', signature: '(selector?: ElementLocatorOptions | string): ElementLocator', returns: 'ElementLocator', desc: 'Element locator.' },
    { name: 'text', kind: 'method', signature: '(selector?: TextLocatorOptions | string | RegExp): TextLocator', returns: 'TextLocator', desc: 'Text locator.' },
  ];
  return (
    <Section title="FrameLocator">
      <Paragraph>Locator for frames with element/text locating.</Paragraph>
      <List items={items} />
      <Paragraph>
        This locator implements the full Frame interface. For all Frame properties, methods and events, see
        <a href="/apis/automation/frame" style={{ marginLeft: 6 }}>Frame</a>.
      </Paragraph>
      <Paragraph>
        Source: <a href="https://github.com/qagogogo/gogogo/blob/main/packages/browser-sdk/src/locators/FrameLocator.ts">FrameLocator.ts</a>
      </Paragraph>
    </Section>
  );
}
