import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const FILTER_DEFAULTS = { tese: '', recuperabilidade: '', uf: '', periodo: '' };

export default function ClientLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [carteiras, setCarteiras] = useState([]);
  const [selectedCarteira, setSelectedCarteira] = useState(null);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [appliedFilters, setAppliedFilters] = useState(FILTER_DEFAULTS);
  const [search, setSearch] = useState('');

  const fetchCarteiras = useCallback(async () => {
    try {
      const { data } = await api.get('/carteiras');
      const list = data.data || data || [];
      setCarteiras(list);
      if (list.length > 0) {
        setSelectedCarteira(prev => prev || list[0]);
      }
    } catch {
      setCarteiras([]);
    }
  }, []);

  useEffect(() => {
    fetchCarteiras();
  }, [fetchCarteiras]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClearFilters = () => {
    setFilters(FILTER_DEFAULTS);
    setAppliedFilters(FILTER_DEFAULTS);
  };

  const initials = (profile?.full_name || profile?.email || '')
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      className="flex h-screen bg-[var(--color-bg)]"
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[var(--color-border)] bg-white transition-transform md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4.5 w-4.5 text-white"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v18" />
              <path d="M5 7l7-4 7 4" />
              <path d="M5 7l-1 5c0 1.5 1 2 2.5 2S9 13.5 9 12L8 7" />
              <path d="M19 7l-1 5c0 1.5 1 2 2.5 2S23 13.5 23 12l-1-5" />
              <path d="M9 21h6" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-text)]">Axion Viewer</div>
            <div className="text-[11px] font-medium text-[var(--color-text-muted)]">
              Portal do Cliente
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Carteira selector */}
          <div className="mb-6">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-subtle)]">
              Carteira
            </label>
            <select
              value={selectedCarteira?.id || ''}
              onChange={e => {
                const cart = carteiras.find(c => c.id === e.target.value);
                setSelectedCarteira(cart);
              }}
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm font-medium text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              {carteiras.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <label className="mb-3 block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-subtle)]">
              Filtros
            </label>
            <div className="space-y-3">
              <select
                value={filters.tese}
                onChange={e => setFilters(f => ({ ...f, tese: e.target.value }))}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="">Tese</option>
                <option value="NPL">NPL</option>
                <option value="RJ">RJ</option>
                <option value="Divida_Ativa">Divida Ativa</option>
                <option value="Litigio">Litigio</option>
              </select>

              <select
                value={filters.recuperabilidade}
                onChange={e => setFilters(f => ({ ...f, recuperabilidade: e.target.value }))}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="">Recuperabilidade</option>
                <option value="Alta">Alta</option>
                <option value="Potencial">Potencial</option>
                <option value="Critica">Critica</option>
                <option value="Indefinida">Indefinida</option>
                <option value="Nenhuma">Nenhuma</option>
              </select>

              <select
                value={filters.uf}
                onChange={e => setFilters(f => ({ ...f, uf: e.target.value }))}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="">UF</option>
                {[
                  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
                  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
                  'SP','SE','TO',
                ].map(uf => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filters.periodo}
                onChange={e => setFilters(f => ({ ...f, periodo: e.target.value }))}
                placeholder="Periodo"
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleApplyFilters}
                className="w-full rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={handleClearFilters}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-subtle)]"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* User info footer */}
        <div className="border-t border-[var(--color-border-subtle)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-white">
              {initials || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-text)]">
                {profile?.full_name || profile?.email}
              </p>
              <p className="text-[11px] text-[var(--color-text-subtle)]">Cliente</p>
            </div>
            <button
              onClick={() => {
                signOut();
                navigate('/login');
              }}
              title="Sair"
              className="rounded-md p-1.5 text-[var(--color-text-subtle)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-text)]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-border-subtle)] bg-white px-4 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-accent-subtle)] md:hidden"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">Meus Relatorios</h1>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-xs">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar casos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-white py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet
            context={{
              selectedCarteira,
              carteiras,
              filters: appliedFilters,
              search,
            }}
          />
        </main>
      </div>
    </div>
  );
}
