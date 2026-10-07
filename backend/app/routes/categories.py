from flask import Blueprint, jsonify

from ..auth import login_required
from ..models import Category

bp = Blueprint("categories", __name__)


@bp.get("/categories")
@login_required
def list_categories():
    return jsonify([c.to_dict() for c in Category.query.filter_by(is_active=True).order_by(Category.id)])
