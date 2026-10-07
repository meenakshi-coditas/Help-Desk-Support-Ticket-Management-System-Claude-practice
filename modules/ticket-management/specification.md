# Module Specification: Ticket Management (`TKT`)

| Item | Value |
|---|---|
| Module | `ticket-management` (ID prefix `TKT`) |
| REQ IDs owned | REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-070; shared NFRs REQ-061, REQ-063, REQ-064 (as they apply to this module) |
| Status | Draft for review. Items marked `Provisional` or `TBD / Requires clarification` depend on open questions in `requirement.md` Section 20 (notably OQ-01, OQ-02, OQ-03, OQ-04, OQ-10, OQ-11, OQ-12, OQ-15, OQ-26, OQ-27). |
| Source | `requirement.md` (client requirement, working assumptions A-xx) |

> Convention: **Provisional** = placeholder value chosen so that tests can be written; it must be confirmed. **TBD / Requires clarification (OQ-xx)** = the client is silent; no behaviour is invented.

---

## 1. Module Overview

The `ticket-management` module covers the lifecycle of a ticket *record* up to the point where workflow takes over: creating a ticket (with an optional attachment), listing tickets (role-scoped "My Tickets" / "All Tickets" with search, filter, sort and pagination), viewing a ticket's details, editing ticket fields, optionally deleting a ticket, supplying the category list, uploading/downloading attachments, and the screen navigation between these screens. It also carries the module-level share of the consistent API response contract (REQ-063), the error-handling contract (REQ-064) and usability/compatibility (REQ-061).

Status changes, assignment, history and the "closed ticket cannot be edited" rule belong to `ticket-workflow`; comments belong to `comments`; dashboards to `dashboard`; login/token to `authentication`.

## 2. Objective

- Let a User raise a well-formed ticket quickly and see it immediately with a system-generated number, created date and status **Open** (REQ-010, REQ-012).
- Reject malformed input consistently in the UI and the API (REQ-011, BR-1, BR-2, BR-3).
- Let Users find and review only their own tickets and Agents find and review all tickets, with usable search, filter, sort and pagination (REQ-014, REQ-015, REQ-019, BR-10).
- Provide a Ticket Details screen that presents the ticket data and hosts the comments/history/actions supplied by other modules (REQ-016).
- Keep API behaviour deterministic and testable (REQ-063) with a uniform error contract (REQ-064).

## 3. Scope

**In scope**
- Create Ticket screen and `POST /api/tickets` (REQ-010..013).
- Ticket field validation (REQ-011), system-generated fields (REQ-012), optional attachment (REQ-013, OQ-02).
- My Tickets and All Tickets screens and `GET /api/tickets` (REQ-014, 015, 019).
- Ticket Details screen and `GET /api/tickets/{id}` (REQ-016).
- `PUT /api/tickets/{id}` field edits (REQ-017, A-07, OQ-03).
- `DELETE /api/tickets/{id}` (REQ-018, optional, OQ-04) - provisional/blocked.
- Categories: `GET /api/categories` (proposed, OQ-26), category validation (REQ-020, A-16, OQ-12).
- Attachment upload (with create) and download `GET /api/tickets/{id}/attachments/{attachmentId}` (proposed, OQ-26).
- Screen navigation (REQ-070); usability/compatibility (REQ-061, TBD); API response and error contract (REQ-063, REQ-064).

**Out of scope (owned elsewhere - cross-reference only)**
- Login, token, logout, lockout: `authentication` (REQ-001..003).
- Assign, status transitions, status history, close, and enforcement of "closed ticket cannot be edited" (BR-6): `ticket-workflow` (REQ-030..038).
- Adding/listing comments: `comments` (REQ-040, 041).
- Dashboard counts and recent tickets: `dashboard` (REQ-050..052).
- Category management UI, user management, notifications, reopening, ticket merge, export (requirement.md Section 18).
- Adding attachments after creation and attachments on comments: TBD / Requires clarification (OQ-02).

## 4. Actors / User Roles

| Actor | Responsibilities in this module |
|---|---|
| User | Create tickets (A-18); list and view **own** tickets only (A-05, BR-10); edit own tickets while status is Open (A-07, Provisional); download own attachments. |
| Support Agent | List and view **all** tickets; download any attachment. Creating tickets: not permitted (A-18, OQ-10). Editing fields: TBD (OQ-03). Deleting: TBD (OQ-04). |
| System | Generates `ticket_number`, `created_at`, `updated_at`, initial status **Open**, stores attachments. |
| Unauthenticated caller | No access to any endpoint of this module (REQ-003). |

## 5. Functional Requirements

| ID | Description | REQ ref |
|---|---|---|
| TKT-FR-01 | The system shall provide a Create Ticket screen with Subject, Description, Category, Priority and an optional Attachment control, available to the User role. | REQ-010, REQ-070 |
| TKT-FR-02 | `POST /api/tickets` shall create a ticket owned by the authenticated User (owner taken from the token, never from the request body). | REQ-010 |
| TKT-FR-03 | Subject shall be required and non-empty after trimming; maximum length Provisional 150 (A-15, OQ-01). | REQ-011, BR-1 |
| TKT-FR-04 | Description shall be required and at least 10 characters after trimming; maximum length Provisional 5000 (A-15, OQ-01). | REQ-011, BR-2 |
| TKT-FR-05 | Priority shall be required and exactly one of Low, Medium, High, Critical (case-sensitive match, Provisional). | REQ-011, BR-3 |
| TKT-FR-06 | Category shall be required (A-16) and reference an existing active category. | REQ-011, REQ-020 |
| TKT-FR-07 | The system shall auto-generate a unique, human-readable `ticket_number` (Provisional: sequential, first value 1001, A-09, OQ-15). | REQ-012 |
| TKT-FR-08 | The system shall auto-generate `created_at` (UTC, A-12) and set initial status to **Open**; `assigned_to` is empty. Client-supplied values for these fields are ignored. | REQ-012 |
| TKT-FR-09 | A ticket may be created with no attachment or one attachment; type/size/count rules are Provisional (OQ-02): one file, maximum 5 MB (5,242,880 bytes), types png, jpg, jpeg, pdf, txt. | REQ-013 |
| TKT-FR-10 | Invalid attachments (type, size, count) shall be rejected and no ticket shall be created (atomic create). | REQ-013, REQ-011 |
| TKT-FR-11 | Attachments shall be stored outside the web root under a server-generated name and be downloadable by the ticket owner and Agents through the download endpoint. | REQ-013, REQ-060 |
| TKT-FR-12 | A "My Tickets" screen shall list only the logged-in User's tickets. | REQ-014, BR-10 |
| TKT-FR-13 | An "All Tickets" screen shall list all tickets for Support Agents. | REQ-015, BR-10 |
| TKT-FR-14 | `GET /api/tickets` shall be role-scoped by the token: User receives own tickets only; Agent receives all; no client parameter may widen the scope. | REQ-014, REQ-015, REQ-002 |
| TKT-FR-15 | List shall support search (Provisional: case-insensitive substring of subject, or exact ticket number; OQ-11). | REQ-019 |
| TKT-FR-16 | List shall support filters (Provisional: `status`, `priority`, `categoryId`; combined with AND; OQ-11). | REQ-019 |
| TKT-FR-17 | List shall support sorting (Provisional: `sortBy` in createdAt, ticketNumber, priority, status; `sortDir` asc/desc; default createdAt desc, A-17; priority sorts by severity Critical > High > Medium > Low). | REQ-019 |
| TKT-FR-18 | List shall support pagination (Provisional: `page` >= 1; `pageSize` default 10, max 100) and return paging metadata. | REQ-019 |
| TKT-FR-19 | Lists shall show an empty state when no ticket matches. | REQ-014, REQ-015, REQ-019 |
| TKT-FR-20 | A Ticket Details screen / `GET /api/tickets/{id}` shall show ticket number, subject, description, category, priority, status, owner, assignee, created/updated dates and attachments. | REQ-016 |
| TKT-FR-21 | Ticket Details shall host sections for comments, history and role-appropriate actions that are supplied by `comments` and `ticket-workflow`; this module only provides the container and empty states (history visibility per role: OQ-24). | REQ-016, REQ-038, REQ-041 |
| TKT-FR-22 | A User shall not retrieve, download from, or modify a ticket owned by another User (UI or API); response per OQ-27 (Provisional 404). | REQ-016, REQ-002, BR-10 |
| TKT-FR-23 | `PUT /api/tickets/{id}` shall allow the owning User to edit subject, description, category and priority only while status is Open, applying the same validation as creation (A-07, Provisional). Status and assignee shall never be changed through this endpoint. | REQ-017 |
| TKT-FR-24 | Editing by Agents and the behaviour of the agent "Update Ticket" screen for field edits: TBD / Requires clarification (OQ-03). Rejection of edits to Closed tickets is enforced by `ticket-workflow` (BR-6, REQ-036). | REQ-017 |
| TKT-FR-25 | `DELETE /api/tickets/{id}` is optional; whether, by whom, soft/hard and effect on children: TBD / Requires clarification (OQ-04). | REQ-018 |
| TKT-FR-26 | `GET /api/categories` (proposed, OQ-26) shall return active categories used by the Create/Edit forms; seed list TBD (OQ-12). | REQ-020 |
| TKT-FR-27 | Navigation shall follow: User - Login > Dashboard > My Tickets > Create Ticket > Ticket Details; Agent - Login > Agent Dashboard > All Tickets > Ticket Details > Update Ticket. Role-inappropriate screens shall not be navigable. | REQ-070, REQ-002 |
| TKT-FR-28 | Every endpoint of this module shall require authentication (401 otherwise). | REQ-003 |
| TKT-FR-29 | API responses shall follow one consistent contract: success envelope (Provisional, OQ-26) and the error contract of requirement.md Section 14, with stable status codes and JSON shape. | REQ-063, REQ-064 |
| TKT-FR-30 | The UI shall show inline field errors, a banner/toast for server errors, and shall prevent duplicate submission while a request is in flight (Provisional). | REQ-064, REQ-011 |
| TKT-FR-31 | User-supplied text (subject, description, file name) shall be output-encoded wherever rendered; queries shall be parameterised. | REQ-060 |
| TKT-FR-32 | Forms and lists shall expose stable element identifiers (id / name / test attribute) to support automation. Naming convention TBD. | REQ-063 |
| TKT-FR-33 | Supported browsers, responsive breakpoints and accessibility level: TBD / Requires clarification (OQ-25). | REQ-061 |

## 6. Business Rules

| ID | Rule | Source |
|---|---|---|
| TKT-BR-01 | Subject cannot be empty. | BR-1 |
| TKT-BR-02 | Description must contain at least 10 characters. | BR-2 |
| TKT-BR-03 | Priority is mandatory and must be Low, Medium, High or Critical. | BR-3, REQ-011 |
| TKT-BR-04 | Category is mandatory and must be a valid, active category. | A-16, OQ-12 |
| TKT-BR-05 | Whitespace is trimmed before validating Subject and Description. | A-15, OQ-22 |
| TKT-BR-06 | Initial status is always Open; ticket number, created date and owner are system/token-derived. | REQ-012 |
| TKT-BR-07 | A User sees only their own tickets; an Agent sees all. | BR-10 |
| TKT-BR-08 | Only Users create tickets; Agents do not. | A-18, OQ-10 |
| TKT-BR-09 | A User may edit own ticket fields only while status is Open; status/assignee are not editable here. | A-07, OQ-03 (Provisional) |
| TKT-BR-10 | A Closed ticket cannot be edited (enforced by `ticket-workflow`). | BR-6, REQ-036 |
| TKT-BR-11 | Attachment: optional; Provisional limit 1 file, 5 MB, types png/jpg/jpeg/pdf/txt; executable and script types are rejected. | OQ-02 |
| TKT-BR-12 | `ticket_number` is unique. | requirement.md Section 11 |
| TKT-BR-13 | Dates are stored in UTC and displayed in the viewer's local time zone. | A-12, OQ-20 |

## 7. User Flow

**Flow 1 - User creates a ticket**
1. User logs in (authentication) and lands on Dashboard.
2. User opens Create Ticket (menu "Create Ticket" or button on My Tickets).
3. User enters Subject, Description, selects Category and Priority, optionally selects an Attachment.
4. User submits. Client-side validation runs; on failure inline errors are shown and nothing is sent.
5. Server validates; on failure 400 with field details is shown inline. On success 201.
6. UI shows a success message and navigates to Ticket Details (or My Tickets - Provisional: Ticket Details) showing the new ticket number, status Open and created date.

```
[Login] -> [Dashboard] -> [My Tickets] -> [Create Ticket] --submit--> (valid?)
                                |                                     |yes -> 201 -> [Ticket Details: Open]
                                |                                     |no  -> inline errors, stay on form
                                +--> [Ticket Details] (click row)
```

**Flow 2 - User reviews own tickets**: My Tickets (default newest first, 10 per page) > search / filter / sort / page > click a row > Ticket Details > (Provisional) Edit while Open.

**Flow 3 - Agent reviews all tickets**: Agent Dashboard > All Tickets > search / filter / sort / page > Ticket Details > (workflow module) Assign / Update Ticket.

**Flow 4 - Edit own ticket (Provisional, A-07)**: Ticket Details (status Open, owner) > Edit > change fields > Save > `PUT` > updated Ticket Details; if status is not Open the Edit action is not offered and the API returns 409.

**Flow 5 - Attachment download**: Ticket Details > click attachment link > `GET .../attachments/{attachmentId}` > file downloads (never rendered inline).

## 8. UI Requirements

### 8.1 Create Ticket (User)
| Element | Type | Rules / States |
|---|---|---|
| Subject | Single-line text, required | Max 150 (Provisional); inline error "Subject is required" when empty; error cleared on correction. |
| Description | Multi-line text, required | Min 10, max 5000 (Provisional); inline error when shorter than 10 after trimming. |
| Category | Dropdown, required (A-16) | Populated from `GET /api/categories`; placeholder "Select a category" is not a valid value. |
| Priority | Dropdown, required | Options Low, Medium, High, Critical; placeholder not valid. |
| Attachment | File picker, optional | One file, 5 MB, allowed types (Provisional, OQ-02); shows selected file name and a remove action; inline error for invalid file. |
| Submit | Button | Disabled/in-progress state while request is pending (prevents double submit); enabled otherwise. |
| Cancel | Button/link | Returns to My Tickets without creating a record. |
| States | - | Initial (empty), validation-error, submitting, success (message + navigation), server-error (banner, form data retained). |

Generated fields (ticket number, created date, status) are **not** inputs; they are shown only after creation.

### 8.2 My Tickets (User) / All Tickets (Agent)
| Element | Rules / States |
|---|---|
| Table columns | Ticket number, Subject, Category, Priority, Status, Created date; All Tickets additionally shows Owner and Assignee (Provisional). Row click opens Ticket Details. |
| Search box | Subject substring / ticket number (Provisional, OQ-11). |
| Filters | Status, Priority, Category dropdowns (Provisional). Changing any search/filter/sort resets to page 1. |
| Sort | Sortable column headers; default Created date descending (A-17). |
| Pagination | Page indicator, previous/next, page-size selector (default 10, max 100 - Provisional). Previous disabled on page 1; next disabled on last page. |
| States | Loading, results, empty ("No tickets found"), error banner. Create Ticket button visible to User only. |

### 8.3 Ticket Details (both roles)
| Element | Rules / States |
|---|---|
| Fields | Ticket number, subject, description (multi-line preserved, encoded), category, priority, status, owner, assignee ("Unassigned" when empty), created and updated date. |
| Attachment | File name, size, download link; "No attachment" when none. |
| Comments section | Rendered by `comments` module; shows empty state when none (REQ-041). |
| History section | Rendered by `ticket-workflow` (REQ-038); role visibility OQ-24. |
| Actions | Assign / Change status / Close are supplied by `ticket-workflow`; "Edit" shown to the owning User only while Open (Provisional, A-07). |
| States | Loading, loaded, not-found / no-access message (OQ-27), error banner. |

### 8.4 Edit Ticket (User, Provisional A-07)
Same fields and validation as Create Ticket (except Attachment: add/replace after creation TBD, OQ-02), pre-filled; Save and Cancel. Agent "Update Ticket" screen field editing: TBD (OQ-03).

### 8.5 Navigation (REQ-070)
- User menu: Dashboard, My Tickets, Create Ticket, Logout. Agent menu: Agent Dashboard, All Tickets, Logout.
- A User never sees All Tickets or agent actions; direct URL access shows an access-denied/redirect (REQ-002).
- Unauthenticated access redirects to Login; a 401 from any call redirects to Login (requirement.md Section 14).

## 9. API Requirements

General: base path `/api`; JSON; `Authorization: Bearer <token>` required on every endpoint below (A-11). Success envelope (Provisional, OQ-26): single object as `{ "data": { ... } }`; lists as `{ "data": [ ... ], "page": 1, "pageSize": 10, "totalItems": 25, "totalPages": 3 }`. Error contract (Provisional, OQ-26): `{ "status": <code>, "error": "<CODE>", "message": "<text>", "details": [ { "field": "...", "message": "..." } ] }`.

### 9.1 POST /api/tickets (REQ-010..013)
- Auth: User only (A-18); Agent receives 403 (OQ-10).
- Request: `multipart/form-data` with parts `subject`, `description`, `categoryId`, `priority`, optional `attachment`; `application/json` also accepted when no attachment (Provisional, OQ-26).
```json
{ "subject": "Cannot connect to VPN", "description": "VPN client times out after login on office Wi-Fi.", "categoryId": 1, "priority": "High" }
```
- Success `201 Created`:
```json
{ "data": { "id": 42, "ticketNumber": 1001, "subject": "Cannot connect to VPN",
  "description": "VPN client times out after login on office Wi-Fi.",
  "category": { "id": 1, "name": "Technical Issue" }, "priority": "High", "status": "Open",
  "createdBy": { "id": 1, "name": "User One" }, "assignedTo": null,
  "attachments": [ { "id": 7, "fileName": "screenshot.png", "contentType": "image/png", "sizeBytes": 102400 } ],
  "createdAt": "2026-10-07T09:30:00Z", "updatedAt": "2026-10-07T09:30:00Z" } }
```
- Errors: 400 validation (field details; invalid attachment included), 401, 403 (Agent), 415 unsupported content type (Provisional), 500.
- Client-supplied `status`, `ticketNumber`, `userId`, `createdAt`, `assignedTo` are ignored (Provisional) and never persisted.

### 9.2 GET /api/tickets (REQ-014, 015, 019)
| Query param | Rule (all Provisional, OQ-11) |
|---|---|
| `page` | integer >= 1, default 1 |
| `pageSize` | integer 1..100, default 10 |
| `search` | case-insensitive substring of subject, or exact ticket number; `%` and `_` treated literally |
| `status` | Open, Assigned, In Progress, Resolved, Closed |
| `priority` | Low, Medium, High, Critical |
| `categoryId` | integer, existing category |
| `sortBy` | createdAt (default), ticketNumber, priority, status |
| `sortDir` | desc (default), asc |

- Scope derived from token: User = own tickets; Agent = all. Any other parameter (e.g. `userId`) is ignored.
- Success `200 OK` (items are summaries):
```json
{ "data": [ { "id": 42, "ticketNumber": 1001, "subject": "Cannot connect to VPN", "category": { "id": 1, "name": "Technical Issue" },
  "priority": "High", "status": "Open", "createdBy": { "id": 1, "name": "User One" }, "assignedTo": null, "createdAt": "2026-10-07T09:30:00Z" } ],
  "page": 1, "pageSize": 10, "totalItems": 1, "totalPages": 1 }
```
- Page beyond last: `200` with empty `data` and unchanged `totalItems` (Provisional). No matches: `200`, `data: []`, `totalItems: 0`, `totalPages: 0`.
- Errors: 400 (invalid page/pageSize/enum/sort field), 401, 500.

### 9.3 GET /api/tickets/{id} (REQ-016)
- `{id}` = internal primary key (A-09, OQ-15). Success `200` with the object shown in 9.1. Comments and history are retrieved from their own endpoints (`GET .../comments`, proposed `GET .../history`) and composed by the screen (OQ-26).
- Errors: 400 non-numeric id, 401, 404 not found **or** owned by another User (Provisional; 403 vs 404 per OQ-27), 500.

### 9.4 PUT /api/tickets/{id} (REQ-017, A-07, OQ-03)
- Request (all four fields required, Provisional): `{ "subject": "...", "description": "...", "categoryId": 2, "priority": "Medium" }`. Any `status`, `assignedTo`, `ticketNumber`, `userId` property => 400 (Provisional).
- Success `200` with updated ticket (`updatedAt` changed, `createdAt` unchanged).
- Errors: 400 validation, 401, 403/404 not the owner (OQ-27), 403 Agent (Provisional, OQ-03), 409 ticket not Open (A-07) or Closed (BR-6, `ticket-workflow`), 404, 500.

### 9.5 DELETE /api/tickets/{id} (REQ-018, OQ-04)
TBD / Requires clarification (OQ-04): need, permitted roles, soft vs hard delete, status restrictions, effect on comments/history/attachments. Until resolved the endpoint is **not specified**; only 401 for unauthenticated calls is certain (REQ-003).

### 9.6 GET /api/categories (REQ-020, proposed - OQ-26)
Success `200`: `{ "data": [ { "id": 1, "name": "Technical Issue" }, { "id": 2, "name": "Billing" } ] }` (active categories only). Errors: 401, 500. Seed list TBD (OQ-12).

### 9.7 GET /api/tickets/{id}/attachments/{attachmentId} (REQ-013, proposed - OQ-26)
Success `200` binary body with `Content-Disposition: attachment; filename="..."`, stored `Content-Type`, `X-Content-Type-Options: nosniff`. Errors: 401, 404 (attachment/ticket missing or ticket not visible to the User), 500.

## 10. Database Requirements

Columns of `tickets` are client-specified; all other columns, types and indexes are **proposed** (requirement.md Section 11) and require confirmation.

**`tickets`**
| Column | Type (proposed) | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| ticket_number | INT/BIGINT | NOT NULL, UNIQUE, generated from a sequence (Provisional start 1001, A-09) |
| user_id | BIGINT | NOT NULL, FK -> `users.id` |
| subject | VARCHAR(150) | NOT NULL (Provisional length, OQ-01) |
| description | TEXT (app limit 5000) | NOT NULL |
| category_id | BIGINT | NOT NULL (A-16), FK -> `categories.id` |
| priority | VARCHAR(10) | NOT NULL, CHECK in (Low, Medium, High, Critical) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'Open', CHECK in (Open, Assigned, In Progress, Resolved, Closed) |
| assigned_to | BIGINT | NULL until assigned, FK -> `users.id` |
| created_at | TIMESTAMP (UTC) | NOT NULL, default current time |
| updated_at | TIMESTAMP (UTC) | NOT NULL, updated on every change |

**`attachments`** (proposed): id PK; ticket_id NOT NULL FK -> `tickets.id`; file_name (original, sanitised) NOT NULL; stored_path (server-generated) NOT NULL; content_type NOT NULL; size_bytes NOT NULL CHECK >= 1 and <= 5242880 (Provisional); uploaded_by FK -> `users.id`; uploaded_at NOT NULL.

**`categories`** (proposed): id PK; name NOT NULL UNIQUE; is_active NOT NULL default true. Seed list TBD (OQ-12).

**Indexes (proposed):** UNIQUE(`tickets.ticket_number`); `tickets(user_id, created_at)` for My Tickets; `tickets(status)`, `tickets(priority)`, `tickets(category_id)`, `tickets(created_at)` for filters/sort; `attachments(ticket_id)`.

**Behaviour:** ticket row and attachment row/file are created atomically - a failed create leaves no ticket, attachment row or orphan file (REQ-062). Deletion cascade/soft-delete: TBD (OQ-04). Ticket creation is not written to `ticket_history` (A-13, OQ-21).

## 11. Validation Rules

| Field | Rule | Limit / Value | Source |
|---|---|---|---|
| subject | required; trimmed (A-15); non-empty; string type | max 150 (Provisional, OQ-01) | BR-1 |
| description | required; trimmed; string type | min 10 (client), max 5000 (Provisional, OQ-01) | BR-2 |
| categoryId | required; integer; existing and active | - | A-16, REQ-020 |
| priority | required; exact match Low, Medium, High, Critical (case-sensitive) | - | BR-3 |
| attachment | optional; count | max 1 (Provisional, OQ-02) | REQ-013 |
| attachment | size | 1 byte to 5,242,880 bytes inclusive (Provisional); 0 bytes rejected | OQ-02 |
| attachment | type (extension and detected content) | png, jpg, jpeg, pdf, txt (Provisional); case-insensitive extension; no extension, double executable extension or content/extension mismatch rejected | OQ-02, REQ-060 |
| attachment | file name | sanitised: path components and control characters removed; stored under server-generated name | REQ-060 |
| page | integer >= 1 | default 1 | OQ-11 |
| pageSize | integer 1..100 | default 10 | OQ-11 |
| status / priority / categoryId (filters) | must be a valid enum value / existing id | - | OQ-11 |
| sortBy / sortDir | whitelist: createdAt, ticketNumber, priority, status / asc, desc | default createdAt desc | OQ-11, A-17 |
| `{id}` path | positive integer | - | A-09 |
| system fields (status, ticketNumber, userId, createdAt, assignedTo) | not accepted from client | ignored on POST; 400 on PUT (Provisional) | REQ-012 |

## 12. Error Scenarios

| # | Scenario | HTTP | error code (Provisional) | UI behaviour |
|---|---|---|---|---|
| E-01 | Subject empty/whitespace/missing/too long | 400 | VALIDATION_ERROR | Inline error under Subject |
| E-02 | Description < 10 chars after trim / missing / too long | 400 | VALIDATION_ERROR | Inline error under Description |
| E-03 | Priority missing or not in allowed set | 400 | VALIDATION_ERROR | Inline error under Priority |
| E-04 | Category missing, non-existent, inactive or wrong type | 400 | VALIDATION_ERROR | Inline error under Category |
| E-05 | Attachment type/size/count invalid | 400 | VALIDATION_ERROR | Inline error under Attachment naming the limit |
| E-06 | Malformed JSON / unsupported content type | 400 / 415 | BAD_REQUEST / UNSUPPORTED_MEDIA_TYPE | Generic error banner |
| E-07 | Missing, invalid or expired token | 401 | UNAUTHORIZED | Redirect to Login |
| E-08 | Agent creates a ticket / User calls Agent-only operation | 403 | FORBIDDEN | "You do not have permission" message |
| E-09 | Ticket (or attachment) not found, or owned by another User | 404 | NOT_FOUND | "Ticket not found" page (OQ-27) |
| E-10 | Non-numeric ticket id / invalid list parameter | 400 | VALIDATION_ERROR | Error banner / reset to defaults |
| E-11 | Edit of a ticket that is not Open (A-07) or is Closed (BR-6) | 409 | CONFLICT | Message names current status |
| E-12 | Status/system field present in PUT body | 400 | VALIDATION_ERROR | n/a (API only) |
| E-13 | Unexpected server/database failure | 500 | INTERNAL_ERROR | Generic banner; form data retained; no stack trace or PII |
| E-14 | Network failure on submit | n/a | n/a | Banner "Could not reach the server"; form data retained |
| E-15 | Status 400 vs 422, 409 vs 400 choice | - | - | TBD / Requires clarification (OQ-26) |

## 13. Security / Permission Requirements

| Operation | User (own) | User (others') | Agent | Anonymous |
|---|---|---|---|---|
| POST /api/tickets | Allowed | n/a | Denied 403 (A-18, OQ-10) | 401 |
| GET /api/tickets | Own only | n/a | All | 401 |
| GET /api/tickets/{id} | Allowed | 404 (OQ-27) | Allowed | 401 |
| PUT /api/tickets/{id} | Open only (A-07) | 404 | TBD (OQ-03); Provisional 403 | 401 |
| DELETE /api/tickets/{id} | TBD (OQ-04) | TBD | TBD | 401 |
| GET /api/categories | Allowed | n/a | Allowed | 401 |
| GET attachment | Allowed | 404 | Allowed | 401 |

- Server-side role **and** ownership checks on every call; the UI is never the only control (REQ-002).
- Owner is taken from the token; request body cannot set owner, status, number or dates (mass-assignment protection).
- Output encoding of subject, description and file name in all views (stored/reflected XSS); parameterised queries for search, filter, sort and id (SQL injection); `sortBy` whitelisted.
- Attachments: extension and content validation, sanitised names, stored outside web root with generated names, served as download with `nosniff`, never executed (REQ-060, OQ-02).
- Errors never leak stack traces, SQL, file paths or other users' data.

## 14. Dependencies

| Depends on | Module / item | Needed for |
|---|---|---|
| authentication | Login, bearer token carrying user id and role (REQ-001..003, A-11); seed accounts (A-08) | Every endpoint and role check |
| ticket-workflow | Status transitions, assign, history, Close action; enforcement of "Closed cannot be edited" (BR-6, REQ-036) | Ticket Details actions; PUT 409 on Closed |
| comments | `GET/POST /api/tickets/{id}/comments` (REQ-040, 041) | Comments section on Ticket Details |
| dashboard | Dashboard screens that link into My Tickets / All Tickets (REQ-050..052) | Navigation (REQ-070) |
| Database | `users`, `categories` tables and seed data (OQ-12) | FKs, category dropdown |
| File storage | Attachment storage location (OQ-02) | Attachments |
| Open questions | OQ-01, 02, 03, 04, 10, 11, 12, 15, 25, 26, 27 | Provisional values in this document |

## 15. Acceptance Criteria

| ID | Criterion | REQ |
|---|---|---|
| TKT-AC-01 | A User submitting valid Subject, Description, Category and Priority receives 201 and the ticket appears in My Tickets with an auto-generated ticket number, created date and status Open. | REQ-010, 012, 014 |
| TKT-AC-02 | An empty, whitespace-only or missing Subject is rejected (UI inline error, API 400 with field detail) and no ticket is created. | REQ-011 |
| TKT-AC-03 | A Description shorter than 10 characters after trimming is rejected and no ticket is created; exactly 10 is accepted. | REQ-011 |
| TKT-AC-04 | A missing or invalid Priority (anything other than Low, Medium, High, Critical) is rejected and no ticket is created. | REQ-011 |
| TKT-AC-05 | A missing, non-existent or inactive Category is rejected and no ticket is created (A-16). | REQ-011, 020 |
| TKT-AC-06 | Subject (Provisional 150) and Description (Provisional 5000) maximum lengths are enforced at the boundary (max accepted, max+1 rejected). | REQ-011 |
| TKT-AC-07 | Client-supplied status, ticket number, owner and created date are ignored; the persisted ticket has status Open, a generated number, the token's owner and a server date. | REQ-012 |
| TKT-AC-08 | Ticket numbers are unique and incrementing, including under concurrent creation. | REQ-012 |
| TKT-AC-09 | A ticket can be created without an attachment, or with one valid attachment (Provisional: png/jpg/jpeg/pdf/txt, 1 byte to 5 MB); the file is stored, linked to the ticket and downloadable unchanged by the owner and Agents. | REQ-013 |
| TKT-AC-10 | Attachments with a disallowed type, size 0 or above the limit, or more than the permitted count are rejected with a field error and no ticket or file is created. | REQ-013 |
| TKT-AC-11 | My Tickets (UI) and `GET /api/tickets` for a User return only that User's tickets; parameters cannot widen the scope. | REQ-014, BR-10 |
| TKT-AC-12 | An Agent sees all tickets in All Tickets / `GET /api/tickets`; a User cannot reach All Tickets. | REQ-015, BR-10 |
| TKT-AC-13 | Ticket Details displays number, subject, description, category, priority, status, owner, assignee, dates and attachment, plus comments and history sections. | REQ-016 |
| TKT-AC-14 | A User cannot view, download from or modify another User's ticket by changing the id in the URL or API call (Provisional 404, OQ-27). | REQ-016, REQ-002 |
| TKT-AC-15 | Search returns only tickets whose subject contains the term (case-insensitive) or whose number matches exactly (Provisional). | REQ-019 |
| TKT-AC-16 | Status, priority and category filters return the correct subset; multiple filters combine with AND (Provisional). | REQ-019 |
| TKT-AC-17 | Default sort is createdAt descending; sortBy/sortDir return correct ascending/descending order (Provisional). | REQ-019 |
| TKT-AC-18 | Pagination returns correct page content, metadata, first/last/beyond-last behaviour and enforces pageSize 1..100, default 10 (Provisional). | REQ-019 |
| TKT-AC-19 | Invalid list parameters (page, pageSize, enum values, sort field) return 400 without a server error. | REQ-019, REQ-064 |
| TKT-AC-20 | The owning User can edit subject, description, category and priority of an Open ticket with the same validation as creation; non-Open, other users' and status/assignee changes are rejected (A-07, Provisional). | REQ-017 |
| TKT-AC-21 | `DELETE /api/tickets/{id}` behaviour is confirmed by the client before testing (OQ-04); until then cases are Blocked. | REQ-018 |
| TKT-AC-22 | Categories are returned by `GET /api/categories` (active only) and populate the Category dropdown (seed list TBD, OQ-12). | REQ-020 |
| TKT-AC-23 | Every endpoint of this module returns 401 for a missing, invalid or expired token. | REQ-003, REQ-002 |
| TKT-AC-24 | Screen navigation follows REQ-070 for each role and role-inappropriate screens are not reachable. | REQ-070 |
| TKT-AC-25 | All success and error responses of this module follow one JSON contract (envelope, status codes, error fields). | REQ-063, REQ-064 |
| TKT-AC-26 | Script and SQL payloads in subject, description, file name, search and sort parameters are neither executed nor change data; malicious attachments are rejected. | REQ-060 |
| TKT-AC-27 | The UI shows inline field errors and friendly messages, never raw errors, and a double click on Submit creates exactly one ticket. | REQ-064, REQ-011 |
| TKT-AC-28 | Ticket Details shows empty states for comments and history on a new ticket without errors. | REQ-016 |
| TKT-AC-29 | Browser, responsive and accessibility expectations are confirmed (OQ-25) and verified; until then cases are Blocked. Stable element identifiers exist for automation. | REQ-061, REQ-063 |

## 16. Edge Cases

- Subject/description containing Unicode (accented, CJK, RTL) and emoji; counting of characters vs bytes vs UTF-16 units (OQ-01 / OQ-22).
- Description of 10 characters padded with spaces, e.g. two leading spaces plus nine letters, trims to 9 (A-15).
- Multi-line description with line breaks (do CR/LF count towards length? TBD, OQ-22).
- Double click / repeated Enter on Submit; browser back or refresh after submit must not duplicate the ticket.
- Concurrent creations by several Users must receive distinct ticket numbers (gaps tolerated? TBD, OQ-15).
- Attachment exactly at the size limit, 0 bytes, name with spaces/Unicode, same name on two tickets (no overwrite), name with path traversal or HTML.
- Page beyond last page; pageSize 0 or 101; search term containing `%`, `_`, quotes; filter with no matches.
- Token expires while the Create Ticket form is open (data loss vs retain - TBD, OQ-09).
- Category deactivated after a ticket was created with it (ticket display keeps category name; exact behaviour TBD, OQ-12).
- Ticket owner deactivated (`users.is_active`) - listing visibility TBD.
- Agent attempting to create or edit ticket fields (A-18, OQ-03, OQ-10).
- Time zone rendering of created date near midnight UTC (A-12, OQ-20).
