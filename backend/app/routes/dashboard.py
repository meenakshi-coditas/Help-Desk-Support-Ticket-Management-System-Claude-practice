from flask import Blueprint, g, jsonify

from .. import config
from ..auth import login_required
from ..models import Ticket

bp = Blueprint("dashboard", __name__)


@bp.get("/dashboard")
@login_required
def dashboard():
    """Counts per A-10 / A-17 (provisional): agents see all tickets, users only their own."""
    query = Ticket.query
    scope = "all" if g.user.role == "AGENT" else "own"
    if scope == "own":
        query = query.filter(Ticket.user_id == g.user.id)

    recent = query.order_by(Ticket.created_at.desc(), Ticket.id.desc()).limit(config.RECENT_TICKETS).all()
    return jsonify({
        "scope": scope,
        "counts": {
            "open": query.filter(Ticket.status == "Open").count(),
            "inProgress": query.filter(Ticket.status == "In Progress").count(),
            "resolved": query.filter(Ticket.status == "Resolved").count(),
            "critical": query.filter(Ticket.priority == "Critical", Ticket.status != "Closed").count(),
        },
        "recentTickets": [t.to_dict() for t in recent],
    })
