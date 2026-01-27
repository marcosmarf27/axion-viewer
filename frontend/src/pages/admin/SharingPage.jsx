import { useState, useEffect } from 'react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';

function FeedbackMessage({ message, type, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`rounded-md p-3 text-sm ${
        type === 'success'
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      {message}
    </div>
  );
}

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
      .then(res => setCarteiras(res.data.data || []))
      .catch(() => setCarteiras([]))
      .finally(() => setLoadingCarteiras(false));
  }, []);

  // Carregar profiles (role=client)
  useEffect(() => {
    setLoadingProfiles(true);
    api
      .get('/accounts')
      .then(res => {
        const allProfiles = res.data.data || res.data || [];
        setProfiles(allProfiles.filter(p => p.user_metadata?.role === 'client'));
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
      .then(res => setAcessos(res.data.data || res.data || []))
      .catch(() => {
        setAcessos([]);
        setFeedback({ message: 'Erro ao carregar acessos da carteira', type: 'error' });
      })
      .finally(() => setLoadingAcessos(false));
  }, [selectedCarteiraId]);

  const handleGrantAccess = async () => {
    if (!selectedCarteiraId || !selectedProfileId) return;
    setGranting(true);
    try {
      await api.post(`/sharing/carteira/${selectedCarteiraId}`, {
        profile_id: selectedProfileId,
      });
      setFeedback({ message: 'Acesso concedido com sucesso', type: 'success' });
      setSelectedProfileId('');
      // Recarregar acessos
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
      await api.delete(
        `/sharing/carteira/${selectedCarteiraId}/${revokeConfirm.profile_id}`
      );
      setFeedback({ message: 'Acesso revogado com sucesso', type: 'success' });
      setRevokeConfirm(null);
      // Recarregar acessos
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

  const formatDate = dateStr => {
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

  const selectedCarteira = carteiras.find(c => c.id === selectedCarteiraId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Compartilhamento de Carteiras
      </h1>

      <FeedbackMessage
        message={feedback.message}
        type={feedback.type}
        onDismiss={() => setFeedback({ message: '', type: '' })}
      />

      {/* Select de carteira */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Selecione uma carteira
        </label>
        {loadingCarteiras ? (
          <LoadingSpinner className="py-4" size="sm" />
        ) : (
          <select
            value={selectedCarteiraId}
            onChange={e => setSelectedCarteiraId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Selecione uma carteira</option>
            {carteiras.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.cliente?.nome ? ` - ${c.cliente.nome}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Conteudo principal */}
      {!selectedCarteiraId ? (
        <EmptyState
          title="Nenhuma carteira selecionada"
          description="Selecione uma carteira acima para gerenciar os acessos de compartilhamento"
        />
      ) : loadingAcessos ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="space-y-6">
          {/* Card: Acessos atuais */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Acessos da Carteira: {selectedCarteira?.nome || ''}
              </h2>
            </div>

            {acessos.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Nenhum acesso concedido"
                  description="Esta carteira ainda nao foi compartilhada com nenhum usuario"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Concedido por
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Data Concessao
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                        Acao
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {acessos.map(acesso => (
                      <tr key={acesso.profile_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {acesso.profiles?.email || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {acesso.profiles?.full_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {acesso.granted_by_nome || acesso.granted_by_email || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(acesso.granted_at || acesso.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setRevokeConfirm(acesso)}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Revogar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card: Conceder acesso */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Conceder Acesso
              </h2>
            </div>
            <div className="p-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Selecione um usuario
                  </label>
                  {loadingProfiles ? (
                    <LoadingSpinner className="py-2" size="sm" />
                  ) : (
                    <select
                      value={selectedProfileId}
                      onChange={e => setSelectedProfileId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Selecione um usuario</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.email}
                          {p.user_metadata?.full_name ? ` - ${p.user_metadata.full_name}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <button
                  onClick={handleGrantAccess}
                  disabled={!selectedProfileId || granting}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {granting ? 'Concedendo...' : 'Conceder Acesso'}
                </button>
              </div>
            </div>
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
