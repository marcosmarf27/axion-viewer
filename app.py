import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import Config


def create_app():
    app = Flask(__name__, static_folder="frontend/dist", static_url_path="")
    CORS(app)
    app.config.from_object(Config)

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)
    os.makedirs(Config.CUSTOM_THEMES_FOLDER, exist_ok=True)

    from routes import register_blueprints

    register_blueprints(app)

    @app.route("/")
    @app.route("/<path:path>")
    def serve_frontend(path=""):
        if path.startswith("api/"):
            return jsonify({"error": "Not found"}), 404

        full_path = os.path.join("frontend/dist", path)
        if path and os.path.isfile(full_path):
            return send_from_directory("frontend/dist", path)

        if os.path.exists("frontend/dist/index.html"):
            return send_from_directory("frontend/dist", "index.html")

        return jsonify({"message": "Axion Viewer API", "version": "3.0.0"}), 200

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
