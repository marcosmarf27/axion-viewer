import CodeBlock from '../CodeBlock';

const convertJson = `curl -X POST 'https://sua-api.com/api/convert' \\
  -H 'Authorization: Bearer SEU_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "markdown": "# Titulo do Documento\\n\\nConteudo em **markdown**...",
    "theme": "juridico",
    "title": "Parecer Juridico"
  }'`;

const convertPdf = `curl -X POST 'https://sua-api.com/api/convert/pdf' \\
  -H 'Authorization: Bearer SEU_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "markdown": "# Titulo do Documento\\n\\nConteudo em **markdown**...",
    "theme": "juridico",
    "title": "Parecer Juridico"
  }'`;

const convertFile = `curl -X POST 'https://sua-api.com/api/convert/file' \\
  -H 'Authorization: Bearer SEU_TOKEN' \\
  -F 'file=@documento.md' \\
  -F 'theme=juridico'`;

const convertFilePdf = `curl -X POST 'https://sua-api.com/api/convert/file/pdf' \\
  -H 'Authorization: Bearer SEU_TOKEN' \\
  -F 'file=@documento.md' \\
  -F 'theme=juridico'`;

const convertResponse = `{
  "success": true,
  "file_id": "uuid-do-arquivo",
  "filename": "parecer-juridico.html",
  "signed_url": "https://storage.supabase.co/...",
  "metadata": {
    "title": "Parecer Juridico",
    "theme": "juridico"
  }
}`;

export default function Conversao() {
  return (
    <section>
      <h2 id="conversao" className="scroll-mt-6 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
        Conversao de Documentos
      </h2>

      <div className="mt-6 space-y-8">
        {/* MD para HTML */}
        <div id="converter-md-html" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Markdown para HTML</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Envie conteudo Markdown no body JSON e receba o HTML convertido com o tema aplicado:
          </p>
          <div className="mt-4 space-y-3">
            <CodeBlock code={convertJson} language="bash" title="POST /api/convert" />
            <CodeBlock code={convertResponse} language="json" title="Resposta" />
          </div>
        </div>

        {/* MD para PDF */}
        <div id="converter-md-pdf" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Markdown para PDF</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Mesma interface, mas gera um arquivo PDF ao inves de HTML:
          </p>
          <div className="mt-4">
            <CodeBlock code={convertPdf} language="bash" title="POST /api/convert/pdf" />
          </div>
        </div>

        {/* Upload de Arquivo */}
        <div id="upload-arquivo" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Upload de Arquivo</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Voce tambem pode enviar um arquivo <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-600">.md</code> diretamente
            via multipart form-data:
          </p>
          <div className="mt-4 space-y-3">
            <CodeBlock code={convertFile} language="bash" title="Upload .md para HTML" />
            <CodeBlock code={convertFilePdf} language="bash" title="Upload .md para PDF" />
          </div>
        </div>

        {/* Temas */}
        <div id="temas-conversao" className="scroll-mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Temas</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Os temas controlam a aparencia visual do documento gerado. Temas disponiveis por padrao:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { name: 'juridico', desc: 'Estilo formal para pareceres e peticoes' },
              { name: 'litigation', desc: 'Layout para pecas processuais' },
              { name: 'corporativo', desc: 'Visual corporativo para relatorios' },
            ].map(t => (
              <div key={t.name} className="rounded-lg border border-slate-200 bg-white p-3">
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-600">{t.name}</code>
                <p className="mt-1.5 text-xs text-slate-500">{t.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-4">
            <p className="text-sm font-medium text-indigo-800">Temas customizados</p>
            <p className="mt-1 text-sm text-indigo-700">
              Administradores podem criar temas personalizados pela pagina{' '}
              <strong>Ferramentas &gt; Temas</strong> ou via API (<code className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-xs text-indigo-900">POST /api/themes</code>).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
