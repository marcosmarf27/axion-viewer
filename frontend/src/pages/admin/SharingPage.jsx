import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserX,
  UserPlus,
  Share2,
  Briefcase,
  FolderOpen,
  Eye,
  ExternalLink,
  HelpCircle,
  Info,
  Users,
  Scale,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import SearchableSelect from '@/components/SearchableSelect';

const statusConfig = {
  ativa: { label: 'Ativa', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  em_analise: {
    label: 'Em Analise',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  encerrada: {
    label: 'Encerrada',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
};

// --- Componentes inline ---

function Tooltip({ text, children }) {
  return (
    <span className="group relative inline-flex items-center">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </span>
    </span>
  );
}

function FeedbackMessage({ message, type, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const styles = {
    success: 'bg-green-50 text-green-700',
    error: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className={`rounded-lg p-3 text-sm ${styles[type] || styles.error}`}>{message}</div>
  );
}

function FlowIndicator() {
  const steps = [
    { icon: Briefcase, label: 'Preparar Carteira', sub: 'Clientes e Carteiras' },
    { icon: FolderOpen, label: 'Inserir Conteudo', sub: 'Casos, Processos, Docs' },
    { icon: Share2, label: 'Compartilhar', sub: 'Voce esta aqui', active: true },
    { icon: Eye, label: 'Cliente Visualiza', sub: 'Portal do Cliente' },
  ];

  return (
    <div className="flex items-center gap-0 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = step.active;
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${isActive ? 'text-[var(--color-accent)]' : 'text-slate-500'}`}
              >
                {step.label}
              </span>
              <span
                className={`text-[10px] ${isActive ? 'font-medium text-[var(--color-accent)]' : 'text-slate-400'}`}
              >
                {step.sub}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="mx-3 h-4 w-4 flex-shrink-0 text-slate-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CarteiraSummaryCard({ carteira, acessosCount }) {
  if (!carteira) return null;

  const status = statusConfig[carteira.status] || statusConfig.ativa;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Briefcase className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{carteira.nome}</h3>
            <p className="text-xs text-slate-500">{carteira.cliente?.nome || 'Sem cliente'}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Scale className="h-3.5 w-3.5" />
          <span>{carteira.qtd_casos ?? 0} Casos</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <FolderOpen className="h-3.5 w-3.5" />
          <span>{carteira.qtd_processos ?? 0} Processos</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5" />
          <span>{acessosCount} Usuarios</span>
        </div>
        <div className="ml-auto">
          <Link
            to={`/admin/carteiras/${carteira.id}/casos`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            Ver Carteira
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function EducativeEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Share2 className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Como funciona o compartilhamento</h3>
        <ol className="mt-4 space-y-3 text-left text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              1
            </span>
            Prepare a carteira com casos, processos e documentos
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              2
            </span>
            Selecione a carteira acima
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-xs font-bold text-[var(--color-accent)]">
              3
            </span>
            Conceda acesso a um usuario cliente
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              4
            </span>
            O cliente visualiza tudo no Portal do Cliente
          </li>
        </ol>
      </div>
    </div>
  );
}

function AvatarInitials({ name, email }) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (email || '?')[0].toUpperCase();

  // Cor baseada no hash simples da string
  const str = name || email || '';
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colorClass = colors[Math.abs(hash) % colors.length];

  return (
    <div
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}
    >
      {initials}
    </div>
  );
}

// --- Componente principal ---

export default function SharingPage() {
  const [carteiras, setCarteiras] = useState([]);
  const [loadingCarteiras, setLoadingCarteiras] = useState(true);
  const [selectedCarteiraId, setSelectedCarteiraId] = useState('');

  const [acessos, setAcessos] = useState([]);
  const [loadingAcessos, setLoadingAcessos] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [granting, setGranting] = useState(false);

  const [revokeConfirm, setRevokeConfirm] = useState(null);

  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Carregar carteiras
  useEffect(() => {
    setLoadingCarteiras(true);
    api
      .get('/carteiras', { params: { per_page: 100 } })
      .then((res) => setCarteiras(res.data.data || []))
      .catch(() => setCarteiras([]))
      .finally(() => setLoadingCarteiras(false));
  }, []);

  // Carregar profiles (role=client)
  useEffect(() => {
    setLoadingProfiles(true);
    api
      .get('/accounts')
      .then((res) => {
        const allProfiles = res.data.data || res.data || [];
        setProfiles(allProfiles.filter((p) => p.user_metadata?.role === 'client'));
      })
      .catch(() => setProfiles([]))
      .finally(() => setLoadingProfiles(false));
  }, []);

  // Carregar acessos quando carteira selecionada
  useEffect(() => {
    if (!selectedCarteiraId) {
      setAcessos([]);
      return;
    }
    setLoadingAcessos(true);
    api
      .get(`/sharing/carteira/${selectedCarteiraId}`)
      .then((res) => setAcessos(res.data.data || res.data || []))
      .catch(() => {
        setAcessos([]);
        setFeedback({ message: 'Erro ao carregar acessos da carteira', type: 'error' });
      })
      .finally(() => setLoadingAcessos(false));
  }, [selectedCarteiraId]);

  // Dados preparados
  const selectedCarteira = carteiras.find((c) => c.id === selectedCarteiraId);

  const carteirasForSelect = carteiras.map((c) => ({
    ...c,
    displayLabel: `${c.nome}${c.cliente?.nome ? ` — ${c.cliente.nome}` : ''}`,
  }));

  const acessoProfileIds = new Set(acessos.map((a) => a.profile_id));
  const availableProfiles = profiles
    .filter((p) => !acessoProfileIds.has(p.id))
    .map((p) => ({
      ...p,
      displayLabel: `${p.user_metadata?.full_name || ''} ${p.email}`.trim(),
    }));

  const handleGrantAccess = async () => {
    if (!selectedCarteiraId || !selectedProfileId) return;

    // Deteccao de duplicata no frontend
    if (acessoProfileIds.has(selectedProfileId)) {
      setFeedback({ message: 'Este usuario ja possui acesso a esta carteira.', type: 'warning' });
      setSelectedProfileId('');
      return;
    }

    setGranting(true);
    try {
      await api.post(`/sharing/carteira/${selectedCarteiraId}`, {
        profile_id: selectedProfileId,
      });
      setFeedback({ message: 'Acesso concedido com sucesso', type: 'success' });
      setSelectedProfileId('');
      const res = await api.get(`/sharing/carteira/${selectedCarteiraId}`);
      setAcessos(res.data.data || res.data || []);
    } catch (err) {
      setFeedback({
        message: err.response?.data?.error || 'Erro ao conceder acesso',
        type: 'error',
      });
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeConfirm) return;
    try {
      await api.delete(`/sharing/carteira/${selectedCarteiraId}/${revokeConfirm.profile_id}`);
      setFeedback({ message: 'Acesso revogado com sucesso', type: 'success' });
      setRevokeConfirm(null);
      const res = await api.get(`/sharing/carteira/${selectedCarteiraId}`);
      setAcessos(res.data.data || res.data || []);
    } catch (err) {
      setFeedback({
        message: err.response?.data?.error || 'Erro ao revogar acesso',
        type: 'error',
      });
      setRevokeConfirm(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Compartilhamento de Carteiras</h1>
            <Tooltip text="Controle quais clientes podem visualizar cada carteira no Portal do Cliente">
              <HelpCircle className="h-4 w-4 cursor-help text-slate-400" />
            </Tooltip>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie quais clientes podem visualizar cada carteira no Portal do Cliente.
          </p>
        </div>
      </div>

      {/* Flow indicator */}
      <FlowIndicator />

      <FeedbackMessage
        message={feedback.message}
        type={feedback.type}
        onDismiss={() => setFeedback({ message: '', type: '' })}
      />

      {/* Seletor de carteira com SearchableSelect */}
      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Selecione uma carteira
          </label>
          <Tooltip text="Escolha a carteira que deseja compartilhar com um cliente">
            <Info className="h-3.5 w-3.5 cursor-help text-slate-400" />
          </Tooltip>
        </div>
        {loadingCarteiras ? (
          <LoadingSpinner className="py-4" size="sm" />
        ) : (
          <SearchableSelect
            value={selectedCarteiraId}
            onChange={setSelectedCarteiraId}
            options={carteirasForSelect}
            valueKey="id"
            labelKey="displayLabel"
            placeholder="Busque por nome da carteira ou cliente..."
            searchPlaceholder="Buscar carteira..."
            emptyMessage="Nenhuma carteira encontrada"
            renderOption={(c) => (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">{c.nome}</div>
                  <div className="text-xs text-slate-500">
                    {c.cliente?.nome || 'Sem cliente'}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    (statusConfig[c.status] || statusConfig.ativa).bg
                  } ${(statusConfig[c.status] || statusConfig.ativa).text}`}
                >
                  {(statusConfig[c.status] || statusConfig.ativa).label}
                </span>
              </div>
            )}
          />
        )}
      </div>

      {/* Conteudo principal */}
      {!selectedCarteiraId ? (
        <EducativeEmptyState />
      ) : loadingAcessos ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="space-y-6">
          {/* Resumo da carteira */}
          <CarteiraSummaryCard carteira={selectedCarteira} acessosCount={acessos.length} />

          {/* Card: Conceder acesso */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <UserPlus className="h-5 w-5 text-[var(--color-accent)]" />
              <h2 className="text-lg font-semibold text-slate-900">Conceder Acesso</h2>
            </div>
            <div className="p-4">
              <p className="mb-4 text-sm text-slate-500">
                Ao conceder acesso, o cliente podera visualizar esta carteira, seus casos,
                processos e documentos no Portal do Cliente.
              </p>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Selecione um cliente
                    </label>
                    <Tooltip text="Apenas clientes sem acesso a esta carteira sao listados">
                      <Info className="h-3.5 w-3.5 cursor-help text-slate-400" />
                    </Tooltip>
                  </div>
                  {loadingProfiles ? (
                    <LoadingSpinner className="py-2" size="sm" />
                  ) : (
                    <SearchableSelect
                      value={selectedProfileId}
                      onChange={setSelectedProfileId}
                      options={availableProfiles}
                      valueKey="id"
                      labelKey="displayLabel"
                      placeholder="Busque por nome ou email..."
                      searchPlaceholder="Buscar cliente..."
                      emptyMessage={
                        profiles.length > 0
                          ? 'Todos os clientes ja possuem acesso'
                          : 'Nenhum cliente cadastrado'
                      }
                      renderOption={(p) => (
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {p.user_metadata?.full_name || p.email}
                          </div>
                          {p.user_metadata?.full_name && (
                            <div className="text-xs text-slate-500">{p.email}</div>
                          )}
                        </div>
                      )}
                    />
                  )}
                </div>
                <button
                  onClick={handleGrantAccess}
                  disabled={!selectedProfileId || granting}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  {granting ? 'Concedendo...' : 'Conceder Acesso'}
                </button>
              </div>
            </div>
          </div>

          {/* Card: Acessos atuais */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Users className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Usuarios com Acesso
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-medium text-slate-600">
                  {acessos.length}
                </span>
              </h2>
            </div>

            {acessos.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">
                  Esta carteira ainda nao foi compartilhada
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Conceda acesso acima para que um cliente possa visualiza-la.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Concedido por
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Data Concessao
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Acao
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {acessos.map((acesso) => (
                      <tr
                        key={acesso.profile_id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AvatarInitials
                              name={acesso.profiles?.full_name}
                              email={acesso.profiles?.email}
                            />
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                {acesso.profiles?.full_name || '-'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {acesso.profiles?.email || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {acesso.granted_by_profile?.full_name ||
                            acesso.granted_by_profile?.email ||
                            '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(acesso.granted_at || acesso.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setRevokeConfirm(acesso)}
                              title="Revogar acesso"
                              aria-label="Revogar acesso"
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <UserX className="h-[18px] w-[18px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!revokeConfirm}
        title="Revogar Acesso"
        message={`Deseja revogar o acesso de "${revokeConfirm?.profiles?.email || revokeConfirm?.profiles?.full_name || ''}" a esta carteira?`}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeConfirm(null)}
      />
    </div>
  );
}
