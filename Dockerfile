# Multi-stage build para otimização de imagem
# Estágio 1: Build do Frontend React
FROM node:20-alpine AS frontend-builder

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/frontend

# Copiar arquivos de dependências
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Instalar dependências (frozen lockfile para builds reproduzíveis)
RUN pnpm install --frozen-lockfile

# Copiar código do frontend
COPY frontend/ ./

# Build args para Supabase (injetados via GitHub Actions)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build do frontend para produção
RUN pnpm build

# Estágio 2: Imagem final com Python + Frontend compilado
FROM python:3.11-slim

# Configurar ambiente não-interativo
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependências do sistema necessárias para WeasyPrint
RUN set -eux && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    libcairo2 \
    shared-mime-info \
    fonts-dejavu-core \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Copiar o frontend compilado do estágio anterior
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Criar diretórios necessários (data/ será montado como volume na Railway)
RUN mkdir -p data/uploads data/outputs data/themes templates

# Expor porta (Railway vai definir via variável de ambiente)
EXPOSE 8080

# Variável de ambiente padrão (Railway vai sobrescrever)
ENV PORT=8080

# Comando para iniciar a aplicação com Gunicorn (production-ready)
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --access-logfile - --error-logfile - app:app
