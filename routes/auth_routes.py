"""Blueprint de autenticacao: health check e perfil do usuario."""

from datetime import datetime

from flask import Blueprint, g, jsonify

from utils.auth import auth_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})


@auth_bp.route("/api/me", methods=["GET"])
@auth_required
def me():
    return jsonify({"success": True, "profile": g.user})
