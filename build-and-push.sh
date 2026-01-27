#!/bin/bash

# Script para build e push da imagem Docker
# Uso: ./build-and-push.sh [versao]

USERNAME="marcosmarf27"
VERSION=${1:-"1.0.0"}
IMAGE_NAME="axion-viewer"

echo "🐳 Iniciando build da imagem Docker..."
echo "   Username: $USERNAME"
echo "   Imagem: $IMAGE_NAME"
echo "   Versão: $VERSION"
echo ""

# Build da imagem
echo "📦 Passo 1/4: Building imagem..."
docker build -t $IMAGE_NAME:latest . || {
    echo "❌ Erro no build da imagem"
    exit 1
}

echo ""
echo "✅ Build concluído!"
echo ""

# Criar tags
echo "🏷️  Passo 2/4: Criando tags..."
docker tag $IMAGE_NAME:latest $USERNAME/$IMAGE_NAME:latest
docker tag $IMAGE_NAME:latest $USERNAME/$IMAGE_NAME:v$VERSION

echo "✅ Tags criadas:"
echo "   - $USERNAME/$IMAGE_NAME:latest"
echo "   - $USERNAME/$IMAGE_NAME:v$VERSION"
echo ""

# Login (se necessário)
echo "🔐 Passo 3/4: Verificando login no Docker Hub..."
if ! docker info | grep -q "Username"; then
    echo "Fazendo login no Docker Hub..."
    docker login || {
        echo "❌ Erro no login"
        exit 1
    }
fi

echo "✅ Login verificado!"
echo ""

# Push das imagens
echo "⬆️  Passo 4/4: Enviando imagens para Docker Hub..."
docker push $USERNAME/$IMAGE_NAME:latest || {
    echo "❌ Erro ao enviar tag latest"
    exit 1
}

docker push $USERNAME/$IMAGE_NAME:v$VERSION || {
    echo "❌ Erro ao enviar tag v$VERSION"
    exit 1
}

echo ""
echo "🎉 Sucesso! Imagens enviadas para Docker Hub:"
echo "   - https://hub.docker.com/r/$USERNAME/$IMAGE_NAME"
echo ""
echo "📋 Próximos passos:"
echo "   1. Acesse Railway: https://railway.app/dashboard"
echo "   2. Crie novo projeto → Deploy Docker Image"
echo "   3. Use a imagem: $USERNAME/$IMAGE_NAME:latest"
echo "   4. Gere um domínio público"
echo ""
echo "💡 Dica: Configure GitHub Actions para deploys automáticos!"
echo "   Veja: GITHUB_ACTIONS_SETUP.md"
echo ""
echo "✅ Deploy completo! 🚀"
