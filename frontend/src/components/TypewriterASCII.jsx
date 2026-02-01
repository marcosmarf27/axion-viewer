import { useState, useEffect } from 'react';

export default function TypewriterASCII({ className }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeno delay para a animação iniciar suavemente
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {/* Logo reveal */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '16px',
            border: '1px solid rgba(212, 168, 67, 0.3)',
            background: 'rgba(212, 168, 67, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
            boxShadow: '0 8px 32px rgba(212, 168, 67, 0.15)',
          }}
        >
          <span
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '36px',
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            A
          </span>
          <span
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '36px',
              fontWeight: 600,
              color: '#d4a843',
            }}
          >
            V
          </span>
        </div>

        {/* Brand text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
          }}
        >
          <span
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '28px',
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
              fontSize: '28px',
              fontWeight: 600,
              color: '#d4a843',
              marginLeft: '8px',
            }}
          >
            Viewer
          </span>
          <span
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              color: '#d4a843',
              marginLeft: '8px',
              opacity: 0.8,
            }}
          >
            2.0
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: '12px',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '11px',
            color: '#80868b',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
          }}
        >
          Powered by Axioma Intelligence
        </div>
      </div>
    </div>
  );
}
