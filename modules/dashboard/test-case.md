# Dashboard Module — Test Cases

Test cases for the `dashboard` module (REQ-050, REQ-051, REQ-052), derived from `modules/dashboard/specification.md` and `requirement.md`. Count definitions, recent-ticket rules and the User Dashboard content are **Provisional** (A-10, A-17; OQ-18, OQ-19). Cases that depend on them carry the OQ tag in the Test Scenario cell and must be re-validated when the open questions are answered. Proposed OQ-29..OQ-32 are defined in the specification (Section 16) and are not yet in `requirement.md`.

## Legend

| Item | Meaning |
|---|---|
| P1 | Critical / smoke |
| P2 | High |
| P3 | Medium |
| P4 | Low |
| Techniques | Positive, Negative, Equivalence Partitioning / Boundary Value Analysis, Decision Table, State Transition, Role / Permission, API, Integration, Database, Error Handling, Edge / Exploratory |
| Ticket id | In the seed, internal `id` = ticket number minus 1000 (for example #1007 has id 7). Provisional (A-09). |
| API tooling | Any REST client; header `Authorization: Bearer <token>` obtained from `POST /api/auth/login` (A-11). |
| Status literals | Shown as display values (`In Progress`); stored form per implementation (OQ-26). |

## Seed accounts (Provisional seed data)

| Account | Role | Password |
|---|---|---|
| user1@helpdesk.test | User | As defined in the seed script (OQ-09) |
| user2@helpdesk.test | User | As defined in the seed script (OQ-09) |
| agent1@helpdesk.test | Support Agent | As defined in the seed script (OQ-09) |

## Seed dataset (Provisional seed data)

`created_at` is 2026-10-01 09:00 UTC for #1001 and increases by exactly one minute per ticket (#1012 = 09:11). Every ticket not in `Open` status has `assigned_to` = agent1. Category: any valid seeded category.

| Ticket # | Owner | Subject | Status | Priority |
|---|---|---|---|---|
| 1001 | user1 | Printer offline | Open | Low |
| 1002 | user1 | Payment failed | Open | Critical |
| 1003 | user2 | Slow report page | Open | High |
| 1004 | user2 | VPN not connecting | Assigned | Critical |
| 1005 | user1 | Request new monitor | Assigned | Medium |
| 1006 | user1 | Email sync error | In Progress | High |
| 1007 | user2 | Server outage | In Progress | Critical |
| 1008 | user2 | Update font size | In Progress | Low |
| 1009 | user1 | Password policy query | Resolved | Medium |
| 1010 | user2 | Checkout error | Resolved | Critical |
| 1011 | user1 | Data loss on save | Closed | Critical |
| 1012 | user2 | Typo on homepage | Closed | Low |

### Expected values derived from the seed (Provisional, A-10 / A-17)

| View | Open Tickets | In Progress | Resolved | Critical | Recent Tickets (newest first) |
|---|---|---|---|---|---|
| Agent (all) | 3 (1001, 1002, 1003) | 3 (1006, 1007, 1008) | 2 (1009, 1010) | 4 (1002, 1004, 1007, 1010; 1011 is Closed) | 1012, 1011, 1010, 1009, 1008 |
| user1 | 2 (1001, 1002) | 1 (1006) | 1 (1009) | 1 (1002) | 1011, 1009, 1006, 1005, 1002 |
| user2 | 1 (1003) | 2 (1007, 1008) | 1 (1010) | 3 (1004, 1007, 1010) | 1012, 1010, 1008, 1007, 1004 |

Not counted in any status counter: Assigned = 2 (1004, 1005), Closed = 2 (1011, 1012). Total tickets = 12.

**Reset rule:** every case that changes data starts by restoring the seed dataset exactly as above ("Reset seed"). Cases that need a subset say so in Preconditions.

## Acceptance criteria traceability

| AC | Covered by |
|---|---|
| DSH-AC-01 | DSH-TC-001 |
| DSH-AC-02 | DSH-TC-018, 019, 020, 021, 022, 041 |
| DSH-AC-03 | DSH-TC-002 |
| DSH-AC-04 | DSH-TC-006, 007 |
| DSH-AC-05 | DSH-TC-003, 004, 005 |
| DSH-AC-06 | DSH-TC-010, 027, 047 |
| DSH-AC-07 | DSH-TC-029, 027, 028 |
| DSH-AC-08 | DSH-TC-008, 009, 043 |
| DSH-AC-09 | DSH-TC-036, 037 |
| DSH-AC-10 | DSH-TC-023, 024, 025, 026, 037 |
| DSH-AC-11 | DSH-TC-012, 017 |
| DSH-AC-12 | DSH-TC-013, 014, 015, 016 |
| DSH-AC-13 | DSH-TC-030, 031, 035, 038, 039, 040 |
| DSH-AC-14 | DSH-TC-032, 048 |
| DSH-AC-15 | DSH-TC-042 |
| DSH-AC-16 | DSH-TC-045, 048 |
| DSH-AC-17 | DSH-TC-011, 028 |

---

## 1. Positive

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-001 | Agent dashboard shows the heading and four correct counters [REQ-050] [OQ-18] | Reset seed | 1. Open the application login page<br>2. Log in as agent1<br>3. Observe the dashboard that is displayed | agent1@helpdesk.test | Heading "SUPPORT DASHBOARD" is shown. Labels shown: Open Tickets, In Progress, Resolved, Critical. Values: Open Tickets 3, In Progress 3, Resolved 2, Critical 4. | P1 |
| DSH-TC-002 | Agent Recent Tickets shows the 5 newest tickets, newest first, in format "#number subject priority" [REQ-051] [OQ-18] | Reset seed | 1. Log in as agent1<br>2. Read the Recent Tickets list top to bottom | agent1@helpdesk.test | Exactly 5 entries in this order: "#1012 Typo on homepage Low", "#1011 Data loss on save Critical", "#1010 Checkout error Critical", "#1009 Password policy query Medium", "#1008 Update font size Low". #1007 and older are not listed. Closed tickets (#1012, #1011) are included. | P1 |
| DSH-TC-003 | user1 dashboard shows counters scoped to own tickets [REQ-052] [REQ-050] [OQ-19] [OQ-18] | Reset seed | 1. Log in as user1<br>2. Read the four counters on the dashboard | user1@helpdesk.test | Open Tickets 2, In Progress 1, Resolved 1, Critical 1. No system-wide values (3/3/2/4) are shown. | P1 |
| DSH-TC-004 | user2 dashboard shows counters scoped to own tickets [REQ-052] [REQ-050] [OQ-19] [OQ-18] | Reset seed | 1. Log in as user2<br>2. Read the four counters on the dashboard | user2@helpdesk.test | Open Tickets 1, In Progress 2, Resolved 1, Critical 3. | P2 |
| DSH-TC-005 | user1 Recent Tickets lists only own tickets, newest first, maximum 5 [REQ-052] [REQ-051] [OQ-19] | Reset seed. user1 owns 6 tickets (#1001, 1002, 1005, 1006, 1009, 1011). | 1. Log in as user1<br>2. Read the Recent Tickets list | user1@helpdesk.test | Exactly 5 entries in this order: "#1011 Data loss on save Critical", "#1009 Password policy query Medium", "#1006 Email sync error High", "#1005 Request new monitor Medium", "#1002 Payment failed Critical". #1001 (6th newest) and every user2 ticket are absent. | P1 |
| DSH-TC-006 | Agent selects a Recent Tickets entry and Ticket Details of that ticket opens [REQ-051] | Reset seed. Logged in as agent1 on the dashboard. | 1. Click the entry "#1011 Data loss on save Critical"<br>2. Observe the screen that opens<br>3. Compare ticket number, subject, priority with the entry | Ticket #1011 | Ticket Details of #1011 opens showing number 1011, subject "Data loss on save", priority Critical, status Closed. | P1 |
| DSH-TC-007 | User selects an own Recent Tickets entry and Ticket Details opens [REQ-051] [REQ-052] [OQ-19] | Reset seed. Logged in as user1 on the dashboard. | 1. Click the entry "#1009 Password policy query Medium"<br>2. Observe the screen that opens | Ticket #1009 | Ticket Details of #1009 opens (subject "Password policy query", priority Medium, status Resolved). No access error is shown. | P2 |

## 2. Negative

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-008 | GET /api/dashboard without valid authentication returns 401 [REQ-052] [REQ-050] [OQ-26] | None | 1. Send GET /api/dashboard with no Authorization header<br>2. Repeat with header `Authorization: Bearer abc.def.ghi` (malformed)<br>3. Repeat with a token of user1 whose last character is altered (tampered)<br>4. Repeat with an expired token (wait for expiry, or use a token issued with past expiry in the test environment) | Variants: none, malformed, tampered, expired | Each request returns HTTP 401 with body in the error contract (`status` 401, `error`, `message`). No counts or tickets are returned. | P1 |
| DSH-TC-009 | Opening the dashboard URL without a session redirects to Login [REQ-052] [REQ-050] [OQ-32] | Browser has no session (cleared storage/cookies) | 1. Open the dashboard URL directly in the browser (path per implementation, OQ-32)<br>2. Observe the result | None | Browser is redirected to the Login screen. No counters or ticket data are rendered, not even briefly. | P1 |
| DSH-TC-010 | User cannot widen scope with query parameters [REQ-052] [REQ-050] [OQ-26] | Reset seed. Token of user1. Id of user2 = obtained from the users table. | 1. Send GET /api/dashboard<br>2. Send GET /api/dashboard?userId=<id of user2><br>3. Send GET /api/dashboard?scope=all<br>4. Send GET /api/dashboard?role=AGENT<br>5. Compare the four responses | Token: user1. Parameters as listed | All four responses are HTTP 200 and identical: `scope` OWN, counts open 2, inProgress 1, resolved 1, critical 1, recent tickets 1011, 1009, 1006, 1005, 1002. Parameters have no effect. | P1 |
| DSH-TC-011 | User cannot open the Agent Dashboard route [REQ-052] [REQ-002] [OQ-32] | Reset seed. Logged in as user1. | 1. Enter the URL of the Agent Dashboard ("SUPPORT DASHBOARD") route manually in the address bar<br>2. Observe the result | URL per implementation (OQ-32) | Agent Dashboard and system-wide figures (3/3/2/4) are not displayed. User is shown an access-denied page or redirected to the User Dashboard (exact behaviour TBD, OQ-32). | P2 |

## 3. Equivalence Partitioning / Boundary Value Analysis

Recent Tickets list size: partitions 0, 1..4, 5, 6 or more. For each case: log in as agent1, empty the `tickets` table (including dependent rows), then insert only the first N seed tickets (#1001..#100N with the seed attributes).

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-012 | Agent dashboard with 0 tickets shows zeros and empty-state [REQ-050] [REQ-051] [OQ-31] | `tickets` table empty (N = 0) | 1. Log in as agent1<br>2. Read counters and the Recent Tickets area | N = 0 | All four counters show `0` (not blank). Recent Tickets shows an empty-state message (wording TBD, OQ-31) and no entries. No error message. API returns 200 with `recentTickets` = `[]`. | P1 |
| DSH-TC-013 | Agent dashboard with exactly 1 ticket (lower boundary) [REQ-050] [REQ-051] | Only #1001 exists (N = 1) | 1. Log in as agent1<br>2. Read counters and the Recent Tickets list | N = 1 (#1001 Open Low) | Open Tickets 1, In Progress 0, Resolved 0, Critical 0. Recent Tickets: "#1001 Printer offline Low" only. | P2 |
| DSH-TC-014 | Agent dashboard with 4 tickets (below the list limit) [REQ-050] [REQ-051] [OQ-18] | Only #1001..#1004 exist (N = 4) | 1. Log in as agent1<br>2. Read counters and the Recent Tickets list | N = 4 | Open Tickets 3 (1001, 1002, 1003), In Progress 0, Resolved 0, Critical 2 (1002, 1004; #1004 is Assigned). Recent Tickets: 1004, 1003, 1002, 1001 (4 entries). | P2 |
| DSH-TC-015 | Agent dashboard with exactly 5 tickets (at the list limit) [REQ-050] [REQ-051] [OQ-18] | Only #1001..#1005 exist (N = 5) | 1. Log in as agent1<br>2. Read counters and the Recent Tickets list | N = 5 | Open Tickets 3, In Progress 0, Resolved 0, Critical 2. Recent Tickets: 1005, 1004, 1003, 1002, 1001 (5 entries). | P1 |
| DSH-TC-016 | Agent dashboard with 6 tickets (above the limit): oldest excluded [REQ-050] [REQ-051] [OQ-18] | Only #1001..#1006 exist (N = 6) | 1. Log in as agent1<br>2. Read counters and the Recent Tickets list | N = 6 | Open Tickets 3, In Progress 1 (1006), Resolved 0, Critical 2. Recent Tickets: 1006, 1005, 1004, 1003, 1002 (5 entries). #1001 is not listed, but still counted in Open Tickets. | P1 |
| DSH-TC-017 | User with 0 own tickets sees zeros and empty-state while others have tickets [REQ-052] [REQ-051] [OQ-19] [OQ-31] | Reset seed, then delete all tickets owned by user2 (#1003, 1004, 1007, 1008, 1010, 1012) | 1. Log in as user2<br>2. Read counters and the Recent Tickets area<br>3. Log out and log in as agent1<br>4. Read the counters | user2@helpdesk.test, agent1@helpdesk.test | Step 2: counters all `0`, empty-state message, no entries, no error. Step 4: Open Tickets 2, In Progress 1, Resolved 1, Critical 1 (only user1 tickets remain). | P2 |

## 4. Decision Table

Counters incremented by one ticket, derived from Specification Section 6.2 (Provisional, A-10; Assigned flagged OQ-18).

| Status | Priority Low / Medium / High | Priority Critical |
|---|---|---|
| Open | Open Tickets | Open Tickets and Critical |
| Assigned | none (OQ-18) | Critical |
| In Progress | In Progress | In Progress and Critical |
| Resolved | Resolved | Resolved and Critical |
| Closed | none | none |

For every case: log in as agent1, empty the `tickets` table, insert ONLY the ticket(s) of one row (owner user1, other attributes as in the seed), reload the dashboard, read counters. Each row is executed on its own database state.

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-018 | Critical tickets in Open, In Progress and Resolved count in the status counter and in Critical [REQ-050] [OQ-18] | `tickets` table empty | 1. Insert one ticket: status Open, priority Critical<br>2. Log in as agent1 and read counters<br>3. Replace the ticket with one of status In Progress, priority Critical; reload and read counters<br>4. Replace it with one of status Resolved, priority Critical; reload and read counters | Rows: (Open, Critical), (In Progress, Critical), (Resolved, Critical) | Row 1: Open 1, In Progress 0, Resolved 0, Critical 1. Row 2: Open 0, In Progress 1, Resolved 0, Critical 1. Row 3: Open 0, In Progress 0, Resolved 1, Critical 1. | P1 |
| DSH-TC-019 | Critical ticket in Assigned counts only in Critical [REQ-050] [OQ-18] | `tickets` table empty | 1. Insert one ticket: status Assigned, priority Critical<br>2. Log in as agent1 and read counters | Row: (Assigned, Critical) | Open 0, In Progress 0, Resolved 0, Critical 1. (Provisional per A-10; if OQ-18 decides that Open includes Assigned, update expected Open to 1.) | P2 |
| DSH-TC-020 | Critical ticket in Closed counts in no counter [REQ-050] [OQ-18] | `tickets` table empty | 1. Insert one ticket: status Closed, priority Critical<br>2. Log in as agent1 and read counters and Recent Tickets | Row: (Closed, Critical) | All four counters are 0. The ticket still appears in Recent Tickets (Provisional, A-10). | P1 |
| DSH-TC-021 | Non-Critical Open, In Progress and Resolved tickets increment only their status counter [REQ-050] | `tickets` table empty | 1. For each of the 9 rows below: insert only that ticket, reload the agent dashboard, read the counters, then delete the ticket | Rows: (Open: Low, Medium, High), (In Progress: Low, Medium, High), (Resolved: Low, Medium, High) | For each row exactly one counter is 1: Open rows give Open 1; In Progress rows give In Progress 1; Resolved rows give Resolved 1. Critical is 0 for all 9 rows. | P2 |
| DSH-TC-022 | Non-Critical Assigned and Closed tickets are counted in no counter [REQ-050] [OQ-18] | `tickets` table empty | 1. For each of the 6 rows below: insert only that ticket, reload the agent dashboard, read the counters, then delete the ticket | Rows: (Assigned: Low, Medium, High), (Closed: Low, Medium, High) | All four counters are 0 for all 6 rows (Provisional, A-10). | P2 |

## 5. State Transition

Each case starts from the seed and uses the Ticket Details / Update Ticket actions of the `ticket-workflow` module (assign, change status). Agent views are taken as agent1; User views as the ticket owner. Transition rules themselves are tested in `ticket-workflow`.

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-023 | Open to Assigned: Open Tickets decreases by 1, no counter increases [REQ-050] [OQ-18] | Reset seed. Logged in as agent1; dashboard shows 3/3/2/4. | 1. Open Ticket #1001 (Open, Low, user1) from All Tickets<br>2. Click Assign to me<br>3. Return to the dashboard (menu) and reload<br>4. Read counters<br>5. Log in as user1 and read the dashboard counters | Ticket #1001 | Agent: Open Tickets 2, In Progress 3, Resolved 2, Critical 4. user1: Open 1, In Progress 1, Resolved 1, Critical 1. #1001 is not counted anywhere (Assigned). Recent list unchanged. | P1 |
| DSH-TC-024 | Assigned to In Progress: In Progress increases by 1 [REQ-050] | Reset seed. Logged in as agent1 (assigned agent of #1005). | 1. Open Ticket #1005 (Assigned, Medium, user1)<br>2. Change status to In Progress<br>3. Return to the dashboard and reload<br>4. Read counters<br>5. Log in as user1 and read the counters | Ticket #1005 | Agent: Open 3, In Progress 4, Resolved 2, Critical 4. user1: Open 2, In Progress 2, Resolved 1, Critical 1. | P1 |
| DSH-TC-025 | In Progress to Resolved: In Progress decreases by 1, Resolved increases by 1 [REQ-050] | Reset seed. Logged in as agent1 (assigned agent of #1006). | 1. Open Ticket #1006 (In Progress, High, user1)<br>2. Change status to Resolved<br>3. Return to the dashboard and reload<br>4. Read counters<br>5. Log in as user1 and read the counters | Ticket #1006 | Agent: Open 3, In Progress 2, Resolved 3, Critical 4. user1: Open 2, In Progress 0, Resolved 2, Critical 1. | P1 |
| DSH-TC-026 | Resolved to Closed (Critical ticket): Resolved and Critical both decrease by 1; ticket stays in Recent Tickets [REQ-050] [REQ-051] [OQ-18] | Reset seed. Logged in as user2 (owner of #1010). | 1. Open Ticket #1010 (Resolved, Critical, user2)<br>2. Click Close ticket<br>3. Return to the user2 dashboard and reload; read counters<br>4. Log in as agent1; read counters and the Recent Tickets list | Ticket #1010 | user2: Open 1, In Progress 2, Resolved 0, Critical 2. Agent: Open 3, In Progress 3, Resolved 1, Critical 3. Agent Recent Tickets still lists 1012, 1011, 1010, 1009, 1008 (ordering is by creation, not by status change). | P1 |

## 6. Role / Permission

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-027 | User API response contains only own-scope data [REQ-052] [REQ-050] [REQ-051] [OQ-19] | Reset seed. Token of user1. | 1. Send GET /api/dashboard with the user1 token<br>2. Inspect `scope`, `counts` and every item of `recentTickets`<br>3. Look up the owner of each returned ticket number in the database | Token: user1 | HTTP 200. `scope` = OWN. counts: open 2, inProgress 1, resolved 1, critical 1. `recentTickets` ticket numbers: 1011, 1009, 1006, 1005, 1002; all owned by user1; no user2 ticket present. | P1 |
| DSH-TC-028 | Agent API response is system-wide and equals the sum of both users [REQ-050] [REQ-051] [OQ-18] | Reset seed. Tokens of agent1, user1, user2. | 1. Send GET /api/dashboard with the agent1 token<br>2. Send GET /api/dashboard with the user1 token and with the user2 token<br>3. Add the user1 and user2 counts per counter and compare with the agent counts | Tokens: agent1, user1, user2 | Agent: `scope` ALL, open 3, inProgress 3, resolved 2, critical 4. Sum of users: open 2+1, inProgress 1+2, resolved 1+1, critical 1+3 = 3, 3, 2, 4, equal to the agent values. Agent recent list contains tickets of both owners (1012 user2, 1011 user1). | P1 |

## 7. API

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-029 | Response structure, field names and data types [REQ-050] [REQ-051] [REQ-052] [OQ-26] | Reset seed. Tokens of agent1 and user1. | 1. Send GET /api/dashboard as agent1<br>2. Check status code and Content-Type header<br>3. Validate the JSON body against the schema in the specification (Section 9.1)<br>4. Repeat as user1 | Tokens: agent1, user1 | HTTP 200, Content-Type is application/json. `scope` is string (ALL / OWN). `counts.open`, `counts.inProgress`, `counts.resolved`, `counts.critical` are integers >= 0. `recentTickets` is an array of at most 5 objects, each with integer `id`, integer `ticketNumber`, string `subject`, `priority` in {Low, Medium, High, Critical}, ISO-8601 UTC `createdAt`. No other fields (no description, e-mail, password data). Field names are Provisional (OQ-26). | P1 |
| DSH-TC-030 | Dashboard counters agree with the ticket list endpoint filtered by the same criteria [REQ-050] [REQ-052] [OQ-11] [OQ-18] | Reset seed. Tokens of agent1 and user1. List endpoint filter parameter names (`status`, `priority`) are Provisional (OQ-11); use the implemented names. | 1. As agent1 call GET /api/dashboard and note the counts<br>2. As agent1 call GET /api/tickets filtered by status Open, then In Progress, then Resolved; note each total<br>3. As agent1 call GET /api/tickets filtered by priority Critical and note the total, then subtract tickets with status Closed<br>4. Repeat steps 1 to 3 as user1 | Tokens: agent1, user1 | Agent: list totals Open 3, In Progress 3, Resolved 2; Critical list total 5 (1002, 1004, 1007, 1010, 1011) minus 1 Closed (1011) = 4. All equal the dashboard counts 3/3/2/4. user1: list totals 2, 1, 1; Critical 2 (1002, 1011) minus 1 Closed = 1; equal to dashboard 2/1/1/1. | P1 |
| DSH-TC-031 | Recent tickets equal the first 5 rows of the ticket list sorted by creation date descending [REQ-051] [REQ-052] [OQ-11] [OQ-18] | Reset seed. Tokens of agent1 and user1. | 1. As agent1 call GET /api/dashboard; note `recentTickets` ticket numbers<br>2. As agent1 call GET /api/tickets with default sort (created_at descending, A-17) and page size 5; note the ticket numbers of page 1<br>3. Compare both sequences<br>4. Repeat steps 1 to 3 as user1 | Tokens: agent1, user1 | Agent sequences both 1012, 1011, 1010, 1009, 1008. user1 sequences both 1011, 1009, 1006, 1005, 1002. | P2 |
| DSH-TC-032 | GET /api/dashboard is read-only and idempotent [REQ-050] [REQ-051] [REQ-052] | Reset seed. Token of agent1. Database access. | 1. Record: count of rows in `tickets`, in `ticket_history`, and `MAX(updated_at)` of `tickets`<br>2. Send GET /api/dashboard three times as agent1 and store the three bodies<br>3. Re-read the values recorded in step 1<br>4. Compare the three bodies | Token: agent1 | The three bodies are identical. Row counts and `MAX(updated_at)` are unchanged (12 rows in `tickets`). No row was created, updated or deleted. | P2 |
| DSH-TC-033 | A status change is visible in the very next API call (no stale HTTP cache) [REQ-050] [OQ-29] | Reset seed. Tokens of agent1. | 1. Call GET /api/dashboard as agent1; note counts (3/3/2/4) and the Cache-Control response header<br>2. Call PUT /api/tickets/1/assign (ticket #1001) as agent1<br>3. Immediately call GET /api/dashboard again as agent1 | Ticket #1001, id 1 | Second response shows Open 2 (all other counters unchanged). The response is not served from a client or proxy cache (header policy TBD, OQ-29; response must not allow stale reuse for this flow). | P2 |

## 8. Integration

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-034 | After login each role lands on its own dashboard [REQ-050] [REQ-052] [OQ-19] | Reset seed. Logged out. | 1. Log in as agent1 and note the screen<br>2. Log out<br>3. Log in as user1 and note the screen | agent1@helpdesk.test, user1@helpdesk.test | Agent lands on the "SUPPORT DASHBOARD" with values 3/3/2/4. User lands on the User Dashboard with values 2/1/1/1. | P1 |
| DSH-TC-035 | UI values equal the API response values [REQ-050] [REQ-051] [REQ-052] | Reset seed. Browser developer tools open (Network tab). | 1. Log in as agent1 and capture the GET /api/dashboard response<br>2. Compare each counter and each recent entry on screen with the response<br>3. Repeat as user1 | agent1, user1 | Every displayed counter and recent entry (number, subject, priority) equals the response; no value is shown that is absent from the response; order is identical. | P1 |
| DSH-TC-036 | Creating a ticket updates counters and recent list for the owner and the agent [REQ-050] [REQ-051] [REQ-052] [OQ-18] | Reset seed. Next ticket number assumed 1013 (A-09). Logged in as user1. | 1. Open Create Ticket<br>2. Enter the data below and submit<br>3. Open the user1 dashboard and reload<br>4. Log in as agent1 and open the dashboard<br>5. Log in as user2 and open the dashboard | Subject: Screen flickers<br>Description: Monitor flickers every few minutes<br>Category: any valid<br>Priority: Critical | user1: Open 3, In Progress 1, Resolved 1, Critical 2; recent list 1013, 1011, 1009, 1006, 1005. Agent: Open 4, In Progress 3, Resolved 2, Critical 5; recent list 1013, 1012, 1011, 1010, 1009. user2 unchanged: 1, 2, 1, 3. Entry shows "#1013 Screen flickers Critical". | P1 |
| DSH-TC-037 | Full lifecycle of a new ticket changes the agent counters step by step [REQ-050] [REQ-051] [OQ-18] | Reset seed. Next ticket number 1013 (A-09). | 1. As user1 create ticket (data below); open the agent dashboard (agent1) and record counters<br>2. As agent1 assign #1013 to self; reload dashboard; record<br>3. As agent1 set In Progress; reload; record<br>4. As agent1 set Resolved; reload; record<br>5. As user1 close #1013; as agent1 reload; record | Subject: Cable replacement<br>Description: Replace damaged network cable<br>Priority: Low<br>Category: any valid | Agent counters (Open, In Progress, Resolved, Critical): start 3, 3, 2, 4; after create 4, 3, 2, 4; after assign 3, 3, 2, 4; after In Progress 3, 4, 2, 4; after Resolved 3, 3, 3, 4; after Closed 3, 3, 2, 4. Critical stays 4 throughout (Low priority). #1013 is first in Recent Tickets at every step. | P1 |

## 9. Database

SQL is conceptual; adapt the status literal and table naming to the implementation (OQ-26).

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-038 | Agent counters equal SQL COUNT on `tickets` [REQ-050] [OQ-18] | Reset seed. Database read access. | 1. Run the four queries below<br>2. Log in as agent1 and read the dashboard counters<br>3. Compare | Q1: `SELECT COUNT(*) FROM tickets WHERE status = 'Open'`<br>Q2: `... WHERE status = 'In Progress'`<br>Q3: `... WHERE status = 'Resolved'`<br>Q4: `... WHERE priority = 'Critical' AND status <> 'Closed'` | Q1 = 3, Q2 = 3, Q3 = 2, Q4 = 4; dashboard shows the same four values. | P1 |
| DSH-TC-039 | User counters equal SQL COUNT filtered by owner [REQ-052] [REQ-050] [OQ-19] | Reset seed. Database read access. | 1. Run Q1 to Q4 from DSH-TC-038 each with an extra condition `AND user_id = (SELECT id FROM users WHERE email = 'user1@helpdesk.test')`<br>2. Repeat with `'user2@helpdesk.test'`<br>3. Log in as user1 and as user2 and compare with their dashboards | user1, user2 | user1 queries: 2, 1, 1, 1. user2 queries: 1, 2, 1, 3. Both dashboards show the same values. | P1 |
| DSH-TC-040 | Recent tickets equal SQL ORDER BY created_at DESC LIMIT 5 [REQ-051] [OQ-18] | Reset seed. Database read access. | 1. Run `SELECT ticket_number, subject, priority FROM tickets ORDER BY created_at DESC, id DESC LIMIT 5`<br>2. Run the same with `WHERE user_id = <id of user1>`<br>3. Compare with the agent and user1 dashboard lists | Queries as listed | Query 1 returns 1012, 1011, 1010, 1009, 1008; query 2 returns 1011, 1009, 1006, 1005, 1002. Dashboards show the same rows in the same order with the same subject and priority text. | P2 |
| DSH-TC-041 | Assigned and Closed tickets are counted nowhere: displayed counters do not add up to the total [REQ-050] [OQ-18] | Reset seed. Database read access. | 1. Run `SELECT status, COUNT(*) FROM tickets GROUP BY status`<br>2. Read the agent dashboard counters Open, In Progress, Resolved<br>3. Add the three status counters and compare with the total of 12 | Seed | Group counts: Open 3, Assigned 2, In Progress 3, Resolved 2, Closed 2 (total 12). Status counters 3 + 3 + 2 = 8; the 4 missing tickets are exactly Assigned (2) and Closed (2). Result is Provisional: if OQ-18 adds Assigned/Closed counters or folds Assigned into Open, update this case. | P2 |

## 10. Error Handling

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-042 | Server failure: API returns generic 500 and UI shows an error state, not zeros [REQ-050] [REQ-051] [REQ-064] | Logged in as agent1. A way to make the dashboard query fail (stop the database, or fault injection / network stub returning 500 for GET /api/dashboard). | 1. Cause the failure<br>2. Reload the dashboard<br>3. Inspect the API response in the Network tab<br>4. Restore the service and use the retry action (or reload) | Fault: 500 on GET /api/dashboard | API returns HTTP 500 in the error contract with a generic message (no stack trace, SQL or PII). UI shows an error message with a retry option; counters are NOT shown as `0` and no previous values are presented as current. After recovery the correct values 3/3/2/4 are shown. | P2 |
| DSH-TC-043 | Session expiry while the dashboard is open redirects to Login [REQ-052] [REQ-050] [REQ-003] | Logged in as user1 on the dashboard. | 1. Invalidate the session (delete the token in browser storage, or wait for expiry if known)<br>2. Reload the dashboard or trigger a refresh<br>3. Observe the result | user1 | The API call returns 401; the UI redirects to Login; no dashboard data remains visible. After logging in again the User Dashboard shows 2/1/1/1. | P2 |

## 11. Edge Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| DSH-TC-044 | Very many tickets: counters stay correct and the list stays at 5 [REQ-050] [REQ-051] [REQ-052] [OQ-25] | Reset seed, then insert 9,988 additional tickets owned by user2, status Open, priority Low, `created_at` earlier than 2026-09-30 (total 10,000 tickets). | 1. Log in as agent1; read counters and Recent Tickets; note the load time<br>2. Log in as user1; read counters and Recent Tickets<br>3. Log in as user2; read counters | Bulk insert as described | Agent: Open 9,991, In Progress 3, Resolved 2, Critical 4; recent 1012, 1011, 1010, 1009, 1008. user1 unchanged: 2/1/1/1. user2: Open 9,989, In Progress 2, Resolved 1, Critical 3. Page renders without error; no unbounded list. Acceptable load time TBD (OQ-25); record observed time. | P3 |
| DSH-TC-045 | Large counter values are displayed completely and the layout holds [REQ-050] [OQ-31] | Logged in as agent1. Browser developer tools able to override the GET /api/dashboard response (mock). | 1. Override the response counts with each value set below, one set at a time<br>2. Reload the dashboard and inspect the four counters and the page layout | Sets for open: 0, 999, 1000, 9999, 10000, 1234567 (other counters 0) | Every value is displayed in full with no truncated digits, no `NaN`, no wrapping out of its box and no horizontal scroll. Thousands separator or abbreviation: TBD (OQ-31); record the observed format. `0` is displayed as `0`. | P3 |
| DSH-TC-046 | Tickets with identical creation time are ordered deterministically [REQ-051] [OQ-30] | Reset seed, then insert #1013 (user1, "Tie A", Open, Medium) and #1014 (user1, "Tie B", Open, Medium) with `created_at` = 2026-10-01 09:30:00 for both (id 13 and 14). | 1. Log in as agent1 and read the Recent Tickets list<br>2. Reload 3 times and compare the order<br>3. Call GET /api/dashboard 3 times and compare the order | Two tickets with equal created_at | Order is identical in all reloads and API calls. Provisional tie-break (higher id first): 1014, 1013, 1012, 1011, 1010. Tie-break rule to be confirmed (OQ-30). | P3 |
| DSH-TC-047 | A ticket created by another user does not leak into a User's dashboard [REQ-052] [REQ-050] [REQ-051] | Reset seed. Two browser sessions: A logged in as user1, B logged in as user2. | 1. In session A load the dashboard; note 2/1/1/1 and recent 1011, 1009, 1006, 1005, 1002<br>2. In session B create a ticket (data below), then change nothing else<br>3. In session A reload the dashboard and call GET /api/dashboard | Subject: Keyboard broken<br>Description: Several keys do not respond<br>Priority: Critical<br>Category: any valid | Session A is unchanged: counts 2/1/1/1 and the same recent list; ticket "Keyboard broken" does not appear in the UI or in the API response. | P1 |
| DSH-TC-048 | Long subject and markup in subject are rendered safely in Recent Tickets [REQ-051] [REQ-060] [OQ-31] [OQ-01] | Reset seed, then insert #1013 (user1, Open, Low) with a 150-character subject and #1014 (user1, Open, Low) with the markup subject below. Logged in as agent1. | 1. Open the dashboard<br>2. Inspect entries #1014 and #1013<br>3. Check for script execution (alert dialog) and layout | Subject A: 150 characters, for example the letter "A" repeated 150 times.<br>Subject B: `<script>alert(1)</script><b>bold</b>` | Subject B is displayed literally as text; no alert dialog appears and no bold formatting is applied. Subject A does not break the layout (wraps or truncates; rule TBD, OQ-31). Row remains selectable and opens the correct ticket. | P2 |
| DSH-TC-049 | Dashboard left open while data changes elsewhere: behaviour before and after reload [REQ-050] [OQ-29] | Reset seed. Browser 1 logged in as agent1 on the dashboard (3/3/2/4); browser 2 logged in as agent1. | 1. In browser 2 assign #1001 to self<br>2. Without any action in browser 1, wait 60 seconds and observe the counters<br>3. Reload the dashboard in browser 1 | Ticket #1001 | After reload: Open Tickets 2. Before reload: record whether the page auto-updates (behaviour TBD, OQ-29); either unchanged or updated is acceptable, but the counters must never show a mixed or partial state. | P4 |
