import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function PageLocatorDoc() {
  const items: Entry[] = [
    { name: 'frame', kind: 'method', signature: '(selector?: FrameLocatorOptions | string): FrameLocator', returns: 'FrameLocator', desc: 'Frame locator.' },
    { name: 'element', kind: 'method', signature: '(selector?: ElementLocatorOptions | string): ElementLocator', returns: 'ElementLocator', desc: 'Element locator.' },
    { name: 'text', kind: 'method', signature: '(selector?: TextLocatorOptions | string | RegExp): TextLocator', returns: 'TextLocator', desc: 'Text locator.' },
  ];
  return (
    <Section title="PageLocator">
      <Paragraph>Locator for pages with element/text/frame helpers.</Paragraph>
      <List items={items} />
      <Paragraph>
        This locator implements the full Page interface. For all Page properties, methods and events, see
        <a href="/apis/automation/page" style={{ marginLeft: 6 }}>Page</a>.
      </Paragraph>
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/mimic/blob/main/packages/browser-sdk/src/locators/PageLocator.ts">PageLocator.ts</a>
      </Paragraph>
    </Section>
  );
}
