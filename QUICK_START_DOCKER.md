# ⚡ Quick Start - Docker Deploy

## 🎯 Objetivo
Fazer deploy da aplicação Markdown API no Docker Hub e Railway em **menos de 15 minutos**.

**Repositório**: https://github.com/marcosmarf27/axion-viewer  
**Docker Hub**: marcosmarf27/axion-viewer

---

## 📝 Pré-requisitos (5 minutos)

1. ✅ Conta no Docker Hub: marcosmarf27 ✓
2. ✅ Conta na Railway: https://railway.app/
3. ✅ Docker instalado na sua máquina

---

## 🚀 Passos Rápidos

### **1. Testar Localmente** (2 min)

```bash
./test-local.sh
```

Abra: http://localhost:8080

---

### **2. Enviar para Docker Hub** (5 min)

**Opção A: Manual**
```bash
./build-and-push.sh 1.0.0
```

**Opção B: GitHub Actions (Automático)**
```bash
git push origin main
# GitHub Actions faz o resto!
```

> 💡 **Configure GitHub Actions** para deploys automáticos: [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)

---

### **3. Deploy na Railway** (3 min)

1. Acesse: https://railway.app/dashboard
2. Clique: **"New Project"**
3. Escolha: **"Empty Project"**
4. Clique: **"+ New"** → **"Docker Image"**
5. Digite: `marcosmarf27/axion-viewer:latest`
6. Pressione **Enter** e clique **"Deploy"**
7. Aguarde 2-3 minutos
8. Vá em **"Settings"** → **"Networking"** → **"Generate Domain"**

---

### **4. Testar Online** (1 min)

Copie o domínio gerado (ex: `seu-app.up.railway.app`)

Teste:
```bash
curl https://seu-app.up.railway.app/api/health
```

---

## ✅ Pronto!

Sua aplicação está online e acessível para o mundo! 🌍

**Próximos passos:**
- ⚡ Configure GitHub Actions: [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)
- 🌐 Adicione domínio customizado na Railway
- 🔐 Configure variáveis de ambiente (se necessário)

---

## 🔄 **Deploy Automático com GitHub Actions**

Depois de configurar (5 min de setup), basta:

```bash
git add .
git commit -m "Minha atualização"
git push origin main
```

✨ GitHub Actions faz:
- Build da imagem Docker
- Push para marcosmarf27/axion-viewer:latest
- Railway pode fazer redeploy automático

**Setup**: Veja [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)

---

## 🆘 Problemas?

- **Guia Completo**: [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)
- **GitHub Actions**: [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)

---

**Deploy feito em menos de 15 minutos! 🎉**
