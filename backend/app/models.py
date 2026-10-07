from datetime import datetime, timezone

from .extensions import db


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(dt):
    return dt.isoformat(timespec="seconds") + "Z" if dt else None


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(254), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    __table_args__ = (db.CheckConstraint("role IN ('USER','AGENT')", name="ck_users_role"),)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class Category(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class Ticket(db.Model):
    __tablename__ = "tickets"
    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.Integer, nullable=False, unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    subject = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    priority = db.Column(db.String(10), nullable=False, index=True)
    status = db.Column(db.String(12), nullable=False, default="Open", index=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow, index=True)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    owner = db.relationship("User", foreign_keys=[user_id])
    assignee = db.relationship("User", foreign_keys=[assigned_to])
    category = db.relationship("Category")
    attachments = db.relationship("Attachment", backref="ticket", cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="ticket", cascade="all, delete-orphan")
    history = db.relationship("TicketHistory", backref="ticket", cascade="all, delete-orphan")

    __table_args__ = (
        db.CheckConstraint("priority IN ('Low','Medium','High','Critical')", name="ck_tickets_priority"),
        db.CheckConstraint("status IN ('Open','Assigned','In Progress','Resolved','Closed')", name="ck_tickets_status"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "ticketNumber": self.ticket_number,
            "userId": self.user_id,
            "subject": self.subject,
            "description": self.description,
            "categoryId": self.category_id,
            "categoryName": self.category.name if self.category else None,
            "priority": self.priority,
            "status": self.status,
            "assignedTo": self.assigned_to,
            "ownerName": self.owner.name if self.owner else None,
            "assigneeName": self.assignee.name if self.assignee else None,
            "attachments": [a.to_dict() for a in self.attachments],
            "createdAt": iso(self.created_at),
            "updatedAt": iso(self.updated_at),
        }


class Comment(db.Model):
    __tablename__ = "comments"
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    author = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id, "ticketId": self.ticket_id, "userId": self.user_id, "body": self.body,
            "authorName": self.author.name, "authorRole": self.author.role, "createdAt": iso(self.created_at),
        }


class TicketHistory(db.Model):
    """Append-only audit log of status changes (Rule 7). No API updates or deletes rows."""
    __tablename__ = "ticket_history"
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False, index=True)
    from_status = db.Column(db.String(12), nullable=False)
    to_status = db.Column(db.String(12), nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    changed_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    actor = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id, "ticketId": self.ticket_id, "fromStatus": self.from_status, "toStatus": self.to_status,
            "changedBy": self.changed_by, "changedByName": self.actor.name, "changedAt": iso(self.changed_at),
        }


class Attachment(db.Model):
    __tablename__ = "attachments"
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False, index=True)
    file_name = db.Column(db.String(255), nullable=False)
    stored_name = db.Column(db.String(64), nullable=False, unique=True)
    content_type = db.Column(db.String(100), nullable=False)
    size_bytes = db.Column(db.Integer, nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    def to_dict(self):
        return {"id": self.id, "name": self.file_name, "size": self.size_bytes, "type": self.content_type}
