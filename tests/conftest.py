"""Fixtures para testes pytest."""

import os
import sys
import tempfile
from unittest.mock import MagicMock

import pytest

# Adicionar o diretório raiz ao path para importar os módulos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from utils.markdown_converter import MarkdownConverter
from utils.theme_manager import ThemeManager


@pytest.fixture
def app():
    """Cria uma instância da aplicação Flask para testes."""
    flask_app = create_app()
    flask_app.config.update(
        {
            "TESTING": True,
        }
    )
    yield flask_app


@pytest.fixture
def client(app):
    """Cria um cliente de teste para a aplicação Flask."""
    return app.test_client()


@pytest.fixture
def markdown_converter():
    """Cria uma instância do MarkdownConverter."""
    return MarkdownConverter()


@pytest.fixture
def theme_manager(tmp_path):
    """Cria uma instância do ThemeManager com pasta temporária."""
    return ThemeManager(custom_themes_folder=str(tmp_path))


@pytest.fixture
def sample_markdown():
    """Retorna um markdown de exemplo para testes."""
    return """# Relatório de Teste

**Processo Principal nº:** 1234567-89.2024.8.26.0100
**Autor(es):** João da Silva
**Réu(s):** Empresa XYZ Ltda
**Vara:** 1ª Vara Cível
**Data desta Análise:** 21/01/2026

## Seção 1

| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Dado A   | Dado B   | Dado C   |

### Detalhes
- Item 1
- Item 2
- Item 3

**Status:** Em andamento
"""


@pytest.fixture
def sample_markdown_with_table():
    """Retorna um markdown com tabela complexa."""
    return """# Análise Processual

## INFORMAÇÕES DO TÍTULO EXECUTIVO

| Parâmetro | Valor |
|-----------|-------|
| Exequente(s) | Banco ABC S/A |
| Executado(s) | Maria Souza |
| Valor da Causa | R$ 50.000,00 |
| Vara | 2ª Vara de Execução Fiscal |
"""


@pytest.fixture
def temp_output_dir():
    """Cria um diretório temporário para outputs."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
def mock_auth(monkeypatch):
    """Mock de autenticacao JWT para testes.
    Simula um usuario admin autenticado.
    """
    monkeypatch.setattr(
        "utils.auth.verify_supabase_token",
        lambda t: {"sub": "test-user-id"},
    )
    monkeypatch.setattr(
        "utils.auth.get_user_profile",
        lambda uid: {
            "id": uid,
            "role": "admin",
            "email": "test@test.com",
            "full_name": "Test Admin",
        },
    )


@pytest.fixture
def mock_supabase(monkeypatch):
    """Mock do servico Supabase para testes.
    Simula upload, criacao de documento e signed URL.
    """
    monkeypatch.setattr(
        "utils.supabase_client.supa_service.upload_file",
        lambda content, ft: f"mock/{ft}/test.{ft}",
    )
    monkeypatch.setattr(
        "utils.supabase_client.supa_service.create_documento",
        lambda data: MagicMock(data=[{"id": "mock-doc-id"}]),
    )
    monkeypatch.setattr(
        "utils.supabase_client.supa_service.get_signed_url",
        lambda path, **kw: "https://mock-signed-url.com",
    )
    monkeypatch.setattr(
        "utils.supabase_client.supa_service.delete_file",
        lambda path: None,
    )
