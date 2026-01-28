"""Blueprint de download e preview via Supabase Storage."""

import logging
import os
import urllib.request
from datetime import datetime

from flask import Blueprint, g, jsonify, redirect, request

from config import Config
from utils.auth import admin_required, auth_required, get_client_carteira_ids
from utils.markdown_converter import MarkdownConverter
from utils.pdf_converter import PDFConverter
from utils.supabase_client import supa_service

logger = logging.getLogger(__name__)

files_bp = Blueprint("files", __name__)

converter = MarkdownConverter()
pdf_converter = PDFConverter()


@files_bp.route("/api/download/<document_id>", methods=["GET"])
@auth_required
def download_document(document_id):
    """Redireciona para signed URL do documento para download."""
    try:
        doc = supa_service.get_documento(document_id)
        if not doc:
            return jsonify({"error": "Documento nao encontrado"}), 404

        # Cliente: verificar acesso via processo -> caso -> carteira
        if g.user.get("role") != "admin" and doc.get("processo_id"):
            processo = supa_service.get_processo(doc["processo_id"])
            if processo:
                caso = supa_service.get_caso(processo.get("caso_id"))
                if caso:
                    allowed = get_client_carteira_ids(g.user_id)
                    if caso.get("carteira_id") not in allowed:
                        return jsonify({"error": "Acesso negado"}), 403

        signed_url = supa_service.get_signed_url(doc["storage_path"], download=True)
        if not signed_url:
            return jsonify({"error": "Erro ao gerar URL de download"}), 500

        return redirect(signed_url)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@files_bp.route("/api/preview/<document_id>", methods=["GET"])
@auth_required
def preview_document(document_id):
    """Retorna signed URL para preview ou download de documento."""
    try:
        doc = supa_service.get_documento(document_id)
        if not doc:
            return jsonify({"error": "Documento nao encontrado"}), 404

        # Cliente: verificar acesso via processo -> caso -> carteira
        if g.user.get("role") != "admin" and doc.get("processo_id"):
            processo = supa_service.get_processo(doc["processo_id"])
            if processo:
                caso = supa_service.get_caso(processo.get("caso_id"))
                if caso:
                    allowed = get_client_carteira_ids(g.user_id)
                    if caso.get("carteira_id") not in allowed:
                        return jsonify({"error": "Acesso negado"}), 403

        download = request.args.get("download") == "true"
        signed_url = supa_service.get_signed_url(doc["storage_path"], download=download)
        if not signed_url:
            return jsonify({"error": "Erro ao gerar URL"}), 500

        return jsonify({"success": True, "signed_url": signed_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@files_bp.route("/api/generate-pdf/<document_id>", methods=["GET"])
@admin_required
def generate_pdf_from_document(document_id):
    """Baixa HTML do Storage, converte para PDF, faz upload do PDF."""
    try:
        doc = supa_service.get_documento(document_id)
        if not doc:
            return jsonify({"error": "Documento nao encontrado"}), 404

        if doc["file_type"] != "html":
            return jsonify({"error": "Documento nao e HTML"}), 400

        # Baixar HTML do Storage via signed URL
        signed_url = supa_service.get_signed_url(doc["storage_path"])
        if not signed_url:
            return jsonify({"error": "Erro ao acessar documento"}), 500

        # Baixar conteudo HTML
        with urllib.request.urlopen(signed_url) as response:
            html_content = response.read().decode("utf-8")

        orientation = request.args.get("orientation", "portrait")

        # Gerar PDF temporario
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_filename = f"relatorio_{timestamp}.pdf"
        pdf_path = os.path.join(Config.OUTPUT_FOLDER, pdf_filename)

        pdf_converter.html_to_pdf(html_content, pdf_path, orientation)

        with open(pdf_path, "rb") as f:
            pdf_content = f.read()

        try:
            os.remove(pdf_path)
        except OSError:
            logger.warning("Falha ao remover PDF temporario: %s", pdf_path)

        # Upload PDF para Storage
        pdf_storage_path = supa_service.upload_file(pdf_content, "pdf")

        try:
            pdf_doc = supa_service.create_documento(
                {
                    "processo_id": doc.get("processo_id"),
                    "filename": pdf_filename,
                    "file_type": "pdf",
                    "storage_path": pdf_storage_path,
                    "file_size": len(pdf_content),
                    "title": doc.get("title", ""),
                    "theme": doc.get("theme", ""),
                    "created_by": doc.get("created_by") or g.user_id,
                }
            )
        except Exception:
            supa_service.delete_file(pdf_storage_path)
            raise

        pdf_signed_url = supa_service.get_signed_url(pdf_storage_path)

        return jsonify(
            {
                "success": True,
                "pdf_filename": pdf_filename,
                "pdf_download_url": f"/api/download/{pdf_doc.data[0]['id']}",
                "document_id": pdf_doc.data[0]["id"],
                "signed_url": pdf_signed_url,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
