# Requirement Specification — Help Desk / Support Ticket Management System

| Item | Value |
|---|---|
| Document status | Draft for review (no code has been written) |
| Source | Client requirement ("Help Desk / Support Ticket Management System") |
| Conventions | `REQ-xxx` = requirement ID. `A-xx` = working assumption. `OQ-xx` = open question (Section 20). `TBD / Requires clarification` = information missing from the client requirement. **Provisional** = a placeholder value chosen only so test cases can be written; it must be confirmed. |

> **Rule applied throughout this document set:** nothing is invented silently. Where the client text is silent or ambiguous, the item is marked `TBD / Requires clarification`, linked to an `OQ-xx`, and — only where documentation/testing cannot proceed otherwise — a *working assumption* (`A-xx`) is stated explicitly.

---

## 1. Project Overview

A web application in which **Users** raise support tickets and **Support Agents** manage and resolve them. Each ticket moves through a fixed lifecycle (Open → Assigned → In Progress → Resolved → Closed), every status change is audited, and role-based rules control who can do what. The client also intends the project to serve as a QA/automation practice target (validation, boundary, role-based, state-transition, API, DB and E2E testing).

## 2. Business Objective

- Give users a single place to report problems and track their resolution.
- Give agents a single place to see, claim, work and resolve tickets.
- Enforce a controlled lifecycle with an auditable status history.
- Provide a rule-rich system suitable for functional, API, database, integration and end-to-end test practice.

## 3. Scope

**In scope (from the client text):**
- Login for two roles (User, Support Agent) and role-based access.
- Ticket creation (with optional attachment), listing ("My Tickets" / "All Tickets"), details, update.
- Ticket assignment, status transitions, ticket history.
- Comments on tickets.
- Dashboards (User and Agent) with ticket counts and recent tickets.
- Search, filtering, sorting and pagination of ticket lists (listed under QA scenarios).
- REST backend APIs and relational database (`users`, `tickets`, `categories`, `comments`, `ticket_history`, `attachments`).

**Not stated / pending decision:** see Section 18 and Section 20.

## 4. User Roles

| Role | Capabilities (as stated by client) |
|---|---|
| **User** | Login; create a ticket; view *their* tickets; add comments; close a *resolved* ticket. |
| **Support Agent** | Login; view *all* tickets; assign tickets to themselves; change ticket status; add comments; resolve tickets. |

Role-permission matrix (✔ = allowed, ✖ = not allowed, ? = TBD / Requires clarification):

| Action | User | Support Agent |
|---|---|---|
| Login | ✔ | ✔ |
| Create ticket | ✔ | ? (OQ-10) |
| View own tickets | ✔ | n/a |
| View all tickets | ✖ | ✔ |
| View a ticket's details | Own tickets only (A-05) | ✔ (all) |
| Edit ticket fields (PUT) | ? (A-07, OQ-03) | ? (OQ-03) |
| Delete ticket | ? (OQ-04) | ? (OQ-04) |
| Assign ticket | ✖ (Rule 4) | ✔ (self-assign; others ? — OQ-05) |
| Change status to *In Progress* | ✖ | ✔ (A-02) |
| Change status to *Resolved* | ✖ (Rule 5) | ✔ |
| Change status to *Closed* | ✔ own, only from Resolved | ? (A-04, OQ-13) |
| Add comment | ✔ own tickets (A-05) | ✔ |
| View ticket history | ? (OQ-24) | ✔ |
| View dashboard | ✔ (content TBD, OQ-19) | ✔ |

## 5. Functional Requirements

### 5.1 Authentication & Access (module: `authentication`)
| ID | Requirement |
|---|---|
| REQ-001 | Both roles can log in with credentials via `POST /api/auth/login` and a Login screen. Credential fields: **TBD / Requires clarification** (A-11, OQ-09). |
| REQ-002 | Role-based access control: every screen action and API endpoint enforces the User / Support Agent permissions in Section 4. |
| REQ-003 | All APIs except login require an authenticated session/token. Token lifetime, logout and lockout: **TBD / Requires clarification** (OQ-09). |

### 5.2 Ticket Management (module: `ticket-management`)
| ID | Requirement |
|---|---|
| REQ-010 | A User can create a ticket (`POST /api/tickets`) providing Subject, Description, Category, Priority and an optional Attachment. |
| REQ-011 | Ticket input validation: Subject not empty (Rule 1); Description ≥ 10 characters (Rule 2); Priority mandatory (Rule 3); Priority ∈ {Low, Medium, High, Critical}; Category must be a valid category (A-16). |
| REQ-012 | System-generated fields: Ticket ID / ticket number (auto-generated), Created Date (auto-generated), initial Status = **Open**. |
| REQ-013 | Attachment is optional. Allowed types / size / count: **TBD / Requires clarification** (OQ-02). |
| REQ-014 | A User can view the list of their own tickets ("My Tickets"). |
| REQ-015 | A Support Agent can view all tickets ("All Tickets"). |
| REQ-016 | A "Ticket Details" screen / `GET /api/tickets/{id}` shows all ticket data, comments and (where permitted) history. |
| REQ-017 | Ticket update via `PUT /api/tickets/{id}` and the agent "Update Ticket" screen. Editable fields and who may edit: **TBD / Requires clarification** (OQ-03). |
| REQ-018 | `DELETE /api/tickets/{id}` — listed by client as optional ("You can implement"). Rules (who, soft/hard delete): **TBD / Requires clarification** (OQ-04). |
| REQ-019 | Ticket lists support search, filtering, sorting and pagination. Searchable/filterable/sortable fields and page size: **TBD / Requires clarification** (OQ-11) — provisional values in module specification. |
| REQ-020 | Tickets belong to a category (`categories` table). Category list and management: **TBD / Requires clarification** (OQ-12). |
| REQ-070 | Screen set and navigation: User — Login → Dashboard → My Tickets → Create Ticket → Ticket Details; Agent — Login → Agent Dashboard → All Tickets → Ticket Details → Update Ticket. |

### 5.3 Ticket Workflow (module: `ticket-workflow`)
| ID | Requirement |
|---|---|
| REQ-030 | Status lifecycle: Open → Assigned → In Progress → Resolved → Closed. |
| REQ-031 | Invalid transitions are rejected; in particular a User cannot move Open directly to Closed. |
| REQ-032 | A Support Agent can assign a ticket to themselves (`PUT /api/tickets/{id}/assign`), moving it Open → Assigned. |
| REQ-033 | Only Support Agents can assign tickets (Rule 4). |
| REQ-034 | A Support Agent can change ticket status (`PUT /api/tickets/{id}/status`); only Support Agents can move a ticket to Resolved (Rule 5). |
| REQ-035 | A User can close a ticket that is Resolved (Resolved → Closed). |
| REQ-036 | A Closed ticket cannot be edited (Rule 6). |
| REQ-037 | Every status change is recorded in `ticket_history` (Rule 7): ticket, from-status, to-status, actor, timestamp. |
| REQ-038 | Ticket history is viewable on Ticket Details in chronological order. Visibility per role: **TBD / Requires clarification** (OQ-24). |

### 5.4 Comments (module: `comments`)
| ID | Requirement |
|---|---|
| REQ-040 | Users and Support Agents can add comments to a ticket (`POST /api/tickets/{id}/comments`). |
| REQ-041 | Comments for a ticket can be listed (`GET /api/tickets/{id}/comments`) and are shown on Ticket Details. |

### 5.5 Dashboard (module: `dashboard`)
| ID | Requirement |
|---|---|
| REQ-050 | Dashboard shows ticket counts: Open Tickets, In Progress, Resolved, Critical (client example; "could show"). Exact count definitions: **TBD** (OQ-18). |
| REQ-051 | Dashboard shows "Recent Tickets" (ticket number, subject, priority). Count of rows / ordering: **TBD** (OQ-18). |
| REQ-052 | Both roles have a dashboard; User-dashboard content is **TBD / Requires clarification** (OQ-19). |

## 6. Non-Functional Requirements

Client text states no explicit NFRs. The items below are standard expectations derived from the stated rules; numeric targets are **TBD / Requires clarification** (OQ-25).

| ID | Requirement |
|---|---|
| REQ-060 | **Security**: passwords never stored or returned in plain text; server-side authorization on every endpoint; input is validated and output-encoded (no stored XSS via subject/description/comments); attachments are validated. |
| REQ-061 | **Usability & compatibility**: supported browsers, screen sizes/responsiveness, accessibility level — **TBD / Requires clarification** (OQ-25). |
| REQ-062 | **Data integrity & auditability**: referential integrity between all tables; status change and ticket row update occur atomically; history is append-only. |
| REQ-063 | **Testability**: deterministic, consistent API responses (status codes, JSON shape, error format), seedable test data, stable UI element identifiers — the client explicitly wants the system to support QA/automation practice. |
| REQ-064 | **Error handling**: consistent error contract (Section 14) and user-friendly UI messages. |

## 7. Business Rules

| # | Rule (client wording) | Related REQ |
|---|---|---|
| BR-1 | Subject cannot be empty. | REQ-011 |
| BR-2 | Description must contain at least 10 characters. | REQ-011 |
| BR-3 | Priority is mandatory. | REQ-011 |
| BR-4 | Only Support Agents can assign tickets. | REQ-033 |
| BR-5 | Only Support Agents can move a ticket to Resolved. | REQ-034 |
| BR-6 | A closed ticket cannot be edited. | REQ-036 |
| BR-7 | Every status change should be recorded in `ticket_history`. | REQ-037 |
| BR-8 | The user must not be able to directly change Open to Closed. | REQ-031 |
| BR-9 | A User can only close a **resolved** ticket. | REQ-035 |
| BR-10 | A User sees only their own tickets; an Agent sees all. | REQ-014, REQ-015 |

### Status transition table (working interpretation — A-02, OQ-06)

| From → To | Who | Mechanism | Allowed? |
|---|---|---|---|
| Open → Assigned | Support Agent | `PUT /assign` (A-01) | ✔ |
| Assigned → In Progress | Support Agent (assigned agent, A-05) | `PUT /status` | ✔ |
| In Progress → Resolved | Support Agent (assigned agent) | `PUT /status` | ✔ |
| Resolved → Closed | Ticket-owner User | `PUT /status` | ✔ |
| Open → Closed (any actor) | — | — | ✖ (BR-8) |
| Any skip (e.g. Open → In Progress, Assigned → Resolved) | — | — | ✖ (A-02) |
| Any backward move (e.g. Resolved → In Progress / reopen) | — | — | ✖ (A-02, OQ-06) |
| Any change out of Closed | — | — | ✖ (BR-6) |
| Any change to Assigned through `/status` | — | — | ✖ (A-03, OQ-07) |

## 8. User Workflows

**WF-1 User raises and closes a ticket**
Login → Dashboard → Create Ticket (fill & submit; status Open) → My Tickets → Ticket Details → *(agent assigns, works, resolves)* → add comments as needed → Close ticket once Resolved.

**WF-2 Agent handles a ticket**
Login → Agent Dashboard → All Tickets (search/filter) → Ticket Details → Assign to self (Open → Assigned) → Update Ticket: In Progress → add comments → Resolved.

**WF-3 Ticket lifecycle (state machine)**
`Open → Assigned → In Progress → Resolved → Closed` (terminal). History example from the client: `10:00 Open→Assigned`, `10:15 Assigned→In Progress`, `11:30 In Progress→Resolved`, `12:00 Resolved→Closed`.

**WF-4 Negative paths**: invalid login; submitting invalid ticket form; User tries to assign/resolve; anyone tries to edit a Closed ticket; User tries Open → Closed.

## 9. Frontend Requirements

| Screen | Role | Content |
|---|---|---|
| Login | Both | Credential form, error message on failure; redirects to role-specific dashboard. |
| Dashboard (User) | User | Content **TBD** (OQ-19); provisional: own-ticket counts + recent own tickets. |
| Agent Dashboard | Agent | "SUPPORT DASHBOARD": Open Tickets, In Progress, Resolved, Critical counts; Recent Tickets list (`#number subject priority`). |
| My Tickets | User | Own tickets list with search/filter/sort/pagination. |
| Create Ticket | User | Subject, Description, Category, Priority, optional Attachment; inline validation. |
| All Tickets | Agent | All tickets list with search/filter/sort/pagination. |
| Ticket Details | Both | Ticket fields, status, assignee, attachment(s), comments, history; role-appropriate actions (Assign, Change status, Close). |
| Update Ticket | Agent | Status change / assignment (and field edits — OQ-03). |

General: role-based navigation (a User never sees agent-only screens/actions), client-side validation mirroring server rules (server remains authoritative), loading/empty/error states. Visual design / branding / language: **TBD**.

## 10. Backend Requirements

- RESTful JSON API under `/api`.
- Authentication, authorization (role + ownership), validation, business-rule enforcement and status-transition engine live in the backend (never only in the UI).
- Status change + `ticket_history` insert + ticket update in one transaction.
- Attachment storage and retrieval (storage location — OQ-02).
- Auto-generation of ticket number (A-09).

## 11. Database Requirements

Client specified the `tickets` columns only. Other tables' columns below are **proposed** (not client-specified) and require confirmation.

| Table | Columns | Source |
|---|---|---|
| `users` | id, name, email, password_hash, role (`USER`/`AGENT`), is_active, created_at | Proposed |
| `tickets` | id, ticket_number, user_id, subject, description, category_id, priority, status, assigned_to, created_at, updated_at | **Client-specified** |
| `categories` | id, name, is_active | Proposed |
| `comments` | id, ticket_id, user_id, body, created_at | Proposed |
| `ticket_history` | id, ticket_id, from_status, to_status, changed_by, changed_at | Proposed (fields implied by client example) |
| `attachments` | id, ticket_id, file_name, stored_path, content_type, size_bytes, uploaded_by, uploaded_at | Proposed |

Constraints: FKs (`tickets.user_id → users`, `tickets.category_id → categories`, `tickets.assigned_to → users`, `comments.ticket_id → tickets`, `ticket_history.ticket_id → tickets`, `attachments.ticket_id → tickets`); `ticket_number` unique; `priority`/`status`/`role` restricted to allowed values; `description`/`subject` NOT NULL; `assigned_to` NULL until assigned.

## 12. API Requirements

Client-listed endpoints (client wording: "You can implement"):

| Method | Endpoint | Purpose | REQ |
|---|---|---|---|
| POST | `/api/auth/login` | Authenticate | REQ-001 |
| GET | `/api/tickets` | List tickets (role-scoped; search/filter/sort/paginate) | REQ-014/015/019 |
| POST | `/api/tickets` | Create ticket | REQ-010..013 |
| GET | `/api/tickets/{id}` | Ticket details | REQ-016 |
| PUT | `/api/tickets/{id}` | Update ticket | REQ-017, REQ-036 |
| DELETE | `/api/tickets/{id}` | Delete ticket (optional) | REQ-018 |
| PUT | `/api/tickets/{id}/status` | Change status | REQ-030..036 |
| PUT | `/api/tickets/{id}/assign` | Assign | REQ-032/033 |
| POST | `/api/tickets/{id}/comments` | Add comment | REQ-040 |
| GET | `/api/tickets/{id}/comments` | List comments | REQ-041 |

**Proposed additions (not in client list — need confirmation, OQ-26):**

| Method | Endpoint | Purpose | REQ |
|---|---|---|---|
| GET | `/api/tickets/{id}/history` | Ticket history | REQ-038 |
| GET | `/api/dashboard` | Dashboard counts + recent tickets (role-scoped) | REQ-050..052 |
| GET | `/api/categories` | Category list for the Create Ticket form | REQ-020 |
| GET | `/api/tickets/{id}/attachments/{attachmentId}` | Download attachment | REQ-013 |
| POST | `/api/auth/logout` (optional) | End session | REQ-003 |

## 13. Validation Rules

| Field | Rule | Source |
|---|---|---|
| Subject | Required; not empty (whitespace-only treated as empty — A-15); max length **provisional 150** (OQ-01) | BR-1 / Proposed |
| Description | Required; ≥ 10 characters (counted after trimming — A-15); max length **provisional 5000** (OQ-01) | BR-2 / Proposed |
| Category | Required (A-16); must reference an existing active category | Proposed |
| Priority | Required; one of Low, Medium, High, Critical (case/exact match as defined by API) | BR-3 |
| Attachment | Optional; types/size/count **TBD** (OQ-02); provisional ≤ 1 file, ≤ 5 MB | OQ-02 |
| Status | Must be a valid status and a permitted transition (Section 7) | BR-8 |
| Comment body | Required; not empty; max length **provisional 2000** (OQ-01) | Proposed |
| Login | Credential fields required; format rules **TBD** (OQ-09) | Proposed |
| List query | `page ≥ 1`; `pageSize` provisional default 10, max 100 (OQ-11) | Proposed |

## 14. Error Handling

Provisional error contract (to be confirmed, OQ-26): every error returns JSON `{ "status": <http code>, "error": "<code>", "message": "<text>", "details": [{ "field": "...", "message": "..." }] }`.

| Situation | HTTP | Notes |
|---|---|---|
| Validation failure | 400 (or 422 — OQ-26) | Field-level details |
| Not authenticated / invalid or expired token / bad credentials | 401 | Login error must not reveal which credential was wrong (REQ-060) |
| Authenticated but not permitted (role / ownership / rule 4, 5) | 403 | |
| Ticket not found (or not visible to the User — OQ-27) | 404 | |
| Invalid status transition / edit of Closed ticket | 409 (or 400/422 — OQ-26) | Message names current and requested status |
| Unexpected failure | 500 | Generic message, no stack trace/PII in response |

UI: inline field errors, banner/toast for server errors, redirect to Login on 401.

## 15. Security Requirements

- Passwords hashed with a strong adaptive algorithm; never logged or returned.
- Token/session required on all endpoints except login; server-side role **and** ownership checks (a User must not access another User's ticket by changing the `{id}`).
- Generic login failure message; brute-force protection **TBD** (OQ-09).
- Input sanitisation/output encoding (XSS), parameterised queries (SQL injection).
- Attachment validation (type, size, filename sanitising, no executable upload/serving) — rules per OQ-02.
- HTTPS in deployed environments; CORS restricted to the frontend origin.
- Secrets in environment configuration, not in source control.

## 16. Assumptions

Working assumptions needed to write testable documentation. **Each one must be confirmed or replaced** — the matching `OQ-xx` is in Section 20.

| ID | Assumption | OQ |
|---|---|---|
| A-01 | `PUT /assign` assigns the ticket to the **calling agent** (self-assignment). Assigning to another agent / reassigning is not supported until clarified. Only tickets in `Open` can be assigned. | OQ-05 |
| A-02 | Status transitions are strictly sequential and forward-only, one step at a time (Section 7). No reopen, no skipping, no backward moves. | OQ-06 |
| A-03 | `Assigned` is reached only via the assign endpoint; `PUT /status` rejects `Assigned` as a target. | OQ-07 |
| A-04 | Only the ticket-owner User can perform Resolved → Closed; Agents cannot close. | OQ-13 |
| A-05 | Users can access (view, comment, close) only tickets they created. Agents can view and comment on all tickets; only the **assigned** agent can change status. | OQ-17 |
| A-06 | Comments are rejected on `Closed` tickets (Rule 6 read conservatively). Comments are immutable (no edit/delete). | OQ-23 |
| A-07 | `PUT /api/tickets/{id}` — a User may edit `subject`, `description`, `category`, `priority` of their **own** ticket only while status is `Open`; status/assignee are never changed through this endpoint. Agent field edits: undefined. | OQ-03 |
| A-08 | Users cannot be created through the application; accounts (≥1 User, ≥1 Agent) are seeded. No registration, password reset, or user-management screens in this release. | OQ-08 |
| A-09 | `id` = internal numeric primary key used in `/api/tickets/{id}`; `ticket_number` = unique, human-readable sequential number shown in UI (client example `#1001`, first value assumed 1001). | OQ-15 |
| A-10 | Dashboard counts: Open = status Open; In Progress = status In Progress; Resolved = status Resolved; Critical = priority Critical and status ≠ Closed. Agent dashboard is system-wide. Recent tickets = 5 most recently created, newest first. | OQ-18 |
| A-11 | Login uses **email + password** and returns a bearer token carrying the user id and role. | OQ-09 |
| A-12 | Dates/times are stored in UTC and displayed in the viewer's local time zone. | OQ-20 |
| A-13 | Ticket creation is not written to `ticket_history` (the client example starts at Open → Assigned). | OQ-21 |
| A-14 | `ticket_history.changed_by` records the acting user; timestamp is server-generated. | OQ-21 |
| A-15 | Leading/trailing whitespace is trimmed before validating Subject, Description, Comment body. | OQ-22 |
| A-16 | Category is mandatory on ticket creation (client lists Category in the form but does not say "mandatory"). | OQ-12 |
| A-17 | List endpoints default sort = `created_at` descending. Dashboard for Users shows the same four counts scoped to the user's own tickets. | OQ-11, OQ-19 |
| A-18 | Only Users create tickets; Agents do not. | OQ-10 |

## 17. Dependencies

- Technology stack: not specified by client → proposal in `plan.md` (needs approval).
- File storage for attachments (local disk vs. object storage — OQ-02).
- Seed data: users (both roles), categories (OQ-12).
- Relational database (the client's table-based design implies RDBMS).
- Module order (details in `plan.md`): `authentication` → `ticket-management` → `ticket-workflow` → `comments` → `dashboard`.

## 18. Out of Scope

Not mentioned by the client; excluded from this documentation unless confirmed:
user registration / self-service sign-up, password reset / change password, user & category administration UI, an Admin role, email/SMS/in-app notifications, SLA timers / escalations, ticket reopening, ticket merge/reassignment between agents, comment edit/delete, reporting/export, multi-language, mobile app, third-party integrations (SSO, chat).

## 19. Acceptance Criteria (high level)

Module-level acceptance criteria are in each `specification.md`. System level:

1. A User can log in, create a ticket (valid data), see it in My Tickets with status Open and an auto-generated number and date.
2. Invalid ticket data (empty subject, description < 10 chars, missing priority) is rejected in UI and API with field-level errors and creates no record.
3. An Agent can see all tickets, assign an Open ticket to themselves, and move it Assigned → In Progress → Resolved; a User can then close it.
4. Open → Closed (and every other invalid transition) is rejected by the API and not offered in the UI.
5. Users cannot assign, cannot resolve, and cannot see/modify other users' tickets (UI and API).
6. A Closed ticket cannot be edited or commented on.
7. Every status change appears in `ticket_history` with from/to status, actor and timestamp, and in Ticket Details in order.
8. Comments can be added and listed by both roles on permitted tickets.
9. Dashboards display correct counts and recent tickets for the role.
10. Search, filter, sort and pagination return correct subsets/ordering/page boundaries.
11. All open questions marked **blocking** below are resolved, and `plan.md`, `task.md`, specs and test cases are updated accordingly.

## 20. Open Questions / Clarifications Required

Priority: **B** = blocks accurate implementation/testing; **N** = can proceed on stated assumption.

| ID | Pri | Question / Ambiguity | Why it matters | Related |
|---|---|---|---|---|
| OQ-01 | N | Maximum lengths for Subject, Description, Comment body? | Boundary tests, DB column sizes | REQ-011, REQ-040 |
| OQ-02 | B | Attachment rules: allowed file types, max size, max number per ticket, can attachments be added after creation, can comments carry attachments, storage location? | Validation & security | REQ-013 |
| OQ-03 | B | `PUT /api/tickets/{id}`: which fields are editable, by whom, and in which statuses? Does the agent "Update Ticket" screen edit fields or only status/assignee? | Ticket-management vs workflow boundary | REQ-017 |
| OQ-04 | B | `DELETE /api/tickets/{id}`: required at all? Who may delete; soft/hard; allowed on non-Closed tickets; effect on comments/history/attachments? | Data integrity | REQ-018 |
| OQ-05 | B | Rule "Only Agents can assign": may an Agent assign a ticket to **another** agent, or reassign an already-assigned ticket? Section 1 says "assign to themselves". | Assign API contract | REQ-032/033 |
| OQ-06 | B | Are other transitions allowed — reopen (Resolved → In Progress/Open), skipping steps (Open → In Progress), Resolved → Closed by Agent, unassign? Client diagram is strictly linear but does not say "only". | State machine | REQ-030/031 |
| OQ-07 | N | Can `Assigned` be set through `PUT /status`, or only via `/assign`? | API contract | REQ-032 |
| OQ-08 | B | How are accounts created (seed/admin/registration)? Is there an Admin role or user management? Password reset? | Scope, module list | REQ-001 |
| OQ-09 | B | Login credentials (email vs username), password policy, token type/expiry, logout, lockout after failed attempts? | Auth design & tests | REQ-001/003 |
| OQ-10 | N | May a Support Agent also create tickets? | Permission matrix | REQ-010 |
| OQ-11 | N | Search fields (subject? ticket number? description?), filters (status, priority, category, assignee, date), sort fields, default sort, default/max page size? | List behaviour | REQ-019 |
| OQ-12 | N | Initial category list; is Category mandatory; can categories be managed? | Seed data, validation | REQ-020 |
| OQ-13 | B | Can an Agent close a ticket? Can a User reject a resolution (reopen)? | Rules 5 & close flow | REQ-035 |
| OQ-15 | N | Format/start of `ticket_number` (e.g. `1001` vs `TKT-1001`); is `{id}` in URLs the PK or the ticket number? | API contract | REQ-012 |
| OQ-17 | B | Can any agent change status on a ticket assigned to a different agent? Can agents act on unassigned tickets (e.g. comment)? | Permission rules | REQ-034 |
| OQ-18 | N | Exact dashboard count definitions (does "Open" include Assigned? what is "Critical" — all or only active?). "Assigned" and "Closed" are not shown in client sample. Recent-tickets size/order. | Dashboard correctness | REQ-050/051 |
| OQ-19 | N | What does the **User** dashboard show? | REQ-052 | REQ-052 |
| OQ-20 | N | Time zone and date/time format for display and history. | History tests | REQ-037 |
| OQ-21 | N | Should ticket creation be logged in history? Who is "changed_by" for system-driven changes? | History completeness | REQ-037 |
| OQ-22 | N | Is whitespace trimmed before validation (e.g. "          " as description)? | Boundary tests | REQ-011 |
| OQ-23 | B | Rule 6 "closed ticket cannot be edited": does it also block new comments, attachments and history views? Can comments be edited/deleted at all? | Comments module | REQ-036, REQ-040 |
| OQ-24 | N | Who may view ticket history (User, Agent, both)? | Visibility | REQ-038 |
| OQ-25 | N | Non-functional targets: performance, concurrency, supported browsers/devices, accessibility, data retention. | NFR tests | REQ-061 |
| OQ-26 | N | Confirm proposed extra endpoints (history, dashboard, categories, attachment download, logout), error format and status codes (400 vs 422, 409 vs 400 for invalid transitions). | API contract | Section 12/14 |
| OQ-27 | N | Should a User requesting another user's ticket get 403 or 404? | Info disclosure | REQ-002 |
| OQ-28 | N | Technology stack constraints (client says only "web application"). | `plan.md` | — |

**Contradictions / ambiguities noted in the client text**
1. Section 1 lists "Change ticket status" *and* "Resolve tickets" for Agents, and Rule 5 restricts Resolved to Agents — consistent, but it is unclear whether Agents can also set `Closed` (OQ-13).
2. "Assign tickets to themselves" (Section 1) vs. "Only Support Agents can assign tickets" (Rule 4) — self-assignment vs. general assignment (OQ-05).
3. `Assigned` is a status but there is a separate `/assign` endpoint *and* a `/status` endpoint — overlap (OQ-07).
4. "User should not be able to directly change Open to Closed" implies other restrictions but does not list them (OQ-06).
5. The ticket field table shows `Status = Open` as user-supplied-looking input; it is treated as system-set (REQ-012).
6. Client dashboard is "could show" (non-binding) and lacks Assigned/Closed counts (OQ-18).
7. API list is "You can implement" — endpoints, especially `DELETE`, are optional (OQ-04).
