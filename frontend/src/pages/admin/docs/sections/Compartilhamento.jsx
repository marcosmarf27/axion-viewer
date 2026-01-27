import CodeBlock from '../CodeBlock';

const criarConta = `curl -X POST 'https://sua-api.com/api/accounts' \\
  -H 'Authorization: Bearer SEU_TOKEN_ADMIN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "cliente@exemplo.com",
    "password": "senha_segura_123",
    "full_name": "Maria Silva",
    "role": "client"
  }'`;

const concederAcesso = `# Listar carteiras para obter o ID
curl 'https://sua-api.com/api/carteiras' \\
  -H 'Authorization: Bearer SEU_TOKEN_ADMIN'

# Conceder acesso a carteira para o usuario cliente
curl -X POST 'https://sua-api.com/api/sharing/carteira/UUID_DA_CARTEIRA' \\
  -H 'Authorization: Bearer SEU_TOKEN_ADMIN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "user_id": "uuid-do-usuario-cliente"
  }'`;

const revogarAcesso = `curl -X DELETE 'https://sua-api.com/api/sharing/carteira/UUID_DA_CARTEIRA' \\
  -H 'Authorization: Bearer SEU_TOKEN_ADMIN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "user_id": "uuid-do-usuario-cliente"
  }'`;

export default function Compartilhamento() {
  return (
    <section>
      <h2 id="compartilhamento" className="scroll-mt-6 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
        Compartilhamento
      </h2>

      <div className="mt-6 space-y-8">
        {/* Criar conta */}
        <div id="criar-conta-cliente" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Passo 1: Criar Conta de Cliente</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Primeiro, crie uma conta com o perfil <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-600">client</code>.
            O cliente recebera um email para confirmar a conta (se configurado no Supabase):
          </p>
          <div className="mt-4">
            <CodeBlock code={criarConta} language="bash" title="Criar Conta de Cliente" />
          </div>
          <div className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">Observacao</p>
            <p className="mt-1 text-sm text-amber-700">
              A criacao de contas requer permissao de <strong>administrador</strong>. O campo{' '}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-900">role</code> deve
              ser <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-900">&quot;client&quot;</code> para
              contas de cliente.
            </p>
          </div>
        </div>

        {/* Conceder acesso */}
        <div id="conceder-acesso" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Passo 2: Conceder Acesso a Carteira</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Depois de criar a conta, vincule o usuario cliente a uma ou mais carteiras.
            O cliente so vera as carteiras que foram compartilhadas com ele:
          </p>
          <div className="mt-4 space-y-3">
            <CodeBlock code={concederAcesso} language="bash" title="Conceder Acesso" />
            <CodeBlock code={revogarAcesso} language="bash" title="Revogar Acesso" />
          </div>
        </div>

        {/* Visao do cliente */}
        <div id="visao-cliente" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Passo 3: O que o Cliente Ve</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Apos o login, o cliente e redirecionado para sua area restrita com acesso somente-leitura:
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="space-y-3">
                {[
                  {
                    title: 'Dashboard',
                    desc: 'Resumo com totais de carteiras, casos e processos compartilhados.',
                  },
                  {
                    title: 'Minhas Carteiras',
                    desc: 'Lista apenas as carteiras que o admin compartilhou. De cada carteira, o cliente pode navegar para casos e processos.',
                  },
                  {
                    title: 'Documentos',
                    desc: 'Visualizacao e download dos documentos vinculados aos processos das carteiras compartilhadas.',
                  },
                ].map((item, i) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-4">
            <p className="text-sm font-medium text-indigo-800">Fluxo completo</p>
            <p className="mt-1 text-sm text-indigo-700">
              Para compartilhar com um cliente: (1) cadastre os dados (cliente, carteira, caso, processo),
              (2) converta os documentos, (3) crie a conta do cliente, (4) compartilhe a carteira.
              O cliente tera acesso imediato apos o compartilhamento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
