"""Shared helpers: ticket lookup with ownership rule, and the single place that changes status + writes history."""
from .errors import not_found
from .extensions import db
from .models import Ticket, TicketHistory, utcnow


def get_accessible_ticket(ticket_id: int, user) -> Ticket:
    """Users only see their own tickets, agents see all (BR-10). Others get 404 so ids are not disclosed (OQ-27)."""
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket or (user.role == "USER" and ticket.user_id != user.id):
        raise not_found("Ticket not found.")
    return ticket


def apply_status_change(ticket: Ticket, to_status: str, user) -> None:
    """Updates the ticket and appends the history row. Caller commits, so both happen in one transaction (REQ-062)."""
    db.session.add(TicketHistory(ticket_id=ticket.id, from_status=ticket.status, to_status=to_status, changed_by=user.id, changed_at=utcnow()))
    ticket.status = to_status
    ticket.updated_at = utcnow()
