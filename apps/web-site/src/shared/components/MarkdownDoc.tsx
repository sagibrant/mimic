import { isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './Common';

export default function MarkdownDoc({ source }: { source: string }) {
  return (
    <section style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 {...props} style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 {...props} style={{ fontSize: '1.5rem', margin: '1.25rem 0 0.5rem' }}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 {...props} style={{ fontSize: '1.25rem', margin: '1.25rem 0 0.5rem' }}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p {...props} style={{ marginBottom: '1rem', color: '#334155' }}>
              {children}
            </p>
          ),
          hr: (props) => <hr {...props} style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '1.25rem 0' }} />,
          ul: ({ children, ...props }) => <ul {...props} style={{ margin: '0 0 1rem 1.25rem', color: '#334155' }}>{children}</ul>,
          ol: ({ children, ...props }) => <ol {...props} style={{ margin: '0 0 1rem 1.25rem', color: '#334155' }}>{children}</ol>,
          li: ({ children, ...props }) => <li {...props} style={{ marginBottom: '0.25rem' }}>{children}</li>,
          pre: ({ children, ...props }) => {
            const childrenArray = Array.isArray(children) ? children : [children];
            const codeElem = childrenArray.find(child => isValidElement(child) && (child.type === 'code' || (child.type as { name?: string }).name === 'code'));
            if (isValidElement(codeElem)) {
              const codeProps = codeElem.props as { children?: unknown; className?: string };
              const raw = codeProps.children;
              const text = Array.isArray(raw) ? raw.join('') : String(raw ?? '');
              if (text.length > 0) {
                return <CodeBlock code={text.replace(/\n$/, '')} languageClassName={codeProps.className} />;
              }
            }
            return (
              <pre
                {...props}
                style={{
                  background: 'var(--mimic-codeblock-bg)',
                  color: 'var(--mimic-codeblock-fg)',
                  border: '1px solid var(--mimic-codeblock-border)',
                  padding: '16px',
                  borderRadius: 8,
                  overflowX: 'auto',
                  marginBottom: '1rem',
                }}
              >
                {children}
              </pre>
            );
          },
          code: ({ children, className, ...props }) => {
            const isBlock = typeof className === 'string' && className.includes('language-');
            if (isBlock) {
              return (
                <code {...props} className={className} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                  {children}
                </code>
              );
            }
            return (
              <code
                {...props}
                className={className}
                style={{
                  background: 'var(--mimic-inline-code-bg)',
                  border: '1px solid var(--mimic-codeblock-border)',
                  borderRadius: 4,
                  padding: '0.1rem 0.25rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '0.9em',
                  color: 'var(--mimic-inline-code-fg)',
                }}
              >
                {children}
              </code>
            );
          },
          a: ({ children, ...props }) => (
            <a {...props} style={{ color: '#2563eb', textDecoration: 'none' }}>
              {children}
            </a>
          ),
          table: ({ children, ...props }) => (
            <table {...props} style={{ borderCollapse: 'collapse', marginBottom: '1rem', width: '100%' }}>
              {children}
            </table>
          ),
          th: ({ children, ...props }) => (
            <th {...props} style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', padding: '8px 6px', color: '#0f172a' }}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td {...props} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 6px', color: '#334155' }}>
              {children}
            </td>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </section>
  );
}
