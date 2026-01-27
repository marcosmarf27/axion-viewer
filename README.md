# Axion Viewer

API Flask que converte documentos Markdown extensos em relatórios HTML e PDF formatados com templates profissionais.

## Características

- 🎨 **Template Jurídico Profissional**: Cores vermelho (#BE3000) e marrom (#3A1101), design responsivo
- 📊 **Processamento Robusto de Tabelas**: Renderização automática de tabelas Markdown, incluindo:
  - Tabelas com células vazias
  - Tabelas com alinhamento (`:---`, `:---:`, `---:`)
  - Múltiplas tabelas no mesmo documento
  - Pré-processamento automático para garantir formatação correta
- 📄 **Documentos Grandes**: Suporta arquivos Markdown de até 16MB (ideal para relatórios extensos)
- 🎯 **Múltiplos Formatos**: Upload de arquivo (.md, .txt, .markdown) ou envio direto do texto JSON
- ⚡ **Conversão Rápida**: Processamento eficiente com isolamento entre requisições
- 📋 **Extração Automática de Metadados**: Cabeçalho completo com processo, exequente, executado, vara e data
- 🔄 **Conversões Sequenciais**: Suporte a múltiplas conversões sem contaminação de estado
- 📥 **Geração de PDF**: Conversão direta para PDF mantendo todo o design e formatação HTML

## Instalação e Execução

### Desenvolvimento Local

O projeto possui dois componentes:
- **Backend API** (Flask) - Conversão de Markdown para HTML/PDF
- **Frontend React** - Interface amigável para testar a API

#### Opção 1: Executar com Frontend (Recomendado para testes)

```bash
# Instalar dependências Python
pip install -r requirements.txt

# Instalar dependências Node.js
cd frontend && pnpm install && cd ..

# Executar ambos os servidores:
# Terminal 1 - Backend na porta 8000
FLASK_PORT=8000 python app.py

# Terminal 2 - Frontend na porta 5000
cd frontend && pnpm dev
```

Acesse o frontend em `http://localhost:5000` - ele possui:
- **Editor de Markdown** com preview em tempo real
- **Upload de arquivos** .md com drag & drop
- **Visualizador de temas** disponíveis
- Conversão para HTML e PDF com um clique

O frontend faz proxy automático das requisições `/api/*` para o backend na porta 8000.

#### Opção 2: Executar apenas a API

```bash
# Instalar dependências
pip install -r requirements.txt

# Executar apenas a API
python app.py
```

A API estará disponível em `http://localhost:5000` e pode ser testada via curl, Postman, etc.

### Deployment em Produção (Autoscale)

O projeto está configurado para deployment Autoscale com Gunicorn:

```bash
# O comando de deploy está configurado automaticamente em .replit:
gunicorn --bind=0.0.0.0:5000 --reuse-port app:app
```

Em produção, apenas o backend API é servido. O frontend React é para desenvolvimento e testes locais.

### 🐳 Deploy com Docker (Docker Hub + Railway)

O projeto inclui configuração completa para containerização e deploy em plataformas cloud.

**Repositório GitHub**: https://github.com/marcosmarf27/axion-viewer  
**Docker Hub**: https://hub.docker.com/r/marcosmarf27/axion-viewer

#### Opção 1: Deploy Rápido com Scripts

```bash
# 1. Testar localmente
./test-local.sh

# 2. Build e push para Docker Hub
./build-and-push.sh 1.0.0
```

#### Opção 2: GitHub Actions (Automático - Recomendado)

Configure uma vez e use **Git tags** para versionamento profissional:

```bash
# Criar nova versão
git tag v1.0.0
git push origin v1.0.0
# GitHub Actions faz build e push automático com versionamento!
```

Ou simplesmente:
```bash
git push origin main
# GitHub Actions faz build e push automático!
```

**Setup**: Veja [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) (5 minutos)

---

### 📌 **Quick Reference: Criando Novas Versões**

Depois de configurar o GitHub Actions, use este fluxo para criar novas versões:

```bash
# 1. Fazer suas alterações
git add .
git commit -m "Implementa nova funcionalidade"

# 2. Criar tag de versão (Semantic Versioning)
git tag v1.0.0

# 3. Push do código e tag
git push origin main
git push origin v1.0.0

# GitHub Actions automaticamente:
# ✅ Faz build da imagem Docker
# ✅ Cria tags: 1.0.0, 1.0, 1, latest
# ✅ Envia para Docker Hub
```

**Versionamento Semântico:**
- `v1.0.0` → Primeira versão estável
- `v1.0.1` → Correção de bugs
- `v1.1.0` → Nova funcionalidade
- `v2.0.0` → Mudanças que quebram compatibilidade

**Ver mais**: [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) seção "Versionamento com Git Tags"

---

#### Opção 3: Deploy Manual

```bash
# 1. Build da imagem
docker build -t axion-viewer:latest .

# 2. Testar localmente
docker run -p 8080:8080 axion-viewer:latest

# 3. Tag e push para Docker Hub
docker tag axion-viewer:latest marcosmarf27/axion-viewer:latest
docker push marcosmarf27/axion-viewer:latest

# 4. Deploy na Railway
# - Acesse: https://railway.app/dashboard
# - New Project → Docker Image
# - Use: marcosmarf27/axion-viewer:latest
# - Generate Domain
```

#### Opção 4: Docker Compose (Desenvolvimento)

```bash
docker-compose up
```

**📖 Guias de Deploy**

- **[QUICK_START_DOCKER.md](QUICK_START_DOCKER.md)** - Deploy em 15 minutos
- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** - Guia completo passo a passo
- **[GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)** - CI/CD automático

O que está incluído:
- ✅ Scripts bash automatizados
- ✅ GitHub Actions workflow pré-configurado
- ✅ Docker multi-stage build otimizado
- ✅ Guias completos em português
- ✅ Push para Docker Hub (com boas práticas de segurança)
- ✅ Deploy na Railway (3 métodos diferentes)
- ✅ Configuração de domínios e variáveis
- ✅ Solução de problemas comuns
- ✅ CI/CD para atualizações automáticas

## Endpoints da API

### 1. Converter Markdown (JSON)
```bash
POST /api/convert
Content-Type: application/json

{
  "markdown": "# Título\n\nConteúdo...",
  "theme": "juridico",
  "custom_config": {
    "colors": {
      "primary": "#BE3000"
    }
  }
}
```

### 2. Converter Arquivo
```bash
POST /api/convert/file
Content-Type: multipart/form-data

file: arquivo.md
theme: juridico
```

### 3. Listar Temas
```bash
GET /api/themes
```

### 4. Download do HTML Gerado
```bash
GET /api/download/{filename}
```

### 5. Preview do HTML
```bash
GET /api/preview/{filename}
```

### 6. Converter Markdown para PDF (JSON)
```bash
POST /api/convert/pdf
Content-Type: application/json

{
  "markdown": "# Título\n\nConteúdo...",
  "theme": "juridico"
}
```

**Resposta:**
```json
{
  "success": true,
  "pdf_filename": "relatorio_20251103_185939.pdf",
  "html_filename": "relatorio_20251103_185939.html",
  "pdf_download_url": "/api/download/relatorio_20251103_185939.pdf",
  "html_download_url": "/api/download/relatorio_20251103_185939.html",
  "metadata": {
    "title": "Título",
    "theme": "juridico",
    "generated_at": "2025-11-03T18:59:39"
  }
}
```

### 7. Converter Arquivo para PDF
```bash
POST /api/convert/file/pdf
Content-Type: multipart/form-data

file: arquivo.md
theme: juridico
```

### 8. Gerar PDF a partir de HTML existente
```bash
GET /api/generate-pdf/{html_filename}
```

**Exemplo:**
```bash
GET /api/generate-pdf/relatorio_20251103_185939.html
```

**Resposta:**
```json
{
  "success": true,
  "pdf_filename": "relatorio_20251103_185939.pdf",
  "pdf_download_url": "/api/download/relatorio_20251103_185939.pdf"
}
```

## Exemplo de Uso

### Usando cURL

#### Converter para HTML
```bash
# Converter texto markdown para HTML
curl -X POST http://localhost:5000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Relatório\n\n## Seção 1\n\n| Campo | Valor |\n|-------|-------|\n| Nome  | Teste |",
    "theme": "juridico"
  }'

# Upload de arquivo para HTML
curl -X POST http://localhost:5000/api/convert/file \
  -F "file=@documento.md" \
  -F "theme=juridico"
```

#### Converter para PDF
```bash
# Converter texto markdown para PDF
curl -X POST http://localhost:5000/api/convert/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Relatório\n\n## Seção 1\n\n| Campo | Valor |\n|-------|-------|\n| Nome  | Teste |",
    "theme": "juridico"
  }'

# Upload de arquivo para PDF
curl -X POST http://localhost:5000/api/convert/file/pdf \
  -F "file=@documento.md" \
  -F "theme=juridico"

# Converter HTML existente para PDF
curl -X GET http://localhost:5000/api/generate-pdf/relatorio_20251103_185939.html
```

### Resposta
```json
{
  "success": true,
  "html": "<!DOCTYPE html>...",
  "filename": "relatorio_20251103_183500.html",
  "download_url": "/api/download/relatorio_20251103_183500.html",
  "metadata": {
    "title": "Relatório",
    "theme": "juridico",
    "generated_at": "2025-11-03T18:35:00"
  }
}
```

## Estrutura do Projeto

```
.
├── app.py                      # Aplicação Flask principal
├── config.py                   # Configurações
├── requirements.txt            # Dependências Python
├── templates/
│   ├── base.html              # Template base
│   └── themes/
│       └── juridico/          # Tema jurídico
│           └── config.json
├── utils/
│   ├── markdown_converter.py  # Conversor de Markdown
│   ├── theme_manager.py       # Gerenciador de temas
│   └── pdf_converter.py       # Conversor de PDF
├── uploads/                    # Arquivos temporários (upload)
└── outputs/                    # HTMLs gerados
```

## Tema Jurídico

O tema jurídico inclui:
- **Cores Primárias**: Vermelho (#BE3000) e Marrom (#3A1101)
- **Layout Profissional**: Cabeçalho com gradiente, cards, rodapé
- **Tabelas Estilizadas**: Alternância de cores, cabeçalhos destacados
- **Responsivo**: Design adaptável para mobile e desktop
- **Ícones**: Font Awesome 6.0 integrado
- **Classes de Risco**: Estilização automática (alto/médio/baixo)

## Formatos Suportados

- `.md` - Markdown
- `.txt` - Texto simples
- `.markdown` - Markdown

## Melhorias Implementadas

### Processamento Robusto de Tabelas
- **Pré-processamento automático**: Adiciona linhas vazias antes de tabelas para garantir conversão correta
- **Suporte a células vazias**: Tabelas com campos opcionais são processadas corretamente
- **Formatação complexa**: Suporte a `<br>`, múltiplas colunas, alinhamento personalizado

### Isolamento de Conversões
- Cada conversão usa uma nova instância do parser Markdown
- Evita contaminação de estado entre requisições sequenciais
- Garantia de resultados consistentes em produção

### Extração Inteligente de Metadados
- Busca flexível por padrões (com e sem pipes `|`)
- Suporte a formatos variados de cabeçalho
- Tratamento de caracteres especiais e quebras de linha

## Limitações

- Tamanho máximo do arquivo: 16MB
- Formatos aceitos: .md, .txt, .markdown
- Requer linha vazia ou texto antes das tabelas para melhor renderização

## Tecnologias

- **Flask 3.0**: Framework web
- **Python Markdown**: Conversão de Markdown
- **Jinja2**: Sistema de templates
- **BeautifulSoup4**: Manipulação de HTML
- **Flask-CORS**: Suporte CORS
- **WeasyPrint 62.3**: Geração de PDF a partir de HTML
- **Pango, Cairo, GDK-PixBuf**: Bibliotecas de renderização gráfica

## Licença

Desenvolvido com Flask e Python.
