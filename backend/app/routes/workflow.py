"""Assignment, status transitions and history."""
from flask import Blueprint, g, jsonify, request
from sqlalchemy import update

from .. import config
from ..access import apply_status_change, get_accessible_ticket
from ..auth import login_required
from ..errors import conflict, forbidden, validation_error
from ..extensions import db
from ..models import Ticket, TicketHistory
from ..workflow import allowed_actions, check_status_change

bp = Blueprint("workflow", __name__)


def _detail(ticket):
    return {**ticket.to_dict(), "allowedActions": allowed_actions(ticket, g.user)}


@bp.put("/tickets/<int:ticket_id>/assign")
@login_required
def assign_ticket(ticket_id):
    """An agent assigns an Open ticket to themselves: Open -> Assigned (A-01). Any body is ignored."""
    ticket = get_accessible_ticket(ticket_id, g.user)
    if g.user.role != "AGENT":
        raise forbidden("Only support agents can assign tickets.")  # Rule 4
    if ticket.status == "Closed":
        raise conflict("A closed ticket cannot be edited.", "TICKET_CLOSED")
    if ticket.status != "Open":
        raise conflict(f"Ticket is already {ticket.status}; only Open tickets can be assigned.", "INVALID_TRANSITION")

    # Conditional update: if two agents click at once only one row matches, the other gets a 409.
    claimed = db.session.execute(
        update(Ticket).where(Ticket.id == ticket.id, Ticket.status == "Open").values(assigned_to=g.user.id)
    ).rowcount
    if not claimed:
        db.session.rollback()
        raise conflict("Ticket was just assigned by someone else.", "INVALID_TRANSITION")
    db.session.refresh(ticket)
    apply_status_change(ticket, "Assigned", g.user)
    db.session.commit()
    return jsonify(_detail(ticket))


@bp.put("/tickets/<int:ticket_id>/status")
@login_required
def change_status(ticket_id):
    ticket = get_accessible_ticket(ticket_id, g.user)
    status = (request.get_json(silent=True) or {}).get("status")
    if not isinstance(status, str) or status not in config.STATUSES:
        raise validation_error({"status": f"Status must be one of: {', '.join(config.STATUSES)}."})
    check_status_change(ticket, g.user, status)
    apply_status_change(ticket, status, g.user)
    db.session.commit()
    return jsonify(_detail(ticket))


@bp.get("/tickets/<int:ticket_id>/history")
@login_required
def ticket_history(ticket_id):
    """Both roles may read history of tickets they can access (OQ-24, provisional)."""
    ticket = get_accessible_ticket(ticket_id, g.user)
    rows = TicketHistory.query.filter_by(ticket_id=ticket.id).order_by(TicketHistory.changed_at, TicketHistory.id).all()
    return jsonify([h.to_dict() for h in rows])
