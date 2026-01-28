import { useState, useEffect, useRef, useCallback } from 'react';

/*
 * Content types:
 *   header  — section title (gold, uppercase)
 *   body    — descriptive text (muted white)
 *   metric  — numbers/data (bright white)
 *   accent  — key findings (gold)
 *   sep     — blank line separator
 */
const TYPEWRITER_CONTENT = [
  { text: 'CARTEIRA RECEBIDA', type: 'header' },
  { text: 'Cessao de creditos inadimplentes — Banco Nacional S.A.', type: 'body' },
  { text: '2.340 contratos  |  R$ 187,4 MM em face value', type: 'metric' },
  { text: 'Segmentos: Credito Pessoal, Consignado, Veiculos', type: 'body' },
  { text: '', type: 'sep' },
  { text: 'TRIAGEM E CLASSIFICACAO', type: 'header' },
  { text: 'Cruzamento de dados com bases publicas e privadas', type: 'body' },
  { text: 'Identificando perfil de devedores e garantias...', type: 'body' },
  { text: '1.812 contratos com garantia real localizada', type: 'metric' },
  { text: '528 contratos sem garantia — reclassificados', type: 'body' },
  { text: '', type: 'sep' },
  { text: 'ANALISE DE VIABILIDADE', type: 'header' },
  { text: 'Avaliando capacidade de recuperacao por contrato', type: 'body' },
  { text: 'Score medio da carteira: 7.2 / 10', type: 'metric' },
  { text: 'Estimativa de recuperacao: R$ 42,8 MM (22.8%)', type: 'accent' },
  { text: 'Prazo projetado: 18 a 36 meses', type: 'body' },
  { text: '', type: 'sep' },
  { text: 'PROCESSOS JUDICIAIS', type: 'header' },
  { text: 'Mapeando acoes em andamento nos tribunais', type: 'body' },
  { text: '347 execucoes fiscais ativas', type: 'metric' },
  { text: '89 recuperacoes judiciais em curso', type: 'metric' },
  { text: '1.904 processos sem acao judicial — elegíveis', type: 'body' },
  { text: '', type: 'sep' },
  { text: 'DOCUMENTACAO', type: 'header' },
  { text: 'Gerando peticoes, notificacoes e relatorios', type: 'body' },
  { text: 'Peticoes iniciais geradas: 1.904', type: 'metric' },
  { text: 'Notificacoes extrajudiciais emitidas: 2.340', type: 'metric' },
  { text: 'Relatorio consolidado da carteira exportado', type: 'accent' },
  { text: '', type: 'sep' },
  { text: 'RESULTADO DA ANALISE', type: 'header' },
  { text: 'Carteira aprovada para aquisicao', type: 'accent' },
  { text: 'ROI projetado: 3.2x sobre valor de cessao', type: 'accent' },
  { text: 'Analise concluida com sucesso.', type: 'accent' },
];

const CHAR_DELAY = 30;
const LINE_DELAY = 450;
const LOGO_DELAY = 1200;
const RESET_DELAY = 4000;
const MAX_VISIBLE_LINES = 26;

const LINE_COLORS = {
  header: '#d4a843',
  body: 'rgba(255, 255, 255, 0.42)',
  metric: 'rgba(255, 255, 255, 0.72)',
  accent: '#d4a843',
  sep: 'transparent',
};

const LINE_WEIGHTS = {
  header: 500,
  body: 400,
  metric: 500,
  accent: 500,
  sep: 400,
};

export default function TypewriterASCII({ className }) {
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [showLogo, setShowLogo] = useState(false);
  const containerRef = useRef(null);
  const stateRef = useRef({ contentIndex: 0, charIndex: 0, phase: 'typing' });
  const timerRef = useRef(null);

  const tick = useCallback(() => {
    const { contentIndex, charIndex, phase } = stateRef.current;

    // Phase: show logo after typing
    if (phase === 'logo') {
      setShowLogo(true);
      stateRef.current.phase = 'waiting';
      timerRef.current = setTimeout(tick, RESET_DELAY);
      return;
    }

    // Phase: reset everything
    if (phase === 'waiting') {
      stateRef.current = { contentIndex: 0, charIndex: 0, phase: 'typing' };
      setLines([]);
      setCurrentLine(null);
      setShowLogo(false);
      timerRef.current = setTimeout(tick, LINE_DELAY);
      return;
    }

    // Phase: all lines typed — transition to logo
    if (contentIndex >= TYPEWRITER_CONTENT.length) {
      setCurrentLine(null);
      stateRef.current.phase = 'logo';
      timerRef.current = setTimeout(tick, LOGO_DELAY);
      return;
    }

    const entry = TYPEWRITER_CONTENT[contentIndex];

    // Separators — instant
    if (entry.text === '') {
      setLines((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_VISIBLE_LINES ? next.slice(-MAX_VISIBLE_LINES) : next;
      });
      setCurrentLine(null);
      stateRef.current.contentIndex++;
      stateRef.current.charIndex = 0;
      timerRef.current = setTimeout(tick, LINE_DELAY / 4);
      return;
    }

    // Still typing current line
    if (charIndex < entry.text.length) {
      setCurrentLine({ ...entry, partial: entry.text.slice(0, charIndex + 1) });
      stateRef.current.charIndex++;
      const speed = entry.type === 'header' ? CHAR_DELAY * 1.2 : CHAR_DELAY * 0.55;
      timerRef.current = setTimeout(tick, speed);
      return;
    }

    // Line complete
    setLines((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_VISIBLE_LINES ? next.slice(-MAX_VISIBLE_LINES) : next;
    });
    setCurrentLine(null);
    stateRef.current.contentIndex++;
    stateRef.current.charIndex = 0;
    timerRef.current = setTimeout(tick, entry.type === 'header' ? LINE_DELAY * 1.1 : LINE_DELAY);
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
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"IBM Plex Mono", "Consolas", monospace',
        fontSize: '12.5px',
        lineHeight: '1.8',
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
          key={`${i}-${entry.text.slice(0, 12)}`}
          style={{
            opacity: entry.type === 'sep' ? 0 : 0.2 + (i / Math.max(lines.length, 1)) * 0.5,
            whiteSpace: 'pre-wrap',
            color: LINE_COLORS[entry.type] || LINE_COLORS.body,
            fontWeight: LINE_WEIGHTS[entry.type] || 400,
            letterSpacing: entry.type === 'header' ? '0.12em' : '0.01em',
            fontSize: entry.type === 'header' ? '11px' : '12.5px',
            marginTop: entry.type === 'header' ? '4px' : '0',
            marginBottom: entry.type === 'header' ? '2px' : '0',
          }}
        >
          {entry.text || '\u00A0'}
        </div>
      ))}

      {/* Current line being typed */}
      {currentLine && (
        <div
          style={{
            opacity: 0.85,
            whiteSpace: 'pre-wrap',
            color: LINE_COLORS[currentLine.type] || LINE_COLORS.body,
            fontWeight: LINE_WEIGHTS[currentLine.type] || 400,
            letterSpacing: currentLine.type === 'header' ? '0.12em' : '0.01em',
            fontSize: currentLine.type === 'header' ? '11px' : '12.5px',
            marginTop: currentLine.type === 'header' ? '4px' : '0',
          }}
        >
          {currentLine.partial}
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '14px',
              marginLeft: '1px',
              backgroundColor: '#d4a843',
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }}
          />
        </div>
      )}

      {/* Idle cursor */}
      {!currentLine && !showLogo && (
        <div style={{ opacity: 0.5 }}>
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '14px',
              backgroundColor: '#d4a843',
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }}
          />
        </div>
      )}

      {/* Logo reveal after typing completes */}
      {showLogo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, rgba(15,31,54,0.97) 0%, rgba(15,31,54,0.85) 60%, transparent 100%)',
            animation: 'fadeIn 0.8s ease-out both',
            zIndex: 5,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '14px',
              border: '1px solid rgba(212, 168, 67, 0.25)',
              background: 'rgba(212, 168, 67, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              animation: 'fadeInUp 0.7s ease-out 0.2s both',
            }}
          >
            <span
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '32px',
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              A
            </span>
            <span
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '32px',
                fontWeight: 600,
                color: '#d4a843',
              }}
            >
              V
            </span>
          </div>

          {/* Brand */}
          <div style={{ animation: 'fadeInUp 0.7s ease-out 0.4s both' }}>
            <span
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '26px',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              Axion
            </span>
            <span
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '26px',
                fontWeight: 600,
                color: '#d4a843',
                marginLeft: '6px',
              }}
            >
              Viewer
            </span>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: '8px',
              animation: 'fadeInUp 0.7s ease-out 0.55s both',
            }}
          >
            Intelligence
          </p>
        </div>
      )}
    </div>
  );
}
