# Traceability Matrix

Requirement → Module → Specification → Test Case → Implementation Task. Generated from the `REQ-xxx` tags in `requirement.md`, `modules/*/specification.md` (FR tables), `modules/*/test-case.md` (Test Scenario column) and `task.md`. Regenerate whenever any of them changes (task REL-T07).

Counts in parentheses are the number of items; the "Other modules" column lists modules that additionally reference the requirement (integration/permission checks).

| REQ | Requirement | Owning module | Spec FR IDs (owner) | Test cases (owner) | Other modules (test cases) | Tasks |
|---|---|---|---|---|---|---|
| REQ-001 | Both roles can log in with credentials via `POST /api/auth/login` and a Login screen. Cred | authentication | AUTH-FR-01 … AUTH-FR-14 (7) | AUTH-TC-001 … AUTH-TC-056 (29) | — | AUTH-T01 … FND-T09 (10) |
| REQ-002 | Role-based access control: every screen action and API endpoint enforces the User / Suppor | authentication | AUTH-FR-09, AUTH-FR-10, AUTH-FR-11 | AUTH-TC-004 … AUTH-TC-049 (8) | ticket-management: 8; ticket-workflow: 1; comments: 4; dashboard: 1 | AUTH-T08 … TKT-T22 (9) |
| REQ-003 | All APIs except login require an authenticated session/token. Token lifetime, logout and l | authentication | AUTH-FR-07 … AUTH-FR-13 (5) | AUTH-TC-003 … AUTH-TC-041 (15) | ticket-management: 4; ticket-workflow: 4; comments: 3; dashboard: 1 | AUTH-T05 … AUTH-T15 (5) |
| REQ-010 | A User can create a ticket (`POST /api/tickets`) providing Subject, Description, Category, | ticket-management | TKT-FR-01, TKT-FR-02 | TKT-TC-001 … TKT-TC-124 (9) | — | TKT-T02 … TKT-T26 (7) |
| REQ-011 | Ticket input validation: Subject not empty (Rule 1); Description ≥ 10 characters (Rule 2); | ticket-management | TKT-FR-03 … TKT-FR-30 (6) | TKT-TC-001 … TKT-TC-122 (43) | — | FND-T08, TKT-T06, TKT-T16, TKT-T24 |
| REQ-012 | System-generated fields: Ticket ID / ticket number (auto-generated), Created Date (auto-ge | ticket-management | TKT-FR-07, TKT-FR-08 | TKT-TC-001 … TKT-TC-120 (10) | — | TKT-T02, TKT-T08, TKT-T17, TKT-T24 |
| REQ-013 | Attachment is optional. Allowed types / size / count: **TBD / Requires clarification** (OQ | ticket-management | TKT-FR-09, TKT-FR-10, TKT-FR-11 | TKT-TC-002 … TKT-TC-123 (22) | — | TKT-T03 … TKT-T16 (5) |
| REQ-014 | A User can view the list of their own tickets ("My Tickets"). | ticket-management | TKT-FR-12, TKT-FR-14, TKT-FR-19 | TKT-TC-001 … TKT-TC-089 (6) | — | TKT-T09, TKT-T18, TKT-T26 |
| REQ-015 | A Support Agent can view all tickets ("All Tickets"). | ticket-management | TKT-FR-13, TKT-FR-14, TKT-FR-19 | TKT-TC-008 … TKT-TC-092 (6) | — | TKT-T09, TKT-T18, TKT-T26 |
| REQ-016 | A "Ticket Details" screen / `GET /api/tickets/{id}` shows all ticket data, comments and (w | ticket-management | TKT-FR-20, TKT-FR-21, TKT-FR-22 | TKT-TC-006 … TKT-TC-119 (7) | ticket-workflow: 1 | TKT-T11, TKT-T20, TKT-T26 |
| REQ-017 | Ticket update via `PUT /api/tickets/{id}` and the agent "Update Ticket" screen. Editable f | ticket-management | TKT-FR-23, TKT-FR-24 | TKT-TC-010 … TKT-TC-110 (10) | — | TKT-T13, TKT-T21 |
| REQ-018 | `DELETE /api/tickets/{id}` — listed by client as optional ("You can implement"). Rules (wh | ticket-management | TKT-FR-25 | TKT-TC-059 | — | TKT-T14 |
| REQ-019 | Ticket lists support search, filtering, sorting and pagination. Searchable/filterable/sort | ticket-management | TKT-FR-15 … TKT-FR-19 (5) | TKT-TC-070 … TKT-TC-106 (23) | — | TKT-T10, TKT-T19, TKT-T24 |
| REQ-020 | Tickets belong to a category (`categories` table). Category list and management: **TBD / R | ticket-management | TKT-FR-06, TKT-FR-26 | TKT-TC-009 … TKT-TC-099 (6) | — | FND-T09 … TKT-T25 (5) |
| REQ-070 | Screen set and navigation: User — Login → Dashboard → My Tickets → Create Ticket → Ticket  | ticket-management | TKT-FR-01, TKT-FR-27 | TKT-TC-007, TKT-TC-008, TKT-TC-058, TKT-TC-124 | — | AUTH-T11 … WF-T22 (15) |
| REQ-030 | Status lifecycle: Open → Assigned → In Progress → Resolved → Closed. | ticket-workflow | WF-FR-01, WF-FR-02 | WF-TC-001 … WF-TC-101 (7) | — | REL-T01 … WF-T22 (5) |
| REQ-031 | Invalid transitions are rejected; in particular a User cannot move Open directly to Closed | ticket-workflow | WF-FR-02 … WF-FR-30 (6) | WF-TC-006 … WF-TC-126 (30) | — | WF-T02, WF-T03, WF-T06, WF-T18 |
| REQ-032 | A Support Agent can assign a ticket to themselves (`PUT /api/tickets/{id}/assign`), moving | ticket-workflow | WF-FR-05 … WF-FR-26 (5) | WF-TC-001 … WF-TC-125 (20) | — | WF-T04, WF-T07, WF-T13, WF-T21 |
| REQ-033 | Only Support Agents can assign tickets (Rule 4). | ticket-workflow | WF-FR-07, WF-FR-08, WF-FR-15, WF-FR-29 | WF-TC-034 … WF-TC-116 (7) | — | WF-T04, WF-T13 |
| REQ-034 | A Support Agent can change ticket status (`PUT /api/tickets/{id}/status`); only Support Ag | ticket-workflow | WF-FR-09 … WF-FR-30 (10) | WF-TC-001 … WF-TC-122 (36) | — | WF-T03 … WF-T14 (5) |
| REQ-035 | A User can close a ticket that is Resolved (Resolved → Closed). | ticket-workflow | WF-FR-13, WF-FR-14, WF-FR-15, WF-FR-26 | WF-TC-001 … WF-TC-125 (15) | — | REL-T01 … WF-T22 (5) |
| REQ-036 | A Closed ticket cannot be edited (Rule 6). | ticket-workflow | WF-FR-16, WF-FR-26 | WF-TC-023 … WF-TC-124 (15) | ticket-management: 1; comments: 1 | CMT-T04, WF-T09, WF-T17, WF-T19 |
| REQ-037 | Every status change is recorded in `ticket_history` (Rule 7): ticket, from-status, to-stat | ticket-workflow | WF-FR-17, WF-FR-18, WF-FR-19 | WF-TC-001 … WF-TC-104 (12) | — | WF-T01, WF-T06, WF-T07, WF-T20 |
| REQ-038 | Ticket history is viewable on Ticket Details in chronological order. Visibility per role:  | ticket-workflow | WF-FR-20, WF-FR-21 | WF-TC-042 … WF-TC-118 (13) | — | WF-T10, WF-T16, WF-T22 |
| REQ-040 | Users and Support Agents can add comments to a ticket (`POST /api/tickets/{id}/comments`). | comments | CMT-FR-01 … CMT-FR-14 (8) | CMT-TC-001 … CMT-TC-058 (42) | — | CMT-T01 … CMT-T13 (9) |
| REQ-041 | Comments for a ticket can be listed (`GET /api/tickets/{id}/comments`) and are shown on Ti | comments | CMT-FR-06 … CMT-FR-11 (5) | CMT-TC-004 … CMT-TC-056 (19) | — | CMT-T01 … CMT-T13 (6) |
| REQ-050 | Dashboard shows ticket counts: Open Tickets, In Progress, Resolved, Critical (client examp | dashboard | DSH-FR-01 … DSH-FR-19 (13) | DSH-TC-001 … DSH-TC-049 (39) | — | DSH-T01 … DSH-T12 (9) |
| REQ-051 | Dashboard shows "Recent Tickets" (ticket number, subject, priority). Count of rows / order | dashboard | DSH-FR-07 … DSH-FR-16 (7) | DSH-TC-002 … DSH-TC-048 (25) | — | DSH-T04 … DSH-T12 (6) |
| REQ-052 | Both roles have a dashboard; User-dashboard content is **TBD / Requires clarification** (O | dashboard | DSH-FR-09 … DSH-FR-18 (5) | DSH-TC-003 … DSH-TC-047 (21) | — | DSH-T03, DSH-T05, DSH-T07, DSH-T10 |
| REQ-060 | **Security**: passwords never stored or returned in plain text; server-side authorization  | authentication | AUTH-FR-04 … AUTH-FR-17 (5) | AUTH-TC-005 … AUTH-TC-056 (16) | ticket-management: 7; ticket-workflow: 1; comments: 7; dashboard: 1 | AUTH-T03 … TKT-T07 (9) |
| REQ-061 | **Usability & compatibility**: supported browsers, screen sizes/responsiveness, accessibil | ticket-management | TKT-FR-33 | TKT-TC-125 | — | FND-T14, REL-T05, TKT-T23 |
| REQ-062 | **Data integrity & auditability**: referential integrity between all tables; status change | ticket-workflow | WF-FR-22, WF-FR-23, WF-FR-24, WF-FR-25 | WF-TC-067 … WF-TC-126 (21) | ticket-management: 2; comments: 6 | FND-T05 … WF-T21 (7) |
| REQ-063 | **Testability**: deterministic, consistent API responses (status codes, JSON shape, error  | ticket-management | TKT-FR-29, TKT-FR-32 | TKT-TC-003 … TKT-TC-125 (8) | ticket-workflow: 3 | CMT-T06 … WF-T12 (17) |
| REQ-064 | **Error handling**: consistent error contract (Section 14) and user-friendly UI messages. | ticket-management | TKT-FR-29, TKT-FR-30 | TKT-TC-023 … TKT-TC-121 (14) | ticket-workflow: 7; comments: 2; dashboard: 1 | FND-T06 … WF-T18 (6) |

## Coverage notes

- Requirements: 34; every one has an owning module and at least one test case and task.
- REQ-018 (DELETE) and REQ-061 (usability/compatibility) each have a single test case that is **blocked** by OQ-04 / OQ-25 until the client answers.
- REQ-017 and REQ-018 rules, and every case tagged `[OQ-xx]`, depend on open questions listed in `requirement.md` §20.
- Business rules: BR-1..3 → REQ-011 (`TKT`); BR-4 → REQ-033; BR-5 → REQ-034; BR-6 → REQ-036; BR-7 → REQ-037; BR-8 → REQ-031 (`WF`); BR-9 → REQ-035; BR-10 → REQ-014/015.
