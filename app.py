import os
from datetime import datetime

from flask import (
    Flask,
    jsonify,
    render_template,
    request,
    send_file,
    send_from_directory,
)
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import Config
from utils.markdown_converter import MarkdownConverter
from utils.pdf_converter import PDFConverter
from utils.theme_manager import ThemeManager

app = Flask(__name__, static_folder="frontend/dist", static_url_path="")
CORS(app)
app.config.from_object(Config)

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)
os.makedirs(Config.CUSTOM_THEMES_FOLDER, exist_ok=True)

converter = MarkdownConverter()
theme_manager = ThemeManager(custom_themes_folder=Config.CUSTOM_THEMES_FOLDER)
pdf_converter = PDFConverter()


def generate_filename(extension="html"):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"relatorio_{timestamp}.{extension}"


@app.route("/")
def serve_frontend():
    if os.path.exists("frontend/dist/index.html"):
        return send_from_directory("frontend/dist", "index.html")
    else:
        return jsonify(
            {
                "message": "API de Conversão Markdown para HTML e PDF",
                "version": "2.0.0",
                "endpoints": {
                    "POST /api/convert": "Converte texto markdown para HTML",
                    "POST /api/convert/file": "Converte arquivo .md para HTML",
                    "POST /api/convert/pdf": "Converte texto markdown para PDF",
                    "POST /api/convert/file/pdf": "Converte arquivo .md para PDF",
                    "GET /api/generate-pdf/<html_filename>": "Converte HTML existente para PDF",
                    "GET /api/themes": "Lista temas disponíveis",
                    "GET /api/files": "Lista arquivos gerados",
                    "DELETE /api/files/<filename>": "Remove arquivo gerado",
                    "GET /api/health": "Status da API",
                },
            }
        )


@app.route("/<path:path>")
def serve_static(path):
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404

    if os.path.exists(os.path.join("frontend/dist", path)):
        return send_from_directory("frontend/dist", path)
    else:
        if os.path.exists("frontend/dist/index.html"):
            return send_from_directory("frontend/dist", "index.html")
        else:
            return jsonify({"error": "Frontend not built"}), 404


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})


@app.route("/api/files", methods=["GET"])
def list_files():
    try:
        files = []
        output_folder = Config.OUTPUT_FOLDER

        if os.path.exists(output_folder):
            for filename in os.listdir(output_folder):
                file_path = os.path.join(output_folder, filename)
                if os.path.isfile(file_path):
                    stat_info = os.stat(file_path)
                    files.append(
                        {
                            "filename": filename,
                            "size": stat_info.st_size,
                            "created_at": datetime.fromtimestamp(
                                stat_info.st_ctime
                            ).isoformat(),
                            "type": "pdf" if filename.endswith(".pdf") else "html",
                            "download_url": f"/api/download/{filename}",
                            "preview_url": f"/api/preview/{filename}"
                            if filename.endswith(".html")
                            else None,
                        }
                    )

        files.sort(key=lambda x: x["created_at"], reverse=True)

        return jsonify({"success": True, "files": files, "total": len(files)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/files/<filename>", methods=["DELETE"])
def delete_file(filename):
    try:
        safe_filename = os.path.basename(filename)

        if ".." in safe_filename or "/" in safe_filename or "\\" in safe_filename:
            return jsonify({"success": False, "error": "Nome de arquivo inválido"}), 400

        file_path = os.path.join(Config.OUTPUT_FOLDER, safe_filename)

        real_file_path = os.path.realpath(file_path)
        real_output_folder = os.path.realpath(Config.OUTPUT_FOLDER)

        if not real_file_path.startswith(real_output_folder):
            return jsonify({"success": False, "error": "Acesso negado"}), 403

        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": "Arquivo não encontrado"}), 404

        os.remove(file_path)

        return jsonify(
            {
                "success": True,
                "message": f"Arquivo {safe_filename} removido com sucesso",
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/files/all", methods=["DELETE"])
def delete_all_files():
    try:
        output_folder = Config.OUTPUT_FOLDER

        if not os.path.exists(output_folder):
            return jsonify(
                {
                    "success": True,
                    "message": "Nenhum arquivo para remover",
                    "deleted_count": 0,
                }
            )

        deleted_count = 0
        errors = []

        for filename in os.listdir(output_folder):
            file_path = os.path.join(output_folder, filename)
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                    deleted_count += 1
                except Exception as e:
                    errors.append(f"{filename}: {str(e)}")

        if errors:
            return jsonify(
                {
                    "success": False,
                    "message": f"{deleted_count} arquivos removidos, mas {len(errors)} falharam",
                    "deleted_count": deleted_count,
                    "errors": errors,
                }
            ), 207

        return jsonify(
            {
                "success": True,
                "message": f"{deleted_count} arquivo(s) removido(s) com sucesso",
                "deleted_count": deleted_count,
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/themes", methods=["GET"])
def list_themes():
    try:
        themes = theme_manager.list_themes()
        theme_details = []

        for theme_name in themes:
            config = theme_manager.get_theme_config(theme_name)
            theme_details.append(
                {
                    "name": theme_name,
                    "description": config.get("description", "Tema disponível"),
                    "colors": config.get("colors", {}),
                    "styling": config.get("styling", {}),
                    "fonts": config.get("fonts", {}),
                }
            )

        return jsonify({"success": True, "themes": theme_details})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/themes", methods=["POST"])
def create_theme():
    """Cria um novo tema com cores derivadas automaticamente"""
    try:
        data = request.get_json()

        if not data or "name" not in data:
            return jsonify(
                {"success": False, "error": 'Campo "name" é obrigatório'}
            ), 400

        theme_name = data.get("name", "").strip().lower()

        # Validar nome do tema
        if not theme_name or not theme_name.replace("_", "").replace("-", "").isalnum():
            return jsonify(
                {
                    "success": False,
                    "error": "Nome do tema deve conter apenas letras, números, hífens e underscores",
                }
            ), 400

        # Verificar se tema já existe
        existing_themes = theme_manager.list_themes()
        if theme_name in existing_themes:
            return jsonify(
                {"success": False, "error": f'Tema "{theme_name}" já existe'}
            ), 409

        # Cor principal (obrigatória ou padrão)
        primary_color = data.get("primary_color", "#0066CC")

        # Função para derivar cores a partir da cor principal
        def darken_color(hex_color, factor=0.3):
            """Escurece uma cor hex"""
            hex_color = hex_color.lstrip("#")
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            r = int(r * (1 - factor))
            g = int(g * (1 - factor))
            b = int(b * (1 - factor))
            return f"#{r:02x}{g:02x}{b:02x}"

        def get_rgba(hex_color, alpha=0.1):
            """Converte hex para rgba"""
            hex_color = hex_color.lstrip("#")
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            return f"rgba({r}, {g}, {b}, {alpha})"

        # Criar configuração do tema com cores derivadas
        new_config = {
            "name": theme_name,
            "description": data.get("description", f"Tema {theme_name}"),
            "colors": {
                "primary": primary_color,
                "dark": darken_color(primary_color, 0.4),
                "black_tone": darken_color(primary_color, 0.7),
                "white": "#ffffff",
                "light_gray": "#f8f9fa",
                "medium_gray": "#6c757d",
                "success": "#28a745",
                "warning": "#ffc107",
                "danger": "#dc3545",
                "light_success_bg": "rgba(40, 167, 69, 0.1)",
                "light_danger_bg": "rgba(220, 53, 69, 0.1)",
                "light_info_bg": get_rgba(primary_color, 0.1),
                "light_warning_bg": "rgba(255, 193, 7, 0.1)",
            },
            "styling": {
                "gradients": {"header_angle": "135deg", "footer_angle": "135deg"},
                "borders": {
                    "section_title": "2px",
                    "h1": "3px",
                    "h2": "2px",
                    "alert_boxes": "4px",
                    "summary_line": "2px",
                },
            },
            "fonts": {"primary": "Segoe UI, Tahoma, Geneva, Verdana, sans-serif"},
            "logo": data.get("logo", ""),
        }

        # Sobrescrever cores se fornecidas manualmente
        if "colors" in data:
            new_config["colors"].update(data["colors"])

        # Salvar o tema
        theme_manager.save_theme_config(theme_name, new_config)

        return jsonify(
            {
                "success": True,
                "message": f'Tema "{theme_name}" criado com sucesso',
                "theme": new_config,
            }
        ), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/themes/<theme_name>", methods=["DELETE"])
def delete_theme(theme_name):
    """Exclui um tema existente"""
    try:
        import shutil

        # Não permitir excluir o tema juridico (padrão)
        if theme_name == "juridico":
            return jsonify(
                {
                    "success": False,
                    "error": 'Não é possível excluir o tema padrão "juridico"',
                }
            ), 403

        # Validar nome do tema
        safe_theme_name = (
            os.path.basename(theme_name)
            .replace("..", "")
            .replace("/", "")
            .replace("\\", "")
        )

        if not safe_theme_name or safe_theme_name != theme_name:
            return jsonify(
                {"success": False, "error": f"Nome de tema inválido: {theme_name}"}
            ), 400

        # Verificar se tema existe
        theme_dir = os.path.join("templates", "themes", safe_theme_name)

        real_theme_dir = os.path.realpath(theme_dir)
        real_themes_folder = os.path.realpath(os.path.join("templates", "themes"))

        if not real_theme_dir.startswith(real_themes_folder):
            return jsonify({"success": False, "error": "Acesso negado"}), 403

        if not os.path.exists(theme_dir):
            return jsonify(
                {"success": False, "error": f'Tema "{theme_name}" não encontrado'}
            ), 404

        # Excluir o diretório do tema
        shutil.rmtree(theme_dir)

        return jsonify(
            {"success": True, "message": f'Tema "{theme_name}" excluído com sucesso'}
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/themes/<theme_name>", methods=["PUT"])
def update_theme(theme_name):
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "Dados inválidos"}), 400

        current_config = theme_manager.get_theme_config(theme_name)

        if "colors" in data:
            current_config["colors"].update(data["colors"])
        if "styling" in data:
            if "styling" not in current_config:
                current_config["styling"] = {}
            if "gradients" in data["styling"]:
                if "gradients" not in current_config["styling"]:
                    current_config["styling"]["gradients"] = {}
                current_config["styling"]["gradients"].update(
                    data["styling"]["gradients"]
                )
            if "borders" in data["styling"]:
                if "borders" not in current_config["styling"]:
                    current_config["styling"]["borders"] = {}
                current_config["styling"]["borders"].update(data["styling"]["borders"])
        if "fonts" in data:
            current_config["fonts"].update(data["fonts"])
        if "description" in data:
            current_config["description"] = data["description"]

        theme_manager.save_theme_config(theme_name, current_config)

        return jsonify(
            {
                "success": True,
                "message": f'Tema "{theme_name}" atualizado com sucesso',
                "theme": current_config,
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/themes/<theme_name>/rename", methods=["PATCH"])
def rename_theme(theme_name):
    """Renomeia um tema existente"""
    try:
        import shutil

        data = request.get_json()

        if not data or "new_name" not in data:
            return jsonify(
                {"success": False, "error": 'Campo "new_name" é obrigatório'}
            ), 400

        new_name = data.get("new_name", "").strip().lower().replace(" ", "-")

        # Validar nome do tema
        if not new_name or not new_name.replace("_", "").replace("-", "").isalnum():
            return jsonify(
                {
                    "success": False,
                    "error": "Nome do tema deve conter apenas letras, números, hífens e underscores",
                }
            ), 400

        # Não permitir renomear o tema juridico
        if theme_name == "juridico":
            return jsonify(
                {
                    "success": False,
                    "error": 'Não é possível renomear o tema padrão "juridico"',
                }
            ), 403

        # Verificar se o nome é o mesmo
        if theme_name == new_name:
            return jsonify(
                {
                    "success": True,
                    "message": "Nome não foi alterado",
                    "theme": theme_manager.get_theme_config(theme_name),
                }
            )

        # Verificar se o novo nome já existe
        existing_themes = theme_manager.list_themes()
        if new_name in existing_themes:
            return jsonify(
                {
                    "success": False,
                    "error": f'Já existe um tema com o nome "{new_name}"',
                }
            ), 409

        # Verificar se tema atual existe
        old_theme_dir = os.path.join("templates", "themes", theme_name)
        new_theme_dir = os.path.join("templates", "themes", new_name)

        if not os.path.exists(old_theme_dir):
            return jsonify(
                {"success": False, "error": f'Tema "{theme_name}" não encontrado'}
            ), 404

        # Validar caminhos (segurança)
        real_old_dir = os.path.realpath(old_theme_dir)
        real_new_dir = os.path.realpath(new_theme_dir)
        real_themes_folder = os.path.realpath(os.path.join("templates", "themes"))

        if not real_old_dir.startswith(
            real_themes_folder
        ) or not real_new_dir.startswith(real_themes_folder):
            return jsonify({"success": False, "error": "Acesso negado"}), 403

        # Renomear (mover) o diretório
        shutil.move(old_theme_dir, new_theme_dir)

        # Atualizar o nome dentro do config.json
        config = theme_manager.get_theme_config(new_name)
        config["name"] = new_name
        theme_manager.save_theme_config(new_name, config)

        return jsonify(
            {
                "success": True,
                "message": f'Tema renomeado de "{theme_name}" para "{new_name}"',
                "old_name": theme_name,
                "new_name": new_name,
                "theme": config,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/convert", methods=["POST"])
def convert_markdown():
    try:
        data = request.get_json()

        if not data or "markdown" not in data:
            return jsonify(
                {"success": False, "error": 'Campo "markdown" é obrigatório'}
            ), 400

        markdown_text = data.get("markdown", "")
        theme_name = data.get("theme", "juridico")
        # Normalize theme name to lowercase for case-insensitive matching
        theme_name = theme_name.lower().strip() if theme_name else "juridico"
        custom_config = data.get("custom_config", {})

        theme_config = theme_manager.get_theme_config(theme_name)

        if custom_config:
            if "colors" in custom_config:
                theme_config["colors"].update(custom_config["colors"])
            if "fonts" in custom_config:
                theme_config["fonts"].update(custom_config["fonts"])

        html_content = converter.convert(markdown_text)
        title = converter.extract_title(markdown_text)
        metadata = converter.extract_metadata(markdown_text)

        rendered_html = render_template(
            "base.html",
            title=title,
            header_title=title,
            content=html_content,
            theme=theme_config,
            metadata=metadata,
            current_year=datetime.now().year,
        )

        output_filename = generate_filename()
        output_path = os.path.join(Config.OUTPUT_FOLDER, output_filename)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(rendered_html)

        return jsonify(
            {
                "success": True,
                "html": rendered_html,
                "filename": output_filename,
                "download_url": f"/api/download/{output_filename}",
                "metadata": {
                    "title": title,
                    "theme": theme_name,
                    "generated_at": datetime.now().isoformat(),
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/convert/file", methods=["POST"])
def convert_file():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "Nenhum arquivo enviado"}), 400

        file = request.files["file"]

        if not file.filename or file.filename == "":
            return jsonify(
                {"success": False, "error": "Nenhum arquivo selecionado"}
            ), 400

        if not Config.allowed_file(file.filename):
            return jsonify(
                {
                    "success": False,
                    "error": "Tipo de arquivo não permitido. Use .md, .txt ou .markdown",
                }
            ), 400

        filename = secure_filename(file.filename)
        upload_path = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(upload_path)

        with open(upload_path, encoding="utf-8") as f:
            markdown_text = f.read()

        theme_name = request.form.get("theme", "juridico")
        # Normalize theme name to lowercase for case-insensitive matching
        theme_name = theme_name.lower().strip() if theme_name else "juridico"

        theme_config = theme_manager.get_theme_config(theme_name)

        html_content = converter.convert(markdown_text)
        title = converter.extract_title(markdown_text)
        metadata = converter.extract_metadata(markdown_text)

        rendered_html = render_template(
            "base.html",
            title=title,
            header_title=title,
            content=html_content,
            theme=theme_config,
            metadata=metadata,
            current_year=datetime.now().year,
        )

        output_filename = generate_filename()
        output_path = os.path.join(Config.OUTPUT_FOLDER, output_filename)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(rendered_html)

        os.remove(upload_path)

        return jsonify(
            {
                "success": True,
                "html": rendered_html[:500] + "..."
                if len(rendered_html) > 500
                else rendered_html,
                "filename": output_filename,
                "download_url": f"/api/download/{output_filename}",
                "metadata": {
                    "title": title,
                    "theme": theme_name,
                    "original_filename": filename,
                    "generated_at": datetime.now().isoformat(),
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/download/<filename>", methods=["GET"])
def download_file(filename):
    try:
        file_path = os.path.join(Config.OUTPUT_FOLDER, filename)

        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": "Arquivo não encontrado"}), 404

        mimetype = "application/pdf" if filename.endswith(".pdf") else "text/html"

        return send_file(
            file_path, as_attachment=True, download_name=filename, mimetype=mimetype
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/preview/<filename>", methods=["GET"])
def preview_file(filename):
    try:
        file_path = os.path.join(Config.OUTPUT_FOLDER, filename)

        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": "Arquivo não encontrado"}), 404

        with open(file_path, encoding="utf-8") as f:
            html_content = f.read()

        return html_content

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/convert/pdf", methods=["POST"])
def convert_markdown_to_pdf():
    try:
        data = request.get_json()

        if not data or "markdown" not in data:
            return jsonify(
                {"success": False, "error": 'Campo "markdown" é obrigatório'}
            ), 400

        markdown_text = data.get("markdown", "")
        theme_name = data.get("theme", "juridico")
        # Normalize theme name to lowercase for case-insensitive matching
        theme_name = theme_name.lower().strip() if theme_name else "juridico"
        custom_config = data.get("custom_config", {})
        orientation = data.get("orientation", "portrait")

        theme_config = theme_manager.get_theme_config(theme_name)

        if custom_config:
            if "colors" in custom_config:
                theme_config["colors"].update(custom_config["colors"])
            if "fonts" in custom_config:
                theme_config["fonts"].update(custom_config["fonts"])

        html_content = converter.convert(markdown_text)
        title = converter.extract_title(markdown_text)
        metadata = converter.extract_metadata(markdown_text)

        rendered_html = render_template(
            "base.html",
            title=title,
            header_title=title,
            content=html_content,
            theme=theme_config,
            metadata=metadata,
            current_year=datetime.now().year,
        )

        html_filename = generate_filename("html")
        html_path = os.path.join(Config.OUTPUT_FOLDER, html_filename)

        with open(html_path, "w", encoding="utf-8") as f:
            f.write(rendered_html)

        pdf_filename = generate_filename("pdf")
        pdf_path = os.path.join(Config.OUTPUT_FOLDER, pdf_filename)

        pdf_converter.html_to_pdf(rendered_html, pdf_path, orientation)

        return jsonify(
            {
                "success": True,
                "pdf_filename": pdf_filename,
                "html_filename": html_filename,
                "pdf_download_url": f"/api/download/{pdf_filename}",
                "html_download_url": f"/api/download/{html_filename}",
                "metadata": {
                    "title": title,
                    "theme": theme_name,
                    "orientation": orientation,
                    "generated_at": datetime.now().isoformat(),
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/convert/file/pdf", methods=["POST"])
def convert_file_to_pdf():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "Nenhum arquivo enviado"}), 400

        file = request.files["file"]

        if not file.filename or file.filename == "":
            return jsonify(
                {"success": False, "error": "Nenhum arquivo selecionado"}
            ), 400

        if not Config.allowed_file(file.filename):
            return jsonify(
                {
                    "success": False,
                    "error": "Tipo de arquivo não permitido. Use .md, .txt ou .markdown",
                }
            ), 400

        filename = secure_filename(file.filename)
        upload_path = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(upload_path)

        with open(upload_path, encoding="utf-8") as f:
            markdown_text = f.read()

        theme_name = request.form.get("theme", "juridico")
        # Normalize theme name to lowercase for case-insensitive matching
        theme_name = theme_name.lower().strip() if theme_name else "juridico"
        orientation = request.form.get("orientation", "portrait")

        theme_config = theme_manager.get_theme_config(theme_name)

        html_content = converter.convert(markdown_text)
        title = converter.extract_title(markdown_text)
        metadata = converter.extract_metadata(markdown_text)

        rendered_html = render_template(
            "base.html",
            title=title,
            header_title=title,
            content=html_content,
            theme=theme_config,
            metadata=metadata,
            current_year=datetime.now().year,
        )

        html_filename = generate_filename("html")
        html_path = os.path.join(Config.OUTPUT_FOLDER, html_filename)

        with open(html_path, "w", encoding="utf-8") as f:
            f.write(rendered_html)

        pdf_filename = generate_filename("pdf")
        pdf_path = os.path.join(Config.OUTPUT_FOLDER, pdf_filename)

        pdf_converter.html_to_pdf(rendered_html, pdf_path, orientation)

        os.remove(upload_path)

        return jsonify(
            {
                "success": True,
                "pdf_filename": pdf_filename,
                "html_filename": html_filename,
                "pdf_download_url": f"/api/download/{pdf_filename}",
                "html_download_url": f"/api/download/{html_filename}",
                "metadata": {
                    "title": title,
                    "theme": theme_name,
                    "orientation": orientation,
                    "original_filename": filename,
                    "generated_at": datetime.now().isoformat(),
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/generate-pdf/<html_filename>", methods=["GET"])
def generate_pdf_from_html(html_filename):
    try:
        safe_filename = os.path.basename(html_filename)

        if not safe_filename.endswith(".html"):
            return jsonify(
                {
                    "success": False,
                    "error": "Nome de arquivo inválido. Deve terminar com .html",
                }
            ), 400

        if ".." in safe_filename or "/" in safe_filename or "\\" in safe_filename:
            return jsonify({"success": False, "error": "Nome de arquivo inválido"}), 400

        html_path = os.path.join(Config.OUTPUT_FOLDER, safe_filename)

        real_html_path = os.path.realpath(html_path)
        real_output_folder = os.path.realpath(Config.OUTPUT_FOLDER)

        if not real_html_path.startswith(real_output_folder):
            return jsonify({"success": False, "error": "Acesso negado"}), 403

        if not os.path.exists(html_path):
            return jsonify(
                {"success": False, "error": "Arquivo HTML não encontrado"}
            ), 404

        orientation = request.args.get("orientation", "portrait")

        pdf_filename = safe_filename.replace(".html", ".pdf")
        pdf_path = os.path.join(Config.OUTPUT_FOLDER, pdf_filename)

        pdf_converter.html_file_to_pdf(html_path, pdf_path, orientation)

        return jsonify(
            {
                "success": True,
                "pdf_filename": pdf_filename,
                "pdf_download_url": f"/api/download/{pdf_filename}",
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    import os

    port = int(os.getenv("FLASK_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
