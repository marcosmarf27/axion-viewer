import { useEffect, useRef, useState } from 'react';
import DocsSidebar from './docs/DocsSidebar';
import sections from './docs/sections';
import PrimeirosPassos from './docs/sections/PrimeirosPassos';
import Autenticacao from './docs/sections/Autenticacao';
import Cadastros from './docs/sections/Cadastros';
import Conversao from './docs/sections/Conversao';
import Compartilhamento from './docs/sections/Compartilhamento';
import ReferenciaApi from './docs/sections/ReferenciaApi';

const allIds = sections.flatMap(s => [s.id, ...s.subsections.map(sub => sub.id)]);

export default function DocsPage() {
  const [activeId, setActiveId] = useState('primeiros-passos');
  const contentRef = useRef(null);

  useEffect(() => {
    const elements = allIds
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documentacao</h1>
        <p className="mt-1 text-sm text-slate-500">
          Guia completo para usar a API, cadastrar dados, converter documentos e compartilhar com clientes.
        </p>
      </div>

      <div className="flex gap-6">
        <DocsSidebar activeId={activeId} />

        <div ref={contentRef} className="min-w-0 flex-1 space-y-12">
          <PrimeirosPassos />
          <Autenticacao />
          <Cadastros />
          <Conversao />
          <Compartilhamento />
          <ReferenciaApi />
        </div>
      </div>
    </div>
  );
}
