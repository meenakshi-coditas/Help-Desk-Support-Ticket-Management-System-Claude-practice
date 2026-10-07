# Authentication Module — Specification

| Item | Value |
|---|---|
| Module | `authentication` (ID prefix `AUTH`) |
| REQ IDs owned | REQ-001, REQ-002 (middleware / role-guard foundation only), REQ-003, REQ-060 (password hashing, no secret leakage, generic login errors) |
| Status | Draft for review. Blocked in part by OQ-08 and OQ-09 (marked **B** in `requirement.md`); working assumptions A-08 and A-11 are applied. |
| Source of truth | `requirement.md` (Sections 4, 5.1, 6, 12, 14, 15, 16, 20) |

> Convention: **Provisional** = placeholder value chosen only so the module can be documented and tested; it must be confirmed. `TBD / Requires clarification (OQ-xx)` = client is silent.

---

## 1. Module Overview

The `authentication` module is the entry point and the security foundation of the Help Desk system. It provides:

- the **Login screen** and `POST /api/auth/login`;
- issue and validation of an **authentication token** (A-11: bearer token carrying user id and role);
- **token-validation middleware** applied to every API except login (REQ-003);
- a reusable **role guard** that other modules attach to their endpoints and screens (REQ-002);
- **role-based redirect** after login (User → Dashboard, Agent → Agent Dashboard; REQ-070);
- **seeded accounts** (A-08, OQ-08) and secure credential handling (REQ-060);
- an optional **logout** (proposed endpoint `POST /api/auth/logout`, OQ-26).

## 2. Objective

1. Allow the two roles (User, Support Agent) to authenticate with email and password (A-11, OQ-09).
2. Ensure no API except login can be called without a valid, unexpired token (REQ-003).
3. Provide the role-guard mechanism that lets each module enforce the Section 4 permission matrix of `requirement.md` (REQ-002).
4. Guarantee that credentials are stored and handled securely and that login failures do not disclose which credential was wrong (REQ-060).

## 3. Scope

**In scope**
- Login screen, client-side validation, error display, role-based redirect.
- `POST /api/auth/login`; proposed optional `POST /api/auth/logout` (OQ-26).
- Token issuing, signature/expiry validation, 401 handling in the UI (redirect to Login).
- Token-validation middleware and role-guard (the *mechanism*; REQ-002).
- Role-based navigation visibility (User never sees agent-only screens/actions).
- Seeded accounts and the `users` table as used for authentication.
- Password hashing, no secret leakage, generic login error (REQ-060).

**Out of scope**
- Per-endpoint authorization rules and ownership checks (BR-4, BR-5, BR-10, A-05) — implemented and tested in `ticket-management`, `ticket-workflow`, `comments`, `dashboard`.
- Ticket logic and dashboard content.
- User registration, password reset / change password, user administration, Admin role (A-08; `requirement.md` Section 18).
- SSO / third-party login (Section 18).
- Brute-force lockout, CAPTCHA, multi-factor authentication: **TBD / Requires clarification (OQ-09)** — not specified, not implemented unless confirmed.

## 4. Actors / User Roles

| Actor | Description | Authentication-related capability |
|---|---|---|
| User (`USER`) | Raises and follows tickets. | Log in; redirected to Dashboard; access limited to User screens/APIs. |
| Support Agent (`AGENT`) | Handles tickets. | Log in; redirected to Agent Dashboard; access to agent screens/APIs. |
| Unauthenticated visitor | Not logged in. | Can reach only the Login screen and `POST /api/auth/login`. |
| System (middleware / role guard) | Server component. | Validates token on every protected request; evaluates role. |

No Admin role exists (A-08, OQ-08).

## 5. Functional Requirements

| ID | Description | REQ ref |
|---|---|---|
| AUTH-FR-01 | The Login screen presents an email field, a password field (masked) and a Login button; Enter key submits the form (A-11). | REQ-001 |
| AUTH-FR-02 | `POST /api/auth/login` authenticates email + password (A-11) and, on success, returns a bearer token carrying user id and role plus basic user profile. | REQ-001 |
| AUTH-FR-03 | After successful login the UI redirects by role: User → Dashboard, Agent → Agent Dashboard. | REQ-001, REQ-070 |
| AUTH-FR-04 | Failed login (unknown email or wrong password) returns the same generic 401 error; the response and UI message never state which credential was wrong. | REQ-001, REQ-060 |
| AUTH-FR-05 | Login input is validated client-side and server-side: both fields required; email format and length per Section 11. Failures return a field-level validation error and perform no authentication. | REQ-001 |
| AUTH-FR-06 | A deactivated account (`users.is_active = false`) cannot log in. Exact HTTP code/message: **TBD / Requires clarification (OQ-09)**; provisional: treated as invalid credentials (401, generic). | REQ-001 |
| AUTH-FR-07 | Token-validation middleware runs on every `/api` endpoint except `POST /api/auth/login` and rejects requests with a missing, malformed, tampered or expired token with 401. | REQ-003 |
| AUTH-FR-08 | Token lifetime is enforced server-side. Lifetime value: **Provisional 60 minutes**, no refresh token (OQ-09). | REQ-003 |
| AUTH-FR-09 | The middleware resolves the caller (user id, role) for downstream handlers; a token whose user no longer exists or is deactivated is rejected with 401 (Provisional, OQ-09). | REQ-003, REQ-002 |
| AUTH-FR-10 | A reusable role guard lets any endpoint declare the allowed role(s); an authenticated caller with a non-permitted role receives 403. Ownership/rule checks stay in the owning modules. | REQ-002 |
| AUTH-FR-11 | The UI renders navigation and actions by role: a User never sees agent-only screens/actions; an Agent does not see User-only creation screens (A-18, OQ-10). Direct URL access to a screen of another role is blocked (redirect or access-denied view — **TBD / Requires clarification**, to be confirmed with UI design). | REQ-002 |
| AUTH-FR-12 | On any 401 response from the API the UI discards the stored token and redirects to Login. Unauthenticated access to a protected screen redirects to Login. | REQ-003 |
| AUTH-FR-13 | Optional logout (`POST /api/auth/logout`, proposed, OQ-26): the UI clears the token and returns to Login. Server-side token revocation: **TBD / Requires clarification (OQ-09)**; provisional: previous token is rejected after logout. | REQ-003 |
| AUTH-FR-14 | Seed data contains at least one User and one Support Agent account (A-08). Seed credentials are environment configuration, not hard-coded in source. | REQ-001, REQ-060 |
| AUTH-FR-15 | Passwords are stored only as salted hashes produced by a strong adaptive algorithm (e.g. bcrypt or Argon2); plain text is never stored. | REQ-060 |
| AUTH-FR-16 | Passwords, password hashes and token secrets never appear in any API response, log, URL or error message. | REQ-060 |
| AUTH-FR-17 | Authentication errors use the provisional error contract of `requirement.md` Section 14; 500 responses carry no stack trace or PII. | REQ-060 |

## 6. Business Rules

The client defines no authentication-specific business rules (BR-1..BR-10 concern tickets). The rules below are working rules for this module.

| ID | Rule | Source / Status |
|---|---|---|
| AUTH-BR-01 | Only the Login screen and `POST /api/auth/login` are accessible without a token. | REQ-003 |
| AUTH-BR-02 | A login failure never reveals whether the email exists. | REQ-060, `requirement.md` Section 14 |
| AUTH-BR-03 | Role is determined by the server (database role of the authenticated account), never by client-supplied data. | REQ-002, REQ-060 |
| AUTH-BR-04 | Accounts are not created via the application; they are seeded. | A-08 (OQ-08) |
| AUTH-BR-05 | Login identifier is the email address. Case sensitivity and surrounding whitespace handling: **TBD / Requires clarification (OQ-09)**; provisional: email compared case-insensitively, surrounding whitespace trimmed (consistent with A-15 intent). | A-11, OQ-09, OQ-22 |
| AUTH-BR-06 | Token lifetime 60 minutes. | Provisional (OQ-09) |
| AUTH-BR-07 | Failed-attempt lockout / throttling: not specified. | **TBD / Requires clarification (OQ-09)** |
| AUTH-BR-08 | Password policy (minimum length, complexity) is not enforced at login; it is relevant only to seeded data until user creation is defined. | **TBD / Requires clarification (OQ-09)** |

## 7. User Flow

### 7.1 Login (happy path)
1. Visitor opens the application; unauthenticated, so the Login screen is shown.
2. Visitor enters email and password and clicks **Login** (or presses Enter).
3. UI validates required fields/email format (inline errors if invalid; no request sent).
4. UI sends `POST /api/auth/login`.
5. Server validates input, looks up the account, verifies the password hash and active flag.
6. Server returns 200 with token and user profile.
7. UI stores the token (storage mechanism: implementation decision, OQ-28) and redirects by role.

```
[Login screen] --submit--> [client validation] --fail--> [inline field errors]
                                  | pass
                                  v
                         POST /api/auth/login
                         /        |         \
                     200 OK     401           400
                       |      (generic)    (field errors)
          role = USER?          |              |
          /          \     [error banner,  [inline errors,
 [Dashboard]   [Agent Dashboard]  stay]        stay]
```

### 7.2 Protected request
1. UI/client calls any `/api/...` endpoint with `Authorization: Bearer <token>`.
2. Middleware validates signature, expiry and account status (401 on failure).
3. Role guard compares caller role with the endpoint's allowed roles (403 on mismatch).
4. Handler runs (ownership/rules enforced by the owning module).

```
Request -> [Token valid?] --no--> 401 -> UI clears token -> Login
                | yes
                v
          [Role permitted?] --no--> 403
                | yes
                v
          [Module handler]
```

### 7.3 Session states
`Anonymous --login ok--> Authenticated --logout--> Anonymous`; `Authenticated --token expires / 401--> Expired (UI shows Login) --login ok--> Authenticated`.

### 7.4 Logout (optional, OQ-26)
User clicks **Logout** -> UI calls `POST /api/auth/logout` -> UI clears token -> Login screen.

## 8. UI Requirements

| ID | Requirement | Status |
|---|---|---|
| AUTH-UI-01 | Login screen fields: Email (text/email input), Password (masked input), Login button. Stable element identifiers for automation (REQ-063). | A-11 |
| AUTH-UI-02 | Inline error beneath a field for validation failures (required, email format). | REQ-001 |
| AUTH-UI-03 | A single banner/alert area shows login failure (generic invalid-credentials message). Exact wording: **TBD / Requires clarification** (Provisional: "Invalid email or password."). | REQ-060 |
| AUTH-UI-04 | The Login button is disabled (or ignores repeated clicks) while a login request is in flight. | Provisional |
| AUTH-UI-05 | After login: User -> Dashboard; Agent -> Agent Dashboard ("SUPPORT DASHBOARD"). | REQ-070 |
| AUTH-UI-06 | Role-based navigation: User menu = Dashboard, My Tickets, Create Ticket; Agent menu = Agent Dashboard, All Tickets. | REQ-002, REQ-070, A-18 |
| AUTH-UI-07 | A Logout control is visible on authenticated screens (if logout is confirmed, OQ-26). | Optional |
| AUTH-UI-08 | On a 401 from any API call the UI redirects to Login and may show a "session expired" notice. | REQ-003 |
| AUTH-UI-09 | Visual design, branding, language, "show password" toggle, "remember me": **TBD / Requires clarification** (not in client text; "remember me" and "forgot password" are not provided, A-08). | OQ-25 |

## 9. API Requirements

All errors use the provisional contract `{ "status", "error", "message", "details": [ { "field", "message" } ] }` (`requirement.md` Section 14, OQ-26). Error `code` strings below are **Provisional**.

### 9.1 `POST /api/auth/login` (public)

| Item | Definition |
|---|---|
| Request body | `{ "email": "user1@helpdesk.test", "password": "<password>" }` (A-11) |
| Success 200 | `{ "token": "<opaque or JWT>", "tokenType": "Bearer", "expiresIn": 3600, "user": { "id": <n>, "name": "<text>", "email": "<text>", "role": "USER" or "AGENT" } }` — shape **Provisional** (OQ-09/OQ-26); never contains password or hash. |
| 400 | Missing/blank `email` or `password`, invalid email format, email over max length, malformed JSON. Code `VALIDATION_ERROR` with `details[]` (400 vs 422: OQ-26). |
| 401 | Unknown email, wrong password (and, provisionally, inactive account). Code `INVALID_CREDENTIALS`; identical status, code and message for all causes. |
| 500 | Unexpected failure; generic message. |

### 9.2 `POST /api/auth/logout` (proposed optional, OQ-26)

| Item | Definition |
|---|---|
| Request | No body; `Authorization: Bearer <token>` |
| Success | 200 or 204 (**TBD**, OQ-26) |
| 401 | Missing/invalid/expired token |

### 9.3 Protected-endpoint behaviour (applies to every other `/api` endpoint)

| Condition | Response |
|---|---|
| No `Authorization` header | 401 `UNAUTHORIZED` |
| Scheme other than `Bearer`, malformed, tampered or unsigned token | 401 |
| Expired token (Provisional 60 min) | 401 |
| Token of deleted/deactivated user (Provisional) | 401 |
| Valid token, role not permitted by the endpoint's role guard | 403 `FORBIDDEN` |
| Valid token, role permitted | Request continues to the owning module |

Header format: `Authorization: Bearer <token>`. Ownership-based denials (403/404, OQ-27) belong to the owning modules.

## 10. Database Requirements

Table `users` (columns **Proposed**, `requirement.md` Section 11; not client-specified):

| Column | Use in this module | Constraint |
|---|---|---|
| `id` | Subject of token; referenced by other modules | Primary key |
| `name` | Returned in login profile | NOT NULL |
| `email` | Login identifier (A-11) | NOT NULL, UNIQUE (case handling per AUTH-BR-05) |
| `password_hash` | Verified at login | NOT NULL; salted adaptive hash; never returned |
| `role` | Role guard | NOT NULL; restricted to `USER`, `AGENT` |
| `is_active` | Blocks deactivated accounts (AUTH-FR-06) | NOT NULL, default true |
| `created_at` | Audit | NOT NULL |

- Login performs read-only access to `users`; no table is written on login (login timestamps / failed-attempt counters are not specified, OQ-09).
- Seed script inserts at least one `USER` and one `AGENT` (A-08). **Provisional seed data**: `user1@helpdesk.test`, `user2@helpdesk.test`, `agent1@helpdesk.test`, `agent2@helpdesk.test`, plus one inactive account `inactive.user@helpdesk.test` for negative testing.
- Token storage on the server (needed only if revocation is confirmed): **TBD (OQ-09)**.

## 11. Validation Rules

| Field | Rule | Failure result | Status |
|---|---|---|---|
| `email` | Required; not blank | 400 field error | A-11, OQ-09 |
| `email` | Must be a syntactically valid email (one `@`, non-empty local and domain parts) | 400 field error | Provisional |
| `email` | Maximum length 254 characters | 400 field error when exceeded | Provisional (OQ-01) |
| `email` | Surrounding whitespace trimmed; compared case-insensitively | Authenticates as normal | Provisional (OQ-09, OQ-22) |
| `password` | Required; not empty. Whitespace-only is not accepted as a credential. | 400 field error | A-11, OQ-09 |
| `password` | Compared case-sensitively, no trimming of the stored value | 401 on mismatch | Provisional |
| `password` | Minimum length / complexity | Not enforced at login | TBD / Requires clarification (OQ-09) |
| `password` | Maximum length | Very long input (for example 10,000 characters) must not cause a 500; accepted for verification or rejected with 400 | TBD / Requires clarification (OQ-09) |
| Request body | Must be valid JSON | 400 | Provisional |
| `Authorization` header | `Bearer <token>`; token must verify and not be expired | 401 | A-11, REQ-003 |

## 12. Error Scenarios

| # | Scenario | HTTP | UI behaviour |
|---|---|---|---|
| E-01 | Wrong password for a known email | 401 `INVALID_CREDENTIALS` | Generic banner; fields kept (password cleared — provisional) |
| E-02 | Unknown email | 401 `INVALID_CREDENTIALS` (identical to E-01) | Same generic banner |
| E-03 | Email or password missing/blank | 400 `VALIDATION_ERROR` | Inline field errors |
| E-04 | Invalid email format / over max length | 400 `VALIDATION_ERROR` | Inline field error |
| E-05 | Malformed JSON body | 400 | Generic error banner |
| E-06 | Deactivated account | 401 (Provisional; OQ-09) | Generic banner |
| E-07 | Request without token | 401 `UNAUTHORIZED` | Redirect to Login |
| E-08 | Malformed, tampered, unsigned or wrong-scheme token | 401 | Redirect to Login |
| E-09 | Expired token | 401 | Redirect to Login with session-expired notice (optional) |
| E-10 | Valid token, role not allowed | 403 `FORBIDDEN` | Access-denied message / hidden control |
| E-11 | Server or database failure during login | 500, generic message, no stack trace | User-friendly error banner |
| E-12 | Network failure / API unreachable | n/a | User-friendly error banner; no crash |
| E-13 | Lockout after repeated failures | TBD / Requires clarification (OQ-09) | TBD |

## 13. Security / Permission Requirements

- **Password storage (REQ-060):** salted, adaptive hash (bcrypt/Argon2 or equivalent); never logged, returned or placed in a URL.
- **Generic login failure (REQ-060):** same status, code, message and (as far as practicable) response time for unknown email and wrong password.
- **Token (A-11):** signed so that tampering with id/role is detected; carries expiry; unsigned tokens and `alg: none` are rejected. Secret/signing key held in environment configuration, not in source control (`requirement.md` Section 15).
- **Server-side enforcement (REQ-002, REQ-003):** authentication and role checks are performed on the server for every endpoint; UI hiding is convenience only.
- **Role source (AUTH-BR-03):** role comes from the verified token/database, never from request body or query.
- **Injection:** parameterised queries for the credential lookup; hostile input in `email`/`password` never alters query logic.
- **Output encoding:** user-supplied input (e.g. email) is never rendered as HTML in error messages.
- **Transport:** HTTPS in deployed environments; CORS restricted to the frontend origin (Section 15).
- **Permission matrix:** Login allowed for User and Agent (`requirement.md` Section 4). All other permissions are enforced by the owning modules using the role guard provided here.
- **Brute-force protection, lockout, MFA:** **TBD / Requires clarification (OQ-09)**.

## 14. Dependencies

**This module provides to others**

| Provided item | Consumed by |
|---|---|
| Token-validation middleware (identity: user id, role) | All modules (`ticket-management`, `ticket-workflow`, `comments`, `dashboard`) |
| Role-guard mechanism (`USER` / `AGENT`) | All modules, to enforce BR-4, BR-5, BR-10, A-05, A-18 |
| `users` table and seeded accounts | All modules (FKs: `tickets.user_id`, `tickets.assigned_to`, `comments.user_id`, `ticket_history.changed_by`) |
| Login/redirect, 401 handling in UI | `dashboard` (landing screens), all UI screens |
| Standard 401/403 error contract | All modules (REQ-064) |

**This module needs from others**

| Needed item | From |
|---|---|
| Landing screens (User Dashboard, Agent Dashboard) as redirect targets | `dashboard` |
| Protected endpoints/screens to attach guards to (for integration tests, e.g. `GET /api/tickets`, `PUT /api/tickets/{id}/assign`) | `ticket-management`, `ticket-workflow` |
| Error contract and technology stack decision | `requirement.md` Section 14, OQ-26, OQ-28 |
| Confirmation of OQ-08 / OQ-09 (blocking) | Client |

Module order: `authentication` is first (no upstream module dependency).

## 15. Acceptance Criteria

| ID | Criterion | Status |
|---|---|---|
| AUTH-AC-01 | Given a seeded active User, when valid email and password are submitted, `POST /api/auth/login` returns 200 with a token and `user.role = USER`, and the UI redirects to the User Dashboard. | A-11 |
| AUTH-AC-02 | Given a seeded active Agent, valid credentials return 200 with `user.role = AGENT` and the UI redirects to the Agent Dashboard. | A-11 |
| AUTH-AC-03 | A wrong password and an unknown email both return 401 with identical status, code and message; the message does not indicate which credential was wrong. | REQ-060 |
| AUTH-AC-04 | A missing or blank email or password is rejected with 400 and field-level details; no authentication occurs. UI shows inline errors without calling the API. | REQ-001 |
| AUTH-AC-05 | An invalid email format and an email longer than 254 characters (Provisional) are rejected with 400. | Provisional (OQ-01) |
| AUTH-AC-06 | A failed login stores no token in the browser and leaves protected APIs inaccessible. | REQ-003 |
| AUTH-AC-07 | `POST /api/auth/login` is callable without a token; every other endpoint returns 401 when the token is missing. | REQ-003 |
| AUTH-AC-08 | Malformed, tampered, unsigned (`alg: none`) or wrong-scheme tokens return 401. | REQ-003, REQ-060 |
| AUTH-AC-09 | A token is accepted until its expiry and rejected with 401 after it (Provisional 60 minutes). | Provisional (OQ-09) |
| AUTH-AC-10 | A valid token whose role is not permitted for an endpoint returns 403 (verified on a representative agent-only endpoint). | REQ-002 |
| AUTH-AC-11 | A User cannot open agent-only screens: navigation omits them and direct URL access is blocked. | REQ-002 |
| AUTH-AC-12 | An unauthenticated visit to any protected screen redirects to Login; a 401 from the API mid-session returns the user to Login. | REQ-003 |
| AUTH-AC-13 | The token identifies the logged-in account (id, role); a client-modified role claim is rejected. | REQ-002, REQ-060 |
| AUTH-AC-14 | Passwords are stored as salted adaptive hashes; two accounts with the same password have different hashes. | REQ-060 |
| AUTH-AC-15 | No password, hash or token secret appears in any API response, URL or log. | REQ-060 |
| AUTH-AC-16 | Injection payloads in email/password do not bypass authentication or cause a 500. | REQ-060 |
| AUTH-AC-17 | Seed data contains at least one active User and one active Agent; email is unique and role is restricted to `USER`/`AGENT`. | A-08 |
| AUTH-AC-18 | A deactivated account cannot log in (Provisional: generic 401) and an existing token of a deactivated account is rejected. | Provisional (OQ-09) |
| AUTH-AC-19 | If logout is implemented: the UI clears the token and shows Login, and the old token is rejected by the API (Provisional). | Provisional (OQ-09, OQ-26) |
| AUTH-AC-20 | All authentication errors follow the error contract; a 500 returns a generic message with no stack trace. | REQ-060, OQ-26 |
| AUTH-AC-21 | Differences in email case/whitespace and password case behave per AUTH-BR-05 and Section 11 (password is case-sensitive). | Provisional (OQ-09, OQ-22) |
| AUTH-AC-22 | Repeated failed attempts: behaviour is documented and tested once OQ-09 is answered (no lockout assumed meanwhile). | TBD (OQ-09) |

## 16. Edge Cases

1. Double-click or repeated Enter on Login must not produce multiple tokens or duplicate error banners (AUTH-UI-04).
2. Very long password (for example 10,000 characters) or email at exactly 254/255 characters must give 401/400, never 500.
3. Email with different case (`USER1@HELPDESK.TEST`) or surrounding spaces (OQ-09, OQ-22).
4. Password consisting only of spaces.
5. Non-ASCII / internationalised email input must not cause a 500.
6. Token expires exactly at the boundary; clock skew between server and client (UI relies on server 401, not on a client timer).
7. Token issued to a user later deactivated or deleted.
8. Two browsers/devices logged in with the same account concurrently: allowed or not is **TBD / Requires clarification (OQ-09)**; provisional: both valid.
9. Logging in as a different role in the same browser after logout must leave no residual data from the previous user.
10. A logged-in user opening the Login screen again: redirect to their dashboard or show Login — **TBD / Requires clarification**.
11. Browser Back after logout must not display protected content.
12. Database/server unavailable during login (E-11) and network failure (E-12).
13. Hostile input (SQL, script tags) in email/password fields.
