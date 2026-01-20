import React, { useEffect, useMemo, useState } from 'react';
import { Section, Paragraph } from './components/Common';
import Browser from './aos/Browser';
import WindowDoc from './aos/Window';
import PageDoc from './aos/Page';
import ElementDoc from './aos/Element';
import FrameDoc from './aos/Frame';
import TextDoc from './aos/Text';
import AIClientDoc from './objects/AIClient';
import KeyboardDoc from './objects/Keyboard';
import MouseDoc from './objects/Mouse';
import DialogDoc from './objects/Dialog';
import LocatorBaseDoc from './locators/Locator';
import BrowserLocatorDoc from './locators/BrowserLocator';
import WindowLocatorDoc from './locators/WindowLocator';
import PageLocatorDoc from './locators/PageLocator';
import FrameLocatorDoc from './locators/FrameLocator';
import ElementLocatorDoc from './locators/ElementLocator';
import TextLocatorDoc from './locators/TextLocator';
import ExpectDoc from './assertions/Expect';
import TypesDoc from './types';

type DocItem = {
  slug: string;
  title: string;
  category: 'AutomationObjects' | 'GeneralObjects' | 'Locators' | 'Assertions' | 'Misc';
  Component: () => React.ReactElement;
};

const docs: DocItem[] = [
  { slug: 'automation/browser', title: 'Browser', category: 'AutomationObjects', Component: Browser },
  { slug: 'automation/window', title: 'Window', category: 'AutomationObjects', Component: WindowDoc },
  { slug: 'automation/page', title: 'Page', category: 'AutomationObjects', Component: PageDoc },
  { slug: 'automation/frame', title: 'Frame', category: 'AutomationObjects', Component: FrameDoc },
  { slug: 'automation/element', title: 'Element', category: 'AutomationObjects', Component: ElementDoc },
  { slug: 'automation/text', title: 'Text', category: 'AutomationObjects', Component: TextDoc },
  { slug: 'objects/ai-client', title: 'AIClient', category: 'GeneralObjects', Component: AIClientDoc },
  { slug: 'objects/mouse', title: 'Mouse', category: 'GeneralObjects', Component: MouseDoc },
  { slug: 'objects/keyboard', title: 'Keyboard', category: 'GeneralObjects', Component: KeyboardDoc },
  { slug: 'objects/dialog', title: 'Dialog', category: 'GeneralObjects', Component: DialogDoc },
  { slug: 'locators/browser-locator', title: 'BrowserLocator', category: 'Locators', Component: BrowserLocatorDoc },
  { slug: 'locators/window-locator', title: 'WindowLocator', category: 'Locators', Component: WindowLocatorDoc },
  { slug: 'locators/page-locator', title: 'PageLocator', category: 'Locators', Component: PageLocatorDoc },
  { slug: 'locators/frame-locator', title: 'FrameLocator', category: 'Locators', Component: FrameLocatorDoc },
  { slug: 'locators/element-locator', title: 'ElementLocator', category: 'Locators', Component: ElementLocatorDoc },
  { slug: 'locators/text-locator', title: 'TextLocator', category: 'Locators', Component: TextLocatorDoc },
  { slug: 'locators/locator', title: 'Locator (Base)', category: 'Locators', Component: LocatorBaseDoc },
  { slug: 'assertions/expect', title: 'Expect', category: 'Assertions', Component: ExpectDoc },
  { slug: 'types', title: 'Types', category: 'Misc', Component: TypesDoc },
];

export default function APIs() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const slug = useMemo(() => {
    const parts = path.split('/').filter(Boolean);
    if (parts[0] !== 'apis') return '';
    return parts.slice(1).join('/');
  }, [path]);

  const active = docs.find(d => d.slug === slug);

  const navigate = (to: string) => {
    if (to === path) return;
    history.pushState({}, '', to);
    setPath(to);
  };
  const byCategory = (category: DocItem['category']) => docs.filter(d => d.category === category);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 64px)' }}>
      <aside style={{ borderRight: '1px solid #e2e8f0', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Mimic API Reference</h3>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Automation Objects</div>
        {byCategory('AutomationObjects').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '1rem 0 0.5rem' }}>Other Objects</div>
        {byCategory('GeneralObjects').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '1rem 0 0.5rem' }}>Locators</div>
        {byCategory('Locators').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '1rem 0 0.5rem' }}>Assertions</div>
        {byCategory('Assertions').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '1rem 0 0.5rem' }}>Misc</div>
        {byCategory('Misc').map(d => (
          <div key={d.slug} style={{ marginBottom: '0.5rem' }}>
            <a href={`/apis/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/apis/${d.slug}`); }}>{d.title}</a>
          </div>
        ))}
      </aside>
      <div>
        {!active && (
          <>
            <Section title="Mimic APIs">
              <Paragraph>
                Official API to work with the Mimic Extension for automating browsers and web apps.
                Browse Automation Objects, Other Objects, Locators, Assertions, and Types using the sidebar.
              </Paragraph>
              <Paragraph>Quick Start:</Paragraph>
              <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: '16px', borderRadius: 8, overflowX: 'auto' }}>
                <code>{`import { BrowserLocator } from 'mimic-sdk';
import { AIClient } from 'mimic-sdk';

const browserLocator = new BrowserLocator();
const browser = await browserLocator.get(); // get current browser
const page = await browser.lastActivePage(); // get current page
const ai = new AIClient(); // get ai client`}</code>
              </pre>
            </Section>
          </>
        )}
        {active && <active.Component />}
      </div>
    </div>
  );
}
