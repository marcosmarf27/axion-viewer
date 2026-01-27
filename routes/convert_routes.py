"""Blueprint de conversao MD->HTML/PDF com Storage + registro DB."""

import os
from datetime import datetime

from flask import Blueprint, g, jsonify, render_template, request
from werkzeug.utils import secure_filename

from config import Config
from utils.auth import admin_required
from utils.markdown_converter import MarkdownConverter
from utils.pdf_converter import PDFConverter
from utils.supabase_client import supa_service
from utils.theme_manager import ThemeManager

convert_bp = Blueprint("convert", __name__)

converter = MarkdownConverter()
theme_manager = ThemeManager(custom_themes_folder=Config.CUSTOM_THEMES_FOLDER)
pdf_converter = PDFConverter()


def generate_filename(extension="html"):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"relatorio_{timestamp}.{extension}"


@convert_bp.route("/api/convert", methods=["POST"])
@admin_required
def convert_markdown():
    try:
        data = request.get_json()

        if not data or "markdown" not in data:
            return jsonify(
                {"success": False, "error": 'Campo "markdown" é obrigatório'}
            ), 400

        markdown_text = data.get("markdown", "")
        theme_name = data.get("theme", "juridico")
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

        filename = generate_filename()

        # Upload para Supabase Storage + registro no banco
        storage_path = supa_service.upload_file(rendered_html.encode("utf-8"), "html")
        try:
            doc_record = supa_service.create_documento(
                {
                    "processo_id": data.get("processo_id"),
                    "filename": filename,
                    "file_type": "html",
                    "storage_path": storage_path,
                    "file_size": len(rendered_html.encode("utf-8")),
                    "title": data.get("title", title),
                    "theme": theme_name,
                    "created_by": g.user_id,
                }
            )
        except Exception:
            supa_service.delete_file(storage_path)
            raise

        signed_url = supa_service.get_signed_url(storage_path)

        return jsonify(
            {
                "success": True,
                "html": rendered_html,
                "filename": filename,
                "download_url": f"/api/download/{doc_record.data[0]['id']}",
                "metadata": {
                    "title": title,
                    "theme": theme_name,
                    "generated_at": datetime.now().isoformat(),
                },
                "document_id": doc_record.data[0]["id"],
                "signed_url": signed_url,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@convert_bp.route("/api/convert/file", methods=["POST"])
@admin_required
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

        original_filename = secure_filename(file.filename)
        upload_path = os.path.join(Config.UPLOAD_FOLDER, original_filename)
        file.save(upload_path)

        with open(upload_path, encoding="utf-8") as f:
            markdown_text = f.read()

        theme_name = request.form.get("theme", "juridico")
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

        filename = generate_filename()

        os.remove(upload_path)

        # Upload para Supabase Storage + registro no banco
        storage_path = supa_service.upload_file(rendered_html.encode("utf-8"), "html")
        try:
            processo_id = request.form.get("processo_id") or None
            doc_title = request.form.get("title", title)
            doc_record = supa_service.create_documento(
                {
                    "processo_id": processo_id,
                    "filename": filename,
                    "original_name": original_filename,
                    "file_type": "html",
                    "storage_path": storage_path,
                    "file_size": len(rendered_html.encode("utf-8")),
                    "title": doc_title,
                    "theme": theme_name,
                    "created_by": g.user_id,
                }
            )
        except Exception:
            supa_service.delete_file(storage_path)
            raise

        signed_url = supa_service.get_signed_url(storage_path)

        return jsonify(
            {
                "success": True,
                "html": rendered_html[:500] + "..."
                if len(rendered_html) > 500
                else rendered_html,
                "filename": filename,
                "download_url": f"/api/download/{doc_record.data[0]['id']}",
                "metadata": {
                    "title": title,
                    "theme": theme_name,
                    "original_filename": original_filename,
                    "generated_at": datetime.now().isoformat(),
                },
                "document_id": doc_record.data[0]["id"],
                "signed_url": signed_url,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@convert_bp.route("/api/convert/pdf", methods=["POST"])
@admin_required
def convert_markdown_to_pdf():
    try:
        data = request.get_json()

        if not data or "markdown" not in data:
            return jsonify(
                {"success": False, "error": 'Campo "markdown" é obrigatório'}
            ), 400

        markdown_text = data.get("markdown", "")
        theme_name = data.get("theme", "juridico")
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
        pdf_filename = generate_filename("pdf")

        # Gerar PDF em arquivo temporario
        pdf_path = os.path.join(Config.OUTPUT_FOLDER, pdf_filename)
        pdf_converter.html_to_pdf(rendered_html, pdf_path, orientation)

        with open(pdf_path, "rb") as f:
            pdf_content = f.read()

        os.remove(pdf_path)

        # Upload HTML para Storage
        html_storage_path = supa_service.upload_file(
            rendered_html.encode("utf-8"), "html"
        )
        # Upload PDF para Storage
        pdf_storage_path = supa_service.upload_file(pdf_content, "pdf")

        processo_id = data.get("processo_id")
        doc_title = data.get("title", title)

        # Registrar HTML no banco
        try:
            html_doc = supa_service.create_documento(
                {
                    "processo_id": processo_id,
                    "filename": html_filename,
                    "file_type": "html",
                    "storage_path": html_storage_path,
                    "file_size": len(rendered_html.encode("utf-8")),
                    "title": doc_title,
                    "theme": theme_name,
                    "created_by": g.user_id,
                }
            )
        except Exception:
            supa_service.delete_file(html_storage_path)
            supa_service.delete_file(pdf_storage_path)
            raise

        # Registrar PDF no banco
        try:
            pdf_doc = supa_service.create_documento(
                {
                    "processo_id": processo_id,
                    "filename": pdf_filename,
                    "file_type": "pdf",
                    "storage_path": pdf_storage_path,
                    "file_size": len(pdf_content),
                    "title": doc_title,
                    "theme": theme_name,
                    "created_by": g.user_id,
                }
            )
        except Exception:
            supa_service.delete_file(pdf_storage_path)
            raise

        pdf_signed_url = supa_service.get_signed_url(pdf_storage_path)
        html_signed_url = supa_service.get_signed_url(html_storage_path)

        return jsonify(
            {
                "success": True,
                "pdf_filename": pdf_filename,
                "html_filename": html_filename,
                "pdf_download_url": f"/api/download/{pdf_doc.data[0]['id']}",
                "html_download_url": f"/api/download/{html_doc.data[0]['id']}",
                "metadata": {
                    "title": title,
                    "theme": theme_name,
                    "orientation": orientation,
                    "generated_at": datetime.now().isoformat(),
                },
                "pdf_document_id": pdf_doc.data[0]["id"],
                "html_document_id": html_doc.data[0]["id"],
                "pdf_signed_url": pdf_signed_url,
                "html_signed_url": html_signed_url,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@convert_bp.route("/api/convert/file/pdf", methods=["POST"])
@admin_required
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

        original_filename = secure_filename(file.filename)
        upload_path = os.path.join(Config.UPLOAD_FOLDER, original_filename)
        file.save(upload_path)

        with open(upload_path, encoding="utf-8") as f:
            markdown_text = f.read()

        theme_name = request.form.get("theme", "juridico")
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
        pdf_filename = generate_filename("pdf")

        # Gerar PDF em arquivo temporario
        pdf_path = os.path.join(Config.OUTPUT_FOLDER, pdf_filename)
        pdf_converter.html_to_pdf(rendered_html, pdf_path, orientation)

        with open(pdf_path, "rb") as f:
            pdf_content = f.read()

        os.remove(pdf_path)
        os.remove(upload_path)

        # Upload HTML e PDF para Storage
        html_storage_path = supa_service.upload_file(
            rendered_html.encode("utf-8"), "html"
        )
        pdf_storage_path = supa_service.upload_file(pdf_content, "pdf")

        processo_id = request.form.get("processo_id") or None
        doc_title = request.form.get("title", title)

        try:
            html_doc = supa_service.create_documento(
                {
                    "processo_id": processo_id,
                    "filename": html_filename,
                    "original_name": original_filename,
                    "file_type": "html",
                    "storage_path": html_storage_path,
                    "file_size": len(rendered_html.encode("utf-8")),
                    "title": doc_title,
                    "theme": theme_name,
                    "created_by": g.user_id,
                }
            )
        except Exception:
            supa_service.delete_file(html_storage_path)
            supa_service.delete_file(pdf_storage_path)
            raise

        try:
            pdf_doc = supa_service.create_documento(
                {
                    "processo_id": processo_id,
                    "filename": pdf_filename,
                    "original_name": original_filename,
                    "file_type": "pdf",
                    "storage_path": pdf_storage_path,
                    "file_size": len(pdf_content),
                    "title": doc_title,
                    "theme": theme_name,
                    "created_by": g.user_id,
                }
            )
        except Exception:
            supa_service.delete_file(pdf_storage_path)
            raise

        pdf_signed_url = supa_service.get_signed_url(pdf_storage_path)
        html_signed_url = supa_service.get_signed_url(html_storage_path)

        return jsonify(
            {
                "success": True,
                "pdf_filename": pdf_filename,
                "html_filename": html_filename,
                "pdf_download_url": f"/api/download/{pdf_doc.data[0]['id']}",
                "html_download_url": f"/api/download/{html_doc.data[0]['id']}",
                "metadata": {
                    "title": title,
                    "theme": theme_name,
                    "orientation": orientation,
                    "original_filename": original_filename,
                    "generated_at": datetime.now().isoformat(),
                },
                "pdf_document_id": pdf_doc.data[0]["id"],
                "html_document_id": html_doc.data[0]["id"],
                "pdf_signed_url": pdf_signed_url,
                "html_signed_url": html_signed_url,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
