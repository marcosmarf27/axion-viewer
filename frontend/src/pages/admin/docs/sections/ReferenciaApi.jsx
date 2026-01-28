const groups = [
  {
    id: 'api-auth',
    title: 'Autenticacao',
    endpoints: [
      { method: 'POST', path: '/api/auth/verify', auth: 'Bearer', desc: 'Verifica token JWT e retorna dados do usuario' },
    ],
  },
  {
    id: 'api-clientes',
    title: 'Clientes',
    endpoints: [
      { method: 'GET', path: '/api/clientes', auth: 'Admin', desc: 'Lista clientes com paginacao e busca' },
      { method: 'GET', path: '/api/clientes/:id', auth: 'Admin', desc: 'Retorna detalhes de um cliente' },
      { method: 'POST', path: '/api/clientes', auth: 'Admin', desc: 'Cria novo cliente' },
      { method: 'PUT', path: '/api/clientes/:id', auth: 'Admin', desc: 'Atualiza cliente existente' },
      { method: 'DELETE', path: '/api/clientes/:id', auth: 'Admin', desc: 'Remove cliente' },
    ],
  },
  {
    id: 'api-carteiras',
    title: 'Carteiras',
    endpoints: [
      { method: 'GET', path: '/api/carteiras', auth: 'Bearer', desc: 'Lista carteiras (admin: todas, client: compartilhadas)' },
      { method: 'GET', path: '/api/carteiras/:id', auth: 'Bearer', desc: 'Retorna detalhes de uma carteira' },
      { method: 'POST', path: '/api/carteiras', auth: 'Admin', desc: 'Cria nova carteira vinculada a um cliente' },
      { method: 'PUT', path: '/api/carteiras/:id', auth: 'Admin', desc: 'Atualiza carteira existente' },
      { method: 'DELETE', path: '/api/carteiras/:id', auth: 'Admin', desc: 'Remove carteira' },
    ],
  },
  {
    id: 'api-casos',
    title: 'Casos',
    endpoints: [
      { method: 'GET', path: '/api/casos', auth: 'Bearer', desc: 'Lista casos com paginacao' },
      { method: 'GET', path: '/api/casos/:id', auth: 'Bearer', desc: 'Retorna detalhes de um caso' },
      { method: 'POST', path: '/api/casos', auth: 'Admin', desc: 'Cria novo caso vinculado a uma carteira' },
      { method: 'PUT', path: '/api/casos/:id', auth: 'Admin', desc: 'Atualiza caso existente' },
      { method: 'DELETE', path: '/api/casos/:id', auth: 'Admin', desc: 'Remove caso' },
    ],
  },
  {
    id: 'api-processos',
    title: 'Processos',
    endpoints: [
      { method: 'GET', path: '/api/processos', auth: 'Bearer', desc: 'Lista processos com paginacao' },
      { method: 'GET', path: '/api/processos/:id', auth: 'Bearer', desc: 'Retorna detalhes com documentos vinculados' },
      { method: 'POST', path: '/api/processos', auth: 'Admin', desc: 'Cria novo processo vinculado a um caso' },
      { method: 'PUT', path: '/api/processos/:id', auth: 'Admin', desc: 'Atualiza processo existente' },
      { method: 'DELETE', path: '/api/processos/:id', auth: 'Admin', desc: 'Remove processo' },
    ],
  },
  {
    id: 'api-documentos',
    title: 'Documentos',
    endpoints: [
      { method: 'GET', path: '/api/documentos', auth: 'Bearer', desc: 'Lista documentos com paginacao' },
      { method: 'GET', path: '/api/documentos/:id', auth: 'Bearer', desc: 'Retorna detalhes de um documento' },
      { method: 'POST', path: '/api/documentos', auth: 'Admin', desc: 'Cria registro de documento' },
      { method: 'PUT', path: '/api/documentos/:id', auth: 'Admin', desc: 'Atualiza documento existente' },
      { method: 'DELETE', path: '/api/documentos/:id', auth: 'Admin', desc: 'Remove documento' },
    ],
  },
  {
    id: 'api-conversao',
    title: 'Conversao',
    endpoints: [
      { method: 'POST', path: '/api/convert', auth: 'Bearer', desc: 'Converte Markdown (JSON body) para HTML' },
      { method: 'POST', path: '/api/convert/file', auth: 'Bearer', desc: 'Converte arquivo .md (upload) para HTML' },
      { method: 'POST', path: '/api/convert/pdf', auth: 'Bearer', desc: 'Converte Markdown (JSON body) para PDF' },
      { method: 'POST', path: '/api/convert/file/pdf', auth: 'Bearer', desc: 'Converte arquivo .md (upload) para PDF' },
    ],
  },
  {
    id: 'api-arquivos',
    title: 'Arquivos',
    endpoints: [
      { method: 'GET', path: '/api/files', auth: 'Bearer', desc: 'Lista arquivos gerados pelo usuario' },
      { method: 'GET', path: '/api/files/:id/download', auth: 'Bearer', desc: 'Download do arquivo' },
      { method: 'GET', path: '/api/files/:id/preview', auth: 'Bearer', desc: 'Preview inline do arquivo' },
      { method: 'POST', path: '/api/files/:id/generate-pdf', auth: 'Bearer', desc: 'Gera PDF a partir de HTML existente' },
      { method: 'DELETE', path: '/api/files/:id', auth: 'Bearer', desc: 'Remove arquivo' },
    ],
  },
  {
    id: 'api-temas',
    title: 'Temas',
    endpoints: [
      { method: 'GET', path: '/api/themes', auth: 'Bearer', desc: 'Lista temas disponiveis' },
      { method: 'POST', path: '/api/themes', auth: 'Admin', desc: 'Cria tema customizado' },
      { method: 'PUT', path: '/api/themes/:name', auth: 'Admin', desc: 'Atualiza tema existente' },
      { method: 'DELETE', path: '/api/themes/:name', auth: 'Admin', desc: 'Remove tema customizado' },
    ],
  },
  {
    id: 'api-compartilhamento',
    title: 'Compartilhamento',
    endpoints: [
      { method: 'GET', path: '/api/sharing/carteira/:id', auth: 'Admin', desc: 'Lista usuarios com acesso a carteira' },
      { method: 'POST', path: '/api/sharing/carteira/:id', auth: 'Admin', desc: 'Concede acesso a carteira para usuario' },
      { method: 'DELETE', path: '/api/sharing/carteira/:id', auth: 'Admin', desc: 'Revoga acesso a carteira' },
      { method: 'GET', path: '/api/accounts', auth: 'Admin', desc: 'Lista contas de usuario' },
      { method: 'POST', path: '/api/accounts', auth: 'Admin', desc: 'Cria nova conta de usuario' },
      { method: 'DELETE', path: '/api/accounts/:id', auth: 'Admin', desc: 'Remove conta de usuario' },
    ],
  },
  {
    id: 'api-dashboard',
    title: 'Dashboard',
    endpoints: [
      { method: 'GET', path: '/api/dashboard', auth: 'Bearer', desc: 'Dados do dashboard (admin: totais gerais, client: dados das carteiras compartilhadas)' },
    ],
  },
];

const methodColors = {
  GET: 'bg-emerald-100 text-emerald-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-red-100 text-red-800',
};

const authColors = {
  Bearer: 'bg-slate-100 text-slate-700',
  Admin: 'bg-[rgba(26,54,93,0.08)] text-[var(--color-accent)]',
};

export default function ReferenciaApi() {
  return (
    <section>
      <h2 id="referencia-api" className="scroll-mt-6 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
        Referencia da API
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Tabela completa de todos os endpoints disponiveis, agrupados por dominio.
        Todos os endpoints com auth <strong>Bearer</strong> requerem um token JWT valido.
        Endpoints com auth <strong>Admin</strong> requerem adicionalmente que o usuario tenha perfil de administrador.
      </p>

      <div className="mt-6 space-y-8">
        {groups.map(group => (
          <div key={group.id} id={group.id} className="scroll-mt-6">
            <h3 className="text-lg font-semibold text-slate-800">{group.title}</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">Metodo</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Endpoint</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">Auth</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Descricao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.endpoints.map((ep, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold ${methodColors[ep.method]}`}>
                          {ep.method}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <code className="font-mono text-xs text-slate-700">{ep.path}</code>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${authColors[ep.auth]}`}>
                          {ep.auth}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{ep.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
