import CodeBlock from '../CodeBlock';

const curlToken = `curl -X POST 'https://SEU_PROJETO.supabase.co/auth/v1/token?grant_type=password' \\
  -H 'apikey: SUA_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "admin@exemplo.com",
    "password": "sua_senha"
  }'`;

const curlResponse = `{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "v1.MR...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "admin@exemplo.com"
  }
}`;

const curlWithToken = `curl -X GET 'https://sua-api.com/api/clientes' \\
  -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json'`;

const jsExample = `import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sua-api.com',
});

// Interceptor para injetar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Exemplo de uso
const { data } = await api.get('/api/clientes');
console.log(data);`;

const sdkExample = `import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://SEU_PROJETO.supabase.co',
  'SUA_ANON_KEY'
);

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@exemplo.com',
  password: 'sua_senha',
});

// O SDK renova o token automaticamente
// Para obter o token atual:
const { data: { session } } = await supabase.auth.getSession();
console.log(session.access_token);`;

export default function Autenticacao() {
  return (
    <section>
      <h2 id="autenticacao" className="scroll-mt-6 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
        Autenticacao
      </h2>

      <div className="mt-6 space-y-8">
        {/* Obter Token */}
        <div id="obter-token" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Obter Token JWT</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            A autenticacao e feita via Supabase Auth. Para obter um token JWT, faca uma
            requisicao POST para o endpoint de autenticacao:
          </p>
          <div className="mt-4 space-y-3">
            <CodeBlock code={curlToken} language="bash" title="Requisicao - Obter Token" />
            <CodeBlock code={curlResponse} language="json" title="Resposta" />
          </div>
          <div className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">Atencao</p>
            <p className="mt-1 text-sm text-amber-700">
              O <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-900">access_token</code> expira
              em 1 hora (3600 segundos). Use o <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-900">refresh_token</code> para
              renovar a sessao sem precisar re-autenticar.
            </p>
          </div>
        </div>

        {/* Usar Token */}
        <div id="usar-token" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Usar Token na API</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Inclua o token no header <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-[var(--color-accent)]">Authorization</code> de
            todas as requisicoes:
          </p>
          <div className="mt-4 space-y-4">
            <CodeBlock code={curlWithToken} language="bash" title="curl com Token" />
            <CodeBlock code={jsExample} language="javascript" title="JavaScript / Axios" />
          </div>
        </div>

        {/* Renovar Token */}
        <div id="renovar-token" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Renovar Token</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Se voce usa o SDK do Supabase no frontend, a renovacao do token e automatica.
            O SDK detecta quando o token esta proximo de expirar e faz o refresh silenciosamente:
          </p>
          <div className="mt-4">
            <CodeBlock code={sdkExample} language="javascript" title="Supabase SDK (renovacao automatica)" />
          </div>
          <div className="mt-4 rounded-lg border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-subtle)] p-4">
            <p className="text-sm font-medium text-[var(--color-accent)]">Dica</p>
            <p className="mt-1 text-sm text-[var(--color-accent)]">
              Para uso via API direta (sem SDK), use o endpoint{' '}
              <code className="rounded bg-[rgba(26,54,93,0.08)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-accent)]">POST /auth/v1/token?grant_type=refresh_token</code>{' '}
              passando o <code className="rounded bg-[rgba(26,54,93,0.08)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-accent)]">refresh_token</code> no body.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
