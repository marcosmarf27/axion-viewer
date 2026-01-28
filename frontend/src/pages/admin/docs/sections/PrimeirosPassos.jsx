export default function PrimeirosPassos() {
  return (
    <section>
      <h2 id="primeiros-passos" className="scroll-mt-6 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
        Primeiros Passos
      </h2>

      <div className="mt-6 space-y-6">
        {/* Visao Geral */}
        <div id="visao-geral" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Visao Geral</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            O <strong>Axion Viewer</strong> e uma plataforma completa para gestao de documentos juridicos.
            Ele permite converter documentos Markdown em HTML e PDF com temas profissionais,
            gerenciar clientes, carteiras, casos e processos, e compartilhar documentos com
            clientes de forma segura.
          </p>
          <div className="mt-4 rounded-lg border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-subtle)] p-4">
            <p className="text-sm font-medium text-[var(--color-accent)]">Como funciona</p>
            <p className="mt-1 text-sm text-[var(--color-accent)]">
              A API REST do Axion Viewer usa autenticacao JWT via Supabase. Todas as operacoes
              de escrita requerem perfil de administrador. Clientes possuem acesso somente-leitura
              as carteiras compartilhadas com eles.
            </p>
          </div>
        </div>

        {/* Perfis */}
        <div id="perfis-usuario" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Perfis de Usuario</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            O sistema possui dois perfis com permissoes distintas:
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(26,54,93,0.08)] text-xs font-bold text-[var(--color-accent)]">A</span>
                <span className="text-sm font-semibold text-slate-800">Administrador</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>- Acesso total ao sistema</li>
                <li>- CRUD de todas as entidades</li>
                <li>- Conversao de documentos</li>
                <li>- Gestao de contas e compartilhamento</li>
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">C</span>
                <span className="text-sm font-semibold text-slate-800">Cliente</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>- Acesso somente-leitura</li>
                <li>- Visualiza carteiras compartilhadas</li>
                <li>- Acessa casos, processos e documentos</li>
                <li>- Dashboard personalizado</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Hierarquia */}
        <div id="hierarquia-dados" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Hierarquia de Dados</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Os dados seguem uma hierarquia de cima para baixo. Cada entidade pertence a entidade acima dela:
          </p>
          <div className="mt-4 flex flex-col items-start gap-1 text-sm">
            {[
              { label: 'Cliente', desc: 'Pessoa fisica ou juridica', color: 'bg-slate-800 text-white' },
              { label: 'Carteira', desc: 'Agrupamento de casos do cliente', color: 'bg-slate-700 text-white' },
              { label: 'Caso', desc: 'Assunto juridico especifico', color: 'bg-slate-600 text-white' },
              { label: 'Processo', desc: 'Processo judicial vinculado ao caso', color: 'bg-slate-500 text-white' },
              { label: 'Documento', desc: 'Arquivo gerado (HTML/PDF)', color: 'bg-slate-400 text-white' },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-3" style={{ paddingLeft: `${i * 1.5}rem` }}>
                <div className="flex items-center gap-2">
                  {i > 0 && (
                    <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${item.color}`}>
                    {item.label}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
