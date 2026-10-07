from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import event
from sqlalchemy.engine import Engine

from .config import Config
from .errors import register_error_handlers
from .extensions import db


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _):
    if dbapi_connection.__class__.__module__.startswith("sqlite3"):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)
    app.json.sort_keys = False

    db.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"], resources={r"/api/*": {}})
    register_error_handlers(app)

    from .routes import register_blueprints
    register_blueprints(app)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    with app.app_context():
        from . import models  # noqa: F401  (register tables)
        db.create_all()
    return app
