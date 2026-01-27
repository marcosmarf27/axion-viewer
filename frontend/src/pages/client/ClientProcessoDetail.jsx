import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';

const statusColors = {
  ativo: 'bg-green-100 text-green-700',
  suspenso: 'bg-yellow-100 text-yellow-700',
  arquivado: 'bg-gray-100 text-gray-700',
  encerrado: 'bg-red-100 text-red-700',
};

const recuperabilidadeColors = {
  Alta: 'bg-green-100 text-green-700',
  Potencial: 'bg-indigo-100 text-indigo-700',
  Critica: 'bg-red-100 text-red-700',
  Indefinida: 'bg-gray-100 text-gray-600',
  Nenhuma: 'bg-gray-200 text-gray-800',
};

function Badge({ children, colorClass }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', colorClass)}>
      {children}
    </span>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      {title && <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>}
      {children}
    </div>
  );
}

function FieldItem({ label, value }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  );
}

function formatCurrency(value) {
  if (value == null) return '-';
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function ClientProcessoDetail() {
  const { id } = useParams();
  const [processo, setProcesso] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProcesso();
    fetchDocumentos();
  }, [id]);

  const fetchProcesso = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/processos/${id}`);
      setProcesso(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentos = async () => {
    setDocsLoading(true);
    try {
      const { data } = await api.get('/documentos', {
        params: { processo_id: id },
      });
      setDocumentos(data.data || data || []);
    } catch {
      setDocumentos([]);
    } finally {
      setDocsLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="py-20" size="lg" />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/carteiras"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          &larr; Voltar
        </Link>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!processo) return null;

  const incidentais = processo.processos_incidentais || [];
  const casoId = processo.caso_id;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link to="/carteiras" className="font-medium text-indigo-600 hover:text-indigo-800">
          Carteiras
        </Link>
        <span>/</span>
        {casoId && (
          <>
            <Link
              to={`/casos/${casoId}/processos`}
              className="font-medium text-indigo-600 hover:text-indigo-800"
            >
              Processos
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900">{processo.numero_cnj}</span>
      </div>

      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{processo.numero_cnj}</h1>
          <Badge colorClass={statusColors[processo.status] || 'bg-gray-100 text-gray-700'}>
            {processo.status}
          </Badge>
          {processo.is_incidental && (
            <Badge colorClass="bg-purple-100 text-purple-700">Incidental</Badge>
          )}
        </div>
      </Card>

      {/* Dados gerais */}
      <Card title="Dados Gerais">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldItem label="Tipo de Tese" value={processo.tipo_tese} />
          <FieldItem label="Tipo de Acao" value={processo.tipo_acao} />
          <FieldItem
            label="Recuperabilidade"
            value={
              processo.recuperabilidade ? (
                <Badge
                  colorClass={
                    recuperabilidadeColors[processo.recuperabilidade] || 'bg-gray-100 text-gray-600'
                  }
                >
                  {processo.recuperabilidade}
                </Badge>
              ) : (
                '-'
              )
            }
          />
          <FieldItem label="Valor da Causa" value={formatCurrency(processo.valor_causa)} />
          <FieldItem label="Valor da Divida" value={formatCurrency(processo.valor_divida)} />
          <FieldItem label="Valor Atualizado" value={formatCurrency(processo.valor_atualizado)} />
          <FieldItem label="Polo Ativo" value={processo.polo_ativo} />
          <FieldItem label="Polo Passivo" value={processo.polo_passivo} />
          <FieldItem label="Comarca" value={processo.comarca} />
          <FieldItem label="Vara" value={processo.vara} />
          <FieldItem label="Tribunal" value={processo.tribunal} />
          <FieldItem label="UF" value={processo.uf} />
          <FieldItem label="Fase Processual" value={processo.fase_processual} />
          <FieldItem label="Data de Distribuicao" value={formatDate(processo.data_distribuicao)} />
          <FieldItem label="Ultima Movimentacao" value={processo.ultima_movimentacao} />
          <FieldItem
            label="Data Ultima Movimentacao"
            value={formatDate(processo.data_ultima_movimentacao)}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <FieldItem label="Observacoes" value={processo.observacoes} />
          </div>
        </dl>
      </Card>

      {/* Processo pai */}
      {processo.processo_pai && (
        <Card title="Processo Pai">
          <p className="text-sm text-gray-700">
            Este processo e incidental ao processo principal:{' '}
            <Link
              to={`/processos/${processo.processo_pai.id}`}
              className="font-medium text-indigo-600 hover:text-indigo-800"
            >
              {processo.processo_pai.numero_cnj || processo.processo_pai.id}
            </Link>
          </p>
        </Card>
      )}

      {/* Processos incidentais */}
      {incidentais.length > 0 && (
        <Card title="Processos Incidentais">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    CNJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Tipo de Acao
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {incidentais.map(child => (
                  <tr key={child.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={`/processos/${child.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {child.numero_cnj}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{child.tipo_acao || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge colorClass={statusColors[child.status] || 'bg-gray-100 text-gray-700'}>
                        {child.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Documentos */}
      <Card title="Documentos">
        {docsLoading ? (
          <LoadingSpinner className="py-8" />
        ) : documentos.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            Nenhum documento vinculado a este processo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Data
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documentos.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {doc.nome || doc.filename}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.tipo || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {doc.signed_url && (
                        <a
                          href={doc.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Preview
                        </a>
                      )}
                      <a
                        href={`/api/download/${doc.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
