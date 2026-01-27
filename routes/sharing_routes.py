"""Blueprint de compartilhamento: acesso a carteiras + contas de usuario."""

from flask import Blueprint, g, jsonify, request

from utils.auth import admin_required
from utils.supabase_client import supa_service

sharing_bp = Blueprint("sharing", __name__)


# ========== ACESSO A CARTEIRAS ==========


@sharing_bp.route("/api/sharing/carteira/<carteira_id>", methods=["GET"])
@admin_required
def list_carteira_access(carteira_id):
    try:
        access_list = supa_service.list_carteira_access(carteira_id)
        return jsonify({"success": True, "data": access_list})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sharing_bp.route("/api/sharing/carteira/<carteira_id>", methods=["POST"])
@admin_required
def grant_carteira_access(carteira_id):
    try:
        data = request.get_json()
        if not data or not data.get("profile_id"):
            return jsonify({"error": "Campo 'profile_id' e obrigatorio"}), 400

        result = supa_service.grant_carteira_access(
            profile_id=data["profile_id"],
            carteira_id=carteira_id,
            granted_by=g.user_id,
        )
        return jsonify({"success": True, "data": result.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sharing_bp.route(
    "/api/sharing/carteira/<carteira_id>/<profile_id>", methods=["DELETE"]
)
@admin_required
def revoke_carteira_access(carteira_id, profile_id):
    try:
        supa_service.revoke_carteira_access(profile_id, carteira_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ========== CONTAS DE USUARIO ==========


@sharing_bp.route("/api/accounts", methods=["POST"])
@admin_required
def create_account():
    try:
        data = request.get_json()
        if not data or not data.get("email") or not data.get("password"):
            return (
                jsonify({"error": "Campos 'email' e 'password' sao obrigatorios"}),
                400,
            )

        result = supa_service.create_user_account(
            email=data["email"],
            password=data["password"],
            full_name=data.get("full_name", ""),
            role=data.get("role", "client"),
        )
        return jsonify({"success": True, "data": {"id": result.user.id}}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sharing_bp.route("/api/accounts", methods=["GET"])
@admin_required
def list_accounts():
    try:
        result = supa_service.list_user_accounts()
        users = [
            {
                "id": u.id,
                "email": u.email,
                "created_at": u.created_at,
                "last_sign_in_at": u.last_sign_in_at,
                "user_metadata": u.user_metadata,
            }
            for u in result
        ]
        return jsonify({"success": True, "data": users})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sharing_bp.route("/api/accounts/<user_id>", methods=["DELETE"])
@admin_required
def delete_account(user_id):
    try:
        supa_service.delete_user_account(user_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sharing_bp.route("/api/accounts/<user_id>/password", methods=["PUT"])
@admin_required
def reset_password(user_id):
    try:
        data = request.get_json()
        if not data or not data.get("password"):
            return jsonify({"error": "Campo 'password' e obrigatorio"}), 400

        supa_service.reset_user_password(user_id, data["password"])
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
