"""Blueprint CRUD de temas (100% filesystem, admin_required)."""

import os
import shutil

from flask import Blueprint, jsonify, request

from config import Config
from utils.auth import admin_required
from utils.theme_manager import ThemeManager

themes_bp = Blueprint("themes", __name__)

theme_manager = ThemeManager(custom_themes_folder=Config.CUSTOM_THEMES_FOLDER)


@themes_bp.route("/api/themes", methods=["GET"])
@admin_required
def list_themes():
    try:
        themes = theme_manager.list_themes()
        theme_details = []

        for theme_name in themes:
            config = theme_manager.get_theme_config(theme_name)
            theme_details.append(
                {
                    "name": theme_name,
                    "description": config.get("description", "Tema disponível"),
                    "colors": config.get("colors", {}),
                    "styling": config.get("styling", {}),
                    "fonts": config.get("fonts", {}),
                }
            )

        return jsonify({"success": True, "themes": theme_details})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@themes_bp.route("/api/themes", methods=["POST"])
@admin_required
def create_theme():
    """Cria um novo tema com cores derivadas automaticamente"""
    try:
        data = request.get_json()

        if not data or "name" not in data:
            return jsonify(
                {"success": False, "error": 'Campo "name" é obrigatório'}
            ), 400

        theme_name = data.get("name", "").strip().lower()

        if not theme_name or not theme_name.replace("_", "").replace("-", "").isalnum():
            return jsonify(
                {
                    "success": False,
                    "error": "Nome do tema deve conter apenas letras, números, hífens e underscores",
                }
            ), 400

        existing_themes = theme_manager.list_themes()
        if theme_name in existing_themes:
            return jsonify(
                {"success": False, "error": f'Tema "{theme_name}" já existe'}
            ), 409

        primary_color = data.get("primary_color", "#0066CC")

        def darken_color(hex_color, factor=0.3):
            hex_color = hex_color.lstrip("#")
            r = int(hex_color[0:2], 16)
            g_val = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            r = int(r * (1 - factor))
            g_val = int(g_val * (1 - factor))
            b = int(b * (1 - factor))
            return f"#{r:02x}{g_val:02x}{b:02x}"

        def get_rgba(hex_color, alpha=0.1):
            hex_color = hex_color.lstrip("#")
            r = int(hex_color[0:2], 16)
            g_val = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            return f"rgba({r}, {g_val}, {b}, {alpha})"

        new_config = {
            "name": theme_name,
            "description": data.get("description", f"Tema {theme_name}"),
            "colors": {
                "primary": primary_color,
                "dark": darken_color(primary_color, 0.4),
                "black_tone": darken_color(primary_color, 0.7),
                "white": "#ffffff",
                "light_gray": "#f8f9fa",
                "medium_gray": "#6c757d",
                "success": "#28a745",
                "warning": "#ffc107",
                "danger": "#dc3545",
                "light_success_bg": "rgba(40, 167, 69, 0.1)",
                "light_danger_bg": "rgba(220, 53, 69, 0.1)",
                "light_info_bg": get_rgba(primary_color, 0.1),
                "light_warning_bg": "rgba(255, 193, 7, 0.1)",
            },
            "styling": {
                "gradients": {"header_angle": "135deg", "footer_angle": "135deg"},
                "borders": {
                    "section_title": "2px",
                    "h1": "3px",
                    "h2": "2px",
                    "alert_boxes": "4px",
                    "summary_line": "2px",
                },
            },
            "fonts": {"primary": "Segoe UI, Tahoma, Geneva, Verdana, sans-serif"},
            "logo": data.get("logo", ""),
        }

        if "colors" in data:
            new_config["colors"].update(data["colors"])

        theme_manager.save_theme_config(theme_name, new_config)

        return jsonify(
            {
                "success": True,
                "message": f'Tema "{theme_name}" criado com sucesso',
                "theme": new_config,
            }
        ), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@themes_bp.route("/api/themes/<theme_name>", methods=["DELETE"])
@admin_required
def delete_theme(theme_name):
    """Exclui um tema existente"""
    try:
        if theme_name == "juridico":
            return jsonify(
                {
                    "success": False,
                    "error": 'Não é possível excluir o tema padrão "juridico"',
                }
            ), 403

        safe_theme_name = (
            os.path.basename(theme_name)
            .replace("..", "")
            .replace("/", "")
            .replace("\\", "")
        )

        if not safe_theme_name or safe_theme_name != theme_name:
            return jsonify(
                {"success": False, "error": f"Nome de tema inválido: {theme_name}"}
            ), 400

        theme_dir = os.path.join("templates", "themes", safe_theme_name)

        real_theme_dir = os.path.realpath(theme_dir)
        real_themes_folder = os.path.realpath(os.path.join("templates", "themes"))

        if not real_theme_dir.startswith(real_themes_folder):
            return jsonify({"success": False, "error": "Acesso negado"}), 403

        if not os.path.exists(theme_dir):
            return jsonify(
                {"success": False, "error": f'Tema "{theme_name}" não encontrado'}
            ), 404

        shutil.rmtree(theme_dir)

        return jsonify(
            {"success": True, "message": f'Tema "{theme_name}" excluído com sucesso'}
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@themes_bp.route("/api/themes/<theme_name>", methods=["PUT"])
@admin_required
def update_theme(theme_name):
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "Dados inválidos"}), 400

        current_config = theme_manager.get_theme_config(theme_name)

        if "colors" in data:
            current_config["colors"].update(data["colors"])
        if "styling" in data:
            if "styling" not in current_config:
                current_config["styling"] = {}
            if "gradients" in data["styling"]:
                if "gradients" not in current_config["styling"]:
                    current_config["styling"]["gradients"] = {}
                current_config["styling"]["gradients"].update(
                    data["styling"]["gradients"]
                )
            if "borders" in data["styling"]:
                if "borders" not in current_config["styling"]:
                    current_config["styling"]["borders"] = {}
                current_config["styling"]["borders"].update(data["styling"]["borders"])
        if "fonts" in data:
            current_config["fonts"].update(data["fonts"])
        if "description" in data:
            current_config["description"] = data["description"]

        theme_manager.save_theme_config(theme_name, current_config)

        return jsonify(
            {
                "success": True,
                "message": f'Tema "{theme_name}" atualizado com sucesso',
                "theme": current_config,
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@themes_bp.route("/api/themes/<theme_name>/rename", methods=["PATCH"])
@admin_required
def rename_theme(theme_name):
    """Renomeia um tema existente"""
    try:
        data = request.get_json()

        if not data or "new_name" not in data:
            return jsonify(
                {"success": False, "error": 'Campo "new_name" é obrigatório'}
            ), 400

        new_name = data.get("new_name", "").strip().lower().replace(" ", "-")

        if not new_name or not new_name.replace("_", "").replace("-", "").isalnum():
            return jsonify(
                {
                    "success": False,
                    "error": "Nome do tema deve conter apenas letras, números, hífens e underscores",
                }
            ), 400

        if theme_name == "juridico":
            return jsonify(
                {
                    "success": False,
                    "error": 'Não é possível renomear o tema padrão "juridico"',
                }
            ), 403

        if theme_name == new_name:
            return jsonify(
                {
                    "success": True,
                    "message": "Nome não foi alterado",
                    "theme": theme_manager.get_theme_config(theme_name),
                }
            )

        existing_themes = theme_manager.list_themes()
        if new_name in existing_themes:
            return jsonify(
                {
                    "success": False,
                    "error": f'Já existe um tema com o nome "{new_name}"',
                }
            ), 409

        old_theme_dir = os.path.join("templates", "themes", theme_name)
        new_theme_dir = os.path.join("templates", "themes", new_name)

        if not os.path.exists(old_theme_dir):
            return jsonify(
                {"success": False, "error": f'Tema "{theme_name}" não encontrado'}
            ), 404

        real_old_dir = os.path.realpath(old_theme_dir)
        real_new_dir = os.path.realpath(new_theme_dir)
        real_themes_folder = os.path.realpath(os.path.join("templates", "themes"))

        if not real_old_dir.startswith(
            real_themes_folder
        ) or not real_new_dir.startswith(real_themes_folder):
            return jsonify({"success": False, "error": "Acesso negado"}), 403

        shutil.move(old_theme_dir, new_theme_dir)

        config = theme_manager.get_theme_config(new_name)
        config["name"] = new_name
        theme_manager.save_theme_config(new_name, config)

        return jsonify(
            {
                "success": True,
                "message": f'Tema renomeado de "{theme_name}" para "{new_name}"',
                "old_name": theme_name,
                "new_name": new_name,
                "theme": config,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
