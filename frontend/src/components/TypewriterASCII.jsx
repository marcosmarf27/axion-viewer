import { useState, useEffect, useRef, useCallback } from 'react';

const TYPEWRITER_CONTENT = [
  { text: '$ axion-cli processar --formato pdf', type: 'cmd' },
  { text: '> Conectando ao servidor Supabase...', type: 'out' },
  { text: '> Autenticacao verificada [ES256/JWKS]', type: 'ok' },
  { text: '> Sessao iniciada: usr_admin_0x4f2a', type: 'out' },
  { text: '', type: 'sep' },
  { text: '$ axion convert documento.md --tema juridico', type: 'cmd' },
  { text: '> Lendo arquivo: peticao_inicial.md (24.3 KB)', type: 'out' },
  { text: '> Preprocessando markdown...', type: 'out' },
  { text: '> Convertendo referencias documentais...', type: 'out' },
  { text: '> Aplicando tema: juridico-formal', type: 'out' },
  { text: '> Gerando HTML... OK [320ms]', type: 'ok' },
  { text: '> Gerando PDF via WeasyPrint... OK [1.2s]', type: 'ok' },
  { text: '> Upload para Storage: documents/2026/01/', type: 'out' },
  { text: '> Documento registrado: doc_id=7f3a9b2e', type: 'ok' },
  { text: '', type: 'sep' },
  { text: '$ axion carteira listar --cliente="Silva & Associados"', type: 'cmd' },
  { text: '> Carteira: Contencioso Civel (12 casos)', type: 'out' },
  { text: '> Carteira: Trabalhista (8 casos)', type: 'out' },
  { text: '> Carteira: Tributario (5 casos)', type: 'out' },
  { text: '> Total: 25 casos ativos, 147 documentos', type: 'ok' },
  { text: '', type: 'sep' },
  { text: '$ axion processo detalhar proc_2026_0042', type: 'cmd' },
  { text: '> Processo: 0001234-56.2026.8.26.0100', type: 'out' },
  { text: '> Vara: 3a Vara Civel - Foro Central', type: 'out' },
  { text: '> Partes: Silva & Associados vs. Corp XYZ', type: 'out' },
  { text: '> Status: Aguardando audiencia', type: 'out' },
  { text: '> Documentos vinculados: 23', type: 'out' },
  { text: '', type: 'sep' },
  { text: '$ axion relatorio gerar --tipo=mensal', type: 'cmd' },
  { text: '> Coletando metricas do periodo...', type: 'out' },
  { text: '> Clientes ativos: 34', type: 'out' },
  { text: '> Documentos gerados: 256', type: 'out' },
  { text: '> Conversoes realizadas: 189', type: 'out' },
  { text: '> Relatorio exportado: relatorio_jan_2026.pdf', type: 'ok' },
  { text: '', type: 'sep' },
  { text: '$ axion audit-log --ultimas=5', type: 'cmd' },
  { text: '> [2026-01-27 14:32] LOGIN admin@axion.com', type: 'out' },
  { text: '> [2026-01-27 14:33] CONVERT peticao.md -> PDF', type: 'out' },
  { text: '> [2026-01-27 14:35] UPLOAD doc_8a2f.pdf (1.8MB)', type: 'out' },
  { text: '> [2026-01-27 14:36] SHARE carteira_07 -> cliente_12', type: 'out' },
  { text: '> [2026-01-27 14:38] EXPORT relatorio_semanal.pdf', type: 'ok' },
  { text: '', type: 'sep' },
  { text: '// Sistema Axion Viewer v2.0', type: 'comment' },
  { text: '// Plataforma de Gestao Juridica', type: 'comment' },
  { text: '// Todos os direitos reservados', type: 'comment' },
];

const CHAR_DELAY = 35;
const LINE_DELAY = 500;
const RESET_DELAY = 3000;
const MAX_VISIBLE_LINES = 28;

const LINE_COLORS = {
  cmd: '#34d399',     // emerald-400 — commands pop
  out: '#64748b',     // slate-500 — standard output
  ok: '#6ee7b7',      // emerald-300 — success
  comment: '#334155',  // slate-700 — very dim comments
  sep: 'transparent',
};

export default function TypewriterASCII({ className }) {
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const containerRef = useRef(null);
  const stateRef = useRef({ contentIndex: 0, charIndex: 0, isResetting: false });
  const timerRef = useRef(null);

  const tick = useCallback(() => {
    const { contentIndex, charIndex, isResetting } = stateRef.current;

    if (isResetting) {
      stateRef.current = { contentIndex: 0, charIndex: 0, isResetting: false };
      setLines([]);
      setCurrentLine(null);
      timerRef.current = setTimeout(tick, LINE_DELAY);
      return;
    }

    if (contentIndex >= TYPEWRITER_CONTENT.length) {
      stateRef.current.isResetting = true;
      timerRef.current = setTimeout(tick, RESET_DELAY);
      return;
    }

    const entry = TYPEWRITER_CONTENT[contentIndex];

    // Empty lines (separators) — add immediately
    if (entry.text === '') {
      setLines(prev => {
        const next = [...prev, entry];
        return next.length > MAX_VISIBLE_LINES ? next.slice(-MAX_VISIBLE_LINES) : next;
      });
      setCurrentLine(null);
      stateRef.current.contentIndex++;
      stateRef.current.charIndex = 0;
      timerRef.current = setTimeout(tick, LINE_DELAY / 3);
      return;
    }

    // Still typing current line
    if (charIndex < entry.text.length) {
      setCurrentLine({ ...entry, partial: entry.text.slice(0, charIndex + 1) });
      stateRef.current.charIndex++;
      timerRef.current = setTimeout(tick, entry.type === 'cmd' ? CHAR_DELAY : CHAR_DELAY * 0.6);
      return;
    }

    // Line complete — move to lines array
    setLines(prev => {
      const next = [...prev, entry];
      return next.length > MAX_VISIBLE_LINES ? next.slice(-MAX_VISIBLE_LINES) : next;
    });
    setCurrentLine(null);
    stateRef.current.contentIndex++;
    stateRef.current.charIndex = 0;
    timerRef.current = setTimeout(tick, LINE_DELAY);
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(tick, LINE_DELAY);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tick]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, currentLine]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{
        overflow: 'hidden',
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
        fontSize: '12.5px',
        lineHeight: '1.7',
        padding: '32px 28px',
        userSelect: 'none',
        pointerEvents: 'none',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 6%, black 88%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 6%, black 88%, transparent 100%)',
      }}
    >
      {lines.map((entry, i) => (
        <div
          key={`${i}-${entry.text.slice(0, 10)}`}
          style={{
            opacity: entry.type === 'sep' ? 0 : 0.15 + (i / Math.max(lines.length, 1)) * 0.45,
            whiteSpace: 'pre',
            color: LINE_COLORS[entry.type] || LINE_COLORS.out,
            fontWeight: entry.type === 'cmd' ? 500 : 300,
            letterSpacing: entry.type === 'cmd' ? '0.02em' : '0',
          }}
        >
          {entry.text || '\u00A0'}
        </div>
      ))}

      {/* Current line being typed */}
      {currentLine && (
        <div
          style={{
            opacity: 0.7,
            whiteSpace: 'pre',
            color: LINE_COLORS[currentLine.type] || LINE_COLORS.out,
            fontWeight: currentLine.type === 'cmd' ? 500 : 300,
            letterSpacing: currentLine.type === 'cmd' ? '0.02em' : '0',
          }}
        >
          {currentLine.partial}
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '15px',
              marginLeft: '1px',
              backgroundColor: '#34d399',
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }}
          />
        </div>
      )}

      {/* Blinking cursor when idle */}
      {!currentLine && (
        <div style={{ opacity: 0.6 }}>
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '15px',
              backgroundColor: '#34d399',
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
