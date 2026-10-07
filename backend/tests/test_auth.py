def test_login_success_returns_token_and_user(client):
    res = client.post("/api/auth/login", json={"email": "user1@helpdesk.test", "password": "User@1234"})
    body = res.get_json()
    assert res.status_code == 200 and body["token"] and body["user"]["role"] == "USER"
    assert "password" not in str(body).lower()


def test_login_is_case_insensitive_for_email(client):
    assert client.post("/api/auth/login", json={"email": " USER1@helpdesk.test ", "password": "User@1234"}).status_code == 200


def test_login_wrong_password_and_unknown_email_share_message(client):
    a = client.post("/api/auth/login", json={"email": "user1@helpdesk.test", "password": "nope"})
    b = client.post("/api/auth/login", json={"email": "ghost@helpdesk.test", "password": "nope"})
    assert a.status_code == b.status_code == 401
    assert a.get_json()["message"] == b.get_json()["message"]


def test_login_missing_fields_returns_field_errors(client):
    res = client.post("/api/auth/login", json={})
    assert res.status_code == 400 and {d["field"] for d in res.get_json()["details"]} == {"email", "password"}


def test_login_with_non_json_body(client):
    assert client.post("/api/auth/login", data="x").status_code == 400


def test_protected_endpoint_requires_token(client):
    assert client.get("/api/tickets").status_code == 401
    assert client.get("/api/tickets", headers={"Authorization": "Bearer garbage"}).status_code == 401
    assert client.get("/api/tickets", headers={"Authorization": "Token abc"}).status_code == 401


def test_expired_token_rejected(app, client):
    import datetime
    import jwt
    exp = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=1)
    token = jwt.encode({"sub": "1", "role": "USER", "exp": exp}, app.config["SECRET_KEY"], algorithm="HS256")
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_token_signed_with_other_key_rejected(client):
    import jwt
    token = jwt.encode({"sub": "3", "role": "AGENT"}, "a-different-signing-key-of-32-chars-or-more", algorithm="HS256")
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_role_in_token_is_not_trusted(app, client):
    import jwt
    forged = jwt.encode({"sub": "1", "role": "AGENT"}, app.config["SECRET_KEY"], algorithm="HS256")  # user 1 is really a USER
    assert client.put("/api/tickets/1/assign", headers={"Authorization": f"Bearer {forged}"}).status_code == 403


def test_me_and_logout(client, agent1):
    assert client.get("/api/auth/me", headers=agent1).get_json()["email"] == "agent1@helpdesk.test"
    assert client.post("/api/auth/logout", headers=agent1).status_code == 204


def test_inactive_user_cannot_login(app, client):
    from app.extensions import db
    from app.models import User
    with app.app_context():
        User.query.filter_by(email="user1@helpdesk.test").update({"is_active": False})
        db.session.commit()
    assert client.post("/api/auth/login", json={"email": "user1@helpdesk.test", "password": "User@1234"}).status_code == 401


def test_unknown_route_and_method_use_error_contract(client):
    res = client.get("/api/nothing")
    assert res.status_code == 404 and set(res.get_json()) == {"status", "error", "message", "details"}
    assert client.delete("/api/tickets/1").status_code in (401, 405)  # DELETE not implemented (OQ-04)


def test_health(client):
    assert client.get("/api/health").get_json() == {"status": "ok"}
