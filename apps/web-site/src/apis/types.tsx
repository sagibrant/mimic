import { Section, Paragraph, List } from './components/Common';
import type { Entry } from './components/Common';

export default function TypesDoc() {
  const locatorFilterOptionMembers: Entry[] = [
    { name: 'name', kind: 'property', returns: 'string', desc: 'Filter field name.' },
    { name: 'value', kind: 'property', returns: 'string | number | boolean | RegExp | undefined', desc: 'Expected value.' },
    { name: 'type', kind: 'property', returns: '"property" | "attribute" | "function" | "text" | undefined', desc: 'Value source.' },
    { name: 'match', kind: 'property', returns: '"has" | "hasNot" | "exact" | "includes" | "startsWith" | "endsWith" | "regex" | undefined', desc: 'Match behavior.' },
  ];

  const browserLocatorOptionsMembers: Entry[] = [
    { name: 'name', kind: 'property', returns: 'string | undefined', desc: 'Browser name.' },
    { name: 'version', kind: 'property', returns: 'string | undefined', desc: 'Browser version.' },
    { name: 'processId', kind: 'property', returns: 'number | undefined', desc: 'Browser process ID.' },
  ];

  const windowLocatorOptionsMembers: Entry[] = [
    { name: 'lastFocused', kind: 'property', returns: 'boolean | undefined', desc: 'Prefer last focused window.' },
  ];

  const pageLocatorOptionsMembers: Entry[] = [
    { name: 'url', kind: 'property', returns: 'string | RegExp | undefined', desc: 'Match by page URL.' },
    { name: 'title', kind: 'property', returns: 'string | RegExp | undefined', desc: 'Match by page title.' },
    { name: 'active', kind: 'property', returns: 'boolean | undefined', desc: 'Match active page.' },
    { name: 'lastFocusedWindow', kind: 'property', returns: 'boolean | undefined', desc: 'Prefer last focused window.' },
    { name: 'index', kind: 'property', returns: 'number | undefined', desc: 'Match by index.' },
  ];

  const frameLocatorOptionsMembers: Entry[] = [
    { name: 'url', kind: 'property', returns: 'string | RegExp | undefined', desc: 'Match by frame URL.' },
    { name: 'selector', kind: 'property', returns: 'string | undefined', desc: 'Match by selector.' },
  ];

  const elementLocatorOptionsMembers: Entry[] = [
    { name: 'selector', kind: 'property', returns: 'string | undefined', desc: 'CSS selector.' },
    { name: 'xpath', kind: 'property', returns: 'string | undefined', desc: 'XPath selector.' },
  ];

  const textLocatorOptionsMembers: Entry[] = [
    { name: 'text', kind: 'property', returns: 'string | RegExp | undefined', desc: 'Match by text content.' },
  ];

  const actionOptionsMembers: Entry[] = [
    { name: 'mode', kind: 'property', returns: '"event" | "cdp" | undefined', desc: 'Action mode.' },
    { name: 'force', kind: 'property', returns: 'boolean | undefined', desc: 'Force the action.' },
  ];

  const clickOptionsMembers: Entry[] = [
    { name: 'button', kind: 'property', returns: '"left" | "right" | "middle" | undefined', desc: 'Mouse button.' },
    { name: 'clickCount', kind: 'property', returns: 'number | undefined', desc: 'Click count.' },
    { name: 'position', kind: 'property', returns: 'Point | undefined', desc: 'Pointer position.' },
    { name: 'modifiers', kind: 'property', returns: 'Array<"Alt" | "Control" | "ControlOrMeta" | "Meta" | "Shift"> | undefined', desc: 'Keyboard modifiers.' },
    { name: 'delayBetweenDownUp', kind: 'property', returns: 'number | undefined', desc: 'Delay between down/up.' },
    { name: 'delayBetweenClick', kind: 'property', returns: 'number | undefined', desc: 'Delay between clicks.' },
  ];

  const textInputOptionsMembers: Entry[] = [
    { name: 'delayBetweenDownUp', kind: 'property', returns: 'number | undefined', desc: 'Delay between down/up.' },
    { name: 'delayBetweenChar', kind: 'property', returns: 'number | undefined', desc: 'Delay between characters.' },
  ];

  const pointMembers: Entry[] = [
    { name: 'x', kind: 'property', returns: 'number', desc: 'X coordinate.' },
    { name: 'y', kind: 'property', returns: 'number', desc: 'Y coordinate.' },
  ];

  const rectInfoMembers: Entry[] = [
    { name: 'left', kind: 'property', returns: 'number', desc: 'Left edge.' },
    { name: 'top', kind: 'property', returns: 'number', desc: 'Top edge.' },
    { name: 'right', kind: 'property', returns: 'number', desc: 'Right edge.' },
    { name: 'bottom', kind: 'property', returns: 'number', desc: 'Bottom edge.' },
    { name: 'width', kind: 'property', returns: 'number', desc: 'Width.' },
    { name: 'height', kind: 'property', returns: 'number', desc: 'Height.' },
    { name: 'x', kind: 'property', returns: 'number', desc: 'X coordinate.' },
    { name: 'y', kind: 'property', returns: 'number', desc: 'Y coordinate.' },
  ];

  const cookieMembers: Entry[] = [
    { name: 'name', kind: 'property', returns: 'string', desc: 'Cookie name.' },
    { name: 'value', kind: 'property', returns: 'string', desc: 'Cookie value.' },
    { name: 'domain', kind: 'property', returns: 'string | undefined', desc: 'Domain.' },
    { name: 'path', kind: 'property', returns: 'string | undefined', desc: 'Path.' },
    { name: 'expires', kind: 'property', returns: 'number | undefined', desc: 'Expiration timestamp (seconds).' },
    { name: 'httpOnly', kind: 'property', returns: 'boolean | undefined', desc: 'HTTP only.' },
    { name: 'secure', kind: 'property', returns: 'boolean | undefined', desc: 'Secure.' },
    { name: 'session', kind: 'property', returns: 'boolean | undefined', desc: 'Session cookie.' },
    { name: 'sameSite', kind: 'property', returns: '"Strict" | "Lax" | "None" | undefined', desc: 'SameSite.' },
    { name: 'partitionKey', kind: 'property', returns: 'string | undefined', desc: 'Partition key.' },
  ];

  return (
    <Section title="Types">
      <Paragraph>Core types used across Gogogo. Reference for method parameters and return values.</Paragraph>
      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>LocatorOptions</h2>
      <Paragraph>Union of all locator option types.</Paragraph>
      <List items={[{ name: 'LocatorOptions', kind: 'property', returns: 'BrowserLocatorOptions | WindowLocatorOptions | PageLocatorOptions | FrameLocatorOptions | ElementLocatorOptions | TextLocatorOptions', desc: 'Primary selector options type union.' }]} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>LocatorFilterOption</h2>
      <Paragraph>One filter clause used by Locator.filter() and Locator.prefer().</Paragraph>
      <List items={locatorFilterOptionMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>BrowserLocatorOptions</h2>
      <Paragraph>Options to locate a browser instance.</Paragraph>
      <List items={browserLocatorOptionsMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>WindowLocatorOptions</h2>
      <Paragraph>Options to locate a window instance.</Paragraph>
      <List items={windowLocatorOptionsMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>PageLocatorOptions</h2>
      <Paragraph>Options to locate a page instance.</Paragraph>
      <List items={pageLocatorOptionsMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>FrameLocatorOptions</h2>
      <Paragraph>Options to locate a frame instance.</Paragraph>
      <List items={frameLocatorOptionsMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>ElementLocatorOptions</h2>
      <Paragraph>Options to locate an element instance.</Paragraph>
      <List items={elementLocatorOptionsMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>TextLocatorOptions</h2>
      <Paragraph>Options to locate a text node instance.</Paragraph>
      <List items={textLocatorOptionsMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>ActionOptions</h2>
      <Paragraph>Common action options for element/text actions.</Paragraph>
      <List items={actionOptionsMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>ClickOptions</h2>
      <Paragraph>Options for click-like actions.</Paragraph>
      <List items={clickOptionsMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>TextInputOptions</h2>
      <Paragraph>Options for text typing behavior.</Paragraph>
      <List items={textInputOptionsMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>Point</h2>
      <Paragraph>Coordinates.</Paragraph>
      <List items={pointMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>RectInfo</h2>
      <Paragraph>Rectangle bounds.</Paragraph>
      <List items={rectInfoMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>Cookie</h2>
      <Paragraph>Cookie record.</Paragraph>
      <List items={cookieMembers} />

      <h2 style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>JSObject</h2>
      <Paragraph>Generic JS object record.</Paragraph>
      <List items={[{ name: 'JSObject', kind: 'property', returns: 'Record<string, unknown>', desc: 'Generic JS object.' }]} />
    </Section>
  );
}
