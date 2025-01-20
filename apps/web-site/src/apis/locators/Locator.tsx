import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function LocatorBaseDoc() {
  const items: Entry[] = [
    { name: 'filter', kind: 'method', signature: '(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<T>', returns: 'Locator<T>', desc: 'Add mandatory filters.' },
    { name: 'prefer', kind: 'method', signature: '(options?: LocatorFilterOption | LocatorFilterOption[]): Locator<T>', returns: 'Locator<T>', desc: 'Add assistive filters.' },
    { name: 'get', kind: 'method', signature: '(): Promise<T>', returns: 'Promise<T>', desc: 'Return single matched object, waits by timeout.' },
    { name: 'count', kind: 'method', signature: '(): Promise<number>', returns: 'Promise<number>', desc: 'Number of matches.' },
    { name: 'all', kind: 'method', signature: '(): Promise<Locator<T>[]>', returns: 'Promise<Locator<T>[]>', desc: 'Locators for all matches.' },
    { name: 'nth', kind: 'method', signature: '(index: number): Locator<T>', returns: 'Locator<T>', desc: 'Locator at index.' },
    { name: 'first', kind: 'method', signature: '(): Locator<T>', returns: 'Locator<T>', desc: 'First match.' },
    { name: 'last', kind: 'method', signature: '(): Locator<T>', returns: 'Locator<T>', desc: 'Last match.' },
  ];
  return (
    <Section title="Locator (Base)">
      <Paragraph>Base class for locators with filtering and ordinal selection.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/gogogo/blob/main/packages/browser-sdk/src/locators/Locator.ts">Locator.ts</a>
      </Paragraph>
    </Section>
  );
}
