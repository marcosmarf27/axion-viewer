import { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);

const theme = {
  'hljs': {
    display: 'block',
    overflowX: 'auto',
    padding: '1rem',
    background: '#f8fafc',
    color: '#334155',
    fontSize: '0.8125rem',
    lineHeight: '1.6',
  },
  'hljs-keyword': { color: '#7c3aed' },
  'hljs-string': { color: '#059669' },
  'hljs-number': { color: '#d97706' },
  'hljs-built_in': { color: '#4f46e5' },
  'hljs-literal': { color: '#d97706' },
  'hljs-attr': { color: '#4f46e5' },
  'hljs-comment': { color: '#94a3b8', fontStyle: 'italic' },
  'hljs-variable': { color: '#0891b2' },
  'hljs-title': { color: '#4f46e5' },
  'hljs-params': { color: '#334155' },
  'hljs-selector-tag': { color: '#7c3aed' },
};

export default function CodeBlock({ code, language = 'bash', title }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
        <span className="text-xs font-medium text-slate-500">
          {title || language.toUpperCase()}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Copiado
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter language={language} style={theme} customStyle={{ margin: 0, borderRadius: 0 }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
