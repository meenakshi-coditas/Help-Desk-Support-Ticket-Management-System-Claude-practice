"""Token authentication (JWT bearer) and role guards."""
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, g, request

from .errors import forbidden, unauthorized
from .extensions import db
from .models import User


def create_token(user: User) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=current_app.config["TOKEN_TTL_MINUTES"])
    return jwt.encode({"sub": str(user.id), "role": user.role, "exp": exp}, current_app.config["SECRET_KEY"], algorithm="HS256")


def _load_user():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer ") or len(header) <= 7:
        raise unauthorized()
    try:
        claims = jwt.decode(header[7:], current_app.config["SECRET_KEY"], algorithms=["HS256"])
        user = db.session.get(User, int(claims["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise unauthorized("Invalid or expired token.")
    # Role/active flag are re-read from the DB, never trusted from the token alone.
    if not user or not user.is_active:
        raise unauthorized("Invalid or expired token.")
    g.user = user


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        _load_user()
        return fn(*args, **kwargs)
    return wrapper


def role_required(role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            _load_user()
            if g.user.role != role:
                raise forbidden()
            return fn(*args, **kwargs)
        return wrapper
    return decorator
