import pytest


def post(client, headers, tid, body):
    return client.post(f"/api/tickets/{tid}/comments", headers=headers, json={"body": body})


def test_user_comments_on_own_ticket_and_lists(client, user1):
    res = post(client, user1, 1, "  Any update?  ")
    assert res.status_code == 201 and res.get_json()["body"] == "Any update?" and res.get_json()["authorRole"] == "USER"
    assert [c["body"] for c in client.get("/api/tickets/1/comments", headers=user1).get_json()] == ["Any update?"]


def test_agent_can_comment_on_any_open_ticket(client, agent2):
    assert post(client, agent2, 1, "Looking into it").status_code == 201


def test_user_cannot_comment_or_read_on_others_ticket(client, user1):
    assert post(client, user1, 2, "hi").status_code == 404
    assert client.get("/api/tickets/2/comments", headers=user1).status_code == 404


@pytest.mark.parametrize("body", ["", "   ", None])
def test_empty_comment_rejected(client, user1, body):
    assert post(client, user1, 1, body).status_code == 400


def test_comment_length_boundary(client, user1):
    assert post(client, user1, 1, "x" * 2000).status_code == 201
    assert post(client, user1, 1, "x" * 2001).status_code == 400


def test_comments_blocked_on_closed_ticket_but_listable(client, user2, agent1):
    assert post(client, user2, 6, "late reply").status_code == 409
    assert post(client, agent1, 6, "late reply").status_code == 409
    assert client.get("/api/tickets/6/comments", headers=user2).status_code == 200


def test_comments_in_chronological_order_with_author(client, agent1):
    data = client.get("/api/tickets/4/comments", headers=agent1).get_json()
    assert [c["authorName"] for c in data] == ["Priya Nair", "Brian Lee"] and data[0]["authorRole"] == "AGENT"


def test_comment_markup_stored_verbatim(client, user1):
    assert post(client, user1, 1, "<img src=x onerror=alert(1)>").get_json()["body"] == "<img src=x onerror=alert(1)>"


def test_comments_require_auth(client):
    assert client.get("/api/tickets/1/comments").status_code == 401


def test_agent_dashboard_counts_and_recent(client, agent1):
    d = client.get("/api/dashboard", headers=agent1).get_json()
    assert d["scope"] == "all"
    assert d["counts"] == {"open": 3, "inProgress": 2, "resolved": 2, "critical": 3}  # critical excludes closed tickets
    assert [t["ticketNumber"] for t in d["recentTickets"]] == [1009, 1001, 1002, 1003, 1008]


def test_user_dashboard_scoped_to_own_tickets(client, user1):
    d = client.get("/api/dashboard", headers=user1).get_json()
    assert d["scope"] == "own" and d["counts"] == {"open": 2, "inProgress": 1, "resolved": 1, "critical": 1}
    assert all(t["userId"] == 1 for t in d["recentTickets"])


def test_dashboard_updates_after_changes(client, agent1, new_ticket):
    assert client.get("/api/dashboard", headers=agent1).get_json()["counts"]["open"] == 4
    client.put(f"/api/tickets/{new_ticket['id']}/assign", headers=agent1)
    d = client.get("/api/dashboard", headers=agent1).get_json()
    assert d["counts"]["open"] == 3 and d["recentTickets"][0]["id"] == new_ticket["id"]


def test_dashboard_requires_auth(client):
    assert client.get("/api/dashboard").status_code == 401


def test_categories(client, user1):
    assert [c["name"] for c in client.get("/api/categories", headers=user1).get_json()] == ["Login", "Payment", "Account", "Technical", "Other"]
