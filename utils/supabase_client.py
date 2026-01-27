import logging
import uuid

from supabase import create_client

from config import Config

logger = logging.getLogger(__name__)


ALLOWED_SORT_FIELDS = {
    "created_at",
    "updated_at",
    "nome",
    "email",
    "documento",
    "descricao",
    "numero_cnj",
    "polo_ativo",
    "polo_passivo",
    "comarca",
    "filename",
    "title",
    "original_name",
    "file_type",
    "credor_principal",
    "devedor_principal",
}


class SupabaseService:
    """Servico centralizado para operacoes no Supabase (Storage, DB, Auth)."""

    def __init__(self):
        if Config.SUPABASE_URL and Config.SUPABASE_SERVICE_ROLE_KEY:
            self.client = create_client(
                Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY
            )
        else:
            self.client = None
            logger.warning(
                "Supabase nao configurado: SUPABASE_URL ou "
                "SUPABASE_SERVICE_ROLE_KEY ausentes"
            )

    # ========== STORAGE ==========

    def upload_file(self, content, file_type):
        """Upload arquivo para Supabase Storage.
        Retorna storage_path (ex: 'html/uuid.html').
        """
        ext = file_type if file_type in ("html", "pdf", "md") else "html"
        filename = f"{uuid.uuid4()}.{ext}"
        storage_path = f"{ext}/{filename}"
        mime_map = {
            "html": "text/html",
            "pdf": "application/pdf",
            "md": "text/markdown",
        }
        self.client.storage.from_("documents").upload(
            path=storage_path,
            file=content,
            file_options={
                "content-type": mime_map.get(ext, "application/octet-stream")
            },
        )
        return storage_path

    def delete_file(self, storage_path):
        """Remove arquivo do Supabase Storage."""
        try:
            self.client.storage.from_("documents").remove([storage_path])
        except Exception:
            logger.exception("Erro ao deletar arquivo do Storage: %s", storage_path)

    def get_signed_url(self, storage_path, expires_in=3600):
        """Gera signed URL para acesso temporario ao arquivo."""
        result = self.client.storage.from_("documents").create_signed_url(
            storage_path, expires_in
        )
        return result.get("signedUrl") or result.get("signedURL")

    # ========== CRUD GENERICO ==========

    def _list(
        self,
        table,
        filters=None,
        page=1,
        per_page=20,
        sort_field="created_at",
        sort_order="desc",
        search=None,
        search_fields=None,
        select="*",
    ):
        """Listagem generica paginada com filtros e busca."""
        query = self.client.table(table).select(select, count="exact")

        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)

        if search and search_fields:
            conditions = ",".join(f"{f}.ilike.%{search}%" for f in search_fields)
            query = query.or_(conditions)

        if sort_field not in ALLOWED_SORT_FIELDS:
            sort_field = "created_at"
        desc = sort_order == "desc"
        query = query.order(sort_field, desc=desc)

        start = (page - 1) * per_page
        end = start + per_page - 1
        query = query.range(start, end)

        result = query.execute()
        total = result.count if result.count is not None else 0
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1

        return {
            "data": result.data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
            },
        }

    def _get(self, table, record_id, select="*"):
        """Busca registro por ID."""
        result = (
            self.client.table(table)
            .select(select)
            .eq("id", record_id)
            .single()
            .execute()
        )
        return result.data

    def _create(self, table, data):
        """Cria registro."""
        result = self.client.table(table).insert(data).execute()
        return result

    def _update(self, table, record_id, data):
        """Atualiza registro por ID."""
        result = self.client.table(table).update(data).eq("id", record_id).execute()
        return result

    def _delete(self, table, record_id):
        """Deleta registro por ID."""
        result = self.client.table(table).delete().eq("id", record_id).execute()
        return result

    # ========== CLIENTES ==========

    def list_clientes(self, **kwargs):
        return self._list(
            "clientes",
            search_fields=["nome", "email", "documento"],
            **kwargs,
        )

    def get_cliente(self, cliente_id):
        return self._get("clientes", cliente_id)

    def create_cliente(self, data):
        return self._create("clientes", data)

    def update_cliente(self, cliente_id, data):
        return self._update("clientes", cliente_id, data)

    def delete_cliente(self, cliente_id):
        return self._delete("clientes", cliente_id)

    # ========== CARTEIRAS ==========

    def list_carteiras(self, **kwargs):
        return self._list(
            "carteiras",
            search_fields=["nome", "descricao"],
            **kwargs,
        )

    def get_carteira(self, carteira_id):
        return self._get("carteiras", carteira_id)

    def create_carteira(self, data):
        return self._create("carteiras", data)

    def update_carteira(self, carteira_id, data):
        return self._update("carteiras", carteira_id, data)

    def delete_carteira(self, carteira_id):
        return self._delete("carteiras", carteira_id)

    # ========== CASOS ==========

    def list_casos(self, **kwargs):
        return self._list(
            "casos",
            search_fields=["nome", "credor_principal", "devedor_principal"],
            **kwargs,
        )

    def get_caso(self, caso_id):
        return self._get("casos", caso_id)

    def create_caso(self, data):
        return self._create("casos", data)

    def update_caso(self, caso_id, data):
        return self._update("casos", caso_id, data)

    def delete_caso(self, caso_id):
        return self._delete("casos", caso_id)

    # ========== PROCESSOS ==========

    def list_processos(self, **kwargs):
        return self._list(
            "processos",
            search_fields=["numero_cnj", "polo_ativo", "polo_passivo", "comarca"],
            **kwargs,
        )

    def get_processo(self, processo_id):
        """Busca processo com processos filhos (incidentais)."""
        processo = self._get("processos", processo_id)
        if processo:
            filhos = (
                self.client.table("processos")
                .select("*")
                .eq("processo_pai_id", processo_id)
                .execute()
            )
            processo["processos_incidentais"] = filhos.data
        return processo

    def create_processo(self, data):
        return self._create("processos", data)

    def update_processo(self, processo_id, data):
        return self._update("processos", processo_id, data)

    def delete_processo(self, processo_id):
        return self._delete("processos", processo_id)

    # ========== DOCUMENTOS ==========

    def list_documentos(self, **kwargs):
        return self._list(
            "documentos",
            search_fields=["filename", "title", "original_name"],
            **kwargs,
        )

    def get_documento(self, documento_id):
        return self._get("documentos", documento_id)

    def create_documento(self, data):
        return self._create("documentos", data)

    def update_documento(self, documento_id, data):
        return self._update("documentos", documento_id, data)

    def delete_documento(self, documento_id):
        """Deleta documento do banco. Storage deve ser deletado ANTES."""
        return self._delete("documentos", documento_id)

    # ========== ACESSO (CARTEIRA <-> PROFILE) ==========

    def list_carteira_access(self, carteira_id):
        """Lista profiles com acesso a uma carteira."""
        result = (
            self.client.table("cliente_carteira_access")
            .select("*, profiles(id, email, full_name, role)")
            .eq("carteira_id", carteira_id)
            .execute()
        )
        return result.data

    def grant_carteira_access(self, profile_id, carteira_id, granted_by):
        """Concede acesso de um profile a uma carteira."""
        existing = (
            self.client.table("cliente_carteira_access")
            .select("id")
            .eq("profile_id", profile_id)
            .eq("carteira_id", carteira_id)
            .execute()
        )
        if existing.data:
            return existing
        return self._create(
            "cliente_carteira_access",
            {
                "profile_id": profile_id,
                "carteira_id": carteira_id,
                "granted_by": granted_by,
            },
        )

    def revoke_carteira_access(self, profile_id, carteira_id):
        """Revoga acesso de um profile a uma carteira."""
        result = (
            self.client.table("cliente_carteira_access")
            .delete()
            .eq("profile_id", profile_id)
            .eq("carteira_id", carteira_id)
            .execute()
        )
        return result

    def get_client_carteiras(self, profile_id):
        """Lista carteiras que um profile tem acesso."""
        result = (
            self.client.table("cliente_carteira_access")
            .select("carteira_id, carteiras(*)")
            .eq("profile_id", profile_id)
            .execute()
        )
        return [item["carteiras"] for item in result.data if item.get("carteiras")]

    # ========== AUTH ADMIN ==========

    def create_user_account(self, email, password, full_name="", role="client"):
        """Cria conta de usuario via Auth Admin API."""
        result = self.client.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name, "role": role},
            }
        )
        return result

    def delete_user_account(self, user_id):
        """Deleta conta de usuario via Auth Admin API."""
        return self.client.auth.admin.delete_user(user_id)

    def reset_user_password(self, user_id, new_password):
        """Reseta senha de usuario via Auth Admin API."""
        return self.client.auth.admin.update_user_by_id(
            user_id, {"password": new_password}
        )

    def list_user_accounts(self):
        """Lista todas as contas de usuario."""
        result = self.client.auth.admin.list_users()
        return result

    # ========== DASHBOARD ==========

    def get_admin_stats(self):
        """Busca estatisticas do dashboard admin via RPC."""
        result = self.client.rpc("get_admin_dashboard_stats").execute()
        return result.data

    def get_recent_documents(self, limit=10):
        """Busca ultimos documentos criados."""
        result = (
            self.client.table("documentos")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data

    def get_client_dashboard_stats(self, profile_id):
        """Busca estatisticas do dashboard do cliente."""
        carteiras = self.get_client_carteiras(profile_id)
        carteira_ids = [c["id"] for c in carteiras]

        if not carteira_ids:
            return {
                "total_carteiras": 0,
                "total_casos": 0,
                "total_processos": 0,
                "carteiras": [],
            }

        # Buscar total de casos de todas as carteiras em uma unica query
        casos_result = (
            self.client.table("casos")
            .select("id", count="exact")
            .in_("carteira_id", carteira_ids)
            .execute()
        )
        total_casos = casos_result.count or 0

        # Buscar processos vinculados aos casos encontrados
        total_processos = 0
        caso_ids = [c["id"] for c in casos_result.data] if casos_result.data else []
        if caso_ids:
            processos_result = (
                self.client.table("processos")
                .select("id", count="exact")
                .in_("caso_id", caso_ids)
                .execute()
            )
            total_processos = processos_result.count or 0

        return {
            "total_carteiras": len(carteiras),
            "total_casos": total_casos,
            "total_processos": total_processos,
            "carteiras": carteiras,
        }


# Instancia singleton
supa_service = SupabaseService()
