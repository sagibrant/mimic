import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Paragraph, Section } from '../apis/components/Common';
import DocsIndex from './index';
import Installation from './installation';
import QuickStart from './quickstart';
import Example from './example';

type DocItem = {
  slug: string;
  title: string;
  Component: () => ReactElement;
};

const docs: DocItem[] = [
  { slug: '', title: 'Overview', Component: DocsIndex },
  { slug: 'installation', title: 'Installation', Component: Installation },
  { slug: 'quickstart', title: 'Quick Start', Component: QuickStart },
  { slug: 'example', title: 'Example', Component: Example },
];

function Docs() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const slug = useMemo(() => {
    const parts = path.split('/').filter(Boolean);
    if (parts[0] !== 'docs') return '';
    return parts[1] || '';
  }, [path]);

  const active = docs.find(d => d.slug === slug) ?? docs[0];

  const navigate = (to: string) => {
    if (to === path) return;
    history.pushState({}, '', to);
    setPath(to);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 64px)' }}>
      <aside style={{ borderRight: '1px solid #e2e8f0', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Gogogo Docs</h3>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem' }}>Getting Started</div>
        {docs.map(d => (
          <div key={d.slug || 'root'} style={{ marginBottom: '0.5rem' }}>
            <a
              href={d.slug ? `/docs/${d.slug}` : '/docs'}
              onClick={(e) => {
                e.preventDefault();
                navigate(d.slug ? `/docs/${d.slug}` : '/docs');
              }}
            >
              {d.title}
            </a>
          </div>
        ))}
        <div style={{ fontSize: '0.9rem', color: '#64748b', margin: '1rem 0 0.5rem' }}>Reference</div>
        <div style={{ marginBottom: '0.5rem' }}>
          <a
            href="/apis"
            onClick={(e) => {
              e.preventDefault();
              navigate('/apis');
            }}
          >
            APIs
          </a>
        </div>
      </aside>
      <div>
        {!active && (
          <Section title="Gogogo Docs">
            <Paragraph>Browse Installation, Quick Start, and Examples from the sidebar.</Paragraph>
          </Section>
        )}
        {active && <active.Component />}
      </div>
    </div>
  );
}

export default Docs;
