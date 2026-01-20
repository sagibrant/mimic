import { Section, Paragraph, List } from '../components/Common';
import type { Entry } from '../components/Common';

export default function ElementDoc() {
  const items: Entry[] = [
    { name: 'element', kind: 'method', signature: '(selector?: ElementLocatorOptions | string): ElementLocator', returns: 'ElementLocator', desc: 'Chain element locating.' },
    { name: 'text', kind: 'method', signature: '(selector?: TextLocatorOptions | string | RegExp): TextLocator', returns: 'TextLocator', desc: 'Chain text locating.' },
    { name: 'ownerFrame', kind: 'method', signature: '(): Promise<Frame>', returns: 'Promise<Frame>', desc: 'Owning frame.' },
    { name: 'contentFrame', kind: 'method', signature: '(): Promise<Frame | null>', returns: 'Promise<Frame | null>', desc: 'Nested frame.' },
    { name: 'tagName', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Tag name.' },
    { name: 'id', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Element id.' },
    { name: 'innerHTML', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Inner HTML.' },
    { name: 'outerHTML', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Outer HTML.' },
    { name: 'innerText', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Inner text.' },
    { name: 'outerText', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Outer text.' },
    { name: 'title', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Title attribute.' },
    { name: 'accessKey', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Access key.' },
    { name: 'hidden', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Hidden state.' },
    { name: 'name', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Name attribute.' },
    { name: 'value', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Value.' },
    { name: 'type', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Input type.' },
    { name: 'alt', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Alt text.' },
    { name: 'accept', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Accept attribute.' },
    { name: 'placeholder', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Placeholder.' },
    { name: 'src', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Image src.' },
    { name: 'disabled', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Disabled.' },
    { name: 'readOnly', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Read only.' },
    { name: 'required', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Required.' },
    { name: 'checked', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Checked.' },
    { name: 'label', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Form label.' },
    { name: 'selected', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Selected.' },
    { name: 'multiple', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Multiple select.' },
    { name: 'options', kind: 'method', signature: '(): Promise<Element[]>', returns: 'Promise<Element[]>', desc: 'Select options.' },
    { name: 'selectedIndex', kind: 'method', signature: '(): Promise<number>', returns: 'Promise<number>', desc: 'Selected index.' },
    { name: 'selectedOptions', kind: 'method', signature: '(): Promise<Element[]>', returns: 'Promise<Element[]>', desc: 'Selected options.' },
    { name: 'visible', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Visibility.' },
    { name: 'boundingBox', kind: 'method', signature: '(): Promise<RectInfo | null>', returns: 'Promise<RectInfo | null>', desc: 'Bounding box.' },
    { name: 'highlight', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Highlight element.' },
    { name: 'getProperty', kind: 'method', signature: '(name: string): Promise<unknown>', returns: 'Promise<unknown>', desc: 'Get property.' },
    { name: 'setProperty', kind: 'method', signature: '(name: string, value: unknown): Promise<void>', returns: 'Promise<void>', desc: 'Set property.' },
    { name: 'getAttribute', kind: 'method', signature: '(name: string): Promise<string | null>', returns: 'Promise<string | null>', desc: 'Get attribute.' },
    { name: 'getAttributes', kind: 'method', signature: '(): Promise<Record<string, unknown>>', returns: 'Promise<Record<string, unknown>>', desc: 'All attributes.' },
    { name: 'setAttribute', kind: 'method', signature: '(name: string, value: string): Promise<void>', returns: 'Promise<void>', desc: 'Set attribute.' },
    { name: 'hasAttribute', kind: 'method', signature: '(name: string): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Has attribute.' },
    { name: 'toggleAttribute', kind: 'method', signature: '(name: string, force?: boolean): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Toggle attribute.' },
    { name: 'querySelectorAll', kind: 'method', signature: '(selector: string): Promise<Element[]>', returns: 'Promise<Element[]>', desc: 'Query inside element.' },
    { name: 'getBoundingClientRect', kind: 'method', signature: '(): Promise<RectInfo>', returns: 'Promise<RectInfo>', desc: 'Client rect.' },
    { name: 'checkValidity', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Form validity.' },
    { name: 'checkVisibility', kind: 'method', signature: '(options?: object): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Visibility checks.' },
    { name: 'focus', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Focus.' },
    { name: 'blur', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Blur.' },
    { name: 'scrollIntoViewIfNeeded', kind: 'method', signature: '(): Promise<void>', returns: 'Promise<void>', desc: 'Scroll into view.' },
    { name: 'check', kind: 'method', signature: '(options?: ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Check checkbox.' },
    { name: 'uncheck', kind: 'method', signature: '(options?: ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Uncheck checkbox.' },
    { name: 'selectOption', kind: 'method', signature: '(values: string | string[] | number | number[] | Element | Element[]): Promise<void>', returns: 'Promise<void>', desc: 'Select option(s).' },
    { name: 'setFileInputFiles', kind: 'method', signature: '(files: string | string[]): Promise<void>', returns: 'Promise<void>', desc: 'Upload files.' },
    { name: 'dispatchEvent', kind: 'method', signature: '(type: string, options?: object): Promise<void>', returns: 'Promise<void>', desc: 'Dispatch event.' },
    { name: 'sendCDPCommand', kind: 'method', signature: '(method: string, commandParams?: { [key: string]: unknown }): Promise<void>', returns: 'Promise<void>', desc: 'Send CDP command.' },
    { name: 'hover', kind: 'method', signature: '(options?: { position?: Point } & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Hover.' },
    { name: 'click', kind: 'method', signature: '(options?: ClickOptions & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Click.' },
    { name: 'dblclick', kind: 'method', signature: '(options?: Omit<ClickOptions, "clickCount"> & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Double click.' },
    { name: 'wheel', kind: 'method', signature: '(options?: { deltaX?: number, deltaY?: number } & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Wheel.' },
    { name: 'dragTo', kind: 'method', signature: '(target: Element | Text, options?: { sourcePosition?: Point, targetPosition?: Point, steps?: number } & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Drag to target.' },
    { name: 'tap', kind: 'method', signature: '(options?: { position?: Point } & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Tap.' },
    { name: 'fill', kind: 'method', signature: '(text: string, options?: TextInputOptions & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Fill text.' },
    { name: 'clear', kind: 'method', signature: '(options?: ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Clear value.' },
    { name: 'press', kind: 'method', signature: '(keys: string | string[], options?: { delayBetweenDownUp?: number } & ActionOptions): Promise<void>', returns: 'Promise<void>', desc: 'Press keys.' },
    { name: 'nodeName', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Node name (base).' },
    { name: 'nodeType', kind: 'method', signature: '(): Promise<number>', returns: 'Promise<number>', desc: 'Node type (base).' },
    { name: 'nodeValue', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Node value (base).' },
    { name: 'isConnected', kind: 'method', signature: '(): Promise<boolean>', returns: 'Promise<boolean>', desc: 'Connected to DOM (base).' },
    { name: 'textContent', kind: 'method', signature: '(): Promise<string>', returns: 'Promise<string>', desc: 'Text content (base).' },
  ];
  return (
    <Section title="Element">
      <Paragraph>DOM element automation with rich properties and actions. Includes Node base members.</Paragraph>
      <List items={items} />
      <Paragraph>
        Source: <a href="https://github.com/sagibrant/mimic/blob/main/packages/browser-sdk/src/aos/Element.ts">Element.ts</a>
      </Paragraph>
    </Section>
  );
}
