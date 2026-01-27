import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import TypewriterASCII from '@/components/TypewriterASCII';

/* ── Geometric Axion Logo ── */
function AxionMark({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagonal frame */}
      <path
        d="M20 2L36.5 11V29L20 38L3.5 29V11L20 2Z"
        stroke="url(#axion-grad)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner A letterform — constructed geometrically */}
      <path
        d="M20 10L28 28H24.5L22.8 24H17.2L15.5 28H12L20 10Z"
        fill="url(#axion-grad)"
      />
      <rect x="17.8" y="20" width="4.4" height="1.5" rx="0.5" fill="#0a0a0b" />
      <defs>
        <linearGradient id="axion-grad" x1="10" y1="2" x2="32" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6ee7b7" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Status Indicator (top-right of terminal panel) ── */
function StatusDot() {
  return (
    <div className="flex items-center gap-2" style={{ animation: 'fadeIn 1.5s ease-out 0.6s both' }}>
      <span
        className="block h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: '#34d399',
          boxShadow: '0 0 6px rgba(52, 211, 153, 0.6)',
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}
      />
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
          fontWeight: 400,
          letterSpacing: '0.08em',
          color: '#475569',
          textTransform: 'uppercase',
        }}
      >
        Sistema ativo
      </span>
    </div>
  );
}

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message || 'Falha ao fazer login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0a0a0b' }}>
      {/* ━━━ Left Panel — Login Form ━━━ */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-[44%]"
        style={{
          background: 'linear-gradient(145deg, #0f0f11 0%, #0a0a0b 50%, #0d0f12 100%)',
        }}
      >
        <div className="w-full max-w-[380px]">
          {/* Brand */}
          <div className="mb-12 login-fade-up-1">
            <AxionMark size={44} />
            <div className="mt-5 flex items-baseline gap-1.5">
              <h1
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '22px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  color: '#e2e8f0',
                  textTransform: 'uppercase',
                }}
              >
                Axion
              </h1>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '22px',
                  fontWeight: 300,
                  letterSpacing: '0.12em',
                  color: '#475569',
                  textTransform: 'uppercase',
                }}
              >
                Viewer
              </span>
            </div>
            <p
              style={{
                marginTop: '8px',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '13.5px',
                fontWeight: 400,
                color: '#475569',
                letterSpacing: '0.01em',
              }}
            >
              Plataforma de Gestao Juridica
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-2xl p-7 login-fade-up-2"
          >
            {error && (
              <div
                className="mb-5 flex items-center gap-2.5 rounded-lg px-4 py-3"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                }}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 20 20"
                  fill="#f87171"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span style={{ fontSize: '13px', color: '#fca5a5' }}>{error}</span>
              </div>
            )}

            <div className="mb-5">
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: '#94a3b8',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="login-input block w-full rounded-xl px-4 py-3"
                style={{ fontSize: '14px' }}
                placeholder="seu@email.com"
              />
            </div>

            <div className="mb-7">
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: '#94a3b8',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="login-input block w-full rounded-xl px-4 py-3"
                style={{ fontSize: '14px' }}
                placeholder="Sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="login-button w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                letterSpacing: '0.03em',
              }}
            >
              {submitting ? 'Autenticando...' : 'Acessar plataforma'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 login-fade-up-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '10px',
                fontWeight: 400,
                color: '#334155',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Axion v2.0
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>
      </div>

      {/* ━━━ Right Panel — Terminal Branding ━━━ */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-[56%] lg:flex-col terminal-scanline"
        style={{
          background: 'linear-gradient(160deg, #060808 0%, #0a0c0b 40%, #080a09 100%)',
        }}
      >
        {/* Grid background */}
        <div className="terminal-grid absolute inset-0" />

        {/* Ambient glow — emerald */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '45%',
            width: '700px',
            height: '700px',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'pulseGlow 6s ease-in-out infinite',
          }}
        />

        {/* Secondary glow — top corner */}
        <div
          className="absolute"
          style={{
            right: '-100px',
            top: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Top bar — simulated terminal chrome */}
        <div
          className="relative z-10 flex items-center justify-between px-7 pt-6 pb-2 login-fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: '#1e293b' }} />
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: '#1e293b' }} />
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: '#1e293b' }} />
            <span
              style={{
                marginLeft: '12px',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                fontWeight: 400,
                color: '#334155',
                letterSpacing: '0.04em',
              }}
            >
              axion-terminal
            </span>
          </div>
          <StatusDot />
        </div>

        {/* Divider line */}
        <div className="relative z-10 mx-7" style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

        {/* ASCII typewriter — fills remaining space */}
        <TypewriterASCII className="relative z-[3] flex-1" />

        {/* Bottom bar */}
        <div
          className="relative z-10 flex items-center justify-between px-7 pb-6 pt-2 login-fade-in"
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              fontWeight: 300,
              color: '#1e293b',
              letterSpacing: '0.06em',
            }}
          >
            SUPABASE / ES256 / JWKS
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              fontWeight: 300,
              color: '#1e293b',
              letterSpacing: '0.06em',
            }}
          >
            SHA-256 ENCRYPTED
          </span>
        </div>
      </div>
    </div>
  );
}
