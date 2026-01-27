"""Blueprint CRUD de processos (auth_required read, admin_required write)."""

from flask import Blueprint, jsonify, request

from utils.auth import admin_required, auth_required
from utils.supabase_client import supa_service

processos_bp = Blueprint("processos", __name__)


@processos_bp.route("/api/processos", methods=["GET"])
@auth_required
def list_processos():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        sort_field = request.args.get("sort_field", "created_at")
        sort_order = request.args.get("sort_order", "desc")
        search = request.args.get("search")
        caso_id = request.args.get("caso_id")
        tipo_tese = request.args.get("tipo_tese")
        recuperabilidade = request.args.get("recuperabilidade")
        uf = request.args.get("uf")
        status = request.args.get("status")

        filters = {}
        if caso_id:
            filters["caso_id"] = caso_id
        if tipo_tese:
            filters["tipo_tese"] = tipo_tese
        if recuperabilidade:
            filters["recuperabilidade"] = recuperabilidade
        if uf:
            filters["uf"] = uf
        if status:
            filters["status"] = status

        result = supa_service.list_processos(
            filters=filters,
            page=page,
            per_page=per_page,
            sort_field=sort_field,
            sort_order=sort_order,
            search=search,
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@processos_bp.route("/api/processos", methods=["POST"])
@admin_required
def create_processo():
    try:
        data = request.get_json()
        if not data or not data.get("numero_cnj") or not data.get("caso_id"):
            return (
                jsonify({"error": "Campos 'numero_cnj' e 'caso_id' sao obrigatorios"}),
                400,
            )

        result = supa_service.create_processo(data)
        return jsonify({"success": True, "data": result.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@processos_bp.route("/api/processos/<processo_id>", methods=["GET"])
@auth_required
def get_processo(processo_id):
    try:
        processo = supa_service.get_processo(processo_id)
        if not processo:
            return jsonify({"error": "Processo nao encontrado"}), 404
        return jsonify({"success": True, "data": processo})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@processos_bp.route("/api/processos/<processo_id>", methods=["PUT"])
@admin_required
def update_processo(processo_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados invalidos"}), 400

        result = supa_service.update_processo(processo_id, data)
        return jsonify({"success": True, "data": result.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@processos_bp.route("/api/processos/<processo_id>", methods=["DELETE"])
@admin_required
def delete_processo(processo_id):
    try:
        supa_service.delete_processo(processo_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
