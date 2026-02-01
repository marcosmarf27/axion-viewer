"""Blueprint CRUD de casos (auth_required read, admin_required write)."""

from flask import Blueprint, g, jsonify, request

from utils.auth import admin_required, auth_required, get_client_carteira_ids
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
        uf_principal = request.args.get("uf_principal")
        data_analise_desde = request.args.get("data_analise_desde")
        data_analise_ate = request.args.get("data_analise_ate")
        status = request.args.get("status")

        # Cliente: validar acesso a carteira
        if g.user.get("role") != "admin":
            allowed = get_client_carteira_ids(g.user_id)
            if carteira_id and carteira_id not in allowed:
                return jsonify(
                    {
                        "data": [],
                        "pagination": {
                            "page": 1,
                            "per_page": per_page,
                            "total": 0,
                            "total_pages": 1,
                        },
                    }
                )

        filters = {}
        if carteira_id:
            filters["carteira_id"] = carteira_id
        if tese:
            filters["tese"] = tese
        if recuperabilidade:
            filters["recuperabilidade"] = recuperabilidade
        if uf_principal:
            filters["uf_principal"] = uf_principal
        if status:
            filters["status"] = status

        # Filtros de data requerem tratamento especial (gte/lte, nao eq)
        extra_query_fn = None
        if data_analise_desde or data_analise_ate:

            def build_date_filter(query):
                if data_analise_desde:
                    query = query.gte("data_analise", data_analise_desde)
                if data_analise_ate:
                    query = query.lte("data_analise", data_analise_ate)
                return query

            extra_query_fn = build_date_filter

        result = supa_service.list_casos(
            filters=filters,
            page=page,
            per_page=per_page,
            sort_field=sort_field,
            sort_order=sort_order,
            search=search,
            select="*, processos(count)",
            extra_query_fn=extra_query_fn,
        )

        # Achatar contagem de processos
        if result.get("data"):
            for caso in result["data"]:
                processos_data = caso.pop("processos", [])
                caso["qtd_processos"] = (
                    processos_data[0].get("count", 0)
                    if processos_data and isinstance(processos_data, list)
                    else 0
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

        # Cliente: verificar acesso via carteira
        if g.user.get("role") != "admin":
            allowed = get_client_carteira_ids(g.user_id)
            if caso.get("carteira_id") not in allowed:
                return jsonify({"error": "Acesso negado"}), 403

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
