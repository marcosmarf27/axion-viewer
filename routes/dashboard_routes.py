"""Blueprint de dashboard: stats admin e cliente."""

from flask import Blueprint, g, jsonify

from utils.auth import admin_required, auth_required
from utils.supabase_client import supa_service

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/stats", methods=["GET"])
@admin_required
def admin_stats():
    try:
        stats = supa_service.get_admin_stats()
        return jsonify({"success": True, "data": stats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dashboard_bp.route("/api/dashboard/recent", methods=["GET"])
@admin_required
def recent_documents():
    try:
        docs = supa_service.get_recent_documents(limit=10)
        return jsonify({"success": True, "data": docs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dashboard_bp.route("/api/dashboard/client", methods=["GET"])
@auth_required
def client_stats():
    try:
        stats = supa_service.get_client_dashboard_stats(g.user_id)
        return jsonify({"success": True, "data": stats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
