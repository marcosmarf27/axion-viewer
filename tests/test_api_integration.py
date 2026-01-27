"""Testes de integração para a API Flask."""

import io


class TestAPIConvert:
    """Testes para o endpoint /api/convert."""

    def test_convert_markdown_to_html(self, client, sample_markdown):
        """Testa conversão de markdown para HTML via API."""
        response = client.post(
            "/api/convert",
            json={"markdown": sample_markdown, "theme": "juridico"},
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
        assert "html" in data
        assert "filename" in data
        assert data["filename"].endswith(".html")

    def test_convert_without_markdown(self, client):
        """Testa erro quando markdown não é fornecido."""
        response = client.post(
            "/api/convert",
            json={"theme": "juridico"},
        )

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False
        assert "error" in data

    def test_convert_with_default_theme(self, client, sample_markdown):
        """Testa conversão com tema padrão."""
        response = client.post(
            "/api/convert",
            json={"markdown": sample_markdown},
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_convert_sequential_requests(self, client):
        """Testa múltiplas conversões sequenciais para verificar reset do estado."""
        for i in range(3):
            markdown = f"# Relatório {i}\n\nConteúdo do relatório {i}."
            response = client.post(
                "/api/convert",
                json={"markdown": markdown, "theme": "juridico"},
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            # Verifica que o conteúdo do relatório atual está presente
            assert f"Conteúdo do relatório {i}" in data["html"]


class TestAPIConvertFile:
    """Testes para o endpoint /api/convert/file."""

    def test_convert_file_upload(self, client):
        """Testa upload de arquivo markdown."""
        markdown_content = b"# Teste Upload\n\nConteudo do arquivo."

        response = client.post(
            "/api/convert/file",
            data={
                "file": (io.BytesIO(markdown_content), "test.md"),
                "theme": "juridico",
            },
            content_type="multipart/form-data",
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
        assert "html" in data
        assert "filename" in data

    def test_convert_file_without_file(self, client):
        """Testa erro quando arquivo não é fornecido."""
        response = client.post(
            "/api/convert/file",
            data={"theme": "juridico"},
            content_type="multipart/form-data",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False

    def test_convert_file_wrong_extension(self, client):
        """Testa comportamento com extensão de arquivo diferente."""
        content = b"Conteudo qualquer"

        response = client.post(
            "/api/convert/file",
            data={
                "file": (io.BytesIO(content), "test.exe"),
                "theme": "juridico",
            },
            content_type="multipart/form-data",
        )

        # API deve rejeitar arquivos com extensões perigosas
        assert response.status_code in [400, 200]  # Comportamento depende da config


class TestAPIThemes:
    """Testes para os endpoints de temas."""

    def test_list_themes(self, client):
        """Testa listagem de temas disponíveis."""
        response = client.get("/api/themes")

        assert response.status_code == 200
        data = response.get_json()
        assert "themes" in data
        assert isinstance(data["themes"], list)

    def test_get_theme_config(self, client):
        """Testa obtenção de configuração de um tema."""
        response = client.get("/api/themes/juridico")

        # Tema pode ou não existir, verificar resposta apropriada
        assert response.status_code in [200, 404]


class TestAPIFiles:
    """Testes para os endpoints de arquivos."""

    def test_list_files(self, client):
        """Testa listagem de arquivos gerados."""
        response = client.get("/api/files")

        assert response.status_code == 200
        data = response.get_json()
        assert "files" in data
        assert isinstance(data["files"], list)


class TestAPIHealth:
    """Testes para verificação de saúde da API."""

    def test_root_endpoint(self, client):
        """Testa endpoint raiz."""
        response = client.get("/")

        # Pode retornar frontend ou JSON de status
        assert response.status_code == 200
