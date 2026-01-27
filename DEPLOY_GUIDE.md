# 🚀 Guia Completo: Deploy Docker Hub → Railway

Este guia mostra como fazer deploy da sua aplicação Markdown API de forma segura e profissional.

**Repositório GitHub**: https://github.com/marcosmarf27/axion-viewer  
**Docker Hub**: https://hub.docker.com/r/marcosmarf27/axion-viewer  
**Username**: marcosmarf27

---

## 📋 **Pré-requisitos**

1. **Docker instalado** na sua máquina
   - Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: `sudo apt-get install docker.io`

2. **Conta no Docker Hub** (gratuita)
   - ✅ Já tem: marcosmarf27

3. **Conta na Railway** (gratuita)
   - Criar em: https://railway.app/

---

## 🔧 **PARTE 1: Preparação e Build Local**

### **Passo 1: Testar o Build Localmente**

Primeiro, vamos garantir que a imagem Docker funciona na sua máquina:

```bash
# No diretório do projeto, execute:
docker build -t axion-viewer:latest .
```

Este comando pode levar 5-10 minutos na primeira vez (está instalando todas as dependências).

**Ou use o script automatizado:**
```bash
./test-local.sh
```

### **Passo 2: Testar a Imagem Localmente**

```bash
# Rodar o container localmente para testar
docker run -p 8080:8080 axion-viewer:latest
```

Depois, abra o navegador em `http://localhost:8080` e teste se a API está funcionando.

**Para parar o container:**
- Pressione `Ctrl + C` no terminal

---

## 🐳 **PARTE 2: Enviar para o Docker Hub**

### **Passo 1: Login no Docker Hub**

```bash
docker login
```

Digite seu **username** e **senha** (ou token de acesso) do Docker Hub.

### **Passo 2: Criar Tag e Push**

**Opção Automática (Recomendada):**
```bash
# Script faz tudo automaticamente
./build-and-push.sh 1.0.0
```

**Opção Manual:**
```bash
# Criar tags
docker tag axion-viewer:latest marcosmarf27/axion-viewer:latest
docker tag axion-viewer:latest marcosmarf27/axion-viewer:v1.0.0
```

### **Passo 3: Push para Docker Hub**

```bash
docker push marcosmarf27/axion-viewer:latest
docker push marcosmarf27/axion-viewer:v1.0.0
```

Este processo pode levar 5-15 minutos dependendo da sua conexão de internet.

### **Passo 4: Verificar no Docker Hub**

1. Acesse: https://hub.docker.com/r/marcosmarf27/axion-viewer
2. Você deve ver as tags (`latest` e `v1.0.0`)
3. Verifique a data de atualização

---

## 🚂 **PARTE 3: Deploy na Railway**

### **Método A: Deploy com Imagem do Docker Hub (RECOMENDADO)**

#### **Passo 1: Criar Novo Projeto**

1. Acesse: https://railway.app/dashboard
2. Clique em **"New Project"**
3. Escolha **"Empty Project"**

#### **Passo 2: Adicionar Serviço Docker**

1. Clique em **"+ New"** → **"Docker Image"**
2. No campo de imagem, digite: `marcosmarf27/axion-viewer:latest`
3. Pressione **Enter** e clique em **"Deploy"**

#### **Passo 3: Configurar Variáveis de Ambiente (Opcional)**

Se sua aplicação precisar de variáveis de ambiente:

1. Clique no serviço implantado
2. Vá em **"Variables"**
3. Adicione as variáveis necessárias

#### **Passo 4: Gerar Domínio Público**

1. Clique no serviço
2. Vá em **"Settings"** → **"Networking"**
3. Clique em **"Generate Domain"**
4. Aguarde 1-2 minutos para o domínio ficar ativo

#### **Passo 5: Testar a Aplicação**

1. Copie o domínio gerado (algo como: `seu-app.up.railway.app`)
2. Acesse no navegador
3. Teste a API!

---

### **Método B: Deploy Direto do GitHub (Alternativo)**

Se preferir fazer deploy direto do código:

#### **Passo 1: Push para GitHub**

```bash
git add .
git commit -m "Add Docker configuration"
git push origin main
```

#### **Passo 2: Conectar Railway ao GitHub**

1. Railway Dashboard → **"New Project"**
2. Escolha **"Deploy from GitHub repo"**
3. Autorize e selecione seu repositório
4. Railway vai detectar o `Dockerfile` automaticamente
5. Clique em **"Deploy"**

---

## 🔐 **DICAS DE SEGURANÇA**

### **1. Usar Token de Acesso (em vez de senha)**

No Docker Hub:
1. Acesse: **Account Settings** → **Security** → **Access Tokens**
2. Crie um novo token
3. Use o token em vez da senha no `docker login`

```bash
docker login -u marcosmarf27
# Quando pedir senha, cole o token
```

### **2. GitHub Actions para Deploy Automático**

Configure CI/CD para fazer deploy automático em cada `git push`:

**Veja o guia completo**: [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)

**Resumo rápido:**
1. Criar token no Docker Hub
2. Adicionar secrets no GitHub: `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN`
3. O workflow em `.github/workflows/docker-publish.yml` já está configurado!
4. Basta fazer `git push` e o resto é automático

### **3. Repositório Privado (Opcional)**

Para projetos comerciais:

1. No Docker Hub, vá em **Repositories** → **Settings**
2. Mude para **"Private"**
3. Na Railway, você precisará do plano Pro para acessar registros privados

### **4. Não Incluir Segredos no Dockerfile**

✅ **CORRETO**: Usar variáveis de ambiente na Railway  
❌ **ERRADO**: Hardcode de senhas/chaves no código

---

## 🔄 **ATUALIZAÇÕES FUTURAS**

Quando fizer mudanças no código, você tem várias opções. **O método recomendado é usar tags do Git** para versionamento semântico.

---

### **🏆 Opção 1: Versionamento com Git Tags (RECOMENDADO)**

**Este é o método mais profissional e automatizado!**

O projeto está configurado com GitHub Actions que detecta automaticamente tags do Git e cria as imagens Docker correspondentes.

#### **Como funciona:**

1. **Você cria uma tag do Git** (ex: `v1.0.0`, `v1.1.0`, `v2.0.0`)
2. **GitHub Actions detecta a tag** e automaticamente:
   - ✅ Faz build da imagem Docker
   - ✅ Cria múltiplas tags Docker: `1.0.0`, `1.0`, `1`, `latest`
   - ✅ Envia para Docker Hub
   - ✅ Railway pode fazer redeploy automático
3. **Resultado**: Versionamento limpo e organizado!

#### **Comandos:**

```bash
# 1. Fazer suas alterações normalmente
git add .
git commit -m "Adiciona nova funcionalidade X"

# 2. Criar tag de versão (Semantic Versioning)
git tag v1.0.0

# 3. Push do código E da tag
git push origin main
git push origin v1.0.0

# Pronto! GitHub Actions faz o resto automaticamente
```

#### **Sistema de Versionamento Semântico:**

Use o padrão **MAJOR.MINOR.PATCH**:

```bash
# v1.0.0 → Primeira versão estável
git tag v1.0.0 && git push origin v1.0.0

# v1.0.1 → Correção de bugs (patch)
git tag v1.0.1 && git push origin v1.0.1

# v1.1.0 → Nova funcionalidade (minor)
git tag v1.1.0 && git push origin v1.1.0

# v2.0.0 → Mudanças que quebram compatibilidade (major)
git tag v2.0.0 && git push origin v2.0.0
```

#### **Tags Docker criadas automaticamente:**

Quando você cria `v1.2.3`, GitHub Actions gera:
- `marcosmarf27/axion-viewer:1.2.3` (versão específica)
- `marcosmarf27/axion-viewer:1.2` (minor version)
- `marcosmarf27/axion-viewer:1` (major version)
- `marcosmarf27/axion-viewer:latest` (sempre a mais recente)

#### **Vantagens:**

✅ **Versionamento profissional** - Padrão da indústria  
✅ **Rastreabilidade completa** - Sabe exatamente qual código está em cada versão  
✅ **Rollback fácil** - Pode voltar para qualquer versão anterior  
✅ **Zero trabalho manual** - GitHub Actions faz tudo  
✅ **Múltiplas tags** - Flexibilidade para usar `latest`, `1.0.0`, ou `1.0`

**Setup necessário**: [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) (configurar uma vez)

---

### **Opção 2: Push Simples no Main (Sem Versionamento)**

Se não precisa de controle de versões, apenas:

```bash
git add .
git commit -m "Minha atualização"
git push origin main
```

GitHub Actions faz:
- ✅ Build da imagem Docker
- ✅ Push para `marcosmarf27/axion-viewer:latest`
- ✅ Cria tag com SHA do commit (ex: `main-abc1234`)
- ✅ Railway pode fazer redeploy automático

**Quando usar**: Atualizações rápidas em desenvolvimento

**Setup**: [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)

---

### **Opção 3: Script Manual (Método Alternativo)**

Para builds locais com controle manual:

```bash
# 1. Rebuild e push
./build-and-push.sh 1.1.0

# 2. Na Railway, vá em Deployments → Redeploy (se necessário)
```

**Quando usar**: Sem acesso ao GitHub Actions ou preferência por controle manual local

---

### **Opção 4: Comandos Docker Manuais (Avançado)**

```bash
# 1. Rebuild a imagem
docker build -t axion-viewer:latest .

# 2. Tag com nova versão
docker tag axion-viewer:latest marcosmarf27/axion-viewer:v1.1.0
docker tag axion-viewer:latest marcosmarf27/axion-viewer:latest

# 3. Push para Docker Hub
docker push marcosmarf27/axion-viewer:v1.1.0
docker push marcosmarf27/axion-viewer:latest

# 4. Na Railway, vá em Deployments → Redeploy
```

**Quando usar**: Controle total manual sobre cada etapa, aprendizado de Docker

---

### **Opção 5: Railway com GitHub Integration (Deploy Direto)**

Se conectou Railway diretamente via GitHub (sem Docker Hub):

```bash
git add .
git commit -m "Atualização XYZ"
git push origin main
```

Railway faz rebuild e redeploy automaticamente!

---

## 🐛 **Solução de Problemas Comuns**

### **Erro: "Cannot connect to Docker daemon"**
```bash
# Linux/Mac: Inicie o Docker
sudo systemctl start docker

# Windows/Mac: Abra o Docker Desktop
```

### **Erro: "denied: requested access to the resource is denied"**
- Verifique se fez login: `docker login`
- Confirme que o nome da tag está correto: `marcosmarf27/axion-viewer`

### **Aplicação não abre na Railway**
1. Verifique os logs: Railway Dashboard → Seu Serviço → **"Logs"**
2. Confirme que o domínio foi gerado
3. Aguarde 2-5 minutos para DNS propagar

### **Erro 502 Bad Gateway**
- Geralmente significa que a aplicação não iniciou
- Verifique os logs para ver mensagens de erro
- Confirme que as dependências estão corretas

---

## 📊 **Monitoramento**

### **Railway Dashboard**
- **Logs**: Ver logs em tempo real
- **Metrics**: CPU, RAM, tráfego de rede
- **Deployments**: Histórico de deploys

### **Docker Hub**
- **Pulls**: Quantas vezes a imagem foi baixada
- **Tags**: Versões disponíveis

---

## 💰 **Custos**

### **Docker Hub** (Plano Gratuito)
- ✅ Repositórios públicos ilimitados
- ✅ 1 repositório privado
- ⚠️ Limite de pulls (200 pulls/6h para usuários anônimos)

### **Railway** (Plano Gratuito)
- ✅ $5 de crédito grátis por mês
- ✅ Suficiente para projetos pequenos/médios
- ⚠️ Depois de esgotar, precisa adicionar cartão (pay-as-you-go)

---

## ✅ **Checklist Final**

Antes de considerar o deploy completo:

- [ ] Imagem testada localmente
- [ ] Push para Docker Hub com sucesso
- [ ] Deploy na Railway realizado
- [ ] Domínio público gerado
- [ ] Aplicação acessível e funcionando
- [ ] Logs sem erros críticos
- [ ] API endpoints testados

---

## 📞 **Suporte**

- **Docker Hub**: https://docs.docker.com/
- **Railway**: https://docs.railway.app/
- **Este Projeto**: Veja o README.md

---

**Feito com ❤️ para deploy seguro e profissional!**
