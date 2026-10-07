"""Single error contract (requirement.md section 14):
{ "status": 400, "error": "VALIDATION_ERROR", "message": "...", "details": [{"field": "...", "message": "..."}] }
"""
from flask import jsonify
from werkzeug.exceptions import HTTPException

from .extensions import db


class ApiError(Exception):
    def __init__(self, status, code, message, details=None):
        super().__init__(message)
        self.status, self.code, self.message, self.details = status, code, message, details or []


def validation_error(errors: dict):
    """errors: {field: message}"""
    return ApiError(400, "VALIDATION_ERROR", "Validation failed.", [{"field": f, "message": m} for f, m in errors.items()])


def unauthorized(message="Authentication required."):
    return ApiError(401, "UNAUTHORIZED", message)


def forbidden(message="You do not have permission to perform this action."):
    return ApiError(403, "FORBIDDEN", message)


def not_found(message="Resource not found."):
    return ApiError(404, "NOT_FOUND", message)


def conflict(message, code="CONFLICT"):
    return ApiError(409, code, message)


def _response(status, code, message, details=None):
    return jsonify({"status": status, "error": code, "message": message, "details": details or []}), status


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(e):
        db.session.rollback()
        return _response(e.status, e.code, e.message, e.details)

    @app.errorhandler(HTTPException)
    def handle_http_error(e):
        codes = {400: "BAD_REQUEST", 404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED", 413: "PAYLOAD_TOO_LARGE"}
        message = "Request body is too large." if e.code == 413 else e.description
        return _response(e.code, codes.get(e.code, "HTTP_ERROR"), message)

    @app.errorhandler(Exception)
    def handle_unexpected(e):
        db.session.rollback()
        app.logger.exception("Unhandled error")
        return _response(500, "INTERNAL_ERROR", "Something went wrong. Please try again.")
