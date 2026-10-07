import pytest

from conftest import file_part

VALID = {"subject": "Cannot print", "description": "Printer shows an error code.", "categoryId": 4, "priority": "Medium"}
FORM = {k: str(v) for k, v in VALID.items()}
MULTIPART = "multipart/form-data"


def create(client, headers, **overrides):
    return client.post("/api/tickets", headers=headers, json={**VALID, **overrides})


def test_create_ticket_sets_system_fields(client, user1):
    res = create(client, user1)
    t = res.get_json()
    assert res.status_code == 201
    assert t["status"] == "Open" and t["assignedTo"] is None and t["ticketNumber"] == 1011 and t["createdAt"].endswith("Z")
    assert t["ownerName"] == "Alice Morgan" and t["categoryName"] == "Technical"


def test_ticket_numbers_are_sequential_and_unique(client, user1):
    a, b = create(client, user1).get_json(), create(client, user1).get_json()
    assert b["ticketNumber"] == a["ticketNumber"] + 1


@pytest.mark.parametrize("overrides,field", [
    ({"subject": ""}, "subject"), ({"subject": "   "}, "subject"), ({"subject": "x" * 151}, "subject"),
    ({"description": "123456789"}, "description"), ({"description": "         x         "}, "description"),
    ({"description": "x" * 5001}, "description"),
    ({"priority": ""}, "priority"), ({"priority": "Urgent"}, "priority"), ({"priority": "low"}, "priority"),
    ({"categoryId": None}, "categoryId"), ({"categoryId": 999}, "categoryId"), ({"categoryId": "abc"}, "categoryId"),
])
def test_create_validation_errors(client, user1, overrides, field):
    res = create(client, user1, **overrides)
    assert res.status_code == 400
    assert field in {d["field"] for d in res.get_json()["details"]}


def test_boundaries_accepted(client, user1):
    assert create(client, user1, subject="x" * 150, description="1234567890").status_code == 201
    assert create(client, user1, subject="x", description="x" * 5000).status_code == 201


def test_all_validation_errors_reported_together(client, user1):
    res = client.post("/api/tickets", headers=user1, json={})
    assert {d["field"] for d in res.get_json()["details"]} == {"subject", "description", "priority", "categoryId"}


def test_values_are_trimmed(client, user1):
    t = create(client, user1, subject="  Hello  ", description="  ten chars!!  ").get_json()
    assert t["subject"] == "Hello" and t["description"] == "ten chars!!"


def test_agent_cannot_create_ticket(client, agent1):
    assert create(client, agent1).status_code == 403


def test_create_with_attachment_multipart_and_download(client, user1):
    res = client.post("/api/tickets", headers=user1, data={**FORM, "attachment": file_part()}, content_type=MULTIPART)
    assert res.status_code == 201
    att = res.get_json()["attachments"][0]
    assert att["name"] == "note.txt" and att["size"] == 5
    dl = client.get(f"/api/tickets/{res.get_json()['id']}/attachments/{att['id']}", headers=user1)
    assert dl.status_code == 200 and dl.data == b"hello"


def test_attachment_download_scoped_to_ticket_access(client, user1, user2):
    res = client.post("/api/tickets", headers=user1, data={**FORM, "attachment": file_part()}, content_type=MULTIPART).get_json()
    assert client.get(f"/api/tickets/{res['id']}/attachments/{res['attachments'][0]['id']}", headers=user2).status_code == 404


def test_attachment_type_and_size_rules(client, user1):
    bad = client.post("/api/tickets", headers=user1, data={**FORM, "attachment": file_part("virus.exe", b"x")}, content_type=MULTIPART)
    assert bad.status_code == 400 and bad.get_json()["details"][0]["field"] == "attachment"
    big = client.post("/api/tickets", headers=user1, data={**FORM, "attachment": file_part("big.pdf", b"x" * (5 * 1024 * 1024 + 1))}, content_type=MULTIPART)
    assert big.status_code == 400
    exact = client.post("/api/tickets", headers=user1, data={**FORM, "attachment": file_part("ok.pdf", b"x" * (5 * 1024 * 1024))}, content_type=MULTIPART)
    assert exact.status_code == 201


def test_invalid_attachment_creates_no_ticket(client, user1):
    before = client.get("/api/tickets", headers=user1).get_json()["total"]
    client.post("/api/tickets", headers=user1, data={**FORM, "attachment": file_part("a.exe")}, content_type=MULTIPART)
    assert client.get("/api/tickets", headers=user1).get_json()["total"] == before


def test_user_sees_only_own_tickets_agent_sees_all(client, user1, agent1):
    own = client.get("/api/tickets?pageSize=100", headers=user1).get_json()
    assert own["total"] == 5 and all(t["userId"] == 1 for t in own["data"])
    assert client.get("/api/tickets", headers=agent1).get_json()["total"] == 10


def test_user_cannot_read_other_users_ticket(client, user1):
    assert client.get("/api/tickets/2", headers=user1).status_code == 404  # ticket 2 belongs to user2
    assert client.get("/api/tickets/1", headers=user1).status_code == 200


def test_ticket_not_found(client, agent1):
    assert client.get("/api/tickets/9999", headers=agent1).status_code == 404


def test_details_include_allowed_actions(client, user1, agent1):
    assert client.get("/api/tickets/1", headers=user1).get_json()["allowedActions"]["canEdit"] is True
    assert client.get("/api/tickets/1", headers=agent1).get_json()["allowedActions"]["canAssign"] is True


def test_list_pagination(client, agent1):
    p1 = client.get("/api/tickets?pageSize=4&page=1", headers=agent1).get_json()
    p3 = client.get("/api/tickets?pageSize=4&page=3", headers=agent1).get_json()
    beyond = client.get("/api/tickets?pageSize=4&page=9", headers=agent1).get_json()
    assert (len(p1["data"]), p1["totalPages"], p1["total"]) == (4, 3, 10)
    assert len(p3["data"]) == 2 and beyond["data"] == []


@pytest.mark.parametrize("query", ["page=0", "page=abc", "pageSize=0", "pageSize=101", "sort=bogus", "sort=priority:up", "status=Bad", "priority=Bad", "categoryId=x"])
def test_list_invalid_params(client, agent1, query):
    assert client.get(f"/api/tickets?{query}", headers=agent1).status_code == 400


def test_search_filter_sort(client, agent1):
    by = lambda q: client.get(f"/api/tickets?{q}", headers=agent1).get_json()
    assert [t["subject"] for t in by("search=login")["data"]] == ["Login issue"]
    assert by("search=%231002")["data"][0]["ticketNumber"] == 1002
    assert by("search=1002")["total"] == 1
    assert by("search=zzzz")["total"] == 0
    assert by("status=Resolved")["total"] == 2
    assert by("priority=Critical&status=Open")["total"] == 1
    assert by("categoryId=2")["total"] == 2
    prios = [t["priority"] for t in by("sort=priority:desc&pageSize=100")["data"]]
    assert prios[0] == "Critical" and prios[-1] == "Low"
    created = [t["createdAt"] for t in by("sort=createdAt:asc&pageSize=100")["data"]]
    assert created == sorted(created)


def test_sql_injection_string_is_harmless(client, agent1):
    assert client.get("/api/tickets?search=' OR 1=1 --", headers=agent1).get_json()["total"] == 0


def test_edit_own_open_ticket(client, user1):
    res = client.put("/api/tickets/1", headers=user1, json={**VALID, "subject": "Updated subject"})
    assert res.status_code == 200 and res.get_json()["subject"] == "Updated subject" and res.get_json()["status"] == "Open"


def test_edit_validates_and_is_restricted(client, user1, user2, agent1):
    assert client.put("/api/tickets/1", headers=user1, json={**VALID, "subject": ""}).status_code == 400
    assert client.put("/api/tickets/1", headers=user2, json=VALID).status_code == 404       # not the owner
    assert client.put("/api/tickets/1", headers=agent1, json=VALID).status_code == 403      # agents: OQ-03
    assert client.put("/api/tickets/3", headers=user1, json=VALID).status_code == 409       # Assigned, not editable
    assert client.put("/api/tickets/6", headers=user2, json=VALID).status_code == 409       # Closed (Rule 6)


def test_edit_cannot_change_status_or_assignee(client, user1):
    res = client.put("/api/tickets/1", headers=user1, json={**VALID, "status": "Closed", "assignedTo": 3})
    assert res.get_json()["status"] == "Open" and res.get_json()["assignedTo"] is None


def test_xss_payload_stored_as_plain_text(client, user1):
    t = create(client, user1, subject="<script>alert(1)</script>").get_json()
    assert t["subject"] == "<script>alert(1)</script>"  # escaped by the React UI on render
