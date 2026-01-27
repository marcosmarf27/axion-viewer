"""Blueprint CRUD de clientes (admin only)."""

from flask import Blueprint, jsonify, request

from utils.auth import admin_required
from utils.supabase_client import supa_service

clientes_bp = Blueprint("clientes", __name__)


@clientes_bp.route("/api/clientes", methods=["GET"])
@admin_required
def list_clientes():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        sort_field = request.args.get("sort_field", "created_at")
        sort_order = request.args.get("sort_order", "desc")
        search = request.args.get("search")
        status = request.args.get("status")

        filters = {}
        if status:
            filters["status"] = status

        result = supa_service.list_clientes(
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


@clientes_bp.route("/api/clientes", methods=["POST"])
@admin_required
def create_cliente():
    try:
        data = request.get_json()
        if not data or not data.get("nome"):
            return jsonify({"error": "Campo 'nome' e obrigatorio"}), 400

        result = supa_service.create_cliente(data)
        return jsonify({"success": True, "data": result.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@clientes_bp.route("/api/clientes/<cliente_id>", methods=["GET"])
@admin_required
def get_cliente(cliente_id):
    try:
        cliente = supa_service.get_cliente(cliente_id)
        if not cliente:
            return jsonify({"error": "Cliente nao encontrado"}), 404
        return jsonify({"success": True, "data": cliente})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@clientes_bp.route("/api/clientes/<cliente_id>", methods=["PUT"])
@admin_required
def update_cliente(cliente_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados invalidos"}), 400

        result = supa_service.update_cliente(cliente_id, data)
        return jsonify({"success": True, "data": result.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@clientes_bp.route("/api/clientes/<cliente_id>", methods=["DELETE"])
@admin_required
def delete_cliente(cliente_id):
    try:
        supa_service.delete_cliente(cliente_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
