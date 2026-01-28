import CodeBlock from '../CodeBlock';

const criarCliente = `curl -X POST 'https://sua-api.com/api/clientes' \\
  -H 'Authorization: Bearer SEU_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "nome": "Empresa ABC Ltda",
    "email": "contato@empresaabc.com",
    "telefone": "(11) 99999-0000",
    "documento": "12.345.678/0001-90"
  }'`;

const criarCarteira = `curl -X POST 'https://sua-api.com/api/carteiras' \\
  -H 'Authorization: Bearer SEU_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "nome": "Carteira Trabalhista 2025",
    "descricao": "Processos trabalhistas do ano",
    "cliente_id": "uuid-do-cliente"
  }'`;

const criarCaso = `curl -X POST 'https://sua-api.com/api/casos' \\
  -H 'Authorization: Bearer SEU_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "titulo": "Reclamacao Trabalhista - Joao Silva",
    "descricao": "Reclamacao por verbas rescisorias",
    "carteira_id": "uuid-da-carteira"
  }'`;

const criarProcesso = `curl -X POST 'https://sua-api.com/api/processos' \\
  -H 'Authorization: Bearer SEU_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "numero": "0001234-56.2025.5.02.0001",
    "vara": "1a Vara do Trabalho de Sao Paulo",
    "status": "em_andamento",
    "caso_id": "uuid-do-caso"
  }'`;

const listagemParams = `# Parametros de listagem disponiveis em todos os endpoints GET
curl 'https://sua-api.com/api/clientes?page=1&per_page=20&search=empresa&sort_field=nome&sort_order=asc' \\
  -H 'Authorization: Bearer SEU_TOKEN'`;

const listagemResponse = `{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  }
}`;

export default function Cadastros() {
  return (
    <section>
      <h2 id="cadastros" className="scroll-mt-6 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
        Cadastros
      </h2>

      <div className="mt-6 space-y-8">
        {/* Fluxo */}
        <div id="fluxo-cadastro" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Fluxo de Cadastro</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Os cadastros devem seguir a ordem hierarquica. Cada entidade depende da anterior:
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {['1. Cliente', '2. Carteira', '3. Caso', '4. Processo'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                  {step}
                </span>
                {i < 3 && (
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-subtle)] p-4">
            <p className="text-sm font-medium text-[var(--color-accent)]">Importante</p>
            <p className="mt-1 text-sm text-[var(--color-accent)]">
              Todos os endpoints de criacao requerem perfil de <strong>administrador</strong>.
              Endpoints de listagem e leitura sao acessiveis por qualquer usuario autenticado
              (admin ou cliente com acesso).
            </p>
          </div>
        </div>

        {/* Clientes */}
        <div id="crud-clientes" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Clientes</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Clientes sao a entidade raiz. Crie um cliente antes de qualquer outra entidade:
          </p>
          <div className="mt-4">
            <CodeBlock code={criarCliente} language="bash" title="Criar Cliente" />
          </div>
        </div>

        {/* Carteiras */}
        <div id="crud-carteiras" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Carteiras</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Carteiras agrupam casos de um cliente. Informe o{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-[var(--color-accent)]">cliente_id</code> ao criar:
          </p>
          <div className="mt-4">
            <CodeBlock code={criarCarteira} language="bash" title="Criar Carteira" />
          </div>
        </div>

        {/* Casos */}
        <div id="crud-casos" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Casos</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Casos representam assuntos juridicos especificos dentro de uma carteira:
          </p>
          <div className="mt-4">
            <CodeBlock code={criarCaso} language="bash" title="Criar Caso" />
          </div>
        </div>

        {/* Processos */}
        <div id="crud-processos" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Processos</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Processos sao vinculados a um caso e contam com numero do processo, vara e status:
          </p>
          <div className="mt-4">
            <CodeBlock code={criarProcesso} language="bash" title="Criar Processo" />
          </div>
        </div>

        {/* Parametros de Listagem */}
        <div id="parametros-listagem" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Parametros de Listagem</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Todos os endpoints de listagem (GET) suportam os seguintes parametros de query:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2 font-semibold text-slate-700">Parametro</th>
                  <th className="px-3 py-2 font-semibold text-slate-700">Tipo</th>
                  <th className="px-3 py-2 font-semibold text-slate-700">Padrao</th>
                  <th className="px-3 py-2 font-semibold text-slate-700">Descricao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['page', 'int', '1', 'Numero da pagina'],
                  ['per_page', 'int', '20', 'Itens por pagina (max: 100)'],
                  ['search', 'string', '""', 'Termo de busca textual'],
                  ['sort_field', 'string', 'created_at', 'Campo para ordenacao'],
                  ['sort_order', 'string', 'desc', 'Direcao: asc ou desc'],
                ].map(([param, type, def, desc]) => (
                  <tr key={param}>
                    <td className="px-3 py-2">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-[var(--color-accent)]">{param}</code>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{type}</td>
                    <td className="px-3 py-2 text-slate-600">
                      <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">{def}</code>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-3">
            <CodeBlock code={listagemParams} language="bash" title="Exemplo de Listagem com Filtros" />
            <CodeBlock code={listagemResponse} language="json" title="Formato da Resposta Paginada" />
          </div>
        </div>
      </div>
    </section>
  );
}
