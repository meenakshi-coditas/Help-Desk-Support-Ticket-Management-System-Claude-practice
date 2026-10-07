"""Status workflow rules in one place (requirement.md section 7; assumptions A-01..A-07)."""
from .errors import conflict, forbidden
from .models import Ticket, User

NEXT_STATUS = {"Open": "Assigned", "Assigned": "In Progress", "In Progress": "Resolved", "Resolved": "Closed"}


def allowed_actions(ticket: Ticket, user: User) -> dict:
    """What `user` may currently do with `ticket`. Sent to the client so the UI never re-implements rules."""
    is_agent = user.role == "AGENT"
    is_owner = ticket.user_id == user.id
    is_assignee = ticket.assigned_to == user.id
    closed = ticket.status == "Closed"
    next_status = None
    if is_agent and is_assignee and ticket.status in ("Assigned", "In Progress"):
        next_status = NEXT_STATUS[ticket.status]
    return {
        "canAssign": is_agent and ticket.status == "Open",
        "nextStatus": next_status,
        "canClose": (not is_agent) and is_owner and ticket.status == "Resolved",
        "canEdit": (not is_agent) and is_owner and ticket.status == "Open",
        "canComment": (not closed) and (is_agent or is_owner),
    }


def check_status_change(ticket: Ticket, user: User, target: str):
    """Raises ApiError (403/409) if the change is not allowed. Order: closed, role rules, transition rules."""
    if ticket.status == "Closed":
        raise conflict("A closed ticket cannot be edited.", "TICKET_CLOSED")  # Rule 6
    is_agent = user.role == "AGENT"

    if target == "Resolved" and not is_agent:
        raise forbidden("Only support agents can resolve tickets.")  # Rule 5
    if target == "Closed" and is_agent:
        raise forbidden("Only the ticket owner can close a ticket.")  # A-04
    if target in ("In Progress", "Resolved") and not is_agent:
        raise forbidden("Only support agents can change this status.")
    if target in ("In Progress", "Resolved") and ticket.assigned_to != user.id:
        raise forbidden("Only the assigned agent can change the status of this ticket.")  # A-05
    if target in ("Open", "Assigned"):
        raise conflict(f"Status cannot be set to {target} directly; use the assign endpoint.", "INVALID_TRANSITION")  # A-03

    if NEXT_STATUS.get(ticket.status) != target:  # includes Open -> Closed (BR-8), skips and backward moves
        raise conflict(f"Cannot change status from {ticket.status} to {target}.", "INVALID_TRANSITION")
