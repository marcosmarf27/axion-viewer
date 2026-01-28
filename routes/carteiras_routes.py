"""Blueprint CRUD de carteiras (auth_required read, admin_required write)."""

from flask import Blueprint, g, jsonify, request

from utils.auth import admin_required, auth_required, get_client_carteira_ids
from utils.supabase_client import supa_service

carteiras_bp = Blueprint("carteiras", __name__)


@carteiras_bp.route("/api/carteiras", methods=["GET"])
@auth_required
def list_carteiras():
    try:
        # Cliente: retornar apenas carteiras com acesso
        if g.user.get("role") != "admin":
            carteiras = supa_service.get_client_carteiras(g.user_id)
            return jsonify(
                {
                    "data": carteiras,
                    "pagination": {
                        "page": 1,
                        "per_page": len(carteiras),
                        "total": len(carteiras),
                        "total_pages": 1,
                    },
                }
            )

        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        sort_field = request.args.get("sort_field", "created_at")
        sort_order = request.args.get("sort_order", "desc")
        search = request.args.get("search")
        cliente_id = request.args.get("cliente_id")
        status = request.args.get("status")

        filters = {}
        if cliente_id:
            filters["cliente_id"] = cliente_id
        if status:
            filters["status"] = status

        result = supa_service.list_carteiras(
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


@carteiras_bp.route("/api/carteiras", methods=["POST"])
@admin_required
def create_carteira():
    try:
        data = request.get_json()
        if not data or not data.get("nome") or not data.get("cliente_id"):
            return jsonify(
                {"error": "Campos 'nome' e 'cliente_id' sao obrigatorios"}
            ), 400

        result = supa_service.create_carteira(data)
        return jsonify({"success": True, "data": result.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@carteiras_bp.route("/api/carteiras/<carteira_id>", methods=["GET"])
@auth_required
def get_carteira(carteira_id):
    try:
        # Cliente: verificar acesso
        if g.user.get("role") != "admin":
            allowed = get_client_carteira_ids(g.user_id)
            if carteira_id not in allowed:
                return jsonify({"error": "Acesso negado"}), 403

        carteira = supa_service.get_carteira(carteira_id)
        if not carteira:
            return jsonify({"error": "Carteira nao encontrada"}), 404
        return jsonify({"success": True, "data": carteira})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@carteiras_bp.route("/api/carteiras/<carteira_id>", methods=["PUT"])
@admin_required
def update_carteira(carteira_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados invalidos"}), 400

        result = supa_service.update_carteira(carteira_id, data)
        return jsonify({"success": True, "data": result.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@carteiras_bp.route("/api/carteiras/<carteira_id>", methods=["DELETE"])
@admin_required
def delete_carteira(carteira_id):
    try:
        supa_service.delete_carteira(carteira_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
