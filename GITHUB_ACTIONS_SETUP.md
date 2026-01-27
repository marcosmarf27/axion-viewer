# 🔄 Configurar GitHub Actions para Deploy Automático

Este guia mostra como configurar o GitHub Actions para fazer build e push automático da imagem Docker com **versionamento profissional usando Git tags**.

---

## 🎯 **O que será automatizado**

### **🏆 Método Recomendado: Git Tags (Versionamento Semântico)**

Sempre que você criar uma **tag do Git** (ex: `v1.0.0`):

1. ✅ GitHub Actions detecta a tag
2. ✅ Faz build da imagem Docker
3. ✅ Cria **múltiplas tags Docker automaticamente**:
   - `marcosmarf27/axion-viewer:1.0.0` (versão completa)
   - `marcosmarf27/axion-viewer:1.0` (minor)
   - `marcosmarf27/axion-viewer:1` (major)
   - `marcosmarf27/axion-viewer:latest` (mais recente)
4. ✅ Envia todas as tags para Docker Hub
5. ✅ Railway detecta nova imagem e faz redeploy (opcional)

**Comandos simples:**
```bash
git tag v1.0.0 && git push origin v1.0.0
```

### **Método Alternativo: Push no Main (Sem Versionamento)**

Sempre que você fizer `git push origin main`:

1. ✅ GitHub Actions detecta o push
2. ✅ Faz build da imagem Docker
3. ✅ Envia para Docker Hub: `marcosmarf27/axion-viewer:latest`
4. ✅ Cria tag com SHA do commit (ex: `main-abc1234`)
5. ✅ Railway detecta nova imagem e faz redeploy (opcional)

---

## 📋 **Pré-requisitos**

1. ✅ Conta no Docker Hub (já tem: marcosmarf27)
2. ✅ Repositório no GitHub: `github.com/marcosmarf27/axion-viewer`
3. ✅ Workflow já criado em `.github/workflows/docker-publish.yml`

---

## 🔐 **Passo 1: Criar Token de Acesso no Docker Hub**

### **Por que Token em vez de Senha?**
Tokens são mais seguros que senhas porque:
- ✅ Podem ser revogados sem alterar sua senha
- ✅ Têm permissões limitadas
- ✅ São específicos para cada integração

### **Como Criar:**

1. Acesse: https://hub.docker.com/settings/security
2. Clique em **"New Access Token"**
3. Preencha:
   - **Description**: `GitHub Actions - Axion Viewer`
   - **Access permissions**: `Read, Write, Delete`
4. Clique em **"Generate"**
5. **COPIE O TOKEN AGORA** (não vai poder ver de novo!)

Exemplo de token: `dckr_pat_abc123xyz789...`

---

## 🔑 **Passo 2: Adicionar Secrets no GitHub**

### **Acessar Configurações do Repositório:**

1. Vá para: https://github.com/marcosmarf27/axion-viewer
2. Clique em **"Settings"** (aba superior)
3. No menu lateral esquerdo: **"Secrets and variables"** → **"Actions"**
4. Clique em **"New repository secret"**

### **Adicionar 2 Secrets:**

#### **Secret 1: DOCKERHUB_USERNAME**
- **Name**: `DOCKERHUB_USERNAME`
- **Value**: `marcosmarf27`
- Clique em **"Add secret"**

#### **Secret 2: DOCKERHUB_TOKEN**
- **Name**: `DOCKERHUB_TOKEN`
- **Value**: Cole o token que você copiou do Docker Hub
- Clique em **"Add secret"**

### **Verificar:**
Você deve ver 2 secrets listados:
- ✅ DOCKERHUB_USERNAME
- ✅ DOCKERHUB_TOKEN

---

## ✅ **Passo 3: Verificar o Workflow**

O arquivo `.github/workflows/docker-publish.yml` já está configurado!

Ele faz:
- ✅ Build da imagem em cada push
- ✅ Push para `marcosmarf27/axion-viewer:latest`
- ✅ Cria tags automáticas
- ✅ Usa cache para builds mais rápidos
- ✅ Atualiza descrição no Docker Hub

---

## 🚀 **Passo 4: Testar o Workflow**

Agora é só fazer um push para testar:

```bash
# Fazer uma mudança qualquer (ou criar arquivo vazio)
touch teste.txt
git add teste.txt
git commit -m "Test GitHub Actions workflow"
git push origin main
```

### **Acompanhar o Build:**

1. Vá para: https://github.com/marcosmarf27/axion-viewer/actions
2. Você verá o workflow "Docker Build and Push" rodando
3. Clique nele para ver os logs em tempo real
4. Deve levar ~5-10 minutos

### **Verificar no Docker Hub:**

1. Acesse: https://hub.docker.com/r/marcosmarf27/axion-viewer
2. Você deve ver a nova tag `latest` com timestamp atualizado
3. Também verá tags adicionais como `main-sha123abc`

---

## 🔄 **Passo 5: Configurar Railway (Opcional - Auto Deploy)**

Para que a Railway faça redeploy automático quando uma nova imagem for enviada:

### **Opção A: Webhook**

1. Na Railway, vá no seu serviço
2. Settings → Webhooks
3. Adicione webhook para "Image Push"
4. Copie a URL do webhook
5. No Docker Hub, vá em Webhooks e adicione a URL

### **Opção B: Manual**

Sempre que quiser atualizar na Railway:
1. Vá no dashboard da Railway
2. Clique em "Deployments"
3. Clique em "Redeploy"

### **Opção C: GitHub Integration (Recomendado)**

Em vez de usar Docker Hub, conecte Railway diretamente ao GitHub:
1. Railway → New Project → GitHub repo
2. Selecione `marcosmarf27/axion-viewer`
3. Railway detecta Dockerfile e faz build automático
4. Cada push no GitHub = deploy automático na Railway

---

## 📊 **Fluxo Completo (Após Configuração)**

```
Você: git push origin main
  ↓
GitHub: Detecta push
  ↓
GitHub Actions: Faz build da imagem (~5-10 min)
  ↓
Docker Hub: Recebe imagem marcosmarf27/axion-viewer:latest
  ↓
Railway: Detecta nova imagem (se configurado)
  ↓
Railway: Faz redeploy automático
  ↓
✅ Aplicação atualizada online!
```

**Tempo total: ~10-15 minutos automático**

---

## 🐛 **Solução de Problemas**

### **Erro: "Invalid credentials"**
- Verifique se DOCKERHUB_USERNAME está correto: `marcosmarf27`
- Verifique se DOCKERHUB_TOKEN foi copiado corretamente
- Tente gerar um novo token

### **Erro: "Build failed"**
- Veja os logs completos no GitHub Actions
- Verifique se o Dockerfile está correto
- Teste build local: `docker build -t test .`

### **Imagem não aparece no Docker Hub**
- Verifique se o workflow completou com sucesso
- Confirme que não é um Pull Request (PRs não fazem push)
- Verifique se está na branch `main` ou `master`

### **Railway não atualiza automaticamente**
- Configure webhook do Docker Hub → Railway
- Ou use GitHub Integration (recomendado)
- Ou faça redeploy manual

---

## 🎨 **Customizações Opcionais**

### **Mudar Nome da Branch**

Se sua branch principal é `develop` em vez de `main`:

Edite `.github/workflows/docker-publish.yml`:
```yaml
on:
  push:
    branches: [ "develop" ]  # ← Mude aqui
```

---

### **🏆 Versionamento Semântico com Git Tags (Detalhado)**

O workflow já está configurado para detectar tags do Git e criar tags Docker automaticamente!

#### **Como o Versionamento Funciona:**

Quando você cria uma tag Git tipo `v1.2.3`, o GitHub Actions automaticamente cria:

| Tag Git | Tags Docker Criadas |
|---------|---------------------|
| `v1.0.0` | `1.0.0`, `1.0`, `1`, `latest` |
| `v1.2.3` | `1.2.3`, `1.2`, `1`, `latest` |
| `v2.0.0` | `2.0.0`, `2.0`, `2`, `latest` |

#### **Padrão Semantic Versioning (MAJOR.MINOR.PATCH):**

```bash
# Formato: vMAJOR.MINOR.PATCH

# PATCH (1.0.0 → 1.0.1) - Correções de bugs
git tag v1.0.1
git push origin v1.0.1

# MINOR (1.0.1 → 1.1.0) - Novas funcionalidades (compatível)
git tag v1.1.0
git push origin v1.1.0

# MAJOR (1.1.0 → 2.0.0) - Mudanças que quebram compatibilidade
git tag v2.0.0
git push origin v2.0.0
```

#### **Exemplo Completo de Workflow de Versão:**

```bash
# === Desenvolvimento ===
# Fazer alterações normais
git add .
git commit -m "Implementa validação de PDF"
git push origin main  # Cria tag latest + main-sha123

# === Quando estiver pronto para release ===
# Criar tag de versão
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions automaticamente cria:
# - marcosmarf27/axion-viewer:1.0.0
# - marcosmarf27/axion-viewer:1.0
# - marcosmarf27/axion-viewer:1
# - marcosmarf27/axion-viewer:latest

# === Correção de bug ===
git add .
git commit -m "Corrige erro no cabeçalho PDF"
git tag v1.0.1
git push origin v1.0.1

# === Nova funcionalidade ===
git add .
git commit -m "Adiciona suporte a temas customizados"
git tag v1.1.0
git push origin v1.1.0

# === Mudança importante ===
git add .
git commit -m "Refatora API (breaking change)"
git tag v2.0.0
git push origin v2.0.0
```

#### **Vantagens do Sistema Automático:**

✅ **Múltiplas tags** - `1.2.3`, `1.2`, `1`, `latest` criadas automaticamente  
✅ **Flexibilidade** - Use versão específica (`1.2.3`) ou geral (`1`)  
✅ **Rollback fácil** - Pode voltar para qualquer versão publicada  
✅ **Rastreamento** - Cada tag aponta para um commit específico

#### **Comandos Úteis para Tags:**

```bash
# Ver todas as tags locais
git tag

# Ver tags remotas
git ls-remote --tags origin

# Criar tag com mensagem
git tag -a v1.0.0 -m "Primeira versão estável"

# Deletar tag local
git tag -d v1.0.0

# Deletar tag remota
git push origin --delete v1.0.0

# Push de todas as tags de uma vez
git push origin --tags
```

---

### **Build Apenas em Tags (Economizar Créditos)**

Para fazer build **somente** em releases (tags), sem builds em cada push no main:

Edite `.github/workflows/docker-publish.yml`:
```yaml
on:
  push:
    tags: [ 'v*.*.*' ]  # Apenas em tags de versão
  # Remove a seção branches para não buildar em push no main
```

Dessa forma, você controla exatamente quando fazer build (apenas quando criar uma tag de versão)

---

## ✅ **Checklist Final**

Antes de considerar configuração completa:

- [ ] Token criado no Docker Hub
- [ ] DOCKERHUB_USERNAME adicionado no GitHub
- [ ] DOCKERHUB_TOKEN adicionado no GitHub
- [ ] Push de teste realizado
- [ ] Workflow executado com sucesso
- [ ] Imagem aparece no Docker Hub
- [ ] Railway configurada (opcional)

---

## 📞 **Links Úteis**

- **Seu Repositório**: https://github.com/marcosmarf27/axion-viewer
- **GitHub Actions**: https://github.com/marcosmarf27/axion-viewer/actions
- **Docker Hub**: https://hub.docker.com/r/marcosmarf27/axion-viewer
- **Railway Dashboard**: https://railway.app/dashboard
- **Documentação GitHub Actions**: https://docs.github.com/actions

---

**Configuração completa! Agora é só fazer `git push` e relaxar! 🚀**
