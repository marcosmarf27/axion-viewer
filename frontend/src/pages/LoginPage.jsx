import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
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
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: '#f5f6f8' }}
    >
      {/* ━━━ Left Panel — Login Form ━━━ */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          {/* Brand */}
          <div className="mb-10 login-fade-up-1">
            <div className="flex items-baseline">
              <span
                style={{
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  fontSize: '28px',
                  fontWeight: 600,
                  color: '#1a365d',
                  letterSpacing: '-0.01em',
                }}
              >
                Axioma
              </span>
              <span
                style={{
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  fontSize: '28px',
                  fontWeight: 600,
                  color: '#8b6914',
                }}
              >
                .
              </span>
            </div>
            <p
              style={{
                marginTop: '4px',
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: '#80868b',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Intelligence
            </p>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="login-card p-8 login-fade-up-2"
          >
            <h2
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                color: '#1a1d21',
                marginBottom: '4px',
              }}
            >
              Entrar na plataforma
            </h2>
            <p
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '13px',
                color: '#5f6368',
                marginBottom: '28px',
              }}
            >
              Insira suas credenciais para continuar
            </p>

            {error && (
              <div
                className="mb-5 flex items-center gap-2.5 rounded-md px-4 py-3"
                style={{
                  background: 'rgba(197, 34, 31, 0.06)',
                  border: '1px solid rgba(197, 34, 31, 0.12)',
                }}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 20 20"
                  fill="#c5221f"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span
                  style={{
                    fontSize: '13px',
                    color: '#c5221f',
                    fontFamily: '"IBM Plex Sans", sans-serif',
                  }}
                >
                  {error}
                </span>
              </div>
            )}

            <div className="mb-5">
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#80868b',
                  letterSpacing: '0.06em',
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
                onChange={(e) => setEmail(e.target.value)}
                className="login-input block w-full px-4 py-3"
                style={{
                  fontSize: '14px',
                  fontFamily: '"IBM Plex Sans", sans-serif',
                }}
                placeholder="seu@email.com"
              />
            </div>

            <div className="mb-7">
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#80868b',
                  letterSpacing: '0.06em',
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
                onChange={(e) => setPassword(e.target.value)}
                className="login-input block w-full px-4 py-3"
                style={{
                  fontSize: '14px',
                  fontFamily: '"IBM Plex Sans", sans-serif',
                }}
                placeholder="Sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="login-button w-full px-4 py-3 text-sm font-semibold"
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              {submitting ? 'Autenticando...' : 'Acessar plataforma'}
            </button>
          </form>

          {/* Footer */}
          <div
            className="mt-10 login-fade-up-3"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                flex: 1,
                height: '1px',
                background: '#e8eaed',
              }}
            />
            <span
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '10px',
                fontWeight: 400,
                color: '#80868b',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Axioma v2.0
            </span>
            <div
              style={{
                flex: 1,
                height: '1px',
                background: '#e8eaed',
              }}
            />
          </div>
        </div>
      </div>

      {/* ━━━ Right Panel — Branding ━━━ */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center"
        style={{
          background: 'linear-gradient(160deg, #1a365d 0%, #234578 50%, #1a365d 100%)',
        }}
      >
        {/* Subtle decorative elements */}
        <div
          className="absolute"
          style={{
            right: '-120px',
            top: '-120px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute"
          style={{
            left: '-80px',
            bottom: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,105,20,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Branding content */}
        <div className="relative z-10 text-center login-slide-in" style={{ maxWidth: '360px' }}>
          {/* Logo mark */}
          <div
            className="mx-auto mb-8 flex items-center justify-center"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            <span
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '28px',
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              A
            </span>
            <span
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '28px',
                fontWeight: 600,
                color: '#d4a843',
              }}
            >
              .
            </span>
          </div>

          {/* Brand name */}
          <div className="mb-3">
            <span
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '36px',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              Axioma
            </span>
            <span
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '36px',
                fontWeight: 600,
                color: '#d4a843',
              }}
            >
              .
            </span>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '32px',
            }}
          >
            Intelligence
          </p>

          {/* Divider */}
          <div
            className="mx-auto mb-8"
            style={{
              width: '40px',
              height: '1px',
              background: 'rgba(255,255,255,0.15)',
            }}
          />

          {/* Tagline */}
          <p
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '15px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: '1.7',
            }}
          >
            Plataforma de Gestao
            <br />
            Juridica Inteligente
          </p>
        </div>

        {/* Bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 pb-6 login-fade-in"
        >
          <span
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '10px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.06em',
            }}
          >
            SUPABASE / ES256 / JWKS
          </span>
          <span
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '10px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.06em',
            }}
          >
            ENCRYPTED
          </span>
        </div>
      </div>
    </div>
  );
}
