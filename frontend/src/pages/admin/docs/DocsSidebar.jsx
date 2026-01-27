import { useState } from 'react';
import { cn } from '@/lib/utils';
import sections from './sections';

export default function DocsSidebar({ activeId }) {
  const [collapsed, setCollapsed] = useState({});

  const toggle = id => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollTo = id => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sticky top-0 hidden w-56 shrink-0 self-start overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm lg:block" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Conteudo</p>
      </div>
      <nav className="p-2">
        {sections.map(section => {
          const isActive = activeId === section.id || section.subsections.some(s => s.id === activeId);
          const isCollapsed = collapsed[section.id];

          return (
            <div key={section.id} className="mb-0.5">
              <button
                onClick={() => {
                  toggle(section.id);
                  scrollTo(section.id);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span className="truncate">{section.label}</span>
                <svg
                  className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', !isCollapsed && 'rotate-90')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {!isCollapsed && (
                <ul className="ml-3 border-l border-slate-200 py-0.5">
                  {section.subsections.map(sub => (
                    <li key={sub.id}>
                      <button
                        onClick={() => scrollTo(sub.id)}
                        className={cn(
                          'block w-full truncate rounded-r-lg py-1 pl-3 pr-2 text-left text-xs transition-colors',
                          activeId === sub.id
                            ? 'border-l-2 border-indigo-500 bg-indigo-50/50 font-medium text-indigo-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        )}
                      >
                        {sub.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
