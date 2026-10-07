import io

import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db
import seed


@pytest.fixture(autouse=True)
def fast_password_hashing(monkeypatch):
    """scrypt is deliberately slow; use a cheap (still verifiable) hash for seeded test accounts."""
    from werkzeug.security import generate_password_hash
    monkeypatch.setattr(seed, "generate_password_hash", lambda p: generate_password_hash(p, method="pbkdf2:sha256:1000"))


@pytest.fixture()
def app(tmp_path):
    class Cfg(TestConfig):
        UPLOAD_DIR = str(tmp_path)
    app = create_app(Cfg)
    with app.app_context():
        db.drop_all()
        db.create_all()
        seed.seed_accounts_and_categories()
        seed.seed_sample_tickets()
    yield app


@pytest.fixture()
def client(app):
    return app.test_client()


def _login(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.get_json()
    return {"Authorization": f"Bearer {res.get_json()['token']}"}


@pytest.fixture()
def user1(client):  # owns ticket ids 1,3,5,7,9; id 3 is Assigned to agent1
    return _login(client, "user1@helpdesk.test", "User@1234")


@pytest.fixture()
def user2(client):
    return _login(client, "user2@helpdesk.test", "User@1234")


@pytest.fixture()
def agent1(client):
    return _login(client, "agent1@helpdesk.test", "Agent@1234")


@pytest.fixture()
def agent2(client):
    return _login(client, "agent2@helpdesk.test", "Agent@1234")


@pytest.fixture()
def new_ticket(client, user1):
    """A fresh Open ticket owned by user1."""
    res = client.post("/api/tickets", headers=user1, json={
        "subject": "Printer offline", "description": "The office printer is offline.", "categoryId": 4, "priority": "High"})
    assert res.status_code == 201
    return res.get_json()


def file_part(name="note.txt", content=b"hello", mime="text/plain"):
    return (io.BytesIO(content), name, mime)
