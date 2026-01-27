import { useState, useEffect, useRef, useCallback } from 'react';

const TYPEWRITER_CONTENT = [
  '$ axion-cli processar --formato pdf',
  '> Conectando ao servidor Supabase...',
  '> Autenticacao verificada [ES256/JWKS]',
  '> Sessao iniciada: usr_admin_0x4f2a',
  '',
  '$ axion convert documento.md --tema juridico',
  '> Lendo arquivo: peticao_inicial.md (24.3 KB)',
  '> Preprocessando markdown...',
  '> Convertendo referencias documentais...',
  '> Aplicando tema: juridico-formal',
  '> Gerando HTML... OK [320ms]',
  '> Gerando PDF via WeasyPrint... OK [1.2s]',
  '> Upload para Storage: documents/2026/01/',
  '> Documento registrado: doc_id=7f3a9b2e',
  '',
  '$ axion carteira listar --cliente="Silva & Associados"',
  '> Carteira: Contencioso Civel (12 casos)',
  '> Carteira: Trabalhista (8 casos)',
  '> Carteira: Tributario (5 casos)',
  '> Total: 25 casos ativos, 147 documentos',
  '',
  '$ axion processo detalhar proc_2026_0042',
  '> Processo: 0001234-56.2026.8.26.0100',
  '> Vara: 3a Vara Civel - Foro Central',
  '> Partes: Silva & Associados vs. Corp XYZ',
  '> Status: Aguardando audiencia',
  '> Documentos vinculados: 23',
  '',
  '$ axion relatorio gerar --tipo=mensal',
  '> Coletando metricas do periodo...',
  '> Clientes ativos: 34',
  '> Documentos gerados: 256',
  '> Conversoes realizadas: 189',
  '> Relatorio exportado: relatorio_jan_2026.pdf',
  '',
  '$ axion audit-log --ultimas=5',
  '> [2026-01-27 14:32] LOGIN admin@axion.com',
  '> [2026-01-27 14:33] CONVERT peticao.md -> PDF',
  '> [2026-01-27 14:35] UPLOAD doc_8a2f.pdf (1.8MB)',
  '> [2026-01-27 14:36] SHARE carteira_07 -> cliente_12',
  '> [2026-01-27 14:38] EXPORT relatorio_semanal.pdf',
  '',
  '// Sistema Axion Viewer v2.0',
  '// Plataforma de Gestao Juridica',
  '// Todos os direitos reservados',
];

const CHAR_DELAY = 40;
const LINE_DELAY = 600;
const RESET_DELAY = 3000;
const MAX_VISIBLE_LINES = 28;

export default function TypewriterASCII({ className }) {
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState('');
  const containerRef = useRef(null);
  const stateRef = useRef({ contentIndex: 0, charIndex: 0, isResetting: false });
  const timerRef = useRef(null);

  const tick = useCallback(() => {
    const { contentIndex, charIndex, isResetting } = stateRef.current;

    if (isResetting) {
      stateRef.current = { contentIndex: 0, charIndex: 0, isResetting: false };
      setLines([]);
      setCurrentLine('');
      timerRef.current = setTimeout(tick, LINE_DELAY);
      return;
    }

    if (contentIndex >= TYPEWRITER_CONTENT.length) {
      stateRef.current.isResetting = true;
      timerRef.current = setTimeout(tick, RESET_DELAY);
      return;
    }

    const fullLine = TYPEWRITER_CONTENT[contentIndex];

    // Empty lines (separators) — add immediately
    if (fullLine === '') {
      setLines(prev => {
        const next = [...prev, ''];
        return next.length > MAX_VISIBLE_LINES ? next.slice(-MAX_VISIBLE_LINES) : next;
      });
      setCurrentLine('');
      stateRef.current.contentIndex++;
      stateRef.current.charIndex = 0;
      timerRef.current = setTimeout(tick, LINE_DELAY / 3);
      return;
    }

    // Still typing current line
    if (charIndex < fullLine.length) {
      setCurrentLine(fullLine.slice(0, charIndex + 1));
      stateRef.current.charIndex++;
      timerRef.current = setTimeout(tick, CHAR_DELAY);
      return;
    }

    // Line complete — move to lines array
    setLines(prev => {
      const next = [...prev, fullLine];
      return next.length > MAX_VISIBLE_LINES ? next.slice(-MAX_VISIBLE_LINES) : next;
    });
    setCurrentLine('');
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

  // Auto-scroll to bottom when new lines are added
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
        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", "Consolas", monospace',
        fontSize: '13px',
        lineHeight: '1.6',
        padding: '24px',
        userSelect: 'none',
        pointerEvents: 'none',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 8%, black 85%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 8%, black 85%, transparent 100%)',
      }}
    >
      {lines.map((line, i) => (
        <div
          key={`${i}-${line.slice(0, 10)}`}
          style={{
            opacity: 0.12 + (i / Math.max(lines.length, 1)) * 0.2,
            whiteSpace: 'pre',
          }}
          className="text-indigo-300"
        >
          {line || '\u00A0'}
        </div>
      ))}

      {/* Current line being typed */}
      {currentLine !== '' && (
        <div style={{ opacity: 0.35, whiteSpace: 'pre' }} className="text-indigo-300">
          {currentLine}
          <span
            className="inline-block w-[7px] translate-y-[1px] bg-indigo-400"
            style={{
              height: '14px',
              animation: 'blink 1s step-end infinite',
            }}
          />
        </div>
      )}

      {/* Blinking cursor when not typing (between lines) */}
      {currentLine === '' && (
        <div style={{ opacity: 0.35 }}>
          <span
            className="inline-block w-[7px] translate-y-[1px] bg-indigo-400"
            style={{
              height: '14px',
              animation: 'blink 1s step-end infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
