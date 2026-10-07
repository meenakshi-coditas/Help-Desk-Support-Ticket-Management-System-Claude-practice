# Authentication Module — Test Cases

Test cases for module `authentication` (prefix `AUTH`), derived from `modules/authentication/specification.md` and `requirement.md`. Covers REQ-001, REQ-002 (middleware/role-guard foundation; per-endpoint authorization is tested in the owning modules), REQ-003 and REQ-060.

## Legend

| Item | Meaning |
|---|---|
| Priority | P1 = critical / smoke, P2 = high, P3 = medium, P4 = low |
| Techniques | Positive, Negative, Equivalence Partitioning (EP), Boundary Value Analysis (BVA), Decision Table, Role/Permission, API, Integration (UI to API), State Transition, Database, Security, Error handling, Edge cases |
| Tags in Test Scenario | `[REQ-xxx]` requirement covered; `[OQ-xx]` case depends on an open question; `[A-xx]` working assumption; **Provisional** values must be confirmed |

## Test Data Reference (Provisional seed data)

| Account | Email | Password | Role | Active |
|---|---|---|---|---|
| User 1 | user1@helpdesk.test | User@1234 | USER | yes |
| User 2 | user2@helpdesk.test | User@1234 | USER | yes |
| Agent 1 | agent1@helpdesk.test | Agent@1234 | AGENT | yes |
| Agent 2 | agent2@helpdesk.test | Agent@1234 | AGENT | yes |
| Inactive User | inactive.user@helpdesk.test | User@1234 | USER | no |

Other provisional values: protected endpoint used for token tests `GET /api/tickets`; agent-only endpoint `PUT /api/tickets/1/assign` (ticket id 1 assumed seeded, status Open); token lifetime 60 minutes; email max length 254; Login URL `/login`; agent screen URL `/agent/dashboard`. Standard request header: `Authorization: Bearer <token>`. Error contract per `requirement.md` Section 14.

---

## 1. Positive Test Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-001 | Login as User with valid credentials via the Login screen [REQ-001] | Application running; seed data loaded; no active session | 1. Open the Login screen (/login)<br>2. Enter email in the Email field<br>3. Enter password in the Password field<br>4. Click Login | Email: user1@helpdesk.test, Password: User@1234 (Provisional seed data) | No error shown; user is authenticated and redirected to the User Dashboard; User navigation (Dashboard, My Tickets, Create Ticket) is displayed | P1 |
| AUTH-TC-002 | Login as Support Agent with valid credentials and role-based redirect [REQ-001] | Seed data loaded; no active session | 1. Open the Login screen<br>2. Enter email and password<br>3. Click Login | Email: agent1@helpdesk.test, Password: Agent@1234 (Provisional seed data) | User is authenticated and redirected to the Agent Dashboard ("SUPPORT DASHBOARD"); Agent navigation (All Tickets) is displayed | P1 |
| AUTH-TC-003 | Token issued at login is accepted by a protected endpoint [REQ-003] | Seed data loaded | 1. Send POST /api/auth/login with the payload below and copy `token` from the response<br>2. Send GET /api/tickets with header Authorization: Bearer <token> | Payload: {"email":"user1@helpdesk.test","password":"User@1234"} | Step 1 returns 200; step 2 returns 200 (not 401 or 403) | P1 |
| AUTH-TC-004 | Token identifies the logged-in account and role [REQ-001, REQ-002] [A-11] | Seed data loaded | 1. Login via POST /api/auth/login as user2@helpdesk.test<br>2. Decode the token payload (if JWT) or read the `user` object of the response<br>3. Repeat for agent2@helpdesk.test | user2@helpdesk.test / User@1234; agent2@helpdesk.test / Agent@1234 | Token/profile for user2 contains user2's own id and role USER; for agent2 contains agent2's own id and role AGENT; ids differ from user1/agent1 | P2 |

## 2. Negative Test Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-005 | Login with a wrong password shows a generic error and stores no session [REQ-001, REQ-003, REQ-060] | Seed data loaded; no active session | 1. Open the Login screen<br>2. Enter a valid email and a wrong password<br>3. Click Login<br>4. Inspect browser storage (local storage, session storage, cookies) for a token<br>5. Send GET /api/tickets without a token | Email: user1@helpdesk.test, Password: Wrong@9999 | User stays on Login; error message indicating invalid credentials is shown and does not state which field is wrong; no token in browser storage; step 5 returns 401 | P1 |
| AUTH-TC-006 | Login with an unknown email shows the same generic error as a wrong password [REQ-001, REQ-060] | Seed data loaded | 1. Open the Login screen<br>2. Enter an unregistered email and any password<br>3. Click Login<br>4. Compare the message text with the message from AUTH-TC-005 | Email: nobody@helpdesk.test, Password: User@1234 | Stays on Login; message text identical to AUTH-TC-005 (error message indicating invalid credentials); message does not reveal that the email is unregistered | P1 |
| AUTH-TC-007 | Submit Login with both fields empty [REQ-001] | On the Login screen | 1. Leave Email and Password empty<br>2. Click Login<br>3. Observe the network tab | Email: (empty), Password: (empty) | Inline required-field errors shown for both fields; no POST /api/auth/login request is sent (client-side validation); no redirect | P2 |
| AUTH-TC-008 | Unauthenticated direct access to protected screens redirects to Login [REQ-003] | No active session (cleared storage) | 1. In the address bar open /tickets (My Tickets)<br>2. Open /agent/dashboard | URLs: /tickets, /agent/dashboard (Provisional paths) | Both requests end on the Login screen; no ticket data displayed | P1 |

## 3. Validation / Equivalence Partitioning

Partitions: email (valid known, valid unknown, empty, invalid format, different case); password (correct, wrong, empty, whitespace-only, different case).

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-009 | Email empty with password filled (client-side) [REQ-001] | On the Login screen | 1. Leave Email empty<br>2. Enter password<br>3. Click Login | Email: (empty), Password: User@1234 | Inline required-field error under Email; no API call; no authentication | P2 |
| AUTH-TC-010 | Invalid email formats rejected by the API [REQ-001] [OQ-09] | API reachable | 1. Send POST /api/auth/login with each payload below<br>2. Record status and body | A: {"email":"user1helpdesk.test","password":"User@1234"}<br>B: {"email":"user1@","password":"User@1234"}<br>C: {"email":"@helpdesk.test","password":"User@1234"} | Each returns 400 with error code for validation failure and `details` naming field `email`; no token returned (Provisional format rule) | P2 |
| AUTH-TC-011 | Email entered in upper case matches the account case-insensitively [REQ-001] [OQ-09] [OQ-22] | Seed data loaded | 1. Send POST /api/auth/login | {"email":"USER1@HELPDESK.TEST","password":"User@1234"} | Provisional: 200 with token for user1. If the client decides emails are case-sensitive, expected becomes 401 | P3 |
| AUTH-TC-012 | Password consisting only of whitespace is not accepted [REQ-001] [OQ-09] | API reachable | 1. Send POST /api/auth/login | {"email":"user1@helpdesk.test","password":"     "} | No token issued; response is 400 (blank password) or 401; never 200 and never 500 | P3 |
| AUTH-TC-013 | Password is case-sensitive [REQ-001] [OQ-09] | Seed data loaded | 1. Send POST /api/auth/login | {"email":"user1@helpdesk.test","password":"user@1234"} | 401 with generic invalid-credentials error; no token | P2 |

## 4. Boundary Value Analysis

Provisional limits: email max 254 characters; token lifetime 60 minutes (OQ-09, OQ-01).

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-014 | Email at maximum length (254 characters) is accepted for validation and treated as an unknown account [REQ-001] [OQ-01] | API reachable | 1. Build an email of exactly 254 characters (local part 64 characters, valid domain labels)<br>2. Send POST /api/auth/login with it | {"email":"<254-character email, e.g. 'a' x 64 + '@' + domain padded to 254>","password":"User@1234"} | 401 generic invalid credentials (passes validation, no such account); no 400, no 500 | P3 |
| AUTH-TC-015 | Email one character over maximum (255 characters) is rejected [REQ-001] [OQ-01] | API reachable | 1. Build a 255-character email<br>2. Send POST /api/auth/login | {"email":"<255-character email>","password":"User@1234"} | 400 validation error naming field `email`; no 500 | P3 |
| AUTH-TC-016 | Extremely long password (10,000 characters) does not crash the service [REQ-001, REQ-060] [OQ-09] | Seed data loaded | 1. Generate a 10,000-character password string<br>2. Send POST /api/auth/login for user1 | {"email":"user1@helpdesk.test","password":"<10,000 x 'A'>"} | 401 (or 400 if a maximum length is defined); never 500; no stack trace in body; response returned in reasonable time | P3 |
| AUTH-TC-017 | Token used 1 second before expiry is accepted [REQ-003] [OQ-09] | Environment allows token lifetime/clock control (Provisional lifetime 60 minutes); user1 token issued at time T | 1. Login as user1 and note issue time T<br>2. Set the clock (or use a short configured lifetime) so the request is made at expiry minus 1 second<br>3. Send GET /api/tickets with the token | user1@helpdesk.test / User@1234 | 200 (token still valid) | P2 |
| AUTH-TC-018 | Token used 1 second after expiry is rejected [REQ-003] [OQ-09] | Same as AUTH-TC-017 | 1. Login as user1<br>2. Make the request at expiry plus 1 second<br>3. Send GET /api/tickets with the token | user1@helpdesk.test / User@1234 | 401 with error contract body; token not accepted | P1 |

## 5. Decision Table

### 5.1 Login decision table

| Condition / Action | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| Email and password provided (not blank) | Y | Y | Y | Y | N |
| Email exists in `users` | Y | Y | N | Y | - |
| Password matches | Y | N | - | Y | - |
| Account active | Y | - | - | N | - |
| **Result** | 200 + token + role redirect | 401 generic | 401 generic (identical to R2) | 401 generic (Provisional, OQ-09) | 400 validation error |

### 5.2 Token / role decision table (protected endpoint)

| Condition / Action | T1 | T2 | T3 | T4 | T5 | T6 |
|---|---|---|---|---|---|---|
| Authorization header present | Y | N | Y | Y | Y | Y |
| Token well-formed and signature valid | Y | - | N | Y | Y | Y |
| Token not expired | Y | - | - | N | Y | Y |
| Account still exists and active | Y | - | - | - | Y | N |
| Role permitted for endpoint | Y | - | - | - | N | - |
| **Result** | 2xx (AUTH-TC-003) | 401 | 401 | 401 | 403 (AUTH-TC-028) | 401 (Provisional) |

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-019 | Decision rule R1: valid credentials and active account [REQ-001] | Seed data loaded | 1. Send POST /api/auth/login | {"email":"agent1@helpdesk.test","password":"Agent@1234"} | 200; body contains `token` and `user.role` = AGENT | P1 |
| AUTH-TC-020 | Decision rule R2: existing email, wrong password [REQ-001, REQ-060] | Seed data loaded | 1. Send POST /api/auth/login | {"email":"agent1@helpdesk.test","password":"Wrong@9999"} | 401; error body per contract (status 401, error code, message); no token | P1 |
| AUTH-TC-021 | Decision rule R3: unknown email [REQ-001, REQ-060] | Seed data loaded | 1. Send POST /api/auth/login | {"email":"ghost@helpdesk.test","password":"Agent@1234"} | 401; same status and error code as AUTH-TC-020; no token | P1 |
| AUTH-TC-022 | Decision rule R4: correct credentials but deactivated account [REQ-001] [OQ-09] | Seed data loaded; inactive.user@helpdesk.test has is_active = false | 1. Send POST /api/auth/login | {"email":"inactive.user@helpdesk.test","password":"User@1234"} | Provisional: 401 generic invalid credentials; no token. Final code/message pending OQ-09 | P2 |
| AUTH-TC-023 | Decision rule R5: required fields missing at the API [REQ-001] | API reachable | 1. Send POST /api/auth/login with payload A<br>2. Send with payload B<br>3. Send with payload C | A: {"password":"User@1234"}<br>B: {"email":"user1@helpdesk.test"}<br>C: {} | Each returns 400 with validation error; `details` lists the missing field(s) (A: email, B: password, C: both); no token | P1 |
| AUTH-TC-024 | Decision rule T2: protected endpoint called without Authorization header [REQ-003] | None required | 1. Send GET /api/tickets without any Authorization header | Header: (none) | 401 with error contract body; no ticket data in response | P1 |
| AUTH-TC-025 | Decision rule T3: malformed token [REQ-003] | None required | 1. Send GET /api/tickets with header Authorization: Bearer abc.def | Header: Authorization: Bearer abc.def | 401; no ticket data | P1 |
| AUTH-TC-026 | Decision rule T4: long-expired token [REQ-003] [OQ-09] | A token that expired at least 1 day ago is available (generated by test tooling or captured earlier) | 1. Send GET /api/tickets with the expired token | Header: Authorization: Bearer <expired token> | 401 with error contract body | P1 |
| AUTH-TC-027 | Decision rule T6: valid token of an account deactivated after issue [REQ-003] [OQ-09] | Test DB access | 1. Login as user2@helpdesk.test and keep the token<br>2. In the database set users.is_active = false for user2<br>3. Send GET /api/tickets with the saved token<br>4. Restore is_active = true | user2@helpdesk.test / User@1234 | Provisional: 401 on step 3 (AUTH-FR-09). Final behaviour pending OQ-09 | P3 |

## 6. Role / Permission

Scope: the role-guard mechanism and role-based navigation. Per-endpoint rules (BR-4, BR-5, A-05) are fully tested in the owning modules; representative endpoints are used here.

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-028 | Decision rule T5: User token on an agent-only endpoint is forbidden [REQ-002] | Ticket id 1 exists with status Open (Provisional seed data); user1 token available | 1. Send PUT /api/tickets/1/assign with header Authorization: Bearer <user1 token> | Login: user1@helpdesk.test / User@1234 | 403 with error contract body; ticket not modified (assigned_to remains NULL) | P1 |
| AUTH-TC-029 | User cannot open an agent-only screen by direct URL [REQ-002] | Logged in as user1 | 1. In the address bar open /agent/dashboard<br>2. Observe the screen and network calls | Login: user1@helpdesk.test / User@1234; URL: /agent/dashboard (Provisional) | Agent dashboard is not displayed; user is redirected or shown an access-denied view (exact behaviour TBD); no agent data returned by the API | P1 |
| AUTH-TC-030 | User navigation shows no agent-only links [REQ-002] | Logged in as user1 | 1. Inspect the navigation menu on the User Dashboard<br>2. Inspect actions on the pages reachable from the menu | Login: user1@helpdesk.test / User@1234 | Menu contains Dashboard, My Tickets, Create Ticket only; no "All Tickets", no Assign or agent status controls | P2 |
| AUTH-TC-031 | Agent token on a User-only endpoint is forbidden [REQ-002] [A-18] [OQ-10] | Agent token available | 1. Send POST /api/tickets with header Authorization: Bearer <agent1 token> and the body below | Login: agent1@helpdesk.test / Agent@1234; Body: {"subject":"Printer broken","description":"Printer on floor 2 not working","categoryId":1,"priority":"High"} | Provisional (A-18): 403 and no ticket created. If OQ-10 allows agents to create tickets, expected becomes 201 | P3 |

## 7. API Test Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-032 | Login success response structure and content type [REQ-001, REQ-060] | Seed data loaded | 1. Send POST /api/auth/login with header Content-Type: application/json<br>2. Inspect response headers and body | {"email":"user1@helpdesk.test","password":"User@1234"} | 200; Content-Type application/json; body has `token` (non-empty), `user.id`, `user.name`, `user.email`, `user.role` (USER); `expiresIn` consistent with token lifetime (shape Provisional); body has no password or password_hash field | P1 |
| AUTH-TC-033 | Login error response follows the error contract [REQ-001] [OQ-26] | Seed data loaded | 1. Send POST /api/auth/login with a wrong password<br>2. Inspect the JSON body | {"email":"user1@helpdesk.test","password":"Wrong@9999"} | Status 401; body contains `status` = 401, `error` code, `message` (generic), optional `details`; no stack trace | P2 |
| AUTH-TC-034 | Malformed JSON body returns 400 [REQ-001] | API reachable | 1. Send POST /api/auth/login with Content-Type application/json and a broken body | Raw body: {"email":"user1@helpdesk.test","password": | 400 error per contract; not 500 | P3 |
| AUTH-TC-035 | Login endpoint is public while others are protected [REQ-003] | No token | 1. Send POST /api/auth/login without Authorization header (valid credentials)<br>2. Send GET /api/tickets without Authorization header | Credentials: user1@helpdesk.test / User@1234 | Step 1 returns 200 (no token required); step 2 returns 401 | P1 |
| AUTH-TC-036 | Wrong HTTP method on the login endpoint is not processed as a login [REQ-001] [OQ-26] | API reachable | 1. Send GET /api/auth/login?email=user1@helpdesk.test&password=User@1234 | Query parameters as shown | No token issued and no authentication performed; response is 405 (or 404) with no credential echo | P3 |

## 8. Integration (UI to API)

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-037 | UI login sends the expected request and attaches the token to later calls [REQ-001, REQ-003] | Browser developer tools network tab open; seed data loaded | 1. On the Login screen enter credentials and click Login<br>2. Inspect the POST /api/auth/login request<br>3. After the Dashboard loads inspect the next API request header | user1@helpdesk.test / User@1234 | Login request is POST with JSON body containing email and password (no query string); response 200; subsequent API calls carry Authorization: Bearer <token> | P1 |
| AUTH-TC-038 | Mid-session 401 returns the user to Login [REQ-003] [OQ-09] | Logged in as user1 | 1. In browser storage replace the token value with an invalid string (or wait for expiry)<br>2. Click My Tickets in the menu | Token replaced with: invalid.token.value | API returns 401; UI discards the stored token and redirects to Login (session-expired notice optional); no ticket data shown | P1 |

## 9. State Transition

States: Anonymous, Authenticated, Expired/Logged out. Logout is an optional proposed feature (OQ-26); skip AUTH-TC-039 to AUTH-TC-040 if not implemented.

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-039 | Authenticated to Anonymous via UI logout [REQ-003] [OQ-26] | Logged in as agent1; Logout control exists | 1. Click Logout<br>2. Observe the screen and browser storage<br>3. Click browser Back | agent1@helpdesk.test / Agent@1234 | Login screen displayed; token removed from storage; Back does not display protected content (redirects to Login) | P2 |
| AUTH-TC-040 | Token is rejected after logout [REQ-003] [OQ-09] [OQ-26] | Logged in as user1; token copied before logout | 1. Send POST /api/auth/logout with the token (expect 200 or 204)<br>2. Send GET /api/tickets with the same token | user1@helpdesk.test / User@1234 | Step 1 succeeds; Provisional: step 2 returns 401 (server-side revocation). If revocation is not implemented the token stays valid until expiry and the case is recorded as clarified by OQ-09 | P2 |
| AUTH-TC-041 | Expired to Authenticated by logging in again [REQ-001, REQ-003] [OQ-09] | user1 token expired (see AUTH-TC-018) and UI is on the Login screen | 1. Login again with valid credentials<br>2. Click My Tickets | user1@helpdesk.test / User@1234 | New token issued; My Tickets loads (200); the old expired token still returns 401 | P2 |
| AUTH-TC-042 | Role switch in the same browser leaves no residual session data [REQ-002] | Same browser used throughout | 1. Login as user1, open My Tickets, log out (or clear session via Logout)<br>2. Login as agent1<br>3. Inspect screen and browser storage | user1@helpdesk.test / User@1234 then agent1@helpdesk.test / Agent@1234 | Agent Dashboard shown with agent navigation only; no user1 data or token remains; token in storage belongs to agent1 | P2 |

## 10. Database Test Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-043 | Seed data contains at least one active User and one active Agent [REQ-001] [A-08] | Fresh DB seeded | 1. Run: SELECT email, role, is_active FROM users | Expected rows (Provisional seed data): user1, user2, agent1, agent2 (active), inactive.user (inactive) | At least one row with role USER and one with role AGENT, both is_active = true; no Admin role present | P1 |
| AUTH-TC-044 | Passwords are stored as adaptive salted hashes, not plain text [REQ-060] | Seed data loaded | 1. Run: SELECT email, password_hash FROM users WHERE email = 'user1@helpdesk.test'<br>2. Compare the value with the known password | Known password: User@1234 | password_hash is not equal to User@1234; value matches an adaptive hash format (for example prefix $2a$/$2b$ for bcrypt or $argon2 for Argon2); column not empty | P1 |
| AUTH-TC-045 | Same password yields different hashes (salt) [REQ-060] | Seed data loaded | 1. Run: SELECT email, password_hash FROM users WHERE email IN ('user1@helpdesk.test','user2@helpdesk.test') (both use User@1234) | user1 and user2 share password User@1234 (Provisional) | The two password_hash values are different | P2 |
| AUTH-TC-046 | Duplicate email is rejected by the database [REQ-001] [OQ-09] | Test DB access; (proposed unique constraint) | 1. Run: INSERT INTO users (name, email, password_hash, role, is_active) VALUES ('Dup', 'user1@helpdesk.test', 'x', 'USER', true) | Duplicate email: user1@helpdesk.test | Insert fails with a unique-constraint violation; row count for that email remains 1 | P2 |
| AUTH-TC-047 | Role value outside USER/AGENT is rejected by the database [REQ-002] | Test DB access | 1. Run: INSERT INTO users (name, email, password_hash, role, is_active) VALUES ('Adm', 'admin@helpdesk.test', 'x', 'ADMIN', true) | role: ADMIN | Insert fails with a constraint violation; no row created | P3 |

## 11. Security Test Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-048 | SQL injection in login fields does not bypass authentication [REQ-060] | Seed data loaded | 1. Send POST /api/auth/login with payload A<br>2. Send with payload B<br>3. On the Login screen type payload A values and click Login | A: {"email":"' OR '1'='1","password":"' OR '1'='1"}<br>B: {"email":"user1@helpdesk.test' --","password":"x"} | Each returns 400 (invalid email format) or 401; never 200; never 500; no SQL error text in the response; users table unchanged | P1 |
| AUTH-TC-049 | Tampering with the role claim in the token is rejected [REQ-002, REQ-060] | user1 token (JWT) available; if the token is opaque, mark case N/A | 1. Login as user1 and copy the token<br>2. Decode the payload, change role from USER to AGENT, re-encode without re-signing<br>3. Send GET /api/tickets with the modified token<br>4. Send PUT /api/tickets/1/assign with the modified token | user1@helpdesk.test / User@1234 | Both requests return 401 (signature invalid); no agent privileges gained; ticket 1 not assigned | P1 |
| AUTH-TC-050 | No password, password hash or secret in any API response [REQ-060] | Seed data loaded | 1. Login as user1 and capture the response<br>2. Call GET /api/tickets and any endpoint returning user data (for example ticket details showing the creator)<br>3. Trigger a 401 and a 400 error and capture bodies<br>4. Search all captured bodies for the strings password, password_hash, $2a$, $2b$, $argon2, User@1234 | user1@helpdesk.test / User@1234 | None of the searched strings appear in any response body or header | P1 |
| AUTH-TC-051 | Credentials are not exposed in URLs or server logs [REQ-060] | Access to application/server logs | 1. Login via the UI as user1<br>2. Review the browser address bar and network request URL<br>3. Search the application/server logs generated by the login for the password value and the token value | user1@helpdesk.test / User@1234 | Login is a POST with credentials in the body only; address bar and request URL contain no email/password; logs do not contain the password or full token | P2 |
| AUTH-TC-052 | Unknown email and wrong password responses are indistinguishable [REQ-060] | Seed data loaded | 1. Send POST /api/auth/login with an existing email and wrong password; save the full response (status, headers except Date, body)<br>2. Send with a non-existent email; save the response<br>3. Diff the two responses | Request 1: {"email":"user1@helpdesk.test","password":"Wrong@9999"}<br>Request 2: {"email":"ghost@helpdesk.test","password":"Wrong@9999"} | Status, error code, message and body structure are identical; no field reveals email existence | P1 |
| AUTH-TC-053 | Repeated failed logins: lockout or throttling behaviour recorded [REQ-060] [OQ-09] | Seed data loaded; clarification of OQ-09 pending | 1. Send POST /api/auth/login 10 times for user2 with a wrong password<br>2. Send POST /api/auth/login for user2 with the correct password | user2@helpdesk.test; wrong: Wrong@9999; correct: User@1234 | Not specified by the client (OQ-09). Provisional: no lockout, step 2 returns 200. Record the actual behaviour; update expected result once OQ-09 is answered | P4 |

## 12. Error Handling

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-054 | Server failure during login returns a generic 500 without internal details [REQ-060] [OQ-26] | Ability to stop the database or force a server fault in a test environment | 1. Stop the database service<br>2. Send POST /api/auth/login with valid credentials<br>3. Open the Login screen, submit valid credentials and observe the UI<br>4. Restart the database | user1@helpdesk.test / User@1234 | API returns 500 with generic message; body contains no stack trace, SQL, host names or credentials; UI shows a user-friendly error banner and does not crash or redirect | P2 |

## 13. Edge Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-TC-055 | Double-click on Login submits a single login [REQ-001] | On the Login screen; developer tools network tab open | 1. Enter valid credentials<br>2. Double-click the Login button quickly | user1@helpdesk.test / User@1234 | Only one POST /api/auth/login is sent (button disabled or request deduplicated); one redirect to the User Dashboard; no duplicate error banner | P3 |
| AUTH-TC-056 | Non-ASCII email input is handled safely [REQ-001, REQ-060] | API reachable | 1. Send POST /api/auth/login | {"email":"üser1@helpdesk.test","password":"User@1234"} | 400 (invalid format) or 401; never 500; no token | P4 |

---

## Coverage Summary

| REQ | Covered by |
|---|---|
| REQ-001 | AUTH-TC-001, 002, 004, 005, 006, 007, 009 to 016, 019 to 023, 032 to 034, 036, 037, 041, 043, 046, 053, 055, 056 |
| REQ-002 | AUTH-TC-004, 028 to 031, 042, 047, 049 |
| REQ-003 | AUTH-TC-003, 005, 008, 017, 018, 024 to 027, 035, 037 to 041 |
| REQ-060 | AUTH-TC-005, 006, 016, 020, 021, 032, 044, 045, 048 to 054, 056 |

| Acceptance criterion | Covered by |
|---|---|
| AUTH-AC-01 | AUTH-TC-001, 019, 032 |
| AUTH-AC-02 | AUTH-TC-002, 019 |
| AUTH-AC-03 | AUTH-TC-005, 006, 020, 021, 052 |
| AUTH-AC-04 | AUTH-TC-007, 009, 023 |
| AUTH-AC-05 | AUTH-TC-010, 014, 015 |
| AUTH-AC-06 | AUTH-TC-005 |
| AUTH-AC-07 | AUTH-TC-024, 035 |
| AUTH-AC-08 | AUTH-TC-025, 049 |
| AUTH-AC-09 | AUTH-TC-017, 018, 026 |
| AUTH-AC-10 | AUTH-TC-028, 031 |
| AUTH-AC-11 | AUTH-TC-029, 030 |
| AUTH-AC-12 | AUTH-TC-008, 038 |
| AUTH-AC-13 | AUTH-TC-004, 049 |
| AUTH-AC-14 | AUTH-TC-044, 045 |
| AUTH-AC-15 | AUTH-TC-032, 050, 051 |
| AUTH-AC-16 | AUTH-TC-048 |
| AUTH-AC-17 | AUTH-TC-043, 046, 047 |
| AUTH-AC-18 | AUTH-TC-022, 027 |
| AUTH-AC-19 | AUTH-TC-039, 040 |
| AUTH-AC-20 | AUTH-TC-033, 034, 054 |
| AUTH-AC-21 | AUTH-TC-011, 012, 013 |
| AUTH-AC-22 | AUTH-TC-053 |
