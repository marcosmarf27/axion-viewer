import re

import markdown
from bs4 import BeautifulSoup, Tag


class MarkdownConverter:
    def __init__(self):
        self.empty_data_patterns = [
            r"^\s*N/?A\s*$",
            r"^\s*Não\s+(informado|encontrado|aplicável)\s*$",
            r"^\s*nenhum\s*$",
            r"^\s*-\s*$",
            r"^\s*$",
        ]
        self.risk_action_types = [
            "Embargos de execução",
            "Embargos à Execução",
            "Revisional",
            "Anulatória",
            "Embargos de Terceiro",
        ]

    def _create_md_instance(self, use_nl2br=True):
        extensions = ["tables", "fenced_code", "sane_lists", "attr_list", "md_in_html"]
        if use_nl2br:
            extensions.append("nl2br")
        return markdown.Markdown(
            extensions=extensions, extension_configs={"tables": {}}
        )

    def _preprocess_details_markdown(self, markdown_text):
        """
        Pré-processa o conteúdo markdown dentro de tags <details> ANTES da conversão principal.
        Isso resolve o problema de listas não serem convertidas dentro de <details>.
        """
        # Regex para encontrar blocos <details>...</details>
        details_pattern = re.compile(
            r"(<details[^>]*>)\s*(<summary[^>]*>.*?</summary>)(.*?)(</details>)",
            re.DOTALL | re.IGNORECASE,
        )

        def ensure_blank_line_before_lists(content):
            """
            Garante que há uma linha em branco antes de listas.
            Markdown requer linha em branco antes de listas para reconhecê-las.
            """
            lines = content.split("\n")
            result = []
            for i, line in enumerate(lines):
                # Verifica se a linha atual é um item de lista
                is_list_item = re.match(r"^\s*[\*\-]\s+", line)
                if is_list_item and i > 0:
                    # Verifica se a linha anterior não é vazia e não é item de lista
                    prev_line = lines[i - 1].strip()
                    prev_is_list = re.match(r"^\s*[\*\-]\s+", lines[i - 1])
                    if prev_line and not prev_is_list:
                        result.append("")  # Adiciona linha em branco
                result.append(line)
            return "\n".join(result)

        def process_details_content(match):
            details_open = match.group(1)
            summary = match.group(2)
            content = match.group(3)
            details_close = match.group(4)

            # Processar o conteúdo como markdown (sem nl2br para preservar listas)
            if content.strip():
                # Garantir linha em branco antes de listas
                content = ensure_blank_line_before_lists(content)
                md_instance = self._create_md_instance(use_nl2br=False)
                processed_content = md_instance.convert(content)
            else:
                processed_content = content

            return f"{details_open}\n{summary}\n{processed_content}\n{details_close}"

        # Processar de dentro para fora (details aninhados)
        max_iterations = 10
        for _ in range(max_iterations):
            new_text = details_pattern.sub(process_details_content, markdown_text)
            if new_text == markdown_text:
                break
            markdown_text = new_text

        return markdown_text

    def _process_document_references(self, html_text):
        """
        Converte referências documentais para o formato padrão:
        (Sequência: 2, 611, 625) -> <span class="reference-span">(Seq.: 2, 611, 625)</span>
        """
        html_text = re.sub(r",\s*Pág\.\s*\d+", "", html_text, flags=re.IGNORECASE)

        patterns = [
            r"(?<!</span>)\(Sequência:\s*([0-9,\s]+)\)",
            r"(?<!</span>)\(Seq\.\s*([0-9,\s]+)\)",
            r"(?<!</span>)\(Seq\.?:\s*([0-9,\s]+)\)",
            r"(?<!</span>)\(Ref\.?:\s*Doc\.?\s*Seq\.?\s*([0-9,\s]+)\)",
            r"(?<!</span>)\(Autos\s*\(?\s*Seq\.?\s*([0-9,\s]+)\)?\)",
            r"(?<!</span>)\(Fonte:\s*Doc\.?\s*Seq\.?\s*([0-9,\s]+)\)",
        ]

        def format_reference(match):
            numbers_str = match.group(1)
            numbers = [
                int(n.strip()) for n in numbers_str.split(",") if n.strip().isdigit()
            ]
            numbers.sort()
            formatted_nums = ", ".join(map(str, numbers))
            return f'<span class="reference-span">(Seq.: {formatted_nums})</span>'

        for pattern in patterns:
            html_text = re.sub(
                pattern, format_reference, html_text, flags=re.IGNORECASE
            )

        return html_text

    def _clean_gemini_references(self, html_text):
        """Remove referências do Gemini no formato [...]"""
        html_text = re.sub(
            r"\[(?:Gemini|Source|Citation).*?\]", "", html_text, flags=re.IGNORECASE
        )
        return html_text

    def _remove_old_generation_dates(self, html_text):
        """Remove linhas com 'Data de Geração' antigas"""
        html_text = re.sub(
            r"<[^>]*>.*?Data\s+de\s+Gera[çc]ão.*?</[^>]*>",
            "",
            html_text,
            flags=re.IGNORECASE,
        )
        html_text = re.sub(
            r"Data\s+de\s+Gera[çc]ão[:\s]*[^\n<]+", "", html_text, flags=re.IGNORECASE
        )
        return html_text

    def _is_empty_data(self, text):
        """Verifica se o texto contém dados vazios/irrelevantes"""
        if not text:
            return True
        text = text.strip()
        for pattern in self.empty_data_patterns:
            if re.match(pattern, text, re.IGNORECASE):
                return True
        return False

    def _clean_empty_table_cells(self, soup):
        """Remove células e linhas de tabela com dados vazios ou N/A"""
        for table in soup.find_all("table"):
            rows_to_remove = []
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                if cells:
                    for cell in cells:
                        if self._is_empty_data(cell.get_text()):
                            cell.string = ""

                    if all(self._is_empty_data(cell.get_text()) for cell in cells):
                        rows_to_remove.append(row)

            for row in rows_to_remove:
                row.decompose()
        return soup

    # Formatação de risco removida - usuário prefere formatação manual
    # def _format_risk_actions(self, soup):
    #     """Formata tipos de ação de risco com classe risk-alto"""
    #     for td in soup.find_all('td'):
    #         text = td.get_text().strip()
    #         for risk_type in self.risk_action_types:
    #             if risk_type.lower() in text.lower():
    #                 if td.find('strong'):
    #                     strong_tag = td.find('strong')
    #                     strong_tag['class'] = strong_tag.get('class', []) + ['risk-alto']
    #                 else:
    #                     new_strong = soup.new_tag('strong', **{'class': 'risk-alto'})
    #                     new_strong.string = text
    #                     td.clear()
    #                     td.append(new_strong)
    #                 break
    #     return soup

    def _improve_italic_conversion(self, markdown_text):
        """
        NÃO faz pré-processamento de markdown - deixa a biblioteca markdown fazer seu trabalho.
        A biblioteca markdown já converte corretamente:
        - **texto** -> <strong>texto</strong>
        - *texto* -> <em>texto</em>
        """
        return markdown_text

    def _process_details_content(self, soup):
        """
        Processa o conteúdo markdown dentro de tags <details>, incluindo details aninhados
        Processa de dentro para fora (leaf-first)
        """
        max_iterations = 10
        iteration = 0

        while iteration < max_iterations:
            iteration += 1
            details_processed = False

            # Encontrar todos os details
            all_details = soup.find_all("details")

            for details in all_details:
                summary = details.find("summary")
                if not summary:
                    continue

                # Verificar se este details contém outros details (não processar se contém)
                nested_details = details.find_all("details")
                # Remover o próprio details da lista
                nested_details = [d for d in nested_details if d != details]

                if nested_details:
                    # Tem details aninhados, pular este e processar os internos primeiro
                    continue

                # Pegar o conteúdo após o summary
                content_parts = []
                for element in list(details.children):
                    if element != summary and element.name != "summary":
                        content_parts.append(str(element))

                if not content_parts:
                    continue

                content_text = "".join(content_parts).strip()

                # Verificar se ainda há markdown não processado
                has_unprocessed_markdown = (
                    "###" in content_text
                    or "##" in content_text
                    or (content_text.count("|") > 5 and "\n|" in content_text)
                    or ("**" in content_text and "<strong>" not in content_text)
                    or bool(re.search(r"^\s*[\*\-]\s+", content_text, re.MULTILINE))
                )

                if not has_unprocessed_markdown:
                    continue

                details_processed = True

                # Processar como markdown
                md_instance = self._create_md_instance()
                processed_html = md_instance.convert(content_text)

                # Limpar o details e reconstruir com conteúdo processado
                details.clear()
                details.append(summary)

                # Adicionar o conteúdo processado
                content_soup = BeautifulSoup(processed_html, "html.parser")
                for child in content_soup.children:
                    details.append(child)

            if not details_processed:
                break

        return soup

    def _preprocess_markdown(self, markdown_text):
        """Preprocessa Markdown antes da conversão"""
        markdown_text = self._improve_italic_conversion(markdown_text)

        markdown_text = self._clean_gemini_references(markdown_text)
        markdown_text = self._remove_old_generation_dates(markdown_text)

        lines = markdown_text.split("\n")
        processed_lines = []

        for i, line in enumerate(lines):
            processed_lines.append(line)

            if i < len(lines) - 1:
                next_line = lines[i + 1].strip()

                if (
                    next_line.startswith("|")
                    and not line.strip().startswith("|")
                    and line.strip()
                    and processed_lines[-1] != ""
                ):
                    processed_lines.append("")

        return "\n".join(processed_lines)

    def _remove_metadata_paragraphs(self, markdown_text):
        """
        Remove os parágrafos de metadados do início do markdown para evitar duplicação
        Os parágrafos estão em formato: **Campo:** valor com dois espaços no final (markdown line break)

        Suporta formatos novos e antigos:
        - Novo: Tipo de Ação, Autor(es), Réu(s), Data desta Análise
        - Antigo: Exequente(s), Executado(s), Data da Análise
        """
        lines = markdown_text.split("\n")
        cleaned_lines = []
        in_metadata_block = False
        found_h1 = False

        for _i, line in enumerate(lines):
            stripped = line.strip()

            if stripped.startswith("# "):
                found_h1 = True
                cleaned_lines.append(line)
                continue

            if found_h1 and not in_metadata_block and not stripped:
                cleaned_lines.append(line)
                in_metadata_block = True
                continue

            if in_metadata_block:
                if (
                    stripped.startswith("**Processo Principal")
                    or stripped.startswith("**Tipo de Ação")
                    or stripped.startswith("**Autor")
                    or stripped.startswith("**Réu")
                    or stripped.startswith("**Exequente")
                    or stripped.startswith("**Executado")
                    or stripped.startswith("**Vara:")
                    or stripped.startswith("**Data desta Análise")
                    or stripped.startswith("**Data da Análise")
                ):
                    continue
                elif not stripped:
                    in_metadata_block = False
                    cleaned_lines.append(line)
                    continue
                else:
                    in_metadata_block = False
                    cleaned_lines.append(line)
            else:
                cleaned_lines.append(line)

        return "\n".join(cleaned_lines)

    def convert(self, markdown_text, remove_header=True, remove_metadata_section=False):
        """
        Converte markdown para HTML

        Args:
            markdown_text: Texto markdown a ser convertido
            remove_header: Remove o primeiro H1 do conteúdo (padrão: True)
            remove_metadata_section: Remove a seção "INFORMAÇÕES DO TÍTULO EXECUTIVO" (padrão: False)
        """
        markdown_text = self._remove_metadata_paragraphs(markdown_text)
        markdown_text = self._preprocess_markdown(markdown_text)
        markdown_text = self._preprocess_details_markdown(markdown_text)

        md = self._create_md_instance()
        html = md.convert(markdown_text)

        soup = BeautifulSoup(html, "html.parser")

        if remove_header:
            first_h1 = soup.find("h1")
            if first_h1 and isinstance(first_h1, Tag):
                first_h1.decompose()

        if remove_metadata_section:
            h2_list = soup.find_all("h2")
            for h2 in h2_list:
                if isinstance(h2, Tag):
                    h2_text = h2.get_text().strip()
                    if "INFORMAÇÕES DO TÍTULO EXECUTIVO" in h2_text.upper() or (
                        h2_text.startswith("1.") and "INFORMAÇÕES" in h2_text.upper()
                    ):
                        next_elem = h2.find_next_sibling()
                        h2.decompose()

                        while next_elem:
                            if isinstance(next_elem, Tag) and next_elem.name in [
                                "h1",
                                "h2",
                            ]:
                                break
                            next_sibling = next_elem.find_next_sibling()
                            if isinstance(next_elem, Tag):
                                next_elem.decompose()
                            next_elem = next_sibling
                        break

        soup = self._clean_empty_table_cells(soup)
        # soup = self._format_risk_actions(soup)  # Removido - formatação manual pelo usuário
        soup = self._process_details_content(soup)

        for table in soup.find_all("table"):
            table["class"] = table.get("class", [])

        for p in soup.find_all("p"):
            text = p.get_text()
            if text.strip().startswith("Classificação:") and "IRRECUPERÁVEL" in text:
                p["class"] = p.get("class", []) + ["classification-info"]

        # Formatação automática de risco removida - usuário prefere formatação manual
        # for strong in soup.find_all('strong'):
        #     text = strong.get_text().strip().upper()
        #     if 'ALTO' in text or 'CRÍTICO' in text:
        #         strong['class'] = strong.get('class', []) + ['risk-alto']
        #     elif 'MÉDIO' in text or 'MEDIO' in text:
        #         strong['class'] = strong.get('class', []) + ['risk-medio']
        #     elif 'BAIXO' in text:
        #         strong['class'] = strong.get('class', []) + ['risk-baixo']

        html = str(soup)
        html = self._process_document_references(html)

        html = re.sub(
            r'<span class="reference-span">(<span class="reference-span">[^<]+</span>)</span>',
            r"\1",
            html,
        )

        return html

    def extract_title(self, markdown_text):
        lines = markdown_text.split("\n")
        for line in lines:
            if line.startswith("# "):
                return line.replace("# ", "").strip()
        return "Relatório de Análise"

    def _extract_from_table(self, markdown_text):
        """
        Extrai metadados da tabela markdown "INFORMAÇÕES DO TÍTULO EXECUTIVO"
        """
        metadata = {}

        md_temp = self._create_md_instance()
        html_temp = md_temp.convert(markdown_text)
        soup_temp = BeautifulSoup(html_temp, "html.parser")

        for table in soup_temp.find_all("table"):
            rows = table.find_all("tr")
            for row in rows:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    param_cell = cells[0].get_text().strip()
                    value_cell = cells[1]

                    if "exequente" in param_cell.lower():
                        metadata["exequente"] = value_cell.get_text().strip()
                    elif "executado" in param_cell.lower():
                        br_tags = value_cell.find_all("br")
                        if br_tags:
                            for br in br_tags:
                                br.replace_with(", ")
                        value_text = value_cell.get_text().strip()
                        value_text = re.sub(r"\s*,\s*", ", ", value_text)
                        value_text = re.sub(r",\s*,", ",", value_text)
                        if len(value_text) > 250:
                            parts = [
                                p.strip() for p in value_text.split(",") if p.strip()
                            ]
                            if len(parts) > 4:
                                value_text = ", ".join(parts[:4]) + "..."
                        metadata["executado"] = value_text
                    elif "valor da causa" in param_cell.lower():
                        metadata["valor_causa"] = value_cell.get_text().strip()
                    elif "natureza do tributo" in param_cell.lower():
                        metadata["natureza_tributo"] = value_cell.get_text().strip()
                    elif "data de inscrição" in param_cell.lower():
                        metadata["data_inscricao"] = value_cell.get_text().strip()
                    elif "encargos" in param_cell.lower():
                        encargos_text = value_cell.get_text().strip()
                        if len(encargos_text) > 300:
                            encargos_text = encargos_text[:300] + "..."
                        metadata["encargos"] = encargos_text
                    elif "certidão de dívida ativa" in param_cell.lower() or (
                        "cda" in param_cell.lower() and "nº" in param_cell.lower()
                    ):
                        metadata["cda"] = value_cell.get_text().strip()
                    elif "vara" in param_cell.lower():
                        metadata["vara"] = value_cell.get_text().strip()

        return metadata

    def _extract_from_paragraphs(self, markdown_text):
        """
        Extrai metadados dos parágrafos em negrito no início do markdown
        Formato esperado: **Campo:** Valor

        Suporta formatos novos e antigos:
        - Novo: Tipo de Ação, Autor(es), Réu(s), Data desta Análise
        - Antigo: Exequente(s), Executado(s), Data da Análise
        """
        metadata = {}
        lines = markdown_text.split("\n")

        for line in lines:
            line = line.strip()

            if (
                not line
                or line.startswith("#")
                or line.startswith("<details>")
                or line.startswith("|")
            ):
                if line.startswith("|") or line.startswith("<details>"):
                    break
                continue

            if (
                "**Processo Principal nº:**" in line
                or "**Processo Principal n°:**" in line
            ):
                valor = re.sub(r"\*\*.*?:\*\*", "", line).strip()
                metadata["processo"] = valor
            elif "**Tipo de Ação:**" in line:
                valor = re.sub(r"\*\*.*?:\*\*", "", line).strip()
                metadata["tipo_acao"] = valor
            # Novos campos (Autor/Réu) com prioridade, depois antigos (Exequente/Executado)
            elif "**Autor(es):**" in line or "**Autor:**" in line:
                valor = re.sub(r"\*\*.*?:\*\*", "", line).strip()
                metadata["autor"] = valor
            elif "**Exequente(s):**" in line:
                valor = re.sub(r"\*\*.*?:\*\*", "", line).strip()
                metadata["exequente"] = valor
            elif "**Réu(s):**" in line or "**Réu:**" in line:
                valor = re.sub(r"\*\*.*?:\*\*", "", line).strip()
                metadata["reu"] = valor
            elif "**Executado(s):**" in line:
                valor = re.sub(r"\*\*.*?:\*\*", "", line).strip()
                metadata["executado"] = valor
            elif "**Vara:**" in line:
                valor = re.sub(r"\*\*.*?:\*\*", "", line).strip()
                metadata["vara"] = valor
            # Novo formato "Data desta Análise" com prioridade, depois antigo "Data da Análise"
            elif "**Data desta Análise:**" in line or "**Data da Análise:**" in line:
                valor = re.sub(r"\*\*.*?:\*\*", "", line).strip()
                metadata["data"] = valor

        return metadata

    def extract_metadata(self, markdown_text):
        """
        Extrai metadados do markdown - APENAS o que existe, sem adivinhar.
        - Processo: extraído do H1 title ou parágrafos em negrito
        - Demais campos: extraídos de parágrafos em negrito ou da tabela "INFORMAÇÕES DO TÍTULO EXECUTIVO"

        PRIORIDADE: Campos do cabeçalho extraídos dos parágrafos NÃO são sobrescritos pelos dados da tabela.

        Suporta formatos novos e antigos:
        - Novo: tipo_acao, autor, reu
        - Antigo: exequente, executado
        """
        metadata = {
            "processo": "",
            "tipo_acao": "",
            "autor": "",
            "reu": "",
            "exequente": "",
            "executado": "",
            "valor_causa": "",
            "cda": "",
            "natureza_tributo": "",
            "data_inscricao": "",
            "encargos": "",
            "vara": "",
            "data": "",
        }

        # Campos do cabeçalho que não devem ser sobrescritos
        header_fields = [
            "processo",
            "tipo_acao",
            "autor",
            "reu",
            "exequente",
            "executado",
            "vara",
            "data",
        ]

        # Extrai dos parágrafos (valores limpos, sem CPF/CNPJ)
        paragraph_metadata = self._extract_from_paragraphs(markdown_text)
        metadata.update(paragraph_metadata)

        if not metadata["processo"]:
            processo_match = re.search(
                r"(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})", markdown_text
            )
            if processo_match:
                metadata["processo"] = processo_match.group(1)

        # Extrai das tabelas (valores com CPF/CNPJ/CDA)
        table_metadata = self._extract_from_table(markdown_text)

        # Merge seletivo: só preenche campos vazios ou campos que não são do cabeçalho
        for key, value in table_metadata.items():
            if key in header_fields:
                # Campos do cabeçalho: só preenche se estiver vazio
                if not metadata[key] and value:
                    metadata[key] = value
            else:
                # Campos extras (valor_causa, cda, etc): sempre preenche
                if value:
                    metadata[key] = value

        for key in metadata:
            if metadata[key]:
                metadata[key] = re.sub(r"\*\*", "", metadata[key])
                metadata[key] = metadata[key].strip()

        return metadata
