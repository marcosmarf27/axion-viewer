"""Testes de integração para a API Flask."""

import io

AUTH_HEADER = {"Authorization": "Bearer mock-token"}


class TestAPIConvert:
    """Testes para o endpoint /api/convert."""

    def test_convert_markdown_to_html(
        self, client, sample_markdown, mock_auth, mock_supabase
    ):
        """Testa conversão de markdown para HTML via API."""
        response = client.post(
            "/api/convert",
            json={"markdown": sample_markdown, "theme": "juridico"},
            headers=AUTH_HEADER,
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
        assert "html" in data
        assert "filename" in data
        assert data["filename"].endswith(".html")
        assert "document_id" in data
        assert "signed_url" in data

    def test_convert_without_markdown(self, client, mock_auth, mock_supabase):
        """Testa erro quando markdown não é fornecido."""
        response = client.post(
            "/api/convert",
            json={"theme": "juridico"},
            headers=AUTH_HEADER,
        )

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False
        assert "error" in data

    def test_convert_with_default_theme(
        self, client, sample_markdown, mock_auth, mock_supabase
    ):
        """Testa conversão com tema padrão."""
        response = client.post(
            "/api/convert",
            json={"markdown": sample_markdown},
            headers=AUTH_HEADER,
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_convert_sequential_requests(self, client, mock_auth, mock_supabase):
        """Testa múltiplas conversões sequenciais para verificar reset do estado."""
        for i in range(3):
            markdown = f"# Relatório {i}\n\nConteúdo do relatório {i}."
            response = client.post(
                "/api/convert",
                json={"markdown": markdown, "theme": "juridico"},
                headers=AUTH_HEADER,
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert f"Conteúdo do relatório {i}" in data["html"]

    def test_convert_requires_auth(self, client):
        """Testa que conversão requer autenticação."""
        response = client.post(
            "/api/convert",
            json={"markdown": "# Test"},
        )
        assert response.status_code == 401


class TestAPIConvertFile:
    """Testes para o endpoint /api/convert/file."""

    def test_convert_file_upload(self, client, mock_auth, mock_supabase):
        """Testa upload de arquivo markdown."""
        markdown_content = b"# Teste Upload\n\nConteudo do arquivo."

        response = client.post(
            "/api/convert/file",
            data={
                "file": (io.BytesIO(markdown_content), "test.md"),
                "theme": "juridico",
            },
            content_type="multipart/form-data",
            headers=AUTH_HEADER,
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
        assert "html" in data
        assert "filename" in data

    def test_convert_file_without_file(self, client, mock_auth, mock_supabase):
        """Testa erro quando arquivo não é fornecido."""
        response = client.post(
            "/api/convert/file",
            data={"theme": "juridico"},
            content_type="multipart/form-data",
            headers=AUTH_HEADER,
        )

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False

    def test_convert_file_wrong_extension(self, client, mock_auth, mock_supabase):
        """Testa comportamento com extensão de arquivo diferente."""
        content = b"Conteudo qualquer"

        response = client.post(
            "/api/convert/file",
            data={
                "file": (io.BytesIO(content), "test.exe"),
                "theme": "juridico",
            },
            content_type="multipart/form-data",
            headers=AUTH_HEADER,
        )

        assert response.status_code == 400


class TestAPIThemes:
    """Testes para os endpoints de temas."""

    def test_list_themes(self, client, mock_auth):
        """Testa listagem de temas disponíveis."""
        response = client.get("/api/themes", headers=AUTH_HEADER)

        assert response.status_code == 200
        data = response.get_json()
        assert "themes" in data
        assert isinstance(data["themes"], list)


class TestAPIHealth:
    """Testes para verificação de saúde da API."""

    def test_health_endpoint(self, client):
        """Testa endpoint de health check (publico)."""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "healthy"

    def test_root_endpoint(self, client):
        """Testa endpoint raiz."""
        response = client.get("/")

        assert response.status_code == 200
