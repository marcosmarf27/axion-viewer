from weasyprint import CSS, HTML

try:
    from weasyprint.text.fonts import FontConfiguration
except ImportError:
    from weasyprint.fonts import FontConfiguration
import re


class PDFConverter:
    def __init__(self):
        self.font_config = FontConfiguration()

    def _extract_css_variables(self, html_content):
        """Extrai as variáveis CSS do HTML"""
        variables = {}

        root_pattern = r":root\s*{([^}]+)}"
        match = re.search(root_pattern, html_content, re.DOTALL)

        if match:
            root_content = match.group(1)
            var_pattern = r"--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);"
            for var_match in re.finditer(var_pattern, root_content):
                var_name = var_match.group(1)
                var_value = var_match.group(2).strip()
                variables[f"--{var_name}"] = var_value

        return variables

    def _replace_css_variables(self, html_content):
        """Substitui var(--variavel) pelos valores reais"""
        variables = self._extract_css_variables(html_content)

        def replace_var(match):
            var_name = match.group(1)
            return variables.get(var_name, match.group(0))

        var_usage_pattern = r"var\((--[a-zA-Z0-9_-]+)\)"
        processed_html = re.sub(var_usage_pattern, replace_var, html_content)

        return processed_html

    def html_to_pdf(self, html_content, output_path, orientation="portrait"):
        if not orientation:
            orientation = "portrait"
        orientation = orientation.strip().lower()
        if orientation not in ("portrait", "landscape"):
            raise ValueError(
                f"Orientação inválida: '{orientation}'. Use 'portrait' ou 'landscape'"
            )

        try:
            processed_html = self._replace_css_variables(html_content)

            html = HTML(string=processed_html)

            page_size = "A4" if orientation == "portrait" else "A4 landscape"

            css = CSS(
                string=f"""
                @page {{
                    size: {page_size};
                    margin: 1.5cm 1cm;
                    orphans: 2;
                    widows: 2;
                }}
                
                * {{
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }}
                
                body {{
                    font-size: 10pt;
                    line-height: 1.4;
                    orphans: 2;
                    widows: 2;
                }}
                
                .header {{
                    padding: 20px 15px !important;
                    margin-bottom: 15px !important;
                    page-break-inside: avoid;
                }}
                
                .header h1 {{
                    font-size: 18pt !important;
                    margin-bottom: 8px !important;
                    line-height: 1.2 !important;
                }}
                
                .header p {{
                    font-size: 9pt !important;
                    margin-bottom: 3px !important;
                }}
                
                .container {{
                    padding: 10px !important;
                }}
                
                .card {{
                    padding: 15px !important;
                    margin-bottom: 15px !important;
                    page-break-inside: avoid;
                }}
                
                h1 {{
                    font-size: 16pt !important;
                    margin: 15px 0 10px 0 !important;
                    page-break-after: avoid;
                    page-break-inside: avoid;
                }}
                
                h2 {{
                    font-size: 14pt !important;
                    margin: 12px 0 8px 0 !important;
                    page-break-after: avoid;
                    page-break-inside: avoid;
                }}
                
                h3 {{
                    font-size: 12pt !important;
                    margin: 10px 0 6px 0 !important;
                    page-break-after: avoid;
                    page-break-inside: avoid;
                }}
                
                h4, h5, h6 {{
                    font-size: 11pt !important;
                    margin: 8px 0 5px 0 !important;
                    page-break-after: avoid;
                }}
                
                p {{
                    font-size: 10pt !important;
                    margin-bottom: 8px !important;
                    orphans: 2;
                    widows: 2;
                }}
                
                .section-title {{
                    font-size: 13pt !important;
                    margin-bottom: 12px !important;
                    padding-bottom: 6px !important;
                    page-break-after: avoid;
                }}
                
                .subsection-title {{
                    font-size: 11pt !important;
                    margin: 10px 0 8px 0 !important;
                    page-break-after: avoid;
                }}
                
                table {{
                    font-size: 9pt !important;
                    margin: 10px 0 !important;
                    page-break-inside: avoid;
                }}
                
                table th {{
                    font-size: 9pt !important;
                    padding: 8px 10px !important;
                }}
                
                table td {{
                    font-size: 9pt !important;
                    padding: 6px 10px !important;
                }}
                
                thead {{
                    display: table-header-group;
                }}
                
                tr {{
                    page-break-inside: avoid;
                }}
                
                ul, ol {{
                    font-size: 10pt !important;
                    margin: 8px 0 !important;
                    padding-left: 25px !important;
                }}
                
                li {{
                    margin-bottom: 4px !important;
                }}
                
                strong, b {{
                    font-weight: 700 !important;
                }}
                
                .alerta-box-critico,
                .alerta-box-medio,
                .alerta-box-baixo {{
                    padding: 10px !important;
                    margin: 12px 0 !important;
                    font-size: 10pt !important;
                    page-break-inside: avoid;
                }}
                
                .executive-summary {{
                    margin-top: -30px !important;
                    page-break-inside: avoid;
                }}
                
                .footer {{
                    padding: 20px 15px !important;
                    margin-top: 20px !important;
                    font-size: 9pt !important;
                }}
                
                .footer h3 {{
                    font-size: 12pt !important;
                }}
                
                .footer p {{
                    font-size: 8pt !important;
                }}
                
                /* Estilos para menus collapse no PDF (sempre expandidos) */
                details {{
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 5px;
                    padding: 12px !important;
                    margin: 12px 0 !important;
                    page-break-inside: avoid;
                }}
                
                /* CRÍTICO: Força o conteúdo de <details> a sempre aparecer no PDF */
                details > *:not(summary) {{
                    display: block !important;
                }}
                
                summary {{
                    font-weight: 700 !important;
                    font-size: 11pt !important;
                    padding: 8px !important;
                    margin: -12px -12px 10px -12px !important;
                    border-radius: 5px 5px 0 0;
                    background-color: rgba(190, 48, 0, 0.1);
                    display: block !important;
                }}
                
                summary::before {{
                    content: '▼ ';
                    color: #BE3000;
                }}
                
                details details {{
                    margin-left: 15px !important;
                    margin-top: 10px !important;
                    background-color: #fff;
                }}
                
                details details summary {{
                    font-size: 10pt !important;
                    background-color: rgba(190, 48, 0, 0.05);
                }}
            """,
                font_config=self.font_config,
            )

            html.write_pdf(
                output_path,
                stylesheets=[css],
                font_config=self.font_config,
                presentational_hints=True,
            )

            return True
        except Exception as e:
            raise Exception(f"Erro ao converter HTML para PDF: {str(e)}") from e

    def html_file_to_pdf(self, html_file_path, output_path, orientation="portrait"):
        if not orientation:
            orientation = "portrait"
        orientation = orientation.strip().lower()
        if orientation not in ("portrait", "landscape"):
            raise ValueError(
                f"Orientação inválida: '{orientation}'. Use 'portrait' ou 'landscape'"
            )

        try:
            with open(html_file_path, encoding="utf-8") as f:
                html_content = f.read()

            return self.html_to_pdf(html_content, output_path, orientation)
        except Exception as e:
            raise Exception(f"Erro ao ler arquivo HTML: {str(e)}") from e
