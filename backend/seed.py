"""Creates demo accounts, categories and sample tickets.  Usage: python seed.py [--reset]

Accounts are PROVISIONAL (requirement.md OQ-08). Change the passwords before any real deployment.
"""
import sys
from datetime import timedelta

from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import Category, Comment, Ticket, TicketHistory, User, utcnow

USERS = [
    ("Alice Morgan", "user1@helpdesk.test", "USER", "User@1234"),
    ("Brian Lee", "user2@helpdesk.test", "USER", "User@1234"),
    ("Priya Nair", "agent1@helpdesk.test", "AGENT", "Agent@1234"),
    ("Carlos Diaz", "agent2@helpdesk.test", "AGENT", "Agent@1234"),
]
CATEGORIES = ["Login", "Payment", "Account", "Technical", "Other"]
# number, owner(1-4), subject, description, category(1-5), priority, status, assignee(1-4|None), age in minutes
TICKETS = [
    (1001, 1, "Login issue", "Unable to login with my registered email address.", 1, "High", "Open", None, 50),
    (1002, 2, "Payment issue", "My card was charged twice for the same order.", 2, "Critical", "Open", None, 130),
    (1003, 1, "Password reset", "Reset email never arrives in my inbox.", 3, "Medium", "Assigned", 3, 300),
    (1004, 2, "App crashes on upload", "The app closes when I upload a PDF file.", 4, "High", "In Progress", 3, 600),
    (1005, 1, "Wrong invoice amount", "Invoice shows an amount different from my plan.", 2, "Medium", "Resolved", 4, 1500),
    (1006, 2, "Update profile name", "I cannot change the display name in my profile.", 3, "Low", "Closed", 3, 3000),
    (1007, 1, "Dashboard is slow", "Pages take more than 10 seconds to load.", 4, "Critical", "In Progress", 4, 900),
    (1008, 2, "Two-factor code not received", "SMS code does not arrive on my phone.", 1, "Critical", "Assigned", 4, 400),
    (1009, 1, "Feature question", "How do I export my ticket list to a file?", 5, "Low", "Open", None, 20),
    (1010, 2, "Cannot attach screenshot", "Attachment button does nothing on Safari.", 4, "Medium", "Resolved", 3, 2100),
]
FLOW = ["Open", "Assigned", "In Progress", "Resolved", "Closed"]


def seed_accounts_and_categories():
    users = [User(name=n, email=e, role=r, password_hash=generate_password_hash(p)) for n, e, r, p in USERS]
    db.session.add_all(users + [Category(name=c) for c in CATEGORIES])
    db.session.commit()


def seed_sample_tickets():
    now = utcnow()
    for number, owner, subject, description, category, priority, status, assignee, age in TICKETS:
        created = now - timedelta(minutes=age)
        ticket = Ticket(ticket_number=number, user_id=owner, subject=subject, description=description, category_id=category,
                        priority=priority, status=status, assigned_to=assignee, created_at=created, updated_at=created)
        db.session.add(ticket)
        db.session.flush()
        for step in range(1, FLOW.index(status) + 1):  # history consistent with status; creation is not logged (A-13)
            actor = owner if FLOW[step] == "Closed" else assignee
            db.session.add(TicketHistory(ticket_id=ticket.id, from_status=FLOW[step - 1], to_status=FLOW[step],
                                         changed_by=actor, changed_at=created + timedelta(minutes=step * 10)))
    db.session.add(Comment(ticket_id=4, user_id=3, body="I can reproduce this with a 3 MB PDF. Investigating the upload handler."))
    db.session.add(Comment(ticket_id=4, user_id=2, body="Thanks. It also happens with a smaller image file."))
    db.session.commit()


def run(reset=False):
    app = create_app()
    with app.app_context():
        if reset:
            db.drop_all()
            db.create_all()
        if User.query.count():
            print("Database already has data; use --reset to recreate it.")
            return
        seed_accounts_and_categories()
        seed_sample_tickets()
        print("Seeded 4 users, 5 categories, 10 tickets.")


if __name__ == "__main__":
    run(reset="--reset" in sys.argv)
