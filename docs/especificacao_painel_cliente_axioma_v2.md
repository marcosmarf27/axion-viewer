# Especificação Técnica - Painel do Cliente

> **Projeto**: Axioma Intelligence - Portal de Relatórios  
> **Versão**: 2.0  
> **Data**: Janeiro/2026

---

## 1. Contexto

### 1.1 Visão Geral

A **Axioma Intelligence** é uma empresa de tecnologia jurídica especializada na análise automatizada de processos judiciais, com foco em carteiras de créditos **NPL (Non-Performing Loans)**.

O **Painel do Cliente** é uma interface web onde os clientes da Axioma podem:

- **Visualizar** os casos e processos já analisados
- **Fazer download** dos relatórios em múltiplos formatos (HTML, PDF, Markdown, JSON, TXT)
- **Organizar** casos por devedor, credor, valor e classificação de risco
- **Filtrar e buscar** processos específicos dentro de sua carteira

### 1.2 Público-Alvo

- Gestores de carteiras NPL (fundos, securitizadoras, bancos)
- Escritórios de advocacia especializados em recuperação de crédito
- Assessorias de cobrança

### 1.3 Fluxo de Uso

```
Cliente contrata análise → Axioma processa casos → Relatórios publicados no Painel → Cliente faz download
```

---

## 2. Estrutura de Dados

### 2.1 Hierarquia

```
CLIENTE (1) ────< (N) CARTEIRA (1) ────< (N) CASO (1) ────< (N) PROCESSO
                                                                  │
                                                                  │ (auto-referência)
                                                                  ▼
                                                             PROCESSO_PAI
                                                        (cnj_principal → cnj)
```

**Relações:**
- Um **Cliente** possui várias **Carteiras**
- Uma **Carteira** agrupa vários **Casos** (ex: "Sicood Credicitrus", "NPL Banco X Q4/2025")
- Um **Caso** agrupa vários **Processos** (todos relacionados ao mesmo devedor/crédito)
- Um **Processo** pode ser vinculado a outro processo como ação incidental (embargos, agravos, etc.)

---

## 3. Entidades e Campos

### 3.1 CLIENTE

Representa a empresa ou pessoa que contratou a Axioma para análise de sua carteira.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id_cliente` | UUID | ✅ | Identificador único interno |
| `nome_cliente` | String | ✅ | Nome da empresa/pessoa (ex: "BTG Pactual", "Enforce") |
| `cnpj` | String | ❌ | CNPJ para identificação formal |
| `contato_email` | String | ❌ | E-mail para notificações de relatórios prontos |
| `ativo` | Boolean | ✅ | Controle de acesso ao painel |

---

### 3.2 CARTEIRA

Agrupa casos relacionados a uma mesma operação, fundo ou lote de créditos. Representa o nível de organização comercial.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id_carteira` | UUID | ✅ | Identificador único interno |
| `id_cliente` | UUID | ✅ | FK → Cliente proprietário da carteira |
| `nome_carteira` | String | ✅ | Nome identificador (ex: "Sicood Credicitrus", "NPL Banco X Q4/2025") |
| `descricao` | Text | ❌ | Descrição ou contexto da carteira |
| `valor_total_carteira` | Decimal | ❌ | Valor consolidado de todos os casos |
| `qtd_casos` | Integer | ❌ | Quantidade de casos na carteira |
| `qtd_processos` | Integer | ❌ | Quantidade total de processos |
| `data_criacao` | DateTime | ✅ | Data de criação da carteira |
| `data_ultima_atualizacao` | DateTime | ✅ | Atualizado automaticamente |

**Observações:**
- A carteira é o agrupador comercial/operacional dos casos
- Permite organizar análises por operação, fundo ou cliente final

---

### 3.3 CASO

Agrupa processos relacionados a um mesmo crédito ou devedor. Representa a unidade de análise do ponto de vista do cliente.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id_caso` | UUID | ✅ | Identificador único interno |
| `id_carteira` | UUID | ✅ | FK → Carteira à qual pertence |
| `nome_caso` | String | ✅ | Nome identificador (editável pelo cliente) |
| `tese` | Enum | ✅ | Tipo de análise: `NPL`, `RJ`, `Dívida Ativa`, `Litigation` |
| `credor_principal` | String | ✅ | Exequente / parte que cobra o crédito |
| `devedor_principal` | String | ✅ | Executado / polo passivo da cobrança |
| `cnpj_cpf_devedor` | String | ❌ | Documento do devedor para identificação |
| `valor_total_caso` | Decimal | ❌ | Valor consolidado ou estimado do caso |
| `classificacao_recuperabilidade` | Enum | ❌ | `Alta`, `Potencial`, `Crítica`, `Indefinida`, `Nenhuma` |
| `uf_principal` | String | ❌ | UF da jurisdição predominante |
| `data_criacao` | DateTime | ✅ | Data de criação do caso no sistema |
| `data_ultima_atualizacao` | DateTime | ✅ | Atualizado automaticamente |
| `url_relatorio_caso` | String | ❌ | Link para download do relatório consolidado |
| `observacoes` | Text | ❌ | Notas internas ou do cliente |

**Observações:**
- O `nome_caso` pode ser definido pela Axioma e editado posteriormente pelo cliente
- O `credor_principal` geralmente é o polo ativo, exceto em ações incidentais onde o devedor figura como autor

---

### 3.4 PROCESSO

Cada processo judicial individual identificado por um número CNJ.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id_processo` | UUID | ✅ | Identificador único interno |
| `id_caso` | UUID | ✅ | FK → Caso ao qual pertence |
| `cnj` | String | ✅ | Número CNJ completo (formato `NNNNNNN-DD.AAAA.J.TR.OOOO`) |
| `cnj_principal` | String | ❌ | CNJ do processo pai (para ações incidentais) |
| `tipo_acao` | String | ✅ | Ex: `Execução de Título Extrajudicial`, `Embargos à Execução`, `Agravo de Instrumento`, `Ação Revisional` |
| `is_incidental` | Boolean | ✅ | `true` se for ação derivada de outro processo |
| `polo_ativo` | String | ✅ | Autor / Exequente / Embargante |
| `polo_passivo` | String | ✅ | Réu / Executado / Embargado |
| `valor_causa` | Decimal | ❌ | Valor original da ação |
| `valor_atualizado` | Decimal | ❌ | Valor corrigido monetariamente |
| `tribunal` | String | ❌ | Ex: `TJSP`, `TRF3`, `TJMG` |
| `comarca_vara` | String | ❌ | Ex: "2ª Vara Cível de Campinas" |
| `uf` | String | ✅ | Estado da jurisdição |
| `fase_processual` | String | ❌ | `Conhecimento`, `Execução`, `Recursal`, `Arquivado` |
| `ultima_movimentacao` | Text | ❌ | Descrição resumida do último andamento |
| `data_ultima_movimentacao` | Date | ❌ | Data do último andamento processual |
| `data_analise` | DateTime | ✅ | Data/hora em que o relatório foi gerado |
| `url_relatorio_html` | String | ❌ | Link para download em HTML |
| `url_relatorio_pdf` | String | ❌ | Link para download em PDF |
| `url_relatorio_md` | String | ❌ | Link para download em Markdown |
| `url_relatorio_json` | String | ❌ | Link para download em JSON |
| `url_relatorio_txt` | String | ❌ | Link para download em TXT |
| `paginas_analisadas` | Integer | ❌ | Quantidade de páginas processadas |
| `classificacao_recuperabilidade` | Enum | ❌ | `Alta`, `Potencial`, `Crítica`, `Indefinida`, `Nenhuma` |

**Observações:**
- `cnj_principal` estabelece vínculo hierárquico entre processos (ex: embargos → execução)
- `is_incidental` facilita filtros e agrupamentos na interface
- Os campos `polo_ativo` e `polo_passivo` são independentes do credor/devedor do caso, pois a posição processual varia conforme o tipo de ação

---

## 4. Enumerações

### 4.1 Tese
| Valor | Descrição |
|-------|-----------|
| `NPL` | Non-Performing Loans - Créditos inadimplentes |
| `RJ` | Recuperação Judicial e Falência |
| `Dívida Ativa` | Execução Fiscal |
| `Litigation` | Contencioso cível geral |

### 4.2 Classificação de Recuperabilidade
| Valor | Descrição |
|-------|-----------|
| `Alta` | Recuperação muito provável - priorizar |
| `Potencial` | Recuperação possível com gestão ativa |
| `Crítica` | Recuperação improvável - avaliar cessão/extinção |
| `Indefinida` | Caso misto - requer análise individual |
| `Nenhuma` | Sem perspectiva de recuperação |

---

## 5. Funcionalidades do Painel

### 5.1 Filtros Essenciais

| Filtro | Aplicável a | Descrição |
|--------|-------------|-----------|
| Recuperabilidade | Caso, Processo | Alta, Potencial, Crítica, Indefinida, Nenhuma |
| Tese | Caso | NPL, RJ, Dívida Ativa, Litigation |
| Data da análise | Caso, Processo | Range de datas |
| Valor | Caso, Processo | Range de valores |
| UF / Tribunal | Processo | Jurisdição |
| Tipo de ação | Processo | Execução, Embargos, Agravo, etc. |
| Ações incidentais | Processo | Mostrar/ocultar ações derivadas |

### 5.2 Busca

| Campo de busca | Descrição |
|----------------|-----------|
| CNJ | Busca exata ou parcial pelo número do processo |
| Devedor | Nome ou CNPJ/CPF do devedor |
| Credor | Nome do credor principal |
| Nome do caso | Identificador do caso |

### 5.3 Ordenação

| Campo | Ordem padrão |
|-------|--------------|
| Data da análise | Mais recente primeiro |
| Valor | Maior primeiro |
| Recuperabilidade | Nenhuma → Crítica → Indefinida → Potencial → Alta |

### 5.4 Downloads Disponíveis

| Formato | Extensão | Uso típico |
|---------|----------|------------|
| HTML | `.html` | Visualização formatada no navegador |
| PDF | `.pdf` | Impressão e arquivamento |
| Markdown | `.md` | Integração com sistemas e edição |
| JSON | `.json` | Integração via API e automações |
| TXT | `.txt` | Texto puro para processamento |

---

## 6. Permissões de Acesso

| Perfil | Permissões |
|--------|------------|
| **Cliente** | Visualiza apenas seus próprios casos e processos |
| **Usuário Axioma** | Visualiza todos os clientes, casos e processos |
| **Administrador** | Acesso total + gestão de usuários e clientes |

---

## 7. Diagrama de Relacionamentos

```
┌─────────────────┐
│     CLIENTE     │
├─────────────────┤
│ id_cliente (PK) │
│ nome_cliente    │
│ cnpj            │
│ contato_email   │
│ ativo           │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────────────┐
│        CARTEIRA         │
├─────────────────────────┤
│ id_carteira (PK)        │
│ id_cliente (FK)         │
│ nome_carteira           │
│ descricao               │
│ valor_total_carteira    │
│ qtd_casos               │
│ qtd_processos           │
│ data_criacao            │
│ data_ultima_atualizacao │
└────────┬────────────────┘
         │ 1:N
         ▼
┌─────────────────────────┐
│          CASO           │
├─────────────────────────┤
│ id_caso (PK)            │
│ id_carteira (FK)        │
│ nome_caso               │
│ tese                    │
│ credor_principal        │
│ devedor_principal       │
│ cnpj_cpf_devedor        │
│ valor_total_caso        │
│ classificacao_recuperab │
│ uf_principal            │
│ data_criacao            │
│ data_ultima_atualizacao │
│ url_relatorio_caso      │
│ observacoes             │
└────────┬────────────────┘
         │ 1:N
         ▼
┌─────────────────────────────┐
│          PROCESSO           │
├─────────────────────────────┤
│ id_processo (PK)            │
│ id_caso (FK)                │
│ cnj                         │
│ cnj_principal (FK self)─────┼──┐
│ tipo_acao                   │  │
│ is_incidental               │  │
│ polo_ativo                  │  │
│ polo_passivo                │  │
│ valor_causa                 │  │
│ valor_atualizado            │  │
│ tribunal                    │  │
│ comarca_vara                │  │
│ uf                          │  │
│ fase_processual             │  │
│ ultima_movimentacao         │  │
│ data_ultima_movimentacao    │  │
│ data_analise                │  │
│ url_relatorio_*             │  │
│ paginas_analisadas          │  │
│ classificacao_recuperab     │  │
└─────────────────────────────┘  │
         ▲                       │
         └───────────────────────┘
         (auto-referência para ações incidentais)
```

---

**Fim do Documento**
