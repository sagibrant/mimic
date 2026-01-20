import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function ExpectDoc() {
  const items: Entry[] = [
    { name: 'expect', kind: 'method', signature: '(actual: unknown): Expect', returns: 'Expect', desc: 'Create Expect for value or function.' },
    { name: 'toBe', kind: 'method', signature: '(expected: unknown): void', returns: 'void', desc: 'Strict equality.' },
    { name: 'toEqual', kind: 'method', signature: '(expected: unknown): void', returns: 'void', desc: 'Deep equality; for automation objects compares RTIDs.' },
    { name: 'toBeTruthy', kind: 'method', signature: '(): void', returns: 'void', desc: 'Truthy.' },
    { name: 'toBeFalsy', kind: 'method', signature: '(): void', returns: 'void', desc: 'Falsy.' },
    { name: 'toBeNaN', kind: 'method', signature: '(): void', returns: 'void', desc: 'NaN.' },
    { name: 'toBeNull', kind: 'method', signature: '(): void', returns: 'void', desc: 'Null.' },
    { name: 'toBeUndefined', kind: 'method', signature: '(): void', returns: 'void', desc: 'Undefined.' },
    { name: 'toBeDefined', kind: 'method', signature: '(): void', returns: 'void', desc: 'Defined.' },
    { name: 'toBeNullOrUndefined', kind: 'method', signature: '(): void', returns: 'void', desc: 'Null or undefined.' },
    { name: 'toHaveLength', kind: 'method', signature: '(n: number): void', returns: 'void', desc: 'Length check.' },
    { name: 'toContain', kind: 'method', signature: '(x: unknown): void', returns: 'void', desc: 'Array/string contains.' },
    { name: 'toMatch', kind: 'method', signature: '(pattern: RegExp | string): void', returns: 'void', desc: 'Regex or string match.' },
    { name: 'toThrow', kind: 'method', signature: '(msg?: string): void', returns: 'void', desc: 'Function throws.' },
    { name: 'not', kind: 'property', returns: 'Expect', desc: 'Negation modifier.' },
  ];
  return (
    <Section title="Assertions: expect() and Expect">
      <Paragraph>Assertion utilities for validations with concise error messages.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/mimic/blob/main/packages/browser-sdk/src/Expect.ts">Expect.ts</a>
      </Paragraph>
    </Section>
  );
}
