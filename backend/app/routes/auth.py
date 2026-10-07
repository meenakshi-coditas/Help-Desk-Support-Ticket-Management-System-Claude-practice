from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash

from ..auth import create_token, login_required
from ..errors import ApiError, validation_error
from ..models import User

bp = Blueprint("auth", __name__)

# Hash of a throw-away password, checked when the email is unknown so response time does not reveal valid emails.
_DUMMY_HASH = "scrypt:32768:8:1$dummy$" + "0" * 128


@bp.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower() if isinstance(data.get("email"), str) else ""
    password = data.get("password") if isinstance(data.get("password"), str) else ""

    errors = {}
    if not email:
        errors["email"] = "Email is required."
    if not password:
        errors["password"] = "Password is required."
    if errors:
        raise validation_error(errors)

    user = User.query.filter(User.email.ilike(email)).first()
    valid = bool(user) and user.is_active and check_password_hash(user.password_hash, password)
    if not user:
        check_password_hash(_DUMMY_HASH, password)
    if not valid:
        # Generic message on purpose (REQ-060): never say which credential was wrong.
        raise ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.")
    return jsonify({"token": create_token(user), "user": user.to_dict()})


@bp.get("/auth/me")
@login_required
def me():
    return jsonify(g.user.to_dict())


@bp.post("/auth/logout")
@login_required
def logout():
    # Tokens are stateless; the client discards its token. Server-side revocation is TBD (OQ-39).
    return "", 204
