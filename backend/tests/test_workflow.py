import pytest

# Seed: id1 Open(user1) | id2 Open(user2) | id3 Assigned(agent1, user1) | id4 In Progress(agent1, user2)
#       id5 Resolved(agent2, user1) | id6 Closed(agent1, user2) | id7 In Progress(agent2, user1)


def status(client, headers, tid, to):
    return client.put(f"/api/tickets/{tid}/status", headers=headers, json={"status": to})


def test_full_lifecycle_records_history(client, user1, agent1, new_ticket):
    tid = new_ticket["id"]
    assert client.put(f"/api/tickets/{tid}/assign", headers=agent1).get_json()["status"] == "Assigned"
    assert status(client, agent1, tid, "In Progress").status_code == 200
    assert status(client, agent1, tid, "Resolved").status_code == 200
    closed = status(client, user1, tid, "Closed")
    assert closed.status_code == 200 and closed.get_json()["status"] == "Closed"
    hist = client.get(f"/api/tickets/{tid}/history", headers=user1).get_json()
    assert [(h["fromStatus"], h["toStatus"]) for h in hist] == [
        ("Open", "Assigned"), ("Assigned", "In Progress"), ("In Progress", "Resolved"), ("Resolved", "Closed")]
    assert hist[0]["changedByName"] == "Priya Nair" and hist[-1]["changedByName"] == "Alice Morgan"


def test_assign_sets_assignee(client, agent1):
    t = client.put("/api/tickets/1/assign", headers=agent1).get_json()
    assert t["assignedTo"] == 3 and t["assigneeName"] == "Priya Nair"


def test_assign_ignores_assignee_in_body(client, agent1):
    assert client.put("/api/tickets/1/assign", headers=agent1, json={"assignedTo": 4}).get_json()["assignedTo"] == 3


def test_user_cannot_assign(client, user1):
    assert client.put("/api/tickets/1/assign", headers=user1).status_code == 403


@pytest.mark.parametrize("tid", [3, 4, 5, 6])
def test_assign_only_open_tickets(client, agent2, tid):
    assert client.put(f"/api/tickets/{tid}/assign", headers=agent2).status_code == 409


def test_second_agent_cannot_assign_taken_ticket(client, agent1, agent2):
    assert client.put("/api/tickets/1/assign", headers=agent1).status_code == 200
    assert client.put("/api/tickets/1/assign", headers=agent2).status_code == 409


def test_user_cannot_resolve(client, user1):
    assert status(client, user1, 7, "Resolved").status_code == 403


def test_user_cannot_set_in_progress(client, user1):
    assert status(client, user1, 3, "In Progress").status_code == 403


def test_open_to_closed_rejected_for_user(client, user1):
    res = status(client, user1, 1, "Closed")
    assert res.status_code == 409 and res.get_json()["error"] == "INVALID_TRANSITION"
    assert client.get("/api/tickets/1", headers=user1).get_json()["status"] == "Open"


def test_agent_cannot_close(client, agent2):
    assert status(client, agent2, 5, "Closed").status_code == 403


def test_only_owner_can_close_resolved(client, user1, user2):
    assert status(client, user2, 5, "Closed").status_code == 404   # user2 cannot even see it
    assert status(client, user1, 5, "Closed").status_code == 200


def test_close_requires_resolved(client, user1):
    assert status(client, user1, 3, "Closed").status_code == 409
    assert status(client, user1, 7, "Closed").status_code == 409


def test_only_assigned_agent_changes_status(client, agent1, agent2):
    assert status(client, agent2, 3, "In Progress").status_code == 403   # id3 belongs to agent1
    assert status(client, agent1, 3, "In Progress").status_code == 200


@pytest.mark.parametrize("tid,target,agent", [
    (3, "Resolved", "agent1"), (3, "Open", "agent1"), (3, "Assigned", "agent1"),   # skip / back / same
    (4, "Open", "agent1"), (4, "Assigned", "agent1"), (4, "In Progress", "agent1"),
    (5, "In Progress", "agent2"),                                                  # reopen
])
def test_invalid_transitions_rejected(client, agent1, agent2, tid, target, agent):
    assert status(client, {"agent1": agent1, "agent2": agent2}[agent], tid, target).status_code == 409


def test_skipping_a_step_rejected(client, agent1):
    client.put("/api/tickets/1/assign", headers=agent1)
    assert status(client, agent1, 1, "Resolved").status_code == 409


@pytest.mark.parametrize("body", [{}, {"status": ""}, {"status": "closed"}, {"status": "Done"}, {"status": None}, {"status": 3}])
def test_invalid_status_values(client, agent1, body):
    res = client.put("/api/tickets/3/status", headers=agent1, json=body)
    assert res.status_code == 400 and res.get_json()["details"][0]["field"] == "status"


def test_closed_ticket_cannot_be_changed(client, user2, agent1):
    for to in ("Open", "Assigned", "In Progress", "Resolved", "Closed"):
        assert status(client, agent1, 6, to).status_code == 409
    assert client.put("/api/tickets/6/assign", headers=agent1).status_code == 409
    assert client.put("/api/tickets/6", headers=user2, json={"subject": "x"}).status_code == 409


def test_failed_change_writes_no_history(client, agent1):
    before = len(client.get("/api/tickets/3/history", headers=agent1).get_json())
    status(client, agent1, 3, "Resolved")
    assert len(client.get("/api/tickets/3/history", headers=agent1).get_json()) == before


def test_history_scoped_to_accessible_tickets(client, user1):
    assert client.get("/api/tickets/4/history", headers=user1).status_code == 404
    assert client.get("/api/tickets/3/history", headers=user1).status_code == 200


def test_status_change_rolls_back_when_history_fails(client, agent1, monkeypatch):
    """REQ-062: if the history insert fails, the ticket status must not change."""
    from app.models import TicketHistory

    def boom(*args, **kwargs):
        raise RuntimeError("history failure")
    monkeypatch.setattr(TicketHistory, "__init__", boom)
    assert client.put("/api/tickets/3/status", headers=agent1, json={"status": "In Progress"}).status_code == 500
    monkeypatch.undo()
    assert client.get("/api/tickets/3", headers=agent1).get_json()["status"] == "Assigned"
