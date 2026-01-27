import json
import os


class ThemeManager:
    def __init__(self, templates_folder="templates", custom_themes_folder=None):
        self.templates_folder = templates_folder
        self.themes_folder = os.path.join(templates_folder, "themes")  # Temas padrão
        self.custom_themes_folder = (
            custom_themes_folder  # Temas customizados (persistido)
        )

    def get_theme_config(self, theme_name="juridico"):
        # Normalize theme name to lowercase for case-insensitive matching
        theme_name = theme_name.lower().strip() if theme_name else "juridico"

        # Primeiro: procura em temas customizados (volume persistente)
        if self.custom_themes_folder:
            custom_theme_path = os.path.join(
                self.custom_themes_folder, theme_name, "config.json"
            )
            if os.path.exists(custom_theme_path):
                with open(custom_theme_path, encoding="utf-8") as f:
                    return json.load(f)

        # Segundo: procura em temas padrão (vem com o código)
        theme_path = os.path.join(self.themes_folder, theme_name, "config.json")
        if os.path.exists(theme_path):
            with open(theme_path, encoding="utf-8") as f:
                return json.load(f)

        return self.get_default_config()

    def get_default_config(self):
        return {
            "name": "juridico",
            "colors": {
                "primary": "#BE3000",
                "dark": "#3A1101",
                "black_tone": "#1a0800",
                "white": "#ffffff",
                "light_gray": "#f5f5f5",
                "medium_gray": "#6c757d",
                "success": "#28a745",
                "warning": "#ffc107",
                "danger": "#dc3545",
                "light_success_bg": "rgba(40, 167, 69, 0.1)",
                "light_danger_bg": "rgba(220, 53, 69, 0.1)",
                "light_info_bg": "rgba(190, 48, 0, 0.1)",
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
            "logo": "https://matricula-simples-api-matricula-docs-084828563243.s3.sa-east-1.amazonaws.com/matriculas/axioma-intelligence/intelligence_branco.png",
        }

    def list_themes(self):
        themes = set()

        # Temas padrão
        if os.path.exists(self.themes_folder):
            for item in os.listdir(self.themes_folder):
                theme_path = os.path.join(self.themes_folder, item)
                if os.path.isdir(theme_path):
                    themes.add(item)

        # Temas customizados (persistidos)
        if self.custom_themes_folder and os.path.exists(self.custom_themes_folder):
            for item in os.listdir(self.custom_themes_folder):
                theme_path = os.path.join(self.custom_themes_folder, item)
                if os.path.isdir(theme_path):
                    themes.add(item)

        return list(themes) if themes else ["juridico"]

    def save_theme_config(self, theme_name, config):
        safe_theme_name = (
            os.path.basename(theme_name)
            .replace("..", "")
            .replace("/", "")
            .replace("\\", "")
        )

        if not safe_theme_name or safe_theme_name != theme_name:
            raise ValueError(f"Nome de tema inválido: {theme_name}")

        # Salva em temas customizados (persistido) se configurado, senão em temas padrão
        target_folder = (
            self.custom_themes_folder
            if self.custom_themes_folder
            else self.themes_folder
        )
        theme_dir = os.path.join(target_folder, safe_theme_name)

        real_theme_dir = os.path.realpath(theme_dir)
        real_target_folder = os.path.realpath(target_folder)

        if not real_theme_dir.startswith(real_target_folder):
            raise ValueError(f"Acesso negado ao tema: {theme_name}")

        os.makedirs(theme_dir, exist_ok=True)

        config_path = os.path.join(theme_dir, "config.json")
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)

        return True
