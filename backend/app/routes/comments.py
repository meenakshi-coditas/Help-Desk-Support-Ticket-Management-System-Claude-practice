from flask import Blueprint, g, jsonify, request

from .. import config
from ..access import get_accessible_ticket
from ..auth import login_required
from ..errors import conflict, forbidden, validation_error
from ..extensions import db
from ..models import Comment
from ..validation import clean_text
from ..workflow import allowed_actions

bp = Blueprint("comments", __name__)


@bp.get("/tickets/<int:ticket_id>/comments")
@login_required
def list_comments(ticket_id):
    ticket = get_accessible_ticket(ticket_id, g.user)
    rows = Comment.query.filter_by(ticket_id=ticket.id).order_by(Comment.created_at, Comment.id).all()  # oldest first (OQ-33)
    return jsonify([c.to_dict() for c in rows])


@bp.post("/tickets/<int:ticket_id>/comments")
@login_required
def add_comment(ticket_id):
    ticket = get_accessible_ticket(ticket_id, g.user)  # a user commenting on someone else's ticket gets 404
    body = clean_text((request.get_json(silent=True) or {}).get("body"))
    if not body:
        raise validation_error({"body": "Comment cannot be empty."})
    if len(body) > config.COMMENT_MAX:
        raise validation_error({"body": f"Comment must be at most {config.COMMENT_MAX} characters."})
    if ticket.status == "Closed":
        raise conflict("Comments are not allowed on a closed ticket.", "TICKET_CLOSED")  # A-06, OQ-23
    if not allowed_actions(ticket, g.user)["canComment"]:
        raise forbidden()
    comment = Comment(ticket_id=ticket.id, user_id=g.user.id, body=body)
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201
