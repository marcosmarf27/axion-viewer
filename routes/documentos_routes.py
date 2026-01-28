"""Blueprint de documentos: lista, detalhe, vincular, delete."""

from flask import Blueprint, g, jsonify, request

from utils.auth import admin_required, auth_required, get_client_carteira_ids
from utils.supabase_client import supa_service

documentos_bp = Blueprint("documentos", __name__)


@documentos_bp.route("/api/documentos", methods=["GET"])
@auth_required
def list_documentos():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        sort_field = request.args.get("sort_field", "created_at")
        sort_order = request.args.get("sort_order", "desc")
        search = request.args.get("search")
        processo_id = request.args.get("processo_id")
        file_type = request.args.get("file_type")
        sem_processo = request.args.get("sem_processo")
        exclude_processo_id = request.args.get("exclude_processo_id")

        # Cliente: validar acesso via processo -> caso -> carteira
        if g.user.get("role") != "admin" and processo_id:
            processo = supa_service.get_processo(processo_id)
            if processo:
                caso = supa_service.get_caso(processo.get("caso_id"))
                if caso:
                    allowed = get_client_carteira_ids(g.user_id)
                    if caso.get("carteira_id") not in allowed:
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
        if processo_id:
            filters["processo_id"] = processo_id
        if file_type:
            filters["file_type"] = file_type

        result = supa_service.list_documentos(
            filters=filters,
            page=page,
            per_page=per_page,
            sort_field=sort_field,
            sort_order=sort_order,
            search=search,
            select="*, processos(numero_cnj)",
        )

        # Achatar processo_numero_cnj
        if result.get("data"):
            for doc in result["data"]:
                proc_data = doc.pop("processos", None)
                doc["processo_numero_cnj"] = (
                    proc_data.get("numero_cnj") if isinstance(proc_data, dict) else None
                )

        # Filtro especial: documentos excluindo processo específico (para vincular)
        if exclude_processo_id:
            query = (
                supa_service.client.table("documentos")
                .select("*, processos(numero_cnj)", count="exact")
                .neq("processo_id", exclude_processo_id)
            )
            if search:
                conditions = ",".join(
                    f"{f}.ilike.%{search}%"
                    for f in ["filename", "title", "original_name"]
                )
                query = query.or_(conditions)
            if file_type:
                query = query.eq("file_type", file_type)

            desc = sort_order == "desc"
            query = query.order(sort_field, desc=desc)

            start = (page - 1) * per_page
            end = start + per_page - 1
            query = query.range(start, end)

            res = query.execute()
            total = res.count if res.count is not None else 0
            total_pages = (total + per_page - 1) // per_page if total > 0 else 1

            # Achatar processo_numero_cnj
            for doc in res.data:
                proc_data = doc.pop("processos", None)
                doc["processo_numero_cnj"] = (
                    proc_data.get("numero_cnj") if isinstance(proc_data, dict) else None
                )

            result = {
                "data": res.data,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": total_pages,
                },
            }

        # Filtro especial: documentos sem processo (para admin vincular)
        elif sem_processo == "true":
            query = (
                supa_service.client.table("documentos")
                .select("*", count="exact")
                .is_("processo_id", "null")
            )
            if search:
                conditions = ",".join(
                    f"{f}.ilike.%{search}%"
                    for f in ["filename", "title", "original_name"]
                )
                query = query.or_(conditions)
            if file_type:
                query = query.eq("file_type", file_type)

            desc = sort_order == "desc"
            query = query.order(sort_field, desc=desc)

            start = (page - 1) * per_page
            end = start + per_page - 1
            query = query.range(start, end)

            res = query.execute()
            total = res.count if res.count is not None else 0
            total_pages = (total + per_page - 1) // per_page if total > 0 else 1

            result = {
                "data": res.data,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": total_pages,
                },
            }

        # Gerar signed_url para cada documento que tenha storage_path
        data_list = result.get("data") if isinstance(result, dict) else None
        if data_list:
            for doc in data_list:
                if doc.get("storage_path"):
                    doc["signed_url"] = supa_service.get_signed_url(doc["storage_path"])

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@documentos_bp.route("/api/documentos/<documento_id>", methods=["GET"])
@auth_required
def get_documento(documento_id):
    try:
        doc = supa_service.get_documento(documento_id)
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

        signed_url = supa_service.get_signed_url(doc["storage_path"])
        doc["signed_url"] = signed_url

        return jsonify({"success": True, "data": doc})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@documentos_bp.route("/api/documentos/<documento_id>", methods=["PUT"])
@admin_required
def update_documento(documento_id):
    """Vincular documento a processo ou atualizar metadados."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados invalidos"}), 400

        result = supa_service.update_documento(documento_id, data)
        return jsonify({"success": True, "data": result.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@documentos_bp.route("/api/documentos/<documento_id>", methods=["DELETE"])
@admin_required
def delete_documento(documento_id):
    try:
        doc = supa_service.get_documento(documento_id)
        if not doc:
            return jsonify({"error": "Documento nao encontrado"}), 404

        # Deletar do Storage PRIMEIRO
        supa_service.delete_file(doc["storage_path"])
        # Deletar registro do banco
        supa_service.delete_documento(documento_id)

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
