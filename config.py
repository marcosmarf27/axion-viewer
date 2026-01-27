import os


class Config:
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    # Diretório base para dados persistentes (volume na Railway)
    DATA_FOLDER = os.environ.get("DATA_FOLDER", "data")
    UPLOAD_FOLDER = os.path.join(DATA_FOLDER, "uploads")
    OUTPUT_FOLDER = os.path.join(DATA_FOLDER, "outputs")
    CUSTOM_THEMES_FOLDER = os.path.join(
        DATA_FOLDER, "themes"
    )  # Temas customizados (persistido)
    TEMPLATES_FOLDER = "templates"  # Temas padrão (vem com o código)
    ALLOWED_EXTENSIONS = {"md", "txt", "markdown"}

    @staticmethod
    def allowed_file(filename):
        return (
            "." in filename
            and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
        )
