import { useCallback, useEffect, useState, type ReactNode } from 'react';

export type Entry = {
  name: string;
  kind: 'method' | 'property' | 'event';
  returns?: string;
  signature?: string;
  desc: string;
};

export const Entry = {} as unknown as Entry;

export const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{title}</h1>
    {children}
  </section>
);

export const Paragraph = ({ children }: { children: ReactNode }) => (
  <p style={{ marginBottom: '1rem', color: '#334155' }}>{children}</p>
);

export const CodeBlock = ({ code, languageClassName }: { code: string; languageClassName?: string }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus('copied');
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopyStatus('copied');
      } catch {
        setCopyStatus('error');
      }
    }
  }, [code]);

  useEffect(() => {
    if (copyStatus !== 'copied') return;
    const timeoutId = window.setTimeout(() => setCopyStatus('idle'), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code to clipboard"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1,
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid var(--mimic-codeblock-border)',
          background: 'var(--mimic-codeblock-bg)',
          color: 'var(--mimic-codeblock-fg)',
          fontSize: 13,
        }}
      >
        {copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Copy failed' : 'Copy'}
      </button>
      <pre
        style={{
          background: 'var(--mimic-codeblock-bg)',
          color: 'var(--mimic-codeblock-fg)',
          border: '1px solid var(--mimic-codeblock-border)',
          padding: '16px',
          borderRadius: 8,
          overflowX: 'auto',
          marginBottom: 0,
        }}
      >
        <code
          className={languageClassName}
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
};

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
