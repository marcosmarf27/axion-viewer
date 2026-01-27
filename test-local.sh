#!/bin/bash

# Script para testar a imagem Docker localmente
# Uso: ./test-local.sh

IMAGE_NAME="axion-viewer"
PORT=8080

echo "🧪 Testando imagem Docker localmente..."
echo ""

# Verificar se a imagem existe
if ! docker images | grep -q "$IMAGE_NAME"; then
    echo "⚠️  Imagem não encontrada. Fazendo build..."
    docker build -t $IMAGE_NAME:latest . || {
        echo "❌ Erro no build"
        exit 1
    }
fi

echo "✅ Imagem encontrada!"
echo ""

# Parar containers anteriores (se existirem)
if docker ps -a | grep -q "axion-viewer-test"; then
    echo "🛑 Parando container anterior..."
    docker stop axion-viewer-test 2>/dev/null
    docker rm axion-viewer-test 2>/dev/null
fi

echo "🚀 Iniciando container na porta $PORT..."
echo ""

# Rodar container
docker run -d \
    --name axion-viewer-test \
    -p $PORT:8080 \
    -e PORT=8080 \
    $IMAGE_NAME:latest

# Aguardar inicialização
echo "⏳ Aguardando aplicação iniciar..."
sleep 5

# Verificar se está rodando
if docker ps | grep -q "axion-viewer-test"; then
    echo ""
    echo "✅ Container rodando com sucesso!"
    echo ""
    echo "📋 Informações:"
    echo "   URL: http://localhost:$PORT"
    echo "   API Health: http://localhost:$PORT/api/health"
    echo ""
    echo "🔍 Ver logs:"
    echo "   docker logs -f axion-viewer-test"
    echo ""
    echo "🛑 Parar container:"
    echo "   docker stop axion-viewer-test"
    echo ""
    
    # Testar endpoint de health
    echo "🏥 Testando endpoint de health..."
    sleep 2
    if command -v curl &> /dev/null; then
        curl -s http://localhost:$PORT/api/health | python3 -m json.tool || echo "Endpoint respondendo (JSON)"
    fi
    
else
    echo "❌ Erro ao iniciar container"
    echo ""
    echo "Ver logs:"
    echo "   docker logs axion-viewer-test"
    exit 1
fi
