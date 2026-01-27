const sections = [
  {
    id: 'primeiros-passos',
    label: 'Primeiros Passos',
    subsections: [
      { id: 'visao-geral', label: 'Visao Geral' },
      { id: 'perfis-usuario', label: 'Perfis de Usuario' },
      { id: 'hierarquia-dados', label: 'Hierarquia de Dados' },
    ],
  },
  {
    id: 'autenticacao',
    label: 'Autenticacao',
    subsections: [
      { id: 'obter-token', label: 'Obter Token JWT' },
      { id: 'usar-token', label: 'Usar Token na API' },
      { id: 'renovar-token', label: 'Renovar Token' },
    ],
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    subsections: [
      { id: 'fluxo-cadastro', label: 'Fluxo de Cadastro' },
      { id: 'crud-clientes', label: 'Clientes' },
      { id: 'crud-carteiras', label: 'Carteiras' },
      { id: 'crud-casos', label: 'Casos' },
      { id: 'crud-processos', label: 'Processos' },
      { id: 'parametros-listagem', label: 'Parametros de Listagem' },
    ],
  },
  {
    id: 'conversao',
    label: 'Conversao de Documentos',
    subsections: [
      { id: 'converter-md-html', label: 'Markdown para HTML' },
      { id: 'converter-md-pdf', label: 'Markdown para PDF' },
      { id: 'upload-arquivo', label: 'Upload de Arquivo' },
      { id: 'temas-conversao', label: 'Temas' },
    ],
  },
  {
    id: 'compartilhamento',
    label: 'Compartilhamento',
    subsections: [
      { id: 'criar-conta-cliente', label: 'Criar Conta Cliente' },
      { id: 'conceder-acesso', label: 'Conceder Acesso' },
      { id: 'visao-cliente', label: 'Visao do Cliente' },
    ],
  },
  {
    id: 'referencia-api',
    label: 'Referencia da API',
    subsections: [
      { id: 'api-auth', label: 'Autenticacao' },
      { id: 'api-clientes', label: 'Clientes' },
      { id: 'api-carteiras', label: 'Carteiras' },
      { id: 'api-casos', label: 'Casos' },
      { id: 'api-processos', label: 'Processos' },
      { id: 'api-documentos', label: 'Documentos' },
      { id: 'api-conversao', label: 'Conversao' },
      { id: 'api-arquivos', label: 'Arquivos' },
      { id: 'api-temas', label: 'Temas' },
      { id: 'api-compartilhamento', label: 'Compartilhamento' },
      { id: 'api-dashboard', label: 'Dashboard' },
    ],
  },
];

export default sections;
