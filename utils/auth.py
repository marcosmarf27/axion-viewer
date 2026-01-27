import logging
from functools import wraps

import jwt
from flask import g, jsonify, request
from jwt import PyJWKClient

from config import Config

logger = logging.getLogger(__name__)

# JWKS client para verificacao de tokens JWT via ES256
JWKS_URL = f"{Config.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = (
    PyJWKClient(JWKS_URL, cache_jwk_set=True, lifespan=600)
    if Config.SUPABASE_URL
    else None
)


def verify_supabase_token(token):
    """Verifica JWT do Supabase via JWKS publico (ES256)."""
    if not jwks_client:
        logger.error("SUPABASE_URL nao configurada")
        return None
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token JWT expirado")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("Token JWT invalido: %s", e)
        return None


def get_user_profile(user_id):
    """Busca profile do usuario no banco via service role client."""
    from utils.supabase_client import supa_service

    try:
        result = (
            supa_service.client.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return result.data
    except Exception:
        logger.exception("Erro ao buscar profile para user_id=%s", user_id)
        return None


def auth_required(f):
    """Decorator que exige autenticacao JWT valida.
    Seta g.user, g.user_id e g.token.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token ausente"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = verify_supabase_token(token)
        if not payload:
            return jsonify({"error": "Token invalido ou expirado"}), 401

        user_id = payload.get("sub")
        profile = get_user_profile(user_id)
        if not profile:
            return jsonify({"error": "Profile nao encontrado"}), 401

        g.user = profile
        g.user_id = user_id
        g.token = token
        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator que exige autenticacao + role admin."""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token ausente"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = verify_supabase_token(token)
        if not payload:
            return jsonify({"error": "Token invalido ou expirado"}), 401

        user_id = payload.get("sub")
        profile = get_user_profile(user_id)
        if not profile:
            return jsonify({"error": "Profile nao encontrado"}), 401

        if profile.get("role") != "admin":
            return jsonify({"error": "Acesso restrito a administradores"}), 403

        g.user = profile
        g.user_id = user_id
        g.token = token
        return f(*args, **kwargs)

    return decorated
