---
name: architect-create
description: Turn a client requirement into a complete, traceable documentation set before any code is written — requirement.md, modules/<module>/specification.md + test-case.md, plan.md, task.md and traceability.md. Use when the user gives a client requirement/PRD and wants it analysed, split into modules, and documented with test cases and tasks ("architect-create", "create the project docs", "analyse this requirement"). Documentation only; never writes application code.
---

# architect-create

Input: the client requirement (pasted text, or `$ARGUMENTS`). Output: a reviewed documentation set at the project root. **Do not write application code in this skill.** After the user approves the docs, implementation (frontend, backend) is a separate step that uses these files as the source of truth.

## Ground rules
- **Never invent requirements.** Anything missing or ambiguous is marked `TBD / Requires clarification` and linked to an open question (`OQ-xx`).
- Where documentation or tests cannot proceed without a decision, state an explicit **working assumption** (`A-xx`, linked to its `OQ-xx`) and mark numbers as **Provisional**. Every assumption must be confirmable or replaceable later.
- Keep requirements, specs, test cases, plan and tasks consistent; do not duplicate requirements; clear professional language; simple and maintainable; readable by developers *and* QA.
- Contradictions and ambiguities in the client text are listed separately under `Open Questions / Clarifications Required`.
- Ask the user clarifying questions only when a decision truly blocks the work and cannot be a documented assumption.

## Steps

### 1. Analyse the requirement (no files yet)
Identify: business, functional and non-functional requirements; user roles and permissions; business rules; workflows; data/entities; dependencies; assumptions; edge cases; validation rules; API, frontend, backend and database requirements; contradictions.

### 2. `requirement.md` (root)
Sections: 1 Project Overview · 2 Business Objective · 3 Scope · 4 User Roles (with a role × action permission matrix) · 5 Functional Requirements · 6 Non-Functional Requirements · 7 Business Rules (numbered `BR-n`; include a status/state transition table if there is a lifecycle) · 8 User Workflows · 9 Frontend · 10 Backend · 11 Database (mark which columns the client specified vs *proposed*) · 12 API (client-listed endpoints vs *proposed additions*) · 13 Validation Rules · 14 Error Handling (provisional error contract + HTTP codes) · 15 Security · 16 Assumptions (`A-xx` table) · 17 Dependencies · 18 Out of Scope · 19 Acceptance Criteria · 20 Open Questions (`OQ-xx` table with a Blocking/Non-blocking flag, plus a list of contradictions).

**Requirement IDs:** every requirement is a table row `| REQ-001 | text |` (use ranges per area, e.g. 001–009 auth, 010–029 core entity, 030–039 workflow, 040–049 secondary feature, 050–059 dashboard/reporting, 060–069 non-functional, 070 UI navigation). IDs are stable and never reused. The traceability script parses these rows.

### 3. Divide into modules
Create `modules/<module-name>/` for each logical, independently manageable module (e.g. authentication, ticket-management, ticket-workflow, comments, dashboard). Only modules that the requirement actually needs; no filler. Decide REQ **ownership**: each REQ belongs to one module; other modules may reference it in integration/permission tests. Assign each module a short ID prefix (`AUTH`, `TKT`, `WF`, `CMT`, `DSH`).

### 4. `specification.md` per module
Header table (module, REQ IDs owned, status), then exactly: 1 Module Overview · 2 Objective · 3 Scope (in/out) · 4 Actors/User Roles · 5 Functional Requirements (table `PFX-FR-01 | description | REQ-xxx`) · 6 Business Rules · 7 User Flow · 8 UI Requirements · 9 API Requirements (method, path, request, response, errors) · 10 Database Requirements · 11 Validation Rules · 12 Error Scenarios · 13 Security/Permission · 14 Dependencies (explicit cross-module) · 15 Acceptance Criteria (`PFX-AC-01`, testable) · 16 Edge Cases. Stay focused on the module; cite `A-xx`/`OQ-xx`.

### 5. `test-case.md` per module
Intro + legend (priorities P1 critical/smoke … P4 low; techniques used), then cases grouped by technique: Positive, Negative, Equivalence Partitioning, Boundary Value Analysis, Decision Table (show the table), State Transition (show the transitions; test every invalid pair), Validation, Role/Permission, API, Integration (UI↔API), Database, Security, Error handling, Edge cases. **Every table uses exactly this header:**

`| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |`

Rules: IDs `PFX-TC-001…` sequential and unique; the Test Scenario cell **ends with the REQ ids in brackets**, e.g. `User cannot assign [REQ-033]`, plus `[OQ-xx]` when the case depends on an open question (these are "blocked until answered"); steps use `<br>` and numbering; no literal pipe inside a cell; concrete test data (exact lengths, JSON, HTTP codes, seed accounts marked *Provisional seed data*); another QA engineer must be able to execute it without asking; no duplicates; every owned REQ and every acceptance criterion covered. Define one fixed seed dataset where counts/ordering are asserted.

### 6. `plan.md` (root)
1 Project Architecture · 2 Technology Stack (a **proposal** if the client gave none) · 3 Frontend · 4 Backend · 5 Database · 6 API · 7 Authentication/Authorization · 8 Module Implementation Order (table with dependencies and exit criteria; list blocking `OQ`s per module) · 9 Integration Strategy · 10 Testing Strategy (levels, tools, TC-ID naming, priority gating) · 11 Error Handling · 12 Security · 13 Deployment · 14 Risks and Mitigations.

### 7. `task.md` (root)
Small, specific, testable checkbox tasks grouped by module, ordered by dependency: a Foundation section first, then one section per module (schema → model → API → validation/security → UI → connect UI to API → unit tests → API tests → UI/E2E tests), then a Release/hardening section. Line format: `- [ ] **PFX-T01** description (⛔ OQ-xx if blocked) — REQ-001, REQ-002`. Every task carries the REQ ids it implements.

### 8. Traceability
Run `python3 .claude/skills/architect-create/scripts/traceability.py` from the project root. It writes `traceability.md` (REQ → module → spec FR → test cases → tasks) and exits non-zero if any REQ lacks an owning FR, a test case or a task — fix gaps before finishing. Regenerate whenever any document changes.

### 9. Consolidate and verify
- Collect the new open questions surfaced while writing module docs and add them to `requirement.md` §20 (give them the next free `OQ` numbers and make the module docs use the same numbers).
- Check: all test tables have 7 columns and unique IDs; every REQ is covered (script); IDs referenced exist.
- Final structure: `requirement.md`, `plan.md`, `task.md`, `traceability.md`, `modules/<module>/{specification.md,test-case.md}`.

### 10. Report to the user (concise)
Modules identified · major requirements · the blocking open questions to take to the client · working assumptions that need confirmation · any contradictions found. Then wait for approval before any coding.

## Efficiency tip
Write `requirement.md` first (it fixes REQ/A/OQ IDs, provisional values and ownership). Then write `plan.md` and `task.md` yourself while **one subagent per module** writes that module's two files in parallel; give each subagent the exact formats above, its owned REQ ids, its ID prefix, what is out of scope (cross-reference only), and tell it not to edit `requirement.md` or run git. Merge their suggested new open questions afterwards (step 9).
