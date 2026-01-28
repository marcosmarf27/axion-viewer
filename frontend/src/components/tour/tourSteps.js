export const TOUR_STEPS = [
  {
    id: 'criar-cliente',
    targetSelector: '[data-tour="nav-clientes"]',
    title: '1. Criar Cliente',
    description:
      'Comece cadastrando um cliente (empresa ou pessoa fisica). O cliente e a base de toda a estrutura do sistema.',
    position: 'right',
    path: '/admin/clientes',
    statKey: 'total_clientes',
  },
  {
    id: 'criar-carteira',
    targetSelector: '[data-tour="nav-carteiras"]',
    title: '2. Criar Carteira',
    description:
      'Crie uma carteira vinculada ao cliente. A carteira agrupa os casos e processos relacionados.',
    position: 'right',
    path: '/admin/carteiras',
    statKey: 'total_carteiras',
  },
  {
    id: 'criar-caso',
    targetSelector: '[data-tour="nav-casos"]',
    title: '3. Criar Caso',
    description:
      'Cadastre um caso dentro da carteira. Cada caso pode conter multiplos processos judiciais.',
    position: 'right',
    path: '/admin/casos',
    statKey: 'total_casos',
  },
  {
    id: 'criar-processo',
    targetSelector: '[data-tour="nav-processos"]',
    title: '4. Criar Processo',
    description:
      'Adicione processos ao caso. Informe numero do processo, vara, partes e demais dados judiciais.',
    position: 'right',
    path: '/admin/processos',
    statKey: 'total_processos',
  },
  {
    id: 'converter-documento',
    targetSelector: '[data-tour="nav-converter"]',
    title: '5. Converter Documento',
    description:
      'Use o conversor para transformar documentos Markdown em HTML ou PDF com temas profissionais.',
    position: 'right',
    path: '/admin/convert',
    statKey: 'total_documentos',
  },
  {
    id: 'vincular-documento',
    targetSelector: '[data-tour="nav-documentos"]',
    title: '6. Vincular Documento',
    description:
      'Na pagina de documentos, vincule o documento convertido a um processo especifico.',
    position: 'right',
    path: '/admin/documentos',
    statKey: null,
  },
  {
    id: 'criar-conta-cliente',
    targetSelector: '[data-tour="nav-contas"]',
    title: '7. Criar Conta de Cliente',
    description:
      'Crie uma conta de acesso para o cliente no sistema. Ele podera visualizar seus processos e documentos.',
    position: 'right',
    path: '/admin/accounts',
    statKey: null,
  },
  {
    id: 'compartilhar-carteira',
    targetSelector: '[data-tour="nav-compartilhamento"]',
    title: '8. Compartilhar Carteira',
    description:
      'Por fim, compartilhe a carteira com a conta do cliente para que ele tenha acesso aos dados.',
    position: 'right',
    path: '/admin/sharing',
    statKey: null,
  },
];

export const TOUR_VERSION = 1;
export const TOUR_STORAGE_KEY = 'axion_tour_state';
