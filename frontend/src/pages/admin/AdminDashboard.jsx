import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import TourProgressCard from '@/components/tour/TourProgressCard';
import { useTour } from '@/hooks/useTour';

const statCards = [
  {
    key: 'total_clientes',
    label: 'Clientes Ativos',
    color: 'bg-blue-500',
    path: '/admin/clientes',
    icon: (
      <svg
        className="h-5 w-5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
  {
    key: 'total_carteiras',
    label: 'Carteiras',
    color: 'bg-[var(--color-accent)]',
    path: '/admin/carteiras',
    icon: (
      <svg
        className="h-5 w-5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
        />
      </svg>
    ),
  },
  {
    key: 'total_casos',
    label: 'Casos',
    color: 'bg-purple-500',
    path: '/admin/casos',
    icon: (
      <svg
        className="h-5 w-5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
        />
      </svg>
    ),
  },
  {
    key: 'total_processos',
    label: 'Processos',
    color: 'bg-amber-500',
    path: '/admin/processos',
    icon: (
      <svg
        className="h-5 w-5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"
        />
      </svg>
    ),
  },
  {
    key: 'total_documentos',
    label: 'Documentos',
    color: 'bg-emerald-500',
    path: '/admin/documentos',
    icon: (
      <svg
        className="h-5 w-5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
  },
  {
    key: 'documentos_este_mes',
    label: 'Docs Este Mes',
    color: 'bg-rose-500',
    path: '/admin/documentos',
    icon: (
      <svg
        className="h-5 w-5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    ),
  },
];

const teseColors = {
  NPL: '#6366f1',
  RJ: '#f59e0b',
  Divida_Ativa: '#ef4444',
  Litigio: '#10b981',
};

const recupColors = {
  Alta: '#10b981',
  Potencial: '#6366f1',
  Critica: '#ef4444',
  Indefinida: '#9ca3af',
  Nenhuma: '#374151',
};

function SimpleBarChart({ data, colorMap, labelKey, valueKey }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">Sem dados</p>;
  }
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="space-y-2">
      {data.map(item => (
        <div key={item[labelKey]} className="flex items-center gap-3">
          <span className="w-28 truncate text-sm text-slate-600">{item[labelKey]}</span>
          <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${max > 0 ? (item[valueKey] / max) * 100 : 0}%`,
                backgroundColor: colorMap[item[labelKey]] || '#6366f1',
              }}
            />
          </div>
          <span className="w-8 text-right text-sm font-medium text-slate-900">
            {item[valueKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { updateProgressFromStats, shouldAutoStart, startTour, hidden } = useTour();
  const autoStarted = useRef(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Update tour progress when stats load
  useEffect(() => {
    if (stats) {
      updateProgressFromStats(stats);
    }
  }, [stats, updateProgressFromStats]);

  // Auto-start tour on first visit
  useEffect(() => {
    if (!loading && shouldAutoStart && !hidden && !autoStarted.current) {
      autoStarted.current = true;
      // Small delay to let the page render
      const timer = setTimeout(() => startTour(), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, shouldAutoStart, hidden, startTour]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, recentRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent'),
      ]);
      setStats(statsRes.data);
      setRecent(recentRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Erro ao carregar dashboard: {error}</p>
        <button onClick={fetchData} className="mt-2 text-sm font-medium text-red-700 underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <button
          onClick={fetchData}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Atualizar
        </button>
      </div>

      {/* Tour Progress */}
      <TourProgressCard />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map(card => (
          <Link
            key={card.key}
            to={card.path}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className={`mb-2 inline-flex rounded-lg ${card.color} p-2.5`}>{card.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{stats?.[card.key] ?? 0}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Distribuicao por Tese</h2>
          <SimpleBarChart
            data={stats?.distribuicao_tese || []}
            colorMap={teseColors}
            labelKey="tese"
            valueKey="count"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Distribuicao por Recuperabilidade
          </h2>
          <SimpleBarChart
            data={stats?.distribuicao_recuperabilidade || []}
            colorMap={recupColors}
            labelKey="recuperabilidade"
            valueKey="count"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Atividade Recente</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">Nenhuma atividade recente.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {doc.title || doc.filename}
                  </p>
                  <p className="text-xs text-slate-500">
                    {doc.file_type?.toUpperCase()} &middot;{' '}
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="ml-4 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {doc.file_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Acoes Rapidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/convert"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Converter Documento
          </Link>
          <Link
            to="/admin/clientes"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Cliente
          </Link>
          <Link
            to="/admin/processos"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Processo
          </Link>
        </div>
      </div>
    </div>
  );
}
