"""Blueprint CRUD de casos (auth_required read, admin_required write)."""

from flask import Blueprint, jsonify, request

from utils.auth import admin_required, auth_required
from utils.supabase_client import supa_service

casos_bp = Blueprint("casos", __name__)


@casos_bp.route("/api/casos", methods=["GET"])
@auth_required
def list_casos():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        sort_field = request.args.get("sort_field", "created_at")
        sort_order = request.args.get("sort_order", "desc")
        search = request.args.get("search")
        carteira_id = request.args.get("carteira_id")
        tese = request.args.get("tese")
        recuperabilidade = request.args.get("recuperabilidade")
        status = request.args.get("status")

        filters = {}
        if carteira_id:
            filters["carteira_id"] = carteira_id
        if tese:
            filters["tese"] = tese
        if recuperabilidade:
            filters["recuperabilidade"] = recuperabilidade
        if status:
            filters["status"] = status

        result = supa_service.list_casos(
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


@casos_bp.route("/api/casos", methods=["POST"])
@admin_required
def create_caso():
    try:
        data = request.get_json()
        if not data or not data.get("nome") or not data.get("carteira_id"):
            return jsonify(
                {"error": "Campos 'nome' e 'carteira_id' sao obrigatorios"}
            ), 400

        result = supa_service.create_caso(data)
        return jsonify({"success": True, "data": result.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@casos_bp.route("/api/casos/<caso_id>", methods=["GET"])
@auth_required
def get_caso(caso_id):
    try:
        caso = supa_service.get_caso(caso_id)
        if not caso:
            return jsonify({"error": "Caso nao encontrado"}), 404
        return jsonify({"success": True, "data": caso})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@casos_bp.route("/api/casos/<caso_id>", methods=["PUT"])
@admin_required
def update_caso(caso_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados invalidos"}), 400

        result = supa_service.update_caso(caso_id, data)
        return jsonify({"success": True, "data": result.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@casos_bp.route("/api/casos/<caso_id>", methods=["DELETE"])
@admin_required
def delete_caso(caso_id):
    try:
        supa_service.delete_caso(caso_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
