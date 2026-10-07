from flask import Flask


def register_blueprints(app: Flask):
    from .auth import bp as auth_bp
    from .categories import bp as categories_bp
    from .comments import bp as comments_bp
    from .dashboard import bp as dashboard_bp
    from .tickets import bp as tickets_bp
    from .workflow import bp as workflow_bp

    for bp in (auth_bp, categories_bp, tickets_bp, workflow_bp, comments_bp, dashboard_bp):
        app.register_blueprint(bp, url_prefix="/api")
