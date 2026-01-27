"""Flask Blueprints registration."""

from routes.auth_routes import auth_bp
from routes.carteiras_routes import carteiras_bp
from routes.casos_routes import casos_bp
from routes.clientes_routes import clientes_bp
from routes.convert_routes import convert_bp
from routes.dashboard_routes import dashboard_bp
from routes.documentos_routes import documentos_bp
from routes.files_routes import files_bp
from routes.processos_routes import processos_bp
from routes.sharing_routes import sharing_bp
from routes.themes_routes import themes_bp


def register_blueprints(app):
    """Registra todos os blueprints na aplicacao Flask."""
    app.register_blueprint(auth_bp)
    app.register_blueprint(convert_bp)
    app.register_blueprint(themes_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(clientes_bp)
    app.register_blueprint(carteiras_bp)
    app.register_blueprint(casos_bp)
    app.register_blueprint(processos_bp)
    app.register_blueprint(documentos_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(sharing_bp)
