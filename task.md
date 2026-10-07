# Implementation Task List

How to use
- Tasks are ordered by dependency (module order in `plan.md` §8). Complete a module's tasks top-to-bottom.
- Each task: `- [ ] **<ID>** description — <REQ ids>` (and `⛔ OQ-xx` if it cannot start until that open question is answered; see `requirement.md` §20).
- "Add tests" tasks reference the module's `test-case.md`: implement the cases of the named group as automated tests and name them after the TC IDs.
- Definition of done for every task: code reviewed, lint/type-check clean, related tests green, spec/test-case updated if behaviour changed.
- Requirement-to-task mapping is in `traceability.md` (generated from the `REQ-xxx` tags below).

Progress note (updated):
- **Frontend** tasks are ticked `[x]`: implemented in `frontend/` (React + Vite, JavaScript). It talks to the real backend by default; `VITE_USE_MOCK=true` switches to a browser-only mock (`frontend/src/services/mock`).
- **Backend** tasks are ticked `[x]`: implemented in `backend/` (Flask + SQLAlchemy + SQLite, JWT). 105 automated API tests pass (`cd backend && python -m pytest`). Backend deviations from `plan.md`: Python/Flask/SQLite instead of Node/PostgreSQL (per client instruction); tables are created with `db.create_all()` (no migration tool yet, so FND-T05 stays open).
- **Still open:** DELETE ticket (OQ-04, TKT-T14), login throttling (AUTH-T09), OpenAPI docs (FND-T12, TKT-T15, WF-T12, CMT-T06, DSH-T05 docs part), concurrency tests (WF-T21), DB-level dashboard cross-check (DSH-T11), frontend automated tests (AUTH-T16, TKT-T26, WF-T22, CMT-T13, DSH-T12), browser/accessibility baseline (TKT-T23, REL-T05), release tasks (REL-*), logging/request ids (FND-T07 partly: `/api/health` only), CI (FND-T11), Docker (FND-T04).

---

## 0. Foundation (cross-cutting)

- [ ] **FND-T01** Approve technology stack and hosting target (⛔ OQ-28) — REQ-063
- [ ] **FND-T02** Initialise repository structure (`frontend/`, `backend/`, `docs` links), `.gitignore`, `.editorconfig` — REQ-063
- [ ] **FND-T03** Configure linting, formatting, type-checking and pre-commit hooks — REQ-063
- [ ] **FND-T04** Create Docker Compose for app + PostgreSQL and `.env.example` — REQ-063
- [ ] **FND-T05** Set up migration tool and baseline migration — REQ-062
- [x] **FND-T06** Implement central error handler and typed domain errors producing the standard error contract (⛔ OQ-26 for final codes) — REQ-064
- [ ] **FND-T07** Implement request-id logging and `/api/health` — REQ-063
- [x] **FND-T08** Implement shared validation helpers (trim, length, enum) — REQ-011, REQ-064
- [x] **FND-T09** Build seed script: users (≥1 User, ≥1 Agent each, plus second of each for permission tests) and categories (⛔ OQ-08, OQ-12) — REQ-001, REQ-020
- [x] **FND-T10** Build test harness: test DB lifecycle, data factories, API client helper, Playwright config — REQ-063
- [ ] **FND-T11** Create CI pipeline (lint, type-check, unit, API tests, build) — REQ-063
- [ ] **FND-T12** Create OpenAPI skeleton and publish it from the backend — REQ-063
- [x] **FND-T13** Create frontend shell: router, layout, API client (token + 401 handling + error normalisation), global error boundary — REQ-064, REQ-070
- [x] **FND-T14** Define UI conventions: `data-testid` naming, loading/empty/error components — REQ-063, REQ-061

## 1. Authentication (`modules/authentication`)

- [x] **AUTH-T01** Create `users` table migration (role CHECK, unique email, password_hash) — REQ-001
- [x] **AUTH-T02** Create user model/repository — REQ-001
- [x] **AUTH-T03** Implement password hashing + verify utility; update seed to use it — REQ-060
- [x] **AUTH-T04** Implement login service (generic failure message, inactive-user handling) (⛔ OQ-09) — REQ-001, REQ-060
- [x] **AUTH-T05** Implement token issue/verify (claims, expiry) (⛔ OQ-09) — REQ-003
- [x] **AUTH-T06** Implement `POST /api/auth/login` with request validation — REQ-001
- [x] **AUTH-T07** Implement authentication middleware (401 on missing/invalid/expired token) — REQ-003
- [x] **AUTH-T08** Implement `requireRole` guard (403) and current-user helper for services — REQ-002
- [ ] **AUTH-T09** Implement login throttling / lockout if confirmed (⛔ OQ-09) — REQ-060
- [x] **AUTH-T10** Implement logout endpoint and/or client-side token discard if confirmed (⛔ OQ-26) — REQ-003
- [x] **AUTH-T11** Create Login screen (fields, inline validation, error banner) — REQ-001, REQ-070
- [x] **AUTH-T12** Connect Login UI to login API; store token; role-based redirect to Dashboard / Agent Dashboard — REQ-001, REQ-002, REQ-070
- [x] **AUTH-T13** Implement route guards (unauthenticated → Login; wrong role → forbidden) and session-expiry handling — REQ-002, REQ-003
- [x] **AUTH-T14** Add unit tests (hashing, token, validators) — REQ-001, REQ-060
- [x] **AUTH-T15** Add API tests: positive, negative, validation, security, role cases from `AUTH-TC` — REQ-001, REQ-002, REQ-003, REQ-060
- [ ] **AUTH-T16** Add UI/E2E tests: login flows and route guards from `AUTH-TC` — REQ-001, REQ-002, REQ-070

## 2. Ticket Management (`modules/ticket-management`)

- [x] **TKT-T01** Create `categories` table + migration; seed categories (⛔ OQ-12) — REQ-020
- [x] **TKT-T02** Create `tickets` table migration (columns per client; CHECKs, FKs, unique `ticket_number` via sequence, indexes) — REQ-010, REQ-012
- [x] **TKT-T03** Create `attachments` table migration — REQ-013
- [x] **TKT-T04** Create ticket/category/attachment models and repositories — REQ-010, REQ-013, REQ-020
- [x] **TKT-T05** Implement `GET /api/categories` (⛔ OQ-26) — REQ-020
- [x] **TKT-T06** Implement create-ticket validation (subject, description ≥ 10, priority, category; trimming; length limits) (⛔ OQ-01, OQ-22) — REQ-011
- [x] **TKT-T07** Implement attachment validation and storage service (type/size/count) (⛔ OQ-02) — REQ-013, REQ-060
- [x] **TKT-T08** Implement `POST /api/tickets` (auto ticket number, created date, status Open, owner = caller; reject Agents if OQ-10 confirms) — REQ-010, REQ-012
- [x] **TKT-T09** Implement ticket list query: role scoping (User own, Agent all) — REQ-014, REQ-015
- [x] **TKT-T10** Add search, filters, sorting and pagination to `GET /api/tickets` (⛔ OQ-11) — REQ-019
- [x] **TKT-T11** Implement `GET /api/tickets/{id}` with ownership check (⛔ OQ-27) — REQ-016, REQ-002
- [x] **TKT-T12** Implement attachment download endpoint (⛔ OQ-26) — REQ-013
- [x] **TKT-T13** Implement `PUT /api/tickets/{id}` field edit per confirmed rules (⛔ OQ-03); closed-ticket rejection is wired in `WF-T09` — REQ-017
- [ ] **TKT-T14** Implement `DELETE /api/tickets/{id}` only if confirmed (⛔ OQ-04) — REQ-018
- [ ] **TKT-T15** Document list/detail/create/update APIs in OpenAPI — REQ-063
- [x] **TKT-T16** Create Create Ticket screen (form, category dropdown, priority selector, attachment picker, inline validation) — REQ-010, REQ-011, REQ-013, REQ-070
- [x] **TKT-T17** Connect Create Ticket UI to API; success redirect to Ticket Details / My Tickets; prevent double submit — REQ-010, REQ-012
- [x] **TKT-T18** Create My Tickets / All Tickets screen (table, status/priority badges, empty state) — REQ-014, REQ-015, REQ-070
- [x] **TKT-T19** Add search box, filters, sort controls and pagination to list screen; sync with URL query — REQ-019
- [x] **TKT-T20** Create Ticket Details screen layout (fields, attachment, slots for comments/history/actions) — REQ-016, REQ-070
- [x] **TKT-T21** Create edit-ticket UI per confirmed rules (⛔ OQ-03) — REQ-017
- [x] **TKT-T22** Implement navigation between screens per client flow and role-based menu — REQ-070, REQ-002
- [ ] **TKT-T23** Apply browser/responsiveness/accessibility baseline once targets are agreed (⛔ OQ-25) — REQ-061
- [x] **TKT-T24** Add unit tests (validators, ticket-number generation, query builder) — REQ-011, REQ-012, REQ-019
- [x] **TKT-T25** Add API tests: create/validation/boundary/decision-table/role/search-filter-sort-pagination/DB cases from `TKT-TC` — REQ-010..REQ-020, REQ-063, REQ-064
- [ ] **TKT-T26** Add UI/E2E tests: create, list, details, navigation from `TKT-TC` — REQ-010, REQ-014, REQ-015, REQ-016, REQ-070

## 3. Ticket Workflow (`modules/ticket-workflow`)

- [x] **WF-T01** Create `ticket_history` table migration (append-only; FKs; index) (⛔ OQ-21) — REQ-037
- [x] **WF-T02** Implement status enum + transition table + `canTransition(from, to, actor, ticket)` (⛔ OQ-06, OQ-13, OQ-17) — REQ-030, REQ-031
- [x] **WF-T03** Implement unit tests for the full 5×5 transition matrix × roles — REQ-030, REQ-031, REQ-034
- [x] **WF-T04** Implement `PUT /api/tickets/{id}/assign` (agent only; Open only; conditional update; self-assignment) (⛔ OQ-05) — REQ-032, REQ-033
- [x] **WF-T05** Implement `PUT /api/tickets/{id}/status` request validation (valid enum, required) — REQ-034
- [x] **WF-T06** Implement status change service: permission checks (Resolved agent-only; Close owner-only; assigned-agent rule), transition check, transaction (ticket update + `ticket_history` insert) — REQ-031, REQ-034, REQ-035, REQ-037, REQ-062
- [x] **WF-T07** Write history row on assignment (Open → Assigned) in the same transaction — REQ-032, REQ-037
- [x] **WF-T08** Update `updated_at` on every change — REQ-062
- [x] **WF-T09** Enforce closed-ticket immutability in `PUT /api/tickets/{id}`, `/status`, `/assign` — REQ-036
- [x] **WF-T10** Implement `GET /api/tickets/{id}/history` (chronological; visibility per OQ-24) — REQ-038
- [x] **WF-T11** Expose allowed actions for the current actor/state in ticket details response (proposed; ⛔ OQ-26) — REQ-034, REQ-035
- [ ] **WF-T12** Document assign/status/history APIs in OpenAPI — REQ-063
- [x] **WF-T13** Build Assign button on Ticket Details (agent, Open tickets) and wire to API — REQ-032, REQ-033
- [x] **WF-T14** Build Update Ticket screen for Agent (only permitted next statuses offered) and wire to API — REQ-034, REQ-070
- [x] **WF-T15** Build Close Ticket action for ticket owner (visible only when Resolved) and wire to API — REQ-035
- [x] **WF-T16** Build History section on Ticket Details (from → to, actor, time; local time per OQ-20) — REQ-038
- [x] **WF-T17** Disable/hide all edit controls on Closed tickets; show read-only banner — REQ-036
- [x] **WF-T18** Handle conflict/error responses in UI (stale state, forbidden) with refresh prompt — REQ-031, REQ-064
- [x] **WF-T19** Add API tests: state-transition, decision-table, role, closed-ticket, validation cases from `WF-TC` — REQ-030..REQ-036
- [x] **WF-T20** Add DB tests: history rows, atomic rollback, append-only, no row on rejected transition — REQ-037, REQ-062
- [ ] **WF-T21** Add concurrency tests (double assign, simultaneous status updates) — REQ-032, REQ-062
- [ ] **WF-T22** Add UI/E2E tests: full lifecycle journey (WF-1/WF-2/WF-3), button visibility per state/role — REQ-030, REQ-035, REQ-038, REQ-070

## 4. Comments (`modules/comments`)

- [x] **CMT-T01** Create `comments` table migration (FKs, index on ticket_id + created_at) — REQ-040, REQ-041
- [x] **CMT-T02** Create comment model/repository — REQ-040
- [x] **CMT-T03** Implement comment validation (required, trimmed, max length) (⛔ OQ-01, OQ-22) — REQ-040
- [x] **CMT-T04** Implement `POST /api/tickets/{id}/comments` with permission rules (owner User or any Agent) and closed-ticket block (⛔ OQ-23) — REQ-040, REQ-002, REQ-036
- [x] **CMT-T05** Implement `GET /api/tickets/{id}/comments` (ordering, ownership check, author name/role) — REQ-041
- [ ] **CMT-T06** Document comments API in OpenAPI — REQ-063
- [x] **CMT-T07** Build comments list component (author, role, timestamp, empty state) on Ticket Details — REQ-041
- [x] **CMT-T08** Build add-comment form (validation, disabled while submitting, hidden/disabled for Closed) — REQ-040
- [x] **CMT-T09** Connect UI to APIs; refresh list after submit — REQ-040, REQ-041
- [x] **CMT-T10** Ensure XSS-safe rendering of comment text and preserve line breaks — REQ-060
- [x] **CMT-T11** Add unit tests (validation) — REQ-040
- [x] **CMT-T12** Add API tests: positive/negative/boundary/decision-table/permission/security/DB cases from `CMT-TC` — REQ-040, REQ-041, REQ-060
- [ ] **CMT-T13** Add UI/E2E tests: add/list comments, closed ticket behaviour — REQ-040, REQ-041

## 5. Dashboard (`modules/dashboard`)

- [x] **DSH-T01** Add supporting indexes (`tickets(status)`, `tickets(priority)`, `tickets(created_at)`, `tickets(user_id)`) if not present — REQ-050
- [x] **DSH-T02** Implement count queries (Open, In Progress, Resolved, Critical) per confirmed definitions (⛔ OQ-18) — REQ-050
- [x] **DSH-T03** Implement role scoping (Agent system-wide; User own tickets) (⛔ OQ-19) — REQ-050, REQ-052
- [x] **DSH-T04** Implement recent-tickets query (size/order per OQ-18; tie-break on id) — REQ-051
- [x] **DSH-T05** Implement `GET /api/dashboard` (⛔ OQ-26) and document in OpenAPI — REQ-050, REQ-051, REQ-052
- [x] **DSH-T06** Build Agent Dashboard screen (counts tiles + Recent Tickets list per client wireframe) — REQ-050, REQ-051, REQ-070
- [x] **DSH-T07** Build User Dashboard screen per confirmed content (⛔ OQ-19) — REQ-052, REQ-070
- [x] **DSH-T08** Connect dashboards to API; empty/zero states; recent ticket → Ticket Details navigation — REQ-051
- [x] **DSH-T09** Ensure counts refresh after create/status change (refetch on navigation or invalidate cache) — REQ-050
- [x] **DSH-T10** Add API tests with the fixed seed dataset: counts, scoping, recent order, role cases from `DSH-TC` — REQ-050, REQ-051, REQ-052
- [ ] **DSH-T11** Add DB cross-check tests (counts equal SQL COUNT; equal to list endpoint totals) — REQ-050
- [ ] **DSH-T12** Add UI/E2E tests: dashboard after create/transition, navigation — REQ-050, REQ-051, REQ-070

## 6. Hardening, E2E and Release (cross-cutting)

- [ ] **REL-T01** Implement end-to-end journeys WF-1, WF-2, WF-3, WF-4 from `requirement.md` §8 in Playwright — REQ-070, REQ-030, REQ-035
- [ ] **REL-T02** Run security pass: IDOR sweep over all `{id}` endpoints, XSS payloads in all text inputs, upload abuse, token tampering — REQ-060, REQ-002
- [ ] **REL-T03** Verify consistent response shapes and status codes across all endpoints against OpenAPI (contract tests) — REQ-063, REQ-064
- [ ] **REL-T04** Verify transactional integrity under failure injection (history insert failure rolls back status) — REQ-062
- [ ] **REL-T05** Cross-browser / responsive / accessibility checks per agreed targets (⛔ OQ-25) — REQ-061
- [ ] **REL-T06** Resolve or formally accept remaining open questions; update `requirement.md`, specs, test cases and tasks — REQ-063
- [ ] **REL-T07** Regenerate `traceability.md`; confirm every REQ has a module, spec, test case and task — REQ-063
- [ ] **REL-T08** Prepare deployment pipeline, environment configuration, backups and release checklist (`plan.md` §13) — REQ-062
- [ ] **REL-T09** Write README (setup, seed accounts, run tests, API docs link) — REQ-063
