# Dashboard Module — Specification

| Item | Value |
|---|---|
| Module | `dashboard` (ID prefix `DSH`) |
| REQ IDs owned | REQ-050, REQ-051, REQ-052 |
| Status | Draft for review (documentation only; no code written). Several items are `Provisional` pending OQ-18, OQ-19, OQ-26 and the proposed OQ-29..OQ-32 listed at the end of Section 16. |
| Source | `requirement.md` (Sections 5.5, 9, 12, 14, 16, 20) |

> Conventions: `Provisional` = placeholder value chosen so that tests can be written; it must be confirmed. `TBD / Requires clarification (OQ-xx)` = the client text is silent. Proposed new open questions (OQ-29..OQ-32) are **not yet in** `requirement.md`.

---

## 1. Module Overview

The `dashboard` module is the landing page shown to each role after login. It summarises the state of tickets as four counters (Open Tickets, In Progress, Resolved, Critical) and a "Recent Tickets" list. The Agent Dashboard ("SUPPORT DASHBOARD") is system-wide. The User Dashboard content is not defined by the client (OQ-19); this specification uses the working assumption A-17: the same four counters and recent list, scoped to the user's own tickets.

The module is **read-only** and owns **no database tables**; every number is derived from the `tickets` table at request time. The data is exposed through the proposed `GET /api/dashboard` endpoint (OQ-26).

## 2. Objective

- Give a Support Agent an at-a-glance view of the current workload (REQ-050) and the latest tickets (REQ-051).
- Give a User an at-a-glance view of their own tickets (REQ-052, provisional per A-17).
- Guarantee that counts are correct, consistent with the ticket lists, up to date after ticket creation or status change, and correctly scoped to the viewer's role.

## 3. Scope

| In scope | Out of scope (cross-reference only) |
|---|---|
| Agent Dashboard: four counters and Recent Tickets list | Ticket creation logic and validation (`ticket-management`, REQ-010..013) |
| User Dashboard: provisional same four counters and recent list, own tickets only (A-17, OQ-19) | Status change, assignment and transition rules (`ticket-workflow`, REQ-030..037) |
| `GET /api/dashboard` (proposed, OQ-26), role scoping, count definitions (A-10, OQ-18) | Login, token issue and expiry (`authentication`, REQ-001..003) |
| Recent Tickets: 5 newest, newest first (Provisional); navigation to Ticket Details | Ticket Details screen content (`ticket-management`, REQ-016) |
| Empty state, large-number display, refresh/caching behaviour (TBD) | Ticket list search/filter/sort/pagination (REQ-019); the list is used only as a consistency oracle |
| Update of counts after ticket creation / status change | Charts, trends, SLA metrics, export (not requested by the client; `requirement.md` Section 18) |

## 4. Actors / User Roles

| Actor | Dashboard access | Scope of data |
|---|---|---|
| Support Agent | Agent Dashboard ("SUPPORT DASHBOARD") | All tickets in the system (A-10) |
| User | User Dashboard (content TBD, OQ-19) | Own tickets only (BR-10, A-17, Provisional) |
| Unauthenticated visitor | None | None; receives 401 / is redirected to Login (REQ-003) |

## 5. Functional Requirements

| ID | Description | REQ ref |
|---|---|---|
| DSH-FR-01 | The Agent Dashboard is titled "SUPPORT DASHBOARD" and shows four counters labelled Open Tickets, In Progress, Resolved and Critical. | REQ-050 |
| DSH-FR-02 | Open Tickets = number of tickets with status `Open`. Provisional (A-10, OQ-18). | REQ-050 |
| DSH-FR-03 | In Progress = number of tickets with status `In Progress`. Provisional (A-10, OQ-18). | REQ-050 |
| DSH-FR-04 | Resolved = number of tickets with status `Resolved`. Provisional (A-10, OQ-18). | REQ-050 |
| DSH-FR-05 | Critical = number of tickets with priority `Critical` and status other than `Closed` (any of Open, Assigned, In Progress, Resolved). Provisional (A-10, OQ-18). | REQ-050 |
| DSH-FR-06 | Agent counters are system-wide (all owners). Tickets in `Assigned` and `Closed` are not counted in Open, In Progress or Resolved; there is no Assigned or Closed counter. Provisional (A-10, OQ-18). | REQ-050 |
| DSH-FR-07 | The Agent Dashboard shows a "Recent Tickets" list; each entry displays `#ticket_number subject priority`. The list contains the 5 most recently created tickets of any status, newest first. Provisional (A-10, OQ-18). Tie-break for equal creation time: TBD / Requires clarification (proposed OQ-30). | REQ-051 |
| DSH-FR-08 | Selecting a Recent Tickets entry opens the Ticket Details screen of that ticket. | REQ-051 |
| DSH-FR-09 | The User Dashboard shows the same four counters, calculated with the definitions in DSH-FR-02..05 over the logged-in user's own tickets only. Provisional (A-17, OQ-19). | REQ-052, REQ-050 |
| DSH-FR-10 | The User Dashboard shows a Recent Tickets list (same format and size as DSH-FR-07) containing only the user's own tickets. Provisional (A-17, OQ-19). | REQ-052, REQ-051 |
| DSH-FR-11 | Scoping is determined server-side from the authenticated identity (role and user id from the token). A User must never receive system-wide counts or another user's tickets, regardless of request parameters. | REQ-052, REQ-002 |
| DSH-FR-12 | `GET /api/dashboard` returns the counters and recent tickets for the caller's role in one response (proposed endpoint; OQ-26). | REQ-050, REQ-051, REQ-052 |
| DSH-FR-13 | Counters and the recent list reflect the current database state: after a ticket is created or its status changes, the next dashboard load shows updated values. In-page auto-refresh and HTTP caching: TBD / Requires clarification (proposed OQ-29). | REQ-050, REQ-051 |
| DSH-FR-14 | Empty state: when there are no tickets in scope, all four counters show `0` and the Recent Tickets area shows an empty-state message (wording TBD / Requires clarification, proposed OQ-31); no error is raised. | REQ-050, REQ-051 |
| DSH-FR-15 | Counter values are non-negative integers. Display format for large values (thousands separator, maximum width, abbreviation): TBD / Requires clarification (proposed OQ-31). Values must never be truncated, wrapped to `NaN`, or overflow the layout. | REQ-050 |
| DSH-FR-16 | Dashboard data (ticket subjects) is output-encoded; markup in a subject is shown as text. | REQ-051, REQ-060 |
| DSH-FR-17 | The dashboard is read-only: loading it never creates, changes or deletes data (no writes to `tickets` or `ticket_history`). | REQ-050..052 |
| DSH-FR-18 | The dashboard requires authentication; an unauthenticated request receives 401 and the UI redirects to Login. | REQ-003, REQ-052 |
| DSH-FR-19 | The UI shows a loading indicator while data is being fetched and an error state (not zeros) when the request fails. | REQ-050, REQ-064 |

## 6. Business Rules

All values are **Provisional** (A-10, A-17) until OQ-18 / OQ-19 are answered.

### 6.1 Count definitions

| Counter (label) | Definition | Counts these tickets | Does not count | Status |
|---|---|---|---|---|
| Open Tickets | `status = Open` | Open (any priority) | Assigned, In Progress, Resolved, Closed | Provisional (A-10, OQ-18: does "Open" include Assigned?) |
| In Progress | `status = In Progress` | In Progress (any priority) | All other statuses | Provisional (A-10) |
| Resolved | `status = Resolved` | Resolved (any priority) | All other statuses | Provisional (A-10) |
| Critical | `priority = Critical AND status <> Closed` | Critical in Open, Assigned, In Progress, Resolved | Critical + Closed; any non-Critical | Provisional (A-10, OQ-18: all Critical or only active?) |
| (none) | Assigned | Not displayed; counted in no counter | — | Provisional (A-10, OQ-18) |
| (none) | Closed | Not displayed; counted in no counter | — | Provisional (A-10, OQ-18) |

Overlap: a ticket may be counted in two counters (for example Critical + Open counts in Open Tickets **and** Critical). The four counters therefore do not sum to the total number of tickets.

### 6.2 Decision table (status × priority → counters incremented)

| Status \ Priority | Low / Medium / High | Critical |
|---|---|---|
| Open | Open Tickets | Open Tickets, Critical |
| Assigned | none (OQ-18) | Critical |
| In Progress | In Progress | In Progress, Critical |
| Resolved | Resolved | Resolved, Critical |
| Closed | none | none |

### 6.3 Other rules

| # | Rule | Status |
|---|---|---|
| DSH-BR-1 | Scope: Agent = all tickets; User = tickets where `tickets.user_id` = caller (BR-10, A-17). | Provisional (OQ-19) |
| DSH-BR-2 | Recent Tickets = tickets ordered by `created_at` descending, limited to 5, with no status filter (Closed tickets are included). | Provisional (A-10, OQ-18) |
| DSH-BR-3 | Equal `created_at` values are ordered deterministically; provisional tie-break = higher internal `id` first. | Provisional (proposed OQ-30) |
| DSH-BR-4 | Counts are computed from the live `tickets` table; no stored or cached counters in this release. | Provisional (proposed OQ-29) |

## 7. User Flow

**Agent flow (WF-2 start)**
1. Agent logs in (`authentication`) and lands on the Agent Dashboard.
2. The UI calls `GET /api/dashboard`; counters and Recent Tickets are displayed.
3. Agent selects a Recent Tickets entry; Ticket Details opens (`ticket-management`).
4. Agent performs assign / status actions (`ticket-workflow`) and returns to the dashboard (navigation menu or Back); updated counters are shown on the next load.
5. Alternatively the agent proceeds to All Tickets (REQ-070).

**User flow (WF-1 start)**
1. User logs in and lands on the Dashboard (content provisional, A-17).
2. UI calls `GET /api/dashboard`; own counters and own recent tickets are displayed.
3. User selects a recent ticket to open its Ticket Details, or uses navigation to My Tickets / Create Ticket (REQ-070).
4. After creating a ticket, the user returns to the dashboard and sees Open Tickets and Recent Tickets updated.

**Alternate flows**
- No tickets in scope: zeros and the empty-state message (DSH-FR-14).
- Session expired: 401 → redirect to Login (DSH-FR-18).
- Server error: error state shown, no misleading zeros (DSH-FR-19).

## 8. UI Requirements

Wireframe of the Agent Dashboard, reconstructed from the client's sample (labels and `#number subject priority` format are client-stated; the numeric values and subjects are **illustrative only**):

```
+--------------------------------------------------+
|  SUPPORT DASHBOARD                               |
+--------------------------------------------------+
|  Open Tickets      : 10                          |
|  In Progress       : 5                           |
|  Resolved          : 20                          |
|  Critical          : 3                           |
+--------------------------------------------------+
|  Recent Tickets                                  |
|  #1005  Login issue            High              |
|  #1004  Payment failed         Critical          |
|  #1003  Slow dashboard         Medium            |
|  #1002  Cannot upload file     Low               |
|  #1001  Password reset         High              |
+--------------------------------------------------+
```

| # | Requirement | Status |
|---|---|---|
| UI-1 | Agent screen heading text: "SUPPORT DASHBOARD". Counter labels: "Open Tickets", "In Progress", "Resolved", "Critical". | Client sample |
| UI-2 | User Dashboard heading and labels | TBD / Requires clarification (OQ-19); provisional: same four labels, same layout, heading wording TBD |
| UI-3 | Recent Tickets entry shows `#` + ticket number, subject, priority, as one selectable row/link. | Client sample / Provisional (OQ-18) |
| UI-4 | Entries are ordered newest first; maximum 5 entries. | Provisional (A-10) |
| UI-5 | Selectable entry opens Ticket Details of that ticket. | REQ-051 |
| UI-6 | Counters show an integer; zero is shown as `0`, never blank. | DSH-FR-14 |
| UI-7 | Long subjects: truncation / wrapping behaviour | TBD / Requires clarification (proposed OQ-31) |
| UI-8 | Loading indicator, error state with retry, empty state message for Recent Tickets. | DSH-FR-14, DSH-FR-19; wording TBD (proposed OQ-31) |
| UI-9 | The User Dashboard exposes no agent-only navigation or system-wide figures. | REQ-002, REQ-052 |
| UI-10 | Dashboard route / URL paths | TBD / Requires clarification (proposed OQ-32) |
| UI-11 | Responsive behaviour, accessibility, branding | TBD / Requires clarification (OQ-25) |

## 9. API Requirements

### 9.1 `GET /api/dashboard` (proposed, OQ-26)

| Item | Value |
|---|---|
| Method / path | `GET /api/dashboard` |
| Auth | Required (bearer token, A-11). Role and user id are read from the token only. |
| Request parameters | None. Any query parameter (for example `userId`, `scope`, `role`) is ignored (Provisional). |
| Idempotent / side effects | Safe and idempotent; no writes (DSH-FR-17). |

**Success response: `200 OK`** (field names are Provisional, OQ-26). Agent example for the test seed dataset:

```json
{
  "scope": "ALL",
  "counts": {
    "open": 3,
    "inProgress": 3,
    "resolved": 2,
    "critical": 4
  },
  "recentTickets": [
    { "id": 12, "ticketNumber": 1012, "subject": "Typo on homepage", "priority": "Low", "createdAt": "2026-10-01T09:11:00Z" },
    { "id": 11, "ticketNumber": 1011, "subject": "Data loss on save", "priority": "Critical", "createdAt": "2026-10-01T09:10:00Z" },
    { "id": 10, "ticketNumber": 1010, "subject": "Checkout error", "priority": "Critical", "createdAt": "2026-10-01T09:09:00Z" },
    { "id": 9, "ticketNumber": 1009, "subject": "Password policy query", "priority": "Medium", "createdAt": "2026-10-01T09:08:00Z" },
    { "id": 8, "ticketNumber": 1008, "subject": "Update font size", "priority": "Low", "createdAt": "2026-10-01T09:07:00Z" }
  ]
}
```

User response: identical structure with `"scope": "OWN"`, counts and recent tickets limited to the caller's tickets. Empty state:

```json
{ "scope": "OWN", "counts": { "open": 0, "inProgress": 0, "resolved": 0, "critical": 0 }, "recentTickets": [] }
```

| Field | Type | Rules |
|---|---|---|
| `scope` | string | `ALL` (Agent) or `OWN` (User). Provisional field. |
| `counts.open`, `counts.inProgress`, `counts.resolved`, `counts.critical` | integer | >= 0 |
| `recentTickets` | array | 0 to 5 items, newest first; `[]` when empty (never `null`) |
| `recentTickets[].id` | integer | Internal id used in `/api/tickets/{id}` (A-09); needed for navigation |
| `recentTickets[].ticketNumber` | integer | Display number (A-09; format OQ-15) |
| `recentTickets[].subject` | string | As stored |
| `recentTickets[].priority` | string | One of `Low`, `Medium`, `High`, `Critical` |
| `recentTickets[].createdAt` | string (ISO-8601 UTC) | A-12. Provisional field. |

The response must not contain description, comments, assignee e-mail, password data or any field not listed above.

### 9.2 Error responses (provisional contract, `requirement.md` Section 14)

Body: `{ "status": <code>, "error": "<code>", "message": "<text>", "details": [] }`

| HTTP | Situation | Example `error` | Notes |
|---|---|---|---|
| 401 | Missing, malformed, tampered or expired token | `UNAUTHORIZED` | UI redirects to Login |
| 403 | Authenticated but role not recognised or account not permitted | `FORBIDDEN` | TBD / Requires clarification (OQ-09: deactivated accounts) |
| 405 | Method other than GET | `METHOD_NOT_ALLOWED` | Provisional |
| 500 | Unexpected failure (for example database unavailable) | `INTERNAL_ERROR` | Generic message, no stack trace or PII |

400 and 404 do not apply: the endpoint has no validated input and no resource id.

## 10. Database Requirements

No new tables. Source: `tickets` (client-specified columns: `id`, `ticket_number`, `user_id`, `subject`, `priority`, `status`, `created_at`, ...).

**Conceptual queries** (status literals shown as display values; stored representation TBD, OQ-26)

| Purpose | Conceptual query |
|---|---|
| Agent counters (system-wide) | One pass with conditional counts over `tickets`: `COUNT(status='Open')`, `COUNT(status='In Progress')`, `COUNT(status='Resolved')`, `COUNT(priority='Critical' AND status<>'Closed')`. |
| User counters | Same aggregate with an additional `WHERE user_id = :currentUserId`. |
| Recent tickets (Agent) | `SELECT id, ticket_number, subject, priority, created_at FROM tickets ORDER BY created_at DESC, id DESC LIMIT 5` (tie-break Provisional, proposed OQ-30). |
| Recent tickets (User) | Same with `WHERE user_id = :currentUserId`. |

Empty aggregate results must be returned as `0`, not `NULL`.

**Indexes (recommended, Provisional; sizing targets TBD, OQ-25)**

| Index | Supports |
|---|---|
| `tickets(status)` and `tickets(priority, status)` | System-wide counters |
| `tickets(user_id, status)` and `tickets(user_id, priority, status)` | User-scoped counters |
| `tickets(created_at DESC, id DESC)` and `tickets(user_id, created_at DESC, id DESC)` | Recent tickets |

Consistency: the queries run in a single read transaction/snapshot so that counters and the recent list are mutually consistent (REQ-062). Parameterised queries only (`requirement.md` Section 15).

## 11. Validation Rules

| Item | Rule | Status |
|---|---|---|
| Authentication | Valid, unexpired bearer token required. | REQ-003 |
| Role / user id | Taken from the token only; never from query string, body or headers supplied by the client. | DSH-FR-11 |
| Query parameters | None defined; unknown parameters ignored without effect on scope. | Provisional (OQ-26) |
| HTTP method | `GET` only. | Provisional |
| Counter values | Integer, >= 0. | DSH-FR-15 |
| Recent list size | 0..5 items. | Provisional (A-10) |
| Priority in response | One of Low, Medium, High, Critical. | REQ-011 |
| Output encoding | Subject rendered as text in the UI (no HTML interpretation). | REQ-060 |

## 12. Error Scenarios

| # | Scenario | Expected behaviour |
|---|---|---|
| E-1 | No token / invalid / expired / tampered token | API 401; UI redirects to Login. |
| E-2 | Database unavailable or query fails | API 500 with generic message; UI shows error state with retry; counters are not displayed as `0`. |
| E-3 | Network failure or timeout | UI shows error state with retry; no stale numbers presented as current (timeout value TBD, OQ-25). |
| E-4 | Token valid but role unknown / account not permitted | API 403 (TBD, OQ-09). |
| E-5 | Non-GET method | API 405 (Provisional). |
| E-6 | User supplies `userId`, `scope` or `role` query parameter | Parameter ignored; response is the caller's own scope. |
| E-7 | No tickets in scope | 200 with zero counters and `[]`; empty-state message in UI (not an error). |
| E-8 | Session expires while the dashboard is open | Next API call returns 401; redirect to Login. |

## 13. Security / Permission Requirements

| # | Requirement |
|---|---|
| S-1 | Server-side enforcement of scope: a User token can only ever produce `OWN` data; no parameter, header or UI manipulation widens it (REQ-002, BR-10). |
| S-2 | All dashboard access requires authentication; no anonymous access (REQ-003). |
| S-3 | The role in the token must be integrity-protected; a tampered token is rejected with 401. |
| S-4 | The Agent Dashboard route and the agent view of the API are not available to the User role; a User opening the agent route is denied or redirected (behaviour TBD, OQ-32). |
| S-5 | Response contains only the fields in Section 9.1 (no descriptions, e-mails, hashes). |
| S-6 | Ticket subjects are output-encoded in the UI (REQ-060). |
| S-7 | Counts leak information: a User must not be able to infer other users' ticket volume (for example from totals or ticket-number gaps in the recent list, which contains only own tickets). |
| S-8 | Errors return the generic contract; no stack trace, SQL or PII (REQ-060, REQ-064). |

Permission matrix (dashboard only):

| Action | User | Support Agent | Unauthenticated |
|---|---|---|---|
| View own-scope dashboard | Yes (provisional, A-17) | n/a | No (401) |
| View system-wide dashboard | No | Yes | No (401) |
| Open Ticket Details from Recent Tickets | Own tickets (A-05) | All tickets | No |

## 14. Dependencies

| Depends on | Module | What is needed |
|---|---|---|
| REQ-001..003 | `authentication` | Login, bearer token carrying user id and role (A-11), 401 handling, post-login redirect to the role dashboard |
| REQ-002 | `authentication` | Role-based access enforcement |
| REQ-010, REQ-012 | `ticket-management` | Ticket creation sets status `Open`, auto ticket number, `created_at`; feeds counters and Recent Tickets |
| REQ-014, REQ-015, REQ-019 | `ticket-management` | List endpoint used as an oracle for count/recent consistency (filter parameter names Provisional, OQ-11) |
| REQ-016, REQ-070 | `ticket-management` | Ticket Details target of navigation; screen navigation set |
| REQ-018 (optional) | `ticket-management` | If deletion exists (OQ-04), deleted tickets must leave counters and recent list |
| REQ-030..035 | `ticket-workflow` | Status changes and assignment that move tickets between counters |
| REQ-060, REQ-062, REQ-064 | NFR | Encoding, atomicity/consistency, error contract |
| Seed data | Test environment | Accounts and tickets in the test-case seed dataset (Provisional seed data) |

The `comments` module has no dependency on the dashboard.

## 15. Acceptance Criteria

| ID | Acceptance criterion | FR refs |
|---|---|---|
| DSH-AC-01 | Given the seed dataset, the Agent Dashboard shows "SUPPORT DASHBOARD" with Open Tickets 3, In Progress 3, Resolved 2, Critical 4 (Provisional values per A-10). | DSH-FR-01..06 |
| DSH-AC-02 | Critical excludes Closed tickets; Assigned and Closed tickets are counted in no status counter; a ticket in two categories (for example Critical + Open) increments both counters (Provisional, OQ-18). | DSH-FR-02..06 |
| DSH-AC-03 | Recent Tickets shows at most 5 tickets, newest first, each as `#number subject priority`, regardless of status (Provisional). | DSH-FR-07 |
| DSH-AC-04 | Selecting a Recent Tickets entry opens Ticket Details of exactly that ticket. | DSH-FR-08 |
| DSH-AC-05 | The User Dashboard shows the four counters and the recent list calculated over the user's own tickets only (Provisional, A-17, OQ-19). | DSH-FR-09, DSH-FR-10 |
| DSH-AC-06 | A User never sees system-wide counts or another user's tickets in the UI or API, including when sending extra query parameters. | DSH-FR-11 |
| DSH-AC-07 | `GET /api/dashboard` returns 200 with the documented structure and types for both roles, scoped by the token (Provisional field names, OQ-26). | DSH-FR-12 |
| DSH-AC-08 | An unauthenticated or invalid-token request returns 401; the UI redirects to Login. | DSH-FR-18 |
| DSH-AC-09 | After a ticket is created, the next dashboard load shows the new ticket first in Recent Tickets and the Open Tickets (and Critical if applicable) counters incremented. | DSH-FR-13 |
| DSH-AC-10 | After each status change (assign, In Progress, Resolved, Closed) the next dashboard load shows counters changed exactly per Section 6.2. | DSH-FR-13 |
| DSH-AC-11 | With no tickets in scope, all counters show `0`, the recent list is empty with an empty-state message, and no error occurs. | DSH-FR-14 |
| DSH-AC-12 | With fewer than 5 tickets in scope all of them are listed; with 5 or more exactly 5 are listed. | DSH-FR-07, DSH-FR-10 |
| DSH-AC-13 | Counters equal the results of the corresponding database counts and of the ticket list endpoint filtered by the same status/priority; the recent list equals the first 5 rows of the list sorted by creation date descending. | DSH-FR-02..07 |
| DSH-AC-14 | Loading the dashboard changes no data; ticket subjects containing markup are displayed as text. | DSH-FR-16, DSH-FR-17 |
| DSH-AC-15 | When the API fails (500), the UI shows an error state, not zeros, and the response exposes no internal details. | DSH-FR-19 |
| DSH-AC-16 | Large counter values and long subjects are displayed without truncation of digits, `NaN` or layout overflow (exact format TBD, proposed OQ-31). | DSH-FR-15 |
| DSH-AC-17 | A User cannot open the Agent Dashboard (UI route) and cannot obtain agent-scope data from the API. | DSH-FR-11 |

## 16. Edge Cases

| # | Edge case | Expected behaviour / status |
|---|---|---|
| EC-1 | 0, 1, 4, 5 and 6 tickets in scope | Recent list shows min(n, 5); the 6th-newest is excluded. |
| EC-2 | Very many tickets (10,000+) | Counters correct; list still 5; response time target TBD (OQ-25). |
| EC-3 | Counter value >= 1,000 or >= 1,000,000 | Displayed completely; format TBD (proposed OQ-31). |
| EC-4 | Several tickets with identical `created_at` | Deterministic order; provisional tie-break `id` descending (proposed OQ-30). |
| EC-5 | Critical ticket moves to Closed | Leaves Critical counter at that moment (Provisional, OQ-18). |
| EC-6 | Critical ticket in `Assigned` | Counted in Critical only (Provisional, OQ-18). |
| EC-7 | A different user creates or changes a ticket | No effect on a User's own dashboard; the Agent view changes. |
| EC-8 | Dashboard open while data changes in another session | Behaviour until reload: TBD / Requires clarification (proposed OQ-29); a reload must show current data. |
| EC-9 | Subject very long (provisional max 150, OQ-01) or containing markup/special characters | No layout break; markup shown as text; truncation rule TBD (proposed OQ-31). |
| EC-10 | Ticket deleted (only if REQ-018 is implemented) | Removed from counters and recent list (OQ-04). |
| EC-11 | Closed tickets in Recent Tickets | Included (Provisional, A-10); confirm (proposed OQ-30). |
| EC-12 | Agent also owning tickets (only if Agents may create tickets, OQ-10) | Agent view stays system-wide; A-18 assumes this does not occur. |
| EC-13 | Role changed or account deactivated while logged in | TBD / Requires clarification (OQ-09). |

### Open items raised by this module (proposed additions to `requirement.md` Section 20; not yet added)

| Proposed ID | Question | Why it matters |
|---|---|---|
| OQ-29 | Dashboard refresh behaviour: manual reload only, auto-refresh interval, HTTP caching of `GET /api/dashboard`? | Staleness tests, DSH-FR-13 |
| OQ-30 | Recent Tickets: tie-break for equal creation time, and are Closed tickets included? | Deterministic ordering, DSH-FR-07 |
| OQ-31 | Number formatting for large counters, subject truncation rule, empty-state message wording? | UI tests, DSH-FR-14/15 |
| OQ-32 | Dashboard route/URL names and behaviour when a User opens the Agent Dashboard route (403 page vs redirect)? | Permission tests, S-4 |
