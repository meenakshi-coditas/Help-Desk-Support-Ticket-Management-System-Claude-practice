"""Ticket management: create, list (search/filter/sort/paginate), details, edit, attachment download."""
import math
import os
import uuid

from flask import Blueprint, current_app, g, jsonify, request, send_from_directory
from sqlalchemy import case, func, or_
from sqlalchemy.exc import IntegrityError

from .. import config
from ..access import get_accessible_ticket
from ..auth import login_required
from ..errors import ApiError, conflict, forbidden, not_found, validation_error
from ..extensions import db
from ..models import Attachment, Ticket, utcnow
from ..validation import validate_attachment, validate_ticket_fields
from ..workflow import allowed_actions

bp = Blueprint("tickets", __name__)

PRIORITY_RANK = case(*[(Ticket.priority == p, i) for i, p in enumerate(config.PRIORITIES)], else_=0)
STATUS_RANK = case(*[(Ticket.status == s, i) for i, s in enumerate(config.STATUSES)], else_=0)
SORTS = {"createdAt": Ticket.created_at, "priority": PRIORITY_RANK, "status": STATUS_RANK, "ticketNumber": Ticket.ticket_number}


def _request_data():
    """Accepts JSON or multipart/form-data (needed for the optional attachment)."""
    if request.is_json:
        return request.get_json(silent=True) or {}
    return request.form.to_dict()


def _int_param(name, default, minimum, maximum=None):
    raw = request.args.get(name)
    if raw in (None, ""):
        return default
    try:
        value = int(raw)
    except ValueError:
        raise validation_error({name: f"{name} must be a number."})
    if value < minimum or (maximum and value > maximum):
        raise validation_error({name: f"{name} must be between {minimum} and {maximum or 'infinity'}."})
    return value


def _next_ticket_number():
    top = db.session.query(func.max(Ticket.ticket_number)).scalar()
    return config.FIRST_TICKET_NUMBER if top is None else top + 1


def _detail(ticket):
    return {**ticket.to_dict(), "allowedActions": allowed_actions(ticket, g.user)}


@bp.get("/tickets")
@login_required
def list_tickets():
    page = _int_param("page", 1, 1)
    page_size = _int_param("pageSize", config.DEFAULT_PAGE_SIZE, 1, config.MAX_PAGE_SIZE)
    query = Ticket.query
    if g.user.role == "USER":
        query = query.filter(Ticket.user_id == g.user.id)

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search.replace('%', '').replace('_', '')}%"
        number = search.lstrip("#")
        query = query.filter(or_(Ticket.subject.ilike(like), Ticket.ticket_number == int(number) if number.isdigit() else False))

    status, priority, category_id = request.args.get("status"), request.args.get("priority"), request.args.get("categoryId")
    if status:
        if status not in config.STATUSES:
            raise validation_error({"status": "Invalid status."})
        query = query.filter(Ticket.status == status)
    if priority:
        if priority not in config.PRIORITIES:
            raise validation_error({"priority": "Invalid priority."})
        query = query.filter(Ticket.priority == priority)
    if category_id:
        if not category_id.isdigit():
            raise validation_error({"categoryId": "Invalid category."})
        query = query.filter(Ticket.category_id == int(category_id))

    sort_field, _, order = request.args.get("sort", "createdAt:desc").partition(":")
    if sort_field not in SORTS or order not in ("", "asc", "desc"):
        raise validation_error({"sort": f"Sort must be one of {', '.join(SORTS)} with :asc or :desc."})
    column = SORTS[sort_field]
    query = query.order_by(column.asc() if order == "asc" else column.desc(), Ticket.id.desc())

    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    return jsonify({
        "data": [t.to_dict() for t in rows], "page": page, "pageSize": page_size,
        "total": total, "totalPages": max(1, math.ceil(total / page_size)),
    })


@bp.post("/tickets")
@login_required
def create_ticket():
    if g.user.role != "USER":
        raise forbidden("Only users can create tickets.")  # A-18
    data = _request_data()
    errors = {}
    fields = validate_ticket_fields(data, errors)
    upload = validate_attachment(request.files.get("attachment"), errors)
    if errors:
        raise validation_error(errors)

    ticket = None
    for _ in range(3):  # retry if two requests picked the same number at once
        ticket = Ticket(
            ticket_number=_next_ticket_number(), user_id=g.user.id, subject=fields["subject"],
            description=fields["description"], category_id=fields["category"].id, priority=fields["priority"], status="Open",
        )
        db.session.add(ticket)
        try:
            db.session.flush()
            break
        except IntegrityError:
            db.session.rollback()
            ticket = None
    if ticket is None:
        raise ApiError(500, "INTERNAL_ERROR", "Could not allocate a ticket number. Please retry.")

    if upload:
        content, ext = upload
        stored = f"{uuid.uuid4().hex}.{ext}"
        os.makedirs(current_app.config["UPLOAD_DIR"], exist_ok=True)
        with open(os.path.join(current_app.config["UPLOAD_DIR"], stored), "wb") as fh:
            fh.write(content)
        file = request.files["attachment"]
        db.session.add(Attachment(
            ticket_id=ticket.id, file_name=os.path.basename(file.filename)[:255], stored_name=stored,
            content_type=file.mimetype or "application/octet-stream", size_bytes=len(content), uploaded_by=g.user.id,
        ))
    db.session.commit()
    return jsonify(_detail(ticket)), 201


@bp.get("/tickets/<int:ticket_id>")
@login_required
def get_ticket(ticket_id):
    return jsonify(_detail(get_accessible_ticket(ticket_id, g.user)))


@bp.put("/tickets/<int:ticket_id>")
@login_required
def update_ticket(ticket_id):
    """Owner may edit subject/description/category/priority while the ticket is Open (A-07, OQ-03 – provisional).
    Status and assignee are never changed here; use /status and /assign."""
    ticket = get_accessible_ticket(ticket_id, g.user)
    if ticket.status == "Closed":
        raise conflict("A closed ticket cannot be edited.", "TICKET_CLOSED")  # Rule 6
    if g.user.role == "AGENT":
        raise forbidden("Agents cannot edit ticket fields.")
    if ticket.status != "Open":
        raise conflict("Only Open tickets can be edited.", "TICKET_NOT_EDITABLE")

    errors = {}
    fields = validate_ticket_fields(request.get_json(silent=True) or {}, errors)
    if errors:
        raise validation_error(errors)
    ticket.subject, ticket.description = fields["subject"], fields["description"]
    ticket.priority, ticket.category_id = fields["priority"], fields["category"].id
    ticket.updated_at = utcnow()
    db.session.commit()
    return jsonify(_detail(ticket))


@bp.get("/tickets/<int:ticket_id>/attachments/<int:attachment_id>")
@login_required
def download_attachment(ticket_id, attachment_id):
    ticket = get_accessible_ticket(ticket_id, g.user)
    attachment = next((a for a in ticket.attachments if a.id == attachment_id), None)
    if not attachment:
        raise not_found("Attachment not found.")
    return send_from_directory(
        current_app.config["UPLOAD_DIR"], attachment.stored_name, as_attachment=True,
        download_name=attachment.file_name, mimetype="application/octet-stream",
    )
