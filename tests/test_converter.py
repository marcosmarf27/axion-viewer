"""Testes de unidade para o MarkdownConverter."""


class TestMarkdownConverter:
    """Testes para a classe MarkdownConverter."""

    def test_convert_basic_markdown(self, markdown_converter):
        """Testa conversão básica de markdown para HTML."""
        markdown = "# Título\n\nParágrafo de teste."
        html = markdown_converter.convert(markdown, remove_header=False)

        assert "<h1>" in html
        assert "Título" in html
        assert "<p>" in html
        assert "Parágrafo de teste" in html

    def test_convert_removes_header_by_default(self, markdown_converter):
        """Testa que o H1 é removido por padrão."""
        markdown = "# Título Principal\n\n## Subtítulo"
        html = markdown_converter.convert(markdown)

        assert "<h1>" not in html
        assert "<h2>" in html
        assert "Subtítulo" in html

    def test_convert_table(self, markdown_converter):
        """Testa conversão de tabelas markdown."""
        markdown = """
| Col1 | Col2 |
|------|------|
| A    | B    |
"""
        html = markdown_converter.convert(markdown)

        assert "<table" in html  # Pode ter atributos como class
        assert "<td>" in html
        assert "Col1" in html

    def test_convert_list(self, markdown_converter):
        """Testa conversão de listas."""
        markdown = """
- Item 1
- Item 2
- Item 3
"""
        html = markdown_converter.convert(markdown)

        assert "<ul>" in html
        assert "<li>" in html
        assert "Item 1" in html

    def test_convert_bold_and_italic(self, markdown_converter):
        """Testa conversão de negrito e itálico."""
        markdown = "**negrito** e *itálico*"
        html = markdown_converter.convert(markdown)

        assert "<strong>" in html
        assert "negrito" in html
        assert "<em>" in html
        assert "itálico" in html

    def test_extract_title(self, markdown_converter):
        """Testa extração do título do markdown."""
        markdown = "# Meu Título\n\nConteúdo aqui."
        title = markdown_converter.extract_title(markdown)

        assert title == "Meu Título"

    def test_extract_title_default(self, markdown_converter):
        """Testa título padrão quando não há H1."""
        markdown = "Apenas texto sem título."
        title = markdown_converter.extract_title(markdown)

        assert title == "Relatório de Análise"

    def test_extract_metadata_from_paragraphs(
        self, markdown_converter, sample_markdown
    ):
        """Testa extração de metadados dos parágrafos."""
        metadata = markdown_converter.extract_metadata(sample_markdown)

        assert metadata["processo"] == "1234567-89.2024.8.26.0100"
        assert metadata["autor"] == "João da Silva"
        assert metadata["reu"] == "Empresa XYZ Ltda"
        assert metadata["vara"] == "1ª Vara Cível"
        assert metadata["data"] == "21/01/2026"

    def test_extract_metadata_from_table(
        self, markdown_converter, sample_markdown_with_table
    ):
        """Testa extração de metadados da tabela."""
        metadata = markdown_converter.extract_metadata(sample_markdown_with_table)

        assert metadata["exequente"] == "Banco ABC S/A"
        assert metadata["executado"] == "Maria Souza"
        assert metadata["valor_causa"] == "R$ 50.000,00"

    def test_process_document_references(self, markdown_converter):
        """Testa processamento de referências documentais."""
        markdown = "Conforme documento (Sequência: 15, 23, 8)."
        html = markdown_converter.convert(markdown)

        assert 'class="reference-span"' in html
        assert "Seq.:" in html
        # Números devem estar ordenados
        assert "8, 15, 23" in html

    def test_clean_empty_table_cells(self, markdown_converter):
        """Testa limpeza de células vazias na tabela."""
        markdown = """
| Col1 | Col2 |
|------|------|
| A    | N/A  |
"""
        html = markdown_converter.convert(markdown)

        # A célula N/A deve ser limpa
        assert "<td></td>" in html or "<td> </td>" in html or "N/A" not in html

    def test_clean_gemini_references(self, markdown_converter):
        """Testa remoção de referências do Gemini."""
        markdown = "Texto [Gemini AI Reference] mais texto."
        html = markdown_converter.convert(markdown)

        assert "[Gemini" not in html
        assert "Reference]" not in html

    def test_convert_details_content(self, markdown_converter):
        """Testa conversão de conteúdo dentro de tags details."""
        markdown = """
<details>
<summary>Clique para expandir</summary>

- Item A
- Item B
</details>
"""
        html = markdown_converter.convert(markdown)

        assert "<details>" in html
        assert "<summary>" in html

    def test_multiple_conversions_reset_state(self, markdown_converter):
        """Testa que múltiplas conversões não mantêm estado."""
        markdown1 = "# Primeiro\n\nConteúdo 1"
        markdown2 = "# Segundo\n\nConteúdo 2"

        html1 = markdown_converter.convert(markdown1, remove_header=False)
        html2 = markdown_converter.convert(markdown2, remove_header=False)

        assert "Primeiro" in html1
        assert "Segundo" in html2
        assert "Primeiro" not in html2
        assert "Segundo" not in html1
