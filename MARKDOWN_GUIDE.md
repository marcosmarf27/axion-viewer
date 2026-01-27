# Guia de Boas Práticas de Markdown para Relatórios

Este guia apresenta a sintaxe de Markdown otimizada para gerar relatórios profissionais usando nossa API de conversão HTML/PDF.

---

## Índice

- [Formatação de Texto](#formatação-de-texto)
- [Títulos e Seções](#títulos-e-seções)
- [Listas](#listas)
- [Tabelas](#tabelas)
- [Menus Collapse (Expansíveis)](#menus-collapse-expansíveis)
- [Formatação Manual e Destaques](#formatação-manual-e-destaques)
- [Metadados do Relatório](#metadados-do-relatório)
- [Referências Documentais](#referências-documentais)
- [Limpeza Automática de Dados](#limpeza-automática-de-dados)
- [Exemplos Completos](#exemplos-completos)
- [Problemas Comuns e Soluções](#problemas-comuns-e-soluções)
- [Temas e Personalização](#temas-e-personalização)
- [Recursos Adicionais](#recursos-adicionais)
- [Exemplo de Relatório Completo](#exemplo-de-relatório-completo)
- [Otimização e Limites Técnicos](#otimização-e-limites-técnicos)

---

## Formatação de Texto

### Negrito
Use `**texto**` para criar texto em **negrito** (forte, com destaque).

```markdown
**Importante:** Este texto aparecerá em negrito forte.
```

**Resultado:** **Importante:** Este texto aparecerá em negrito forte.

### Itálico
Use `*texto*` ou `_texto_` para criar texto em *itálico*.

```markdown
*Observação:* Este texto aparecerá em itálico.
```

**Resultado:** *Observação:* Este texto aparecerá em itálico.

### Negrito + Itálico
Use `***texto***` para combinar negrito e itálico.

```markdown
***Atenção crítica:*** Texto com ambos os estilos.
```

**Resultado:** ***Atenção crítica:*** Texto com ambos os estilos.

---

## Títulos e Seções

Use `#` para criar títulos hierárquicos. Quanto mais `#`, menor o nível do título.

```markdown
# Título Principal (H1)
## Seção Principal (H2)
### Subseção (H3)
#### Subseção Menor (H4)
```

**Dica:** Em relatórios jurídicos, use:
- `#` para o título do relatório
- `##` para seções principais (ex: "INFORMAÇÕES DO TÍTULO EXECUTIVO")
- `###` para subsseções (ex: "a) Tabela de Referência")

---

## Listas

### Lista não ordenada (bullets)

```markdown
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
- Item 3
```

**Resultado:**
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
- Item 3

### Lista ordenada (numerada)

```markdown
1. Primeiro item
2. Segundo item
3. Terceiro item
   1. Subitem 3.1
   2. Subitem 3.2
```

**Resultado:**
1. Primeiro item
2. Segundo item
3. Terceiro item
   1. Subitem 3.1
   2. Subitem 3.2

---

## Tabelas

Tabelas são fundamentais para relatórios. Use `|` para separar colunas e `-` para criar o cabeçalho.

### Estrutura Básica

```markdown
| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Valor 1  | Valor 2  | Valor 3  |
| Valor 4  | Valor 5  | Valor 6  |
```

**Resultado:**

| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Valor 1  | Valor 2  | Valor 3  |
| Valor 4  | Valor 5  | Valor 6  |

### Tabela com Formatação

```markdown
| Parâmetro | Informação | Fonte Documental |
|-----------|------------|------------------|
| **Exequente** | UNIÃO - FAZENDA NACIONAL (CNPJ: 00.394.460/0216-53) | (Seq.: 254, 341) |
| **Executado(s)** | APARECIDO LUIZ TOMÉ (CPF: 211.107.359-87) | (Seq.: 2, 3, 254) |
| **Valor da Causa** | R$ 151.414,46 | (Seq.: 3, 255, 341) |
```

**Resultado:**

| Parâmetro | Informação | Fonte Documental |
|-----------|------------|------------------|
| **Exequente** | UNIÃO - FAZENDA NACIONAL (CNPJ: 00.394.460/0216-53) | (Seq.: 254, 341) |
| **Executado(s)** | APARECIDO LUIZ TOMÉ (CPF: 211.107.359-87) | (Seq.: 2, 3, 254) |
| **Valor da Causa** | R$ 151.414,46 | (Seq.: 3, 255, 341) |

### Múltiplas Linhas em Células

Para incluir múltiplas linhas dentro de uma célula de tabela, use `<br>` (quebra de linha HTML):

```markdown
| Parâmetro | Informação |
|-----------|------------|
| **Executado(s)** | APARECIDO LUIZ TOMÉ (CPF: 211.107.359-87) (Espólio)<br>WANDERLEIA TOMÉ (CPF: 595.879-389-68)<br>ROSEMEIRE TOMÉ (CPF: 070.662.149-27) |
| **Valor** | R$ 151.414,46 |
```

**Resultado:** Os nomes dos executados aparecerão em linhas separadas dentro da mesma célula.

**Dica:** Use `<br>` quando precisar listar múltiplos itens relacionados na mesma célula (exemplo: vários executados, múltiplos endereços, etc.)

### Boas Práticas para Tabelas

1. **Sempre deixe uma linha em branco antes da tabela**
2. **Use negritos nos cabeçalhos das colunas da esquerda** para destacar parâmetros
3. **Mantenha alinhamento consistente** (opcional, mas facilita leitura)
4. **Use `<br>` para múltiplas linhas** dentro de uma célula
5. **Evite células muito longas** - quebre textos extensos em parágrafos separados

### Evite

```markdown
Texto colado na tabela sem espaço
| Coluna 1 | Coluna 2 |
|----------|----------|
| Valor    | Valor    |
```

### Faça

```markdown
Texto antes da tabela

| Coluna 1 | Coluna 2 |
|----------|----------|
| Valor    | Valor    |
```

---

## Menus Collapse (Expansíveis)

Use HTML com tags `<details>` e `<summary>` para criar seções que podem ser expandidas/recolhidas. **Ideal para relatórios longos!**

**IMPORTANTE:** Não use CPF/CNPJ no cabeçalho do relatório. Essas informações devem estar APENAS nas tabelas internas das seções.

### Sintaxe Básica

```html
<details>
<summary>Clique para expandir</summary>

Conteúdo que aparece ao expandir.

Você pode usar **Markdown** normalmente aqui:
- Listas
- **Negritos**
- Tabelas
- Etc.

</details>
```

### Exemplo com Seção de Processo

```html
<details>
<summary><i class="fas fa-balance-scale"></i> DETALHAMENTO DAS TESES DE DEFESA DOS EXECUTADOS</summary>

**Status:** Encerrado - Provido (anulou a execução)

**Questão Jurídica Central:** Oposição de embargos de execução nº 243/98, alegando a iliquidez do título.

| Data ajuizamento | Nº CNJ | Tipo de Ação | Tribunal |
|------------------|--------|--------------|----------|
| 15/03/1998 | 298/98 | Embargos à Execução | TJPR |

**Resultado/Impacto:** O acórdão do Tribunal anulou a execução, confirmando a tese de iliquidez do título.

</details>
```

**Resultado:** Isso criará uma seção recolhida com um botão de expandir/recolher.

### Dicas para Menus Collapse

1. **Sempre deixe linhas em branco** entre `<summary>` e o conteúdo
2. **Deixe linha em branco** antes de `</details>`
3. **Use ícones Font Awesome no summary** para tornar mais profissional:
   - `<i class="fas fa-info-circle"></i>`, `<i class="fas fa-chart-bar"></i>`, `<i class="fas fa-balance-scale"></i>`
   - **Evite emojis em relatórios profissionais**
4. **Aninhe vários collapse** para organizar informações complexas

### Exemplo com Font Awesome Icons

```html
<details>
<summary><i class="fas fa-info-circle"></i> 1. INFORMAÇÕES DO TÍTULO EXECUTIVO</summary>

| Parâmetro | Informação |
|-----------|------------|
| **Exequente** | UNIÃO - FAZENDA NACIONAL |
| **Executado(s)** | APARECIDO LUIZ TOMÉ |
| **Valor da Causa** | R$ 151.414,46 |

</details>

<details>
<summary><i class="fas fa-chart-bar"></i> 2. DIAGNÓSTICO E CLASSIFICAÇÃO DO ATIVO</summary>

**Classificação:** IRRECUPERÁVEL

**Status Geral:** Execução com débito principal quitado.

</details>

<details>
<summary><i class="fas fa-balance-scale"></i> 3. DETALHAMENTO DAS TESES DE DEFESA DOS EXECUTADOS</summary>

**Status:** Encerrado - Provido (anulou a execução)

**Questão Jurídica Central:** Oposição de embargos de execução.

</details>
```

**Ícones Font Awesome recomendados para relatórios jurídicos profissionais:**
- `<i class="fas fa-info-circle"></i>` - Informações gerais e dados do processo
- `<i class="fas fa-chart-bar"></i>` - Análises, diagnósticos e gráficos
- `<i class="fas fa-balance-scale"></i>` - Teses jurídicas e questões legais
- `<i class="fas fa-gavel"></i>` - Decisões judiciais e sentenças
- `<i class="fas fa-exclamation-triangle"></i>` - Alertas, riscos e advertências
- `<i class="fas fa-check-circle"></i>` - Conclusões e recomendações
- `<i class="fas fa-calendar-alt"></i>` - Cronologia e linha do tempo
- `<i class="fas fa-file-alt"></i>` - Documentos e anexos
- `<i class="fas fa-file-invoice-dollar"></i>` - Análise financeira e valores
- `<i class="fas fa-search"></i>` - Investigação e due diligence
- `<i class="fas fa-users"></i>` - Partes do processo

**Importante:** Para relatórios profissionais, **evite usar emojis** (❤️, 🔷, 🔸, etc.). Prefira sempre ícones Font Awesome que transmitem seriedade e profissionalismo.

### Exemplo Aninhado

Você pode aninhar menus collapse para criar estruturas hierárquicas complexas:

```html
<details>
<summary><i class="fas fa-folder"></i> SEÇÃO PRINCIPAL</summary>

Informações gerais da seção.

<details>
<summary><i class="fas fa-file-alt"></i> Subseção 1</summary>

Conteúdo da subseção 1 com **markdown** e tabelas:

| Coluna 1 | Coluna 2 |
|----------|----------|
| Valor A  | Valor B  |

</details>

<details>
<summary><i class="fas fa-file-alt"></i> Subseção 2</summary>

### Título dentro do collapse

Conteúdo da subseção 2 com listas:
- Item 1
- Item 2

</details>

</details>
```

### Processamento Avançado de Details Aninhados

**IMPORTANTE:** A API usa um processamento inteligente "leaf-first" (de dentro para fora) para garantir que todo o Markdown dentro de `<details>` seja convertido corretamente, mesmo em estruturas profundamente aninhadas.

**Como funciona:**

1. A API identifica todos os `<details>` no documento
2. Processa primeiro os `<details>` mais internos (sem outros `<details>` dentro)
3. Converte o Markdown interno para HTML
4. Move para o próximo nível externo e repete
5. Continua até processar todos os níveis

**Isso significa que você pode usar:**
- ✅ Tabelas dentro de `<details>`
- ✅ Títulos (`###`) dentro de `<details>`
- ✅ Negritos, itálicos e formatação complexa
- ✅ `<details>` aninhados com múltiplos níveis
- ✅ Listas ordenadas e não ordenadas

**Exemplo complexo que funciona perfeitamente:**

```html
<details>
<summary><i class="fas fa-info-circle"></i> Nível 1 - Informações Gerais</summary>

### Título no Nível 1

<details>
<summary><i class="fas fa-chart-bar"></i> Nível 2 - Análise Detalhada</summary>

| Coluna | Valor |
|--------|-------|
| **Param** | Dado importante |

<details>
<summary><i class="fas fa-file-alt"></i> Nível 3 - Documentação</summary>

**Conteúdo** no nível mais interno com *itálico* e tabelas.

</details>

</details>

</details>
```

Todos os níveis serão processados corretamente, garantindo que tabelas, títulos e formatação apareçam como esperado no HTML/PDF final.

---

## Formatação Manual e Destaques

### Controle Total da Formatação

**IMPORTANTE:** A API **NÃO** aplica formatação automática de cores ou estilos. Você tem controle total sobre como seu conteúdo aparece no relatório final.

### Como Destacar Informações Importantes

Use **negritos** e estruturação adequada para destacar informações críticas:

```markdown
**Risco ALTO:** Este é um risco crítico que requer atenção imediata.

**Risco MÉDIO:** Este é um risco moderado que deve ser monitorado.

**Risco BAIXO:** Este é um risco menor, apenas para registro.
```

### Formatação de Ações Jurídicas

Para destacar ações jurídicas em tabelas, use **negritos** manualmente:

```markdown
| Data ajuizamento | Tipo de Ação | Status |
|------------------|--------------|--------|
| 15/03/1998 | **Embargos à Execução** | Encerrado |
| 20/06/2003 | **Anulatória** | Em andamento |
```

**Dica:** Você pode combinar negritos com cores personalizadas através de configurações de tema customizadas na API.

---

## Metadados do Relatório

### Extração Automática de Metadados

A API extrai automaticamente informações do cabeçalho do seu relatório e as exibe de forma destacada no topo do documento HTML/PDF final.

### Formato do Cabeçalho (NOVO)

Use o seguinte formato logo após o título principal (`#`) do relatório:

```markdown
# TÍTULO DO RELATÓRIO

**Processo Principal nº:** 5001410-19.2016.4.04.7010
**Tipo de Ação:** Execução Fiscal
**Autor(es):** UNIÃO - FAZENDA NACIONAL
**Réu(s):** APARECIDO LUIZ TOMÉ, WANDERLEIA TOMÉ
**Vara:** Tribunal Regional Federal da 4ª Região
**Data desta Análise:** 03/11/2025
```

### Campos do Cabeçalho

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Processo Principal nº** | Número CNJ do processo | `5001410-19.2016.4.04.7010` |
| **Tipo de Ação** | Descrição completa do tipo de ação | `Execução Fiscal`, `Ação Anulatória` |
| **Autor(es)** | Nome limpo, sem CNPJ | `UNIÃO - FAZENDA NACIONAL` |
| **Réu(s)** | Nome limpo, sem CNPJ | `EMPRESA TESTE LTDA` |
| **Vara** | Tribunal/Vara | `1ª Vara Federal de Curitiba` |
| **Data desta Análise** | Data do dia da análise | `05/12/2025` |

### Como Funciona

1. **Formato:** Use `**Campo:** Valor` com dois espaços no final da linha (quebra de linha no Markdown)
2. **Posição:** Logo após o título H1 (`#`) e antes do primeiro `##`
3. **Campos Reconhecidos (Novos):**
   - Processo Principal nº
   - Tipo de Ação (NOVO)
   - Autor(es) (substitui Exequente)
   - Réu(s) (substitui Executado)
   - Vara
   - Data desta Análise

### Compatibilidade com Formato Antigo

A API mantém compatibilidade com o formato antigo. Os campos antigos são automaticamente convertidos:

| Formato Antigo | Formato Novo | Renderiza como |
|----------------|--------------|----------------|
| `**Exequente(s):**` | `**Autor(es):**` | **Autor(es):** |
| `**Executado(s):**` | `**Réu(s):**` | **Réu(s):** |
| `**Data da Análise:**` | `**Data desta Análise:**` | **Data desta Análise:** |

### Deduplicação Automática

**IMPORTANTE:** A API remove automaticamente esses parágrafos de metadados do corpo do documento após extraí-los, evitando duplicação de informações.

Isso significa que você pode escrever essas informações uma única vez no início do documento, e a API:
- Extrai e exibe no cabeçalho visual do relatório
- Remove do corpo para evitar repetição
- Mantém o documento limpo e organizado

### Metadados em Tabelas

Você também pode incluir metadados dentro de tabelas, e a API os extrairá automaticamente:

```markdown
| Parâmetro | Informação |
|-----------|------------|
| **Exequente** | UNIÃO - FAZENDA NACIONAL (CNPJ: 00.394.460/0216-53) |
| **Valor da Causa** | R$ 151.414,46 |
```

**Dica:** CPF e CNPJ devem aparecer **apenas** dentro das tabelas, não no cabeçalho do relatório.

---

## Referências Documentais

A API processa automaticamente referências de documentos:

```markdown
Informação importante (Sequência: 254, 341, 2)
```

**Resultado:** `(Seq.: 2, 254, 341)` - Os números são automaticamente ordenados e formatados.

### Formatos Aceitos

Todos estes formatos são reconhecidos e convertidos:

- `(Sequência: 611, 2, 625)` → `(Seq.: 2, 611, 625)`
- `(Seq. 254, 341)` → `(Seq.: 254, 341)`
- `(Ref.: Doc. Seq. 100, 200)` → `(Seq.: 100, 200)`
- `(Autos Seq. 50)` → `(Seq.: 50)`
- `(Fonte: Doc. Seq. 10, 20)` → `(Seq.: 10, 20)`

---

## 🧹 Limpeza Automática de Dados

A API possui um sistema inteligente de limpeza de dados que remove automaticamente informações irrelevantes ou vazias das suas tabelas e documentos.

### O que é Removido Automaticamente

#### 1. Células Vazias e Valores Nulos

A API detecta e limpa:
- `N/A` ou `n/a`
- `Não informado`
- `Não encontrado`
- `Não aplicável`
- `nenhum`
- Células com apenas `-` ou espaços em branco

**Exemplo:**

```markdown
| Parâmetro | Valor |
|-----------|-------|
| **Nome** | João Silva |
| **CPF** | N/A |
| **Endereço** | - |
```

**Após processamento:**
- A linha com CPF `N/A` pode ser removida ou mantida dependendo do contexto
- Células vazias são formatadas adequadamente

#### 2. Referências Geradas por IA

A API remove automaticamente referências no formato `[Source: ...]`, `[Citation: ...]` ou `[Gemini: ...]` que possam ter sido geradas por ferramentas de IA.

**Exemplo:**

```markdown
O processo foi arquivado em 2024 [Gemini Source 1].
```

**Após processamento:**
```markdown
O processo foi arquivado em 2024.
```

#### 3. Linhas de Tabela Completamente Vazias

Se uma linha inteira de uma tabela contém apenas valores vazios (N/A, -, espaços), ela é automaticamente removida.

#### 4. Datas de Geração Antigas

A API remove automaticamente linhas antigas como `Data de Geração: XX/XX/XXXX` que podem estar duplicadas ou desatualizadas no documento.

### Benefícios da Limpeza Automática

- Relatórios mais limpos e profissionais
- Redução de ruído visual
- Foco nas informações relevantes
- Menor necessidade de edição manual

### Dica

Você não precisa se preocupar em limpar manualmente células vazias ou referências de IA. A API faz isso automaticamente, permitindo que você foque no conteúdo importante.

---

## Exemplos Completos

### Exemplo 1: Seção de Informações do Título Executivo

```markdown
## 1. INFORMAÇÕES DO TÍTULO EXECUTIVO

| Parâmetro | Informação | Fonte Documental |
|-----------|------------|------------------|
| **Exequente** | UNIÃO - FAZENDA NACIONAL (CNPJ: 00.394.460/0216-53) | (Seq.: 254, 341) |
| **Executado(s)** | APARECIDO LUIZ TOMÉ (CPF: 211.107.359-87) (Espólio)<br>WANDERLEIA TOMÉ (CPF: 595.879-389-68) | (Seq.: 2, 3, 254, 341, 350) |
| **Valor da Causa** | R$ 151.414,46 | (Seq.: 3, 255, 341) |
| **Certidão de Dívida Ativa (CDA) nº** | 90 6 06 000103-44 | (Seq.: 3, 255, 327) |
```

### Exemplo 2: Diagnóstico com Collapse

```markdown
## 2. DIAGNÓSTICO E CLASSIFICAÇÃO DO ATIVO

**Classificação:** IRRECUPERÁVEL

<details>
<summary><i class="fas fa-file-alt"></i> RAIO-X DO PROCESSO (Resumo dos Fatos)</summary>

**Status Geral do Processo:** Execução com débito principal quitado, mas suspensa devido a parcelamento administrativo.

**Status do Crédito (Valor):** CDA nº 90 6 06 000103-44, com valor original de R$ 151.414,46. O débito principal foi quitado em 05/11/2024.

**Status da Garantia:** Execução garantida por imóvel (Mat. 1.913) arrematado por R$ 420.000,00.

**Principais Riscos Factuais:**

- **Risco de Nulidade de Citação:** Para Maria Aparecida de Melo, pela ausência de assinatura na certidão de citação.
- **Risco de Suspensão por Ação Conexa:** A imissão na posse do imóvel arrematado está suspensa.
- **Risco de Concurso de Credores:** Múltiplos credores disputam o saldo remanescente.

</details>
```

### Exemplo 3: Tabela de Ações Judiciais

```markdown
## 3. DETALHAMENTO DAS TESES DE DEFESA

### a) Tabela de Referência

| Data ajuizamento | Nº CNJ | Tipo de Ação | Tribunal | Instância | Última Movimentação |
|------------------|--------|--------------|----------|-----------|---------------------|
| 15/03/1998 | 298/98 | **Embargos à Execução** | TJPR | 1º grau | 10/05/2000 |
| 20/06/2003 | 2003.70.10.001460-7 | **Anulatória** | Justiça Federal | 1º Grau | 15/08/2008 |
```

---

## Problemas Comuns e Soluções

### Problema 1: Tabela não aparece

**Errado:**
```markdown
Texto sem espaço
| Coluna 1 | Coluna 2 |
|----------|----------|
```

**Correto:**
```markdown
Texto antes da tabela

| Coluna 1 | Coluna 2 |
|----------|----------|
```

**Solução:** Sempre deixe uma linha em branco antes da tabela.

---

### Problema 2: Negritos não aparecem

**Errado:**
```markdown
* *Texto* *  (asterisco com espaços)
**Texto **  (espaço antes do asterisco final)
```

**Correto:**
```markdown
**Texto**
*Texto*
```

**Solução:** Cole os asteriscos diretamente ao texto, sem espaços.

---

### Problema 3: Collapse não funciona

**Errado:**
```html
<details>
<summary>Título</summary>
Conteúdo colado sem espaço
</details>
```

**Correto:**
```html
<details>
<summary>Título</summary>

Conteúdo com linha em branco antes.

</details>
```

**Solução:** Deixe linhas em branco após `<summary>` e antes de `</details>`.

---

### Problema 4: Lista não quebra corretamente

**Errado:**
```markdown
- Item 1
- Item 2
  - Subitem sem espaços suficientes
```

**Correto:**
```markdown
- Item 1
- Item 2
  - Subitem com 2 espaços de indentação
```

**Solução:** Use exatamente 2 ou 4 espaços para indentar subitens.

---

## Resumo das Melhores Práticas

### SEMPRE FAÇA

1. **Deixe linhas em branco** antes de tabelas e blocos HTML
2. **Use `**texto**`** para negritos (dois asteriscos)
3. **Use `*texto*`** para itálicos (um asterisco)
4. **Formate parâmetros** em tabelas com negrito na primeira coluna
5. **Organize seções longas** com menus collapse
6. **Use títulos hierárquicos** (`#`, `##`, `###`) corretamente

### NUNCA FAÇA

1. **Não misture** asteriscos com espaços (`* * texto * *`)
2. **Não cole** tabelas diretamente após texto sem linha em branco
3. **Não use** células de tabela muito longas (quebre em parágrafos)
4. **Não esqueça** as linhas em branco em blocos HTML
5. **Não use** caracteres especiais sem testar (pode quebrar a conversão)

---

## 🎨 Temas e Personalização

A API suporta temas personalizáveis que controlam a aparência visual dos seus relatórios HTML e PDF.

### Tema Padrão: Jurídico

O tema **jurídico** é o tema padrão, otimizado para relatórios legais e judiciais, com:

- **Cores principais:** Gradiente vermelho e marrom (#8B0000 → #5D4037)
- **Tipografia:** Arial, sans-serif
- **Fonte base:** 10pt (PDF), 16px (HTML)
- **Tabelas:** Fonte 9pt, bordas cinza (#dee2e6)
- **Títulos:** Fonte 18pt, gradiente de cores
- **Logo:** Suporte para logo personalizado no cabeçalho

### Como Usar Temas via API

Ao fazer requisições para a API, você pode especificar o tema:

```json
{
  "markdown": "# Seu relatório...",
  "theme": "juridico"
}
```

### Personalização Avançada

Você pode customizar cores e fontes específicas através do parâmetro `custom_config`:

```json
{
  "markdown": "# Seu relatório...",
  "theme": "juridico",
  "custom_config": {
    "colors": {
      "primary": "#1a237e",
      "secondary": "#0d47a1",
      "accent": "#ff6f00"
    },
    "fonts": {
      "main": "Georgia, serif",
      "headings": "Helvetica, sans-serif"
    }
  }
}
```

### Elementos Estilizados Automaticamente

O tema jurídico aplica automaticamente estilos especiais para:

- **Cabeçalho do relatório:** Com gradiente de cores e logo
- **Tabelas:** Bordas limpas, headers com fundo cinza
- **Menus collapse (`<details>`):** Fundo temático, bordas arredondadas, efeitos hover
- **Referências documentais:** Estilo especial com cor de destaque
- **Negritos (`<strong>`):** Peso 700 para garantir visibilidade
- **Quebras de página:** Otimizadas para impressão PDF

### Configuração de PDF

As configurações de PDF incluem:

- **Orientação:** `portrait` (padrão) ou `landscape`
- **Margens:** 1.5cm vertical, 1cm horizontal
- **Tamanho:** A4
- **Fontes:** Ajustadas automaticamente (10pt corpo, 9pt tabelas, 18pt títulos)

**Exemplo de requisição com orientação:**

```json
{
  "markdown": "# Relatório amplo...",
  "theme": "juridico",
  "orientation": "landscape"
}
```

### Dica para Desenvolvedores

Você pode criar temas personalizados adicionando novos arquivos de configuração em `templates/themes/[nome-tema]/config.json`. Consulte o tema jurídico como referência.

---

## Recursos Adicionais

### Escolha Entre Emojis e Ícones Font Awesome

**Para Relatórios Profissionais (Recomendado):**

Use **ícones Font Awesome** para transmitir seriedade e profissionalismo:
- `<i class="fas fa-info-circle"></i>` ao invés de 📋
- `<i class="fas fa-chart-bar"></i>` ao invés de 📊
- `<i class="fas fa-exclamation-triangle"></i>` ao invés de ⚠️
- `<i class="fas fa-check-circle"></i>` ao invés de ✅
- `<i class="fas fa-balance-scale"></i>` ao invés de ⚖️

**Para Documentos Informais (Opcional):**

Emojis podem ser usados em relatórios menos formais:
- 📋 Documentos/Listas
- 📊 Dados/Tabelas
- ⚠️ Atenção/Alertas
- ✅ Aprovado/Positivo
- ❌ Negado/Negativo

**Dica:** Para relatórios jurídicos, executivos e corporativos, sempre prefira ícones Font Awesome.

### Quebra de Linha

Para forçar uma quebra de linha dentro de um parágrafo, use `<br>`:

```markdown
Linha 1<br>
Linha 2
```

---

## Exemplo de Relatório Completo

**REGRAS IMPORTANTES:**
1. **NÃO** incluir CPF/CNPJ no cabeçalho do relatório
2. **SIM** incluir CPF/CNPJ apenas nas tabelas internas
3. Use `<details>` e `<summary>` com ícones Font Awesome profissionais
4. **EVITE** usar emojis em relatórios profissionais
5. Inclua **Tipo de Ação** e **Data desta Análise** no cabeçalho
6. Use **Autor(es)** e **Réu(s)** em vez de Exequente/Executado
7. Deixe linhas em branco antes de tabelas e depois de `<summary>`
8. Use `<br>` para múltiplas linhas em células
9. Use negritos manualmente para destacar informações importantes

```markdown
# RELATÓRIO DE PROCESSO DE DÍVIDA ATIVA

**Processo Principal nº:** 5001410-19.2016.4.04.7010
**Tipo de Ação:** Execução Fiscal
**Autor(es):** UNIÃO - FAZENDA NACIONAL
**Réu(s):** APARECIDO LUIZ TOMÉ, WANDERLEIA TOMÉ, ROSEMEIRE TOMÉ
**Vara:** Tribunal Regional Federal da 4ª Região - Vara Federal de Umuarama/PR
**Data desta Análise:** 03/11/2025

<details>
<summary><i class="fas fa-info-circle"></i> 1. INFORMAÇÕES DO TÍTULO EXECUTIVO</summary>

Esta seção contém as informações principais do processo.

| Parâmetro | Informação | Fonte Documental |
|-----------|------------|------------------|
| **Exequente** | UNIÃO - FAZENDA NACIONAL (CNPJ: 00.394.460/0216-53) | (Seq.: 254, 341) |
| **Executado(s)** | APARECIDO LUIZ TOMÉ (CPF: 211.107.359-87) (Espólio)<br>WANDERLEIA TOMÉ (CPF: 595.879-389-68)<br>ROSEMEIRE TOMÉ (CPF: 070.662.149-27) | (Seq.: 2, 3, 254, 341, 350) |
| **Valor da Causa** | R$ 151.414,46 | (Seq.: 3, 255, 341) |
| **CDA nº** | 90 6 06 000103-44 | (Seq.: 3, 255, 327) |
| **Natureza** | Dívida Ativa - Crédito Rural STN | (Seq.: 3, 327, 337) |

</details>

<details>
<summary><i class="fas fa-chart-bar"></i> 2. DIAGNÓSTICO E CLASSIFICAÇÃO</summary>

### Classificação do Ativo

**Classificação:** IRRECUPERÁVEL

**Status Geral:** Execução com débito principal quitado em 05/11/2024, mas suspensa devido a parcelamento administrativo e aguardando resolução de ações conexas.

**Principais Riscos Identificados:**

- **Risco de Nulidade de Citação:** Para Maria Aparecida de Melo, pela ausência de assinatura
- **Risco de Suspensão por Ação Conexa:** A imissão na posse do imóvel está suspensa
- **Risco de Concurso de Credores:** Múltiplos credores disputam o saldo remanescente

</details>

<details>
<summary><i class="fas fa-balance-scale"></i> 3. DETALHAMENTO DAS TESES DE DEFESA</summary>

### Ações Judiciais Relevantes

| Data ajuizamento | Nº CNJ | Tipo de Ação | Tribunal | Instância | Status |
|------------------|--------|--------------|----------|-----------|--------|
| 15/03/1998 | 298/98 | **Embargos à Execução** | TJPR | 1º grau | Encerrado - Provido |
| 20/06/2003 | 2003.70.10.001460-7 | **Anulatória** | Justiça Federal | 1º Grau | Encerrado - Improcedente |

**Análise das Teses:**

O executado apresentou **Embargos à Execução** em 1998 alegando iliquidez do título, que foi provido pelo Tribunal. Posteriormente, ajuizou **Ação Anulatória** em 2003, que foi julgada improcedente.

</details>

<details>
<summary><i class="fas fa-check-circle"></i> 4. CONCLUSÕES E RECOMENDAÇÕES</summary>

### Conclusões Finais

Com base na análise completa do processo, conclui-se que:

1. O débito principal foi **quitado** em 05/11/2024
2. Há saldo remanescente em conta judicial aguardando destinação
3. A execução está **suspensa** por ações conexas
4. O ativo é classificado como **IRRECUPERÁVEL**

### Recomendações

- Acompanhar resolução das ações conexas
- Monitorar destinação do saldo remanescente
- Avaliar possibilidade de levantamento de valores

</details>
```

**Este exemplo demonstra:**
- Extração automática de metadados do cabeçalho (novo formato)
- Uso do campo **Tipo de Ação** no cabeçalho
- Uso de **Autor(es)** e **Réu(s)** (novos campos padronizados)
- Uso de **Data desta Análise** (novo formato)
- Uso correto de `<details>` com linhas em branco
- Ícones Font Awesome profissionais (sem emojis)
- Tabelas com `<br>` para múltiplas linhas
- Referências documentais que serão formatadas automaticamente
- Negritos manuais para destacar informações
- CPF/CNPJ apenas nas tabelas, não no cabeçalho
- Estrutura hierárquica clara e profissional

**Veja o arquivo EXEMPLO_MARKDOWN_PROFISSIONAL.md para um exemplo completo e detalhado.**

---

## Otimização e Limites Técnicos

### Limites da API

A API possui os seguintes limites técnicos:

- **Tamanho máximo de arquivo:** 16 MB para uploads de arquivos `.md`
- **Tamanho de requisição JSON:** Limitado pelo servidor (recomendado: até 16 MB)
- **Timeout de processamento:** 120 segundos para conversões complexas
- **Formatos suportados:** `.md` (Markdown), HTML e PDF como saída

### Otimização de Performance

#### Para Tabelas Grandes

Se você tem tabelas muito grandes (mais de 100 linhas), considere:

1. **Dividir em seções collapse:** Use `<details>` para organizar dados em blocos menores
2. **Simplificar colunas:** Remova colunas desnecessárias para reduzir largura
3. **Usar orientação landscape:** Para tabelas largas, use `"orientation": "landscape"` na requisição PDF

**Exemplo:**

```html
<details>
<summary><i class="fas fa-chart-bar"></i> Dados de 2020-2021 (100 registros)</summary>

| Data | Valor | Status |
|------|-------|--------|
| ... tabela com muitos dados ... |

</details>

<details>
<summary><i class="fas fa-chart-bar"></i> Dados de 2022-2023 (100 registros)</summary>

| Data | Valor | Status |
|------|-------|--------|
| ... mais dados ... |

</details>
```

#### Para Documentos Longos

Para relatórios muito extensos:

1. **Use hierarquia de títulos:** Organize com `#`, `##`, `###` corretamente
2. **Collapse para seções longas:** Mantenha o documento navegável
3. **Evite imagens muito grandes:** Se incluir imagens, otimize o tamanho
4. **Processamento incremental:** Considere dividir em múltiplos relatórios se necessário

### Boas Práticas de Performance

**FAÇA:**
- Use collapse (`<details>`) para organizar conteúdo extenso
- Mantenha tabelas com largura razoável (máximo 8-10 colunas)
- Teste com dados reais antes de processar grandes volumes
- Use quebras de linha `<br>` ao invés de criar linhas extras desnecessárias

**EVITE:**
- Tabelas com mais de 15 colunas (considere dividir)
- Células de tabela com textos extremamente longos (use parágrafos separados)
- Aninhamento excessivo de `<details>` (máximo 3-4 níveis recomendado)
- Caracteres especiais não testados que podem quebrar a conversão

### Solução de Problemas Comuns

| Problema | Solução |
|----------|---------|
| Timeout ao processar | Reduza tamanho do documento ou simplifique tabelas |
| PDF muito grande | Use orientação portrait, reduza número de colunas |
| Tabelas não aparecem corretamente | Verifique linhas em branco antes das tabelas |
| Formatação perdida em `<details>` | Confirme linhas em branco após `<summary>` |
| Referências não formatadas | Verifique formato: `(Seq.: 1, 2, 3)` |

### Dicas de Qualidade

Para relatórios de máxima qualidade:

1. **Revise o Markdown:** Use um editor com preview antes de enviar para API
2. **Teste incremental:** Comece com seções pequenas, depois expanda
3. **Valide tabelas:** Certifique-se que todas têm o mesmo número de colunas
4. **Use o tema correto:** `juridico` para relatórios legais
5. **Verifique metadados:** Confirme que o cabeçalho está no formato correto

---

**Nota Final:** Este guia cobre as principais funcionalidades suportadas pela API. Para casos específicos ou dúvidas, consulte a equipe técnica.
