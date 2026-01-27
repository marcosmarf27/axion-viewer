import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

const statCards = [
  {
    key: 'total_clientes',
    label: 'Clientes Ativos',
    color: 'bg-blue-500',
    path: '/admin/clientes',
  },
  { key: 'total_carteiras', label: 'Carteiras', color: 'bg-indigo-500', path: '/admin/carteiras' },
  { key: 'total_casos', label: 'Casos', color: 'bg-purple-500', path: '/admin/casos' },
  { key: 'total_processos', label: 'Processos', color: 'bg-amber-500', path: '/admin/processos' },
  {
    key: 'total_documentos',
    label: 'Documentos',
    color: 'bg-emerald-500',
    path: '/admin/documentos',
  },
  {
    key: 'documentos_este_mes',
    label: 'Docs Este Mes',
    color: 'bg-rose-500',
    path: '/admin/documentos',
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
    return <p className="text-sm text-gray-500">Sem dados</p>;
  }
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="space-y-2">
      {data.map(item => (
        <div key={item[labelKey]} className="flex items-center gap-3">
          <span className="w-28 truncate text-sm text-gray-600">{item[labelKey]}</span>
          <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${max > 0 ? (item[valueKey] / max) * 100 : 0}%`,
                backgroundColor: colorMap[item[labelKey]] || '#6366f1',
              }}
            />
          </div>
          <span className="w-8 text-right text-sm font-medium text-gray-900">{item[valueKey]}</span>
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

  useEffect(() => {
    fetchData();
  }, []);

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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchData}
          className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          Atualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map(card => (
          <Link
            key={card.key}
            to={card.path}
            className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`mb-2 inline-block rounded-md ${card.color} p-2`}>
              <div className="h-4 w-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.[card.key] ?? 0}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Distribuicao por Tese</h2>
          <SimpleBarChart
            data={stats?.distribuicao_tese || []}
            colorMap={teseColors}
            labelKey="tese"
            valueKey="count"
          />
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
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
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">Nenhuma atividade recente.</p>
        ) : (
          <div className="divide-y">
            {recent.map(doc => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {doc.title || doc.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc.file_type?.toUpperCase()} &middot;{' '}
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="ml-4 inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {doc.file_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Acoes Rapidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/convert"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Converter Documento
          </Link>
          <Link
            to="/admin/clientes"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Novo Cliente
          </Link>
          <Link
            to="/admin/processos"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Novo Processo
          </Link>
        </div>
      </div>
    </div>
  );
}
