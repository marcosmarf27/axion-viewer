import { useState, useEffect, useRef, useCallback } from 'react';

const TYPEWRITER_CONTENT = [
  { text: '$ axioma-cli processar --formato pdf', type: 'cmd' },
  { text: '> Conectando ao servidor Supabase...', type: 'out' },
  { text: '> Autenticacao verificada [ES256/JWKS]', type: 'ok' },
  { text: '> Sessao iniciada: usr_admin_0x4f2a', type: 'out' },
  { text: '', type: 'sep' },
  { text: '$ axioma convert documento.md --tema juridico', type: 'cmd' },
  { text: '> Lendo arquivo: peticao_inicial.md (24.3 KB)', type: 'out' },
  { text: '> Preprocessando markdown...', type: 'out' },
  { text: '> Convertendo referencias documentais...', type: 'out' },
  { text: '> Aplicando tema: juridico-formal', type: 'out' },
  { text: '> Gerando HTML... OK [320ms]', type: 'ok' },
  { text: '> Gerando PDF via WeasyPrint... OK [1.2s]', type: 'ok' },
  { text: '> Upload para Storage: documents/2026/01/', type: 'out' },
  { text: '> Documento registrado: doc_id=7f3a9b2e', type: 'ok' },
  { text: '', type: 'sep' },
  { text: '$ axioma carteira listar --cliente="Silva & Associados"', type: 'cmd' },
  { text: '> Carteira: Contencioso Civel (12 casos)', type: 'out' },
  { text: '> Carteira: Trabalhista (8 casos)', type: 'out' },
  { text: '> Carteira: Tributario (5 casos)', type: 'out' },
  { text: '> Total: 25 casos ativos, 147 documentos', type: 'ok' },
  { text: '', type: 'sep' },
  { text: '$ axioma processo detalhar proc_2026_0042', type: 'cmd' },
  { text: '> Processo: 0001234-56.2026.8.26.0100', type: 'out' },
  { text: '> Vara: 3a Vara Civel - Foro Central', type: 'out' },
  { text: '> Partes: Silva & Associados vs. Corp XYZ', type: 'out' },
  { text: '> Status: Aguardando audiencia', type: 'out' },
  { text: '> Documentos vinculados: 23', type: 'out' },
  { text: '', type: 'sep' },
  { text: '$ axioma relatorio gerar --tipo=mensal', type: 'cmd' },
  { text: '> Coletando metricas do periodo...', type: 'out' },
  { text: '> Clientes ativos: 34', type: 'out' },
  { text: '> Documentos gerados: 256', type: 'out' },
  { text: '> Conversoes realizadas: 189', type: 'out' },
  { text: '> Relatorio exportado: relatorio_jan_2026.pdf', type: 'ok' },
  { text: '', type: 'sep' },
  { text: '$ axioma audit-log --ultimas=5', type: 'cmd' },
  { text: '> [2026-01-27 14:32] LOGIN admin@axion.com', type: 'out' },
  { text: '> [2026-01-27 14:33] CONVERT peticao.md -> PDF', type: 'out' },
  { text: '> [2026-01-27 14:35] UPLOAD doc_8a2f.pdf (1.8MB)', type: 'out' },
  { text: '> [2026-01-27 14:36] SHARE carteira_07 -> cliente_12', type: 'out' },
  { text: '> [2026-01-27 14:38] EXPORT relatorio_semanal.pdf', type: 'ok' },
  { text: '', type: 'sep' },
  { text: '// Axioma Intelligence v2.0', type: 'comment' },
  { text: '// Plataforma de Gestao Juridica', type: 'comment' },
  { text: '// Todos os direitos reservados', type: 'comment' },
];

const CHAR_DELAY = 35;
const LINE_DELAY = 500;
const RESET_DELAY = 3000;
const MAX_VISIBLE_LINES = 28;

const LINE_COLORS = {
  cmd: '#d4a843',
  out: 'rgba(255, 255, 255, 0.45)',
  ok: 'rgba(255, 255, 255, 0.75)',
  comment: 'rgba(255, 255, 255, 0.15)',
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

    if (entry.text === '') {
      setLines((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_VISIBLE_LINES ? next.slice(-MAX_VISIBLE_LINES) : next;
      });
      setCurrentLine(null);
      stateRef.current.contentIndex++;
      stateRef.current.charIndex = 0;
      timerRef.current = setTimeout(tick, LINE_DELAY / 3);
      return;
    }

    if (charIndex < entry.text.length) {
      setCurrentLine({ ...entry, partial: entry.text.slice(0, charIndex + 1) });
      stateRef.current.charIndex++;
      timerRef.current = setTimeout(tick, entry.type === 'cmd' ? CHAR_DELAY : CHAR_DELAY * 0.6);
      return;
    }

    setLines((prev) => {
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
        fontFamily: '"IBM Plex Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
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
            opacity: entry.type === 'sep' ? 0 : 0.15 + (i / Math.max(lines.length, 1)) * 0.55,
            whiteSpace: 'pre',
            color: LINE_COLORS[entry.type] || LINE_COLORS.out,
            fontWeight: entry.type === 'cmd' ? 500 : 400,
            letterSpacing: entry.type === 'cmd' ? '0.02em' : '0',
          }}
        >
          {entry.text || '\u00A0'}
        </div>
      ))}

      {currentLine && (
        <div
          style={{
            opacity: 0.8,
            whiteSpace: 'pre',
            color: LINE_COLORS[currentLine.type] || LINE_COLORS.out,
            fontWeight: currentLine.type === 'cmd' ? 500 : 400,
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
              backgroundColor: '#d4a843',
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }}
          />
        </div>
      )}

      {!currentLine && (
        <div style={{ opacity: 0.6 }}>
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '15px',
              backgroundColor: '#d4a843',
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
