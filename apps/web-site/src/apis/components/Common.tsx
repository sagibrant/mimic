import React from 'react';

export type Entry = {
  name: string;
  kind: 'method' | 'property' | 'event';
  returns?: string;
  signature?: string;
  desc: string;
};

export const Entry = {} as unknown as Entry;

export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{title}</h1>
    {children}
  </section>
);

export const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p style={{ marginBottom: '1rem', color: '#334155' }}>{children}</p>
);

export const List = ({ items }: { items: Entry[] }) => (
  <ul style={{ listStyle: 'none', padding: 0 }}>
    {items.map(i => (
      <li key={`${i.name}-${i.kind}-${i.signature ?? ''}-${i.returns ?? ''}`} style={{ marginBottom: '0.75rem' }}>
        <div>
          <strong>{i.name}</strong>
          {i.signature && <span style={{ marginLeft: 8, color: '#64748b' }}>{i.signature}</span>}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
          <span style={{ marginRight: 12 }}>Kind: {i.kind}</span>
          {i.returns && <span>Returns: {i.returns}</span>}
        </div>
        <div style={{ color: '#475569' }}>{i.desc}</div>
      </li>
    ))}
  </ul>
);
