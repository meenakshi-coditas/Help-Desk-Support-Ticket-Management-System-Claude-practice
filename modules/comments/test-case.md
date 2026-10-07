# Test Cases — Comments Module (`CMT`)

This document contains the manual/API test cases for the `comments` module (REQ-040 add comment, REQ-041 list comments and display on Ticket Details), derived from `modules/comments/specification.md` and `requirement.md`. Cases that depend on a provisional value or an open question are tagged in the Test Scenario column (for example `[OQ-23]`); their expected results must be re-confirmed once the client answers.

## Legend

- **Priority:** P1 = critical / smoke, P2 = high, P3 = medium, P4 = low.
- **Techniques used:** positive and negative testing, equivalence partitioning (EP), boundary value analysis (BVA), decision table, state-based testing, role/permission testing, API testing, UI-to-API integration, database verification, security testing, error handling, edge cases.
- **Provisional values used:** comment body max length 2000 (OQ-01); oldest-first ordering; 201/200/403/404/409/400 status codes (OQ-26, OQ-27, OQ-23); UI message texts.
- **Expected-result notation:** "403/404" means 403 per the provisional contract, or 404 if OQ-27 is resolved that way. "409" means 409 or the code chosen under OQ-26.

## Test Environment and Provisional Seed Data

All accounts and tickets below are **Provisional seed data** (A-08, A-11, OQ-09); reset the database to this state before each full run. `{baseUrl}` is the application URL; API tool: Postman or curl. Obtain tokens with `POST {baseUrl}/api/auth/login` using email and password (A-11). `ID-1001` means the internal ticket id of ticket number `#1001` (A-09), obtained from `GET /api/tickets`.

Accounts:
- `user1@helpdesk.test` / `Password@123` — role User, name "User One"
- `user2@helpdesk.test` / `Password@123` — role User, name "User Two"
- `agent1@helpdesk.test` / `Password@123` — role Support Agent, name "Agent One"

Tickets:
- `#1001` owner user1, status Open (unassigned), no comments
- `#1002` owner user1, status Assigned (agent1), no comments
- `#1003` owner user1, status In Progress (agent1), no comments
- `#1004` owner user1, status Resolved (agent1), no comments
- `#1005` owner user1, status Closed, 2 existing comments (one by user1, one by agent1)
- `#1006` owner user2, status Open, no comments
- `#1007` owner user1, status Open, no comments (reserved for empty-state checks; never comment on it)
- `#1008` owner user1, status Open, 120 comments (seeded by script, bodies "Seed comment 001" to "Seed comment 120", created in that order)
- `#1009` owner user1, status Resolved (agent1), no comments (consumed by CMT-TC-031)
- `#1010` owner user2, status Closed, 1 existing comment

Token notation: `T-user1`, `T-user2`, `T-agent1`. Request header for every API call: `Authorization: Bearer <token>`, `Content-Type: application/json`. Text of 2000 characters is generated with `python3 -c "print('A'*2000)"`.

## Decision Table — Add Comment and List Comments (role x ownership x ticket status)

Expected outcome per combination (Provisional where Closed is involved — OQ-23; 403/404 per OQ-27; 409 per OQ-26). Legend: Allowed = 201 (add) or 200 (list); Blocked-perm = 403/404; Blocked-state = 409.

| Role | Ticket ownership | Ticket status | Add comment | List comments |
|---|---|---|---|---|
| User | Own | Open | Allowed | Allowed |
| User | Own | Assigned | Allowed | Allowed |
| User | Own | In Progress | Allowed | Allowed |
| User | Own | Resolved | Allowed | Allowed |
| User | Own | Closed | Blocked-state (409) | Allowed |
| User | Not own | Open / Assigned / In Progress / Resolved | Blocked-perm | Blocked-perm |
| User | Not own | Closed | Blocked-perm (not 409) | Blocked-perm |
| Agent | Any (not applicable) | Open | Allowed | Allowed |
| Agent | Any (not applicable) | Assigned | Allowed | Allowed |
| Agent | Any (not applicable) | In Progress | Allowed | Allowed |
| Agent | Any (not applicable) | Resolved | Allowed | Allowed |
| Agent | Any (not applicable) | Closed | Blocked-state (409) | Allowed |

Cases derived from the table are in the "Decision Table" and "State-Dependent" sections (CMT-TC-024 to CMT-TC-031) and complemented by CMT-TC-001 to CMT-TC-003, CMT-TC-011, CMT-TC-012.

---

## Positive Test Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-001 | User adds a comment to own Open ticket via UI [REQ-040] | Logged in as user1; ticket #1001 is Open with no comments | 1. Open My Tickets<br>2. Click ticket #1001 to open Ticket Details<br>3. In the add-comment form type the comment text<br>4. Click "Add Comment" | Comment text: `Printer still shows error E-23 after restart.` | Comment is saved and appears as the last item in the Comments section with author "User One", role User and a timestamp; the text area is cleared; no page error shown | P1 |
| CMT-TC-002 | Agent adds a comment to an Assigned ticket via UI [REQ-040] | Logged in as agent1; ticket #1002 is Assigned to agent1 | 1. Open All Tickets<br>2. Click ticket #1002<br>3. Type the comment text in the add-comment form<br>4. Click "Add Comment" | Comment text: `Please send a screenshot of the error.` | Comment appears in the list with author "Agent One", role Support Agent and a timestamp; form is cleared | P1 |
| CMT-TC-003 | Agent adds a comment to an unassigned Open ticket owned by another user [REQ-040] [OQ-17] | Logged in as agent1; ticket #1001 is Open and unassigned (owner user1) | 1. Open All Tickets<br>2. Click ticket #1001<br>3. Type the comment text<br>4. Click "Add Comment" | Comment text: `I will review this ticket shortly.` | Comment is saved and displayed with author "Agent One"; agent is allowed to comment on all tickets (A-05) | P2 |
| CMT-TC-004 | Each comment shows author name, role and timestamp in local time [REQ-041] | Logged in as user1; ticket #1005 (Closed) has 2 seeded comments | 1. Open My Tickets and click ticket #1005<br>2. Read the Comments section<br>3. Compare each item with the seeded author and creation time in the database | Seeded authors: user1 ("User One", User) and agent1 ("Agent One", Support Agent) | Every comment shows author name, author role, timestamp and body; timestamps equal the stored UTC value converted to the browser time zone (A-12) | P2 |
| CMT-TC-005 | Comments are listed in chronological order, oldest first [REQ-041] [Provisional ordering] | Ticket #1002 has no comments; users user1 and agent1 available in two browser sessions | 1. As user1 add comment "First comment" to #1002<br>2. As agent1 add comment "Second comment" to #1002<br>3. As user1 add comment "Third comment" to #1002<br>4. Reload Ticket Details of #1002 as user1 | Comments: `First comment`, `Second comment`, `Third comment` | Comments are displayed in the order First, Second, Third (oldest at top, newest at bottom) and the order is unchanged after reload | P2 |
| CMT-TC-006 | Leading and trailing whitespace is trimmed on save [REQ-040] [A-15] [OQ-22] | Logged in as user1; ticket #1003 open in Ticket Details | 1. Type the comment text including the surrounding spaces<br>2. Click "Add Comment"<br>3. Inspect the displayed comment and the stored `body` in the database | Comment text: three spaces, `Need update please`, three spaces | Comment is saved; displayed and stored body equals `Need update please` with no surrounding spaces | P2 |
| CMT-TC-007 | Empty state is shown when the ticket has no comments [REQ-041] | Logged in as user1; ticket #1007 has no comments | 1. Open My Tickets and click ticket #1007<br>2. Observe the Comments section | None | Comments section shows an empty-state message (for example "No comments yet"), not a blank area or an error; the add-comment form is available | P3 |

## Negative Test Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-008 | UI rejects an empty comment [REQ-040] | Logged in as user1; Ticket Details of #1001 open; note comment count | 1. Leave the add-comment text area empty<br>2. Click "Add Comment" | Comment text: (empty) | Inline error "Comment is required" is shown; no request creating a comment succeeds; comment count unchanged | P1 |
| CMT-TC-009 | UI rejects a whitespace-only comment [REQ-040] [A-15] | Logged in as user1; Ticket Details of #1001 open; note comment count | 1. Type only spaces in the text area<br>2. Click "Add Comment" | Comment text: five space characters | Inline error "Comment is required" is shown; nothing is saved; comment count unchanged | P2 |
| CMT-TC-010 | UI offers no add-comment form on a Closed ticket for the owner [REQ-040] [OQ-23] [Provisional] | Logged in as user1; ticket #1005 is Closed | 1. Open My Tickets and click ticket #1005<br>2. Observe the Comments section and the area below it | None | Existing 2 comments remain visible; the add-comment form is hidden or disabled and an informational message states that the ticket is closed | P1 |
| CMT-TC-011 | API rejects a comment on a Closed ticket [REQ-040] [OQ-23] [OQ-26] [Provisional] | Token T-user1 available; ticket #1005 Closed with 2 comments | 1. Send POST {baseUrl}/api/tickets/ID-1005/comments with T-user1<br>2. Send GET {baseUrl}/api/tickets/ID-1005/comments with T-user1 and count items | Body: `{"body":"Can I add one more note?"}` | POST returns 409 with `error` TICKET_CLOSED and a message naming the closed state; GET still returns exactly 2 comments; no row inserted | P1 |
| CMT-TC-012 | API rejects a comment from a User on another user's ticket [REQ-040] [REQ-002] [OQ-27] | Token T-user2 available; ticket #1001 owned by user1 | 1. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user2<br>2. Query database for comments of ticket #1001 containing the text | Body: `{"body":"I should not be able to post this."}` | Response is 403 (or 404 per OQ-27) with the error contract; no row is inserted | P1 |
| CMT-TC-013 | API rejects an add-comment request without a token [REQ-040] [REQ-003] | None | 1. Send POST {baseUrl}/api/tickets/ID-1001/comments with no Authorization header | Body: `{"body":"No token comment"}` | Response is 401 with `error` UNAUTHORIZED; no row inserted | P1 |
| CMT-TC-014 | API returns 404 when adding a comment to a non-existent ticket [REQ-040] | Token T-agent1 available; ticket id 999999 does not exist | 1. Send POST {baseUrl}/api/tickets/999999/comments with T-agent1 | Body: `{"body":"Comment for missing ticket"}` | Response is 404 with `error` NOT_FOUND; no row inserted | P2 |
| CMT-TC-015 | API rejects a request with the body field missing [REQ-040] | Token T-user1 available; ticket #1001 Open | 1. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1 and an empty JSON object | Body: `{}` | Response is 400 (or 422 per OQ-26) with `error` VALIDATION_ERROR and a `details` entry for field `body`; no row inserted | P2 |

## Validation / Equivalence Partitioning

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-016 | Valid class — special characters are stored and shown literally [REQ-040] [REQ-060] | Logged in as user1; Ticket Details of #1002 open | 1. Type the comment text<br>2. Click "Add Comment"<br>3. Compare displayed text with the input | Comment text: `Cost = $50 & tax 5% (see "FAQ #2"): a/b, c\d; e@f! ~^*_-+=[]{}?` | Comment is saved; displayed text equals the input exactly, with no characters lost or altered | P3 |
| CMT-TC-017 | Invalid class — body containing only line breaks and tabs is rejected [REQ-040] [A-15] | Token T-user1 available; ticket #1001 Open | 1. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1 and the JSON body below | Body: `{"body":"\n\t\n  \t"}` (JSON escapes for newline and tab) | Response is 400 with `error` VALIDATION_ERROR and a `details` entry for `body`; no row inserted | P2 |

## Boundary Value Analysis (body length, Provisional max 2000 — OQ-01)

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-018 | Body length 0 (empty string) is rejected by the API [REQ-040] [OQ-01] [OQ-26] | Token T-user1 available; ticket #1001 Open | 1. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1 | Body: `{"body":""}` | Response is 400 (or 422) in the error contract format: `status`, `error` VALIDATION_ERROR, `message`, `details` with field `body`; no row inserted | P1 |
| CMT-TC-019 | Body length 1 (minimum) is accepted [REQ-040] [OQ-01] | Token T-user1 available; ticket #1001 Open | 1. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1 | Body: `{"body":"a"}` | Response is 201; returned `body` equals `a`; one new row inserted | P2 |
| CMT-TC-020 | Body length 2000 (maximum) is accepted [REQ-040] [OQ-01] [Provisional] | Token T-user1 available; ticket #1001 Open | 1. Generate 2000 "A" characters<br>2. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1<br>3. Check stored body length in the database | Body: JSON with `body` = 2000 characters of `A` | Response is 201; stored body length is exactly 2000; value unchanged | P1 |
| CMT-TC-021 | Body length 2001 (maximum + 1) is rejected [REQ-040] [OQ-01] [Provisional] | Token T-user1 available; ticket #1001 Open; note comment count | 1. Generate 2001 "A" characters<br>2. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1<br>3. Check comment count | Body: JSON with `body` = 2001 characters of `A` | Response is 400 (or 422) with `details` for field `body` stating the 2000-character limit; comment count unchanged | P1 |
| CMT-TC-022 | 2000 characters plus trailing spaces is accepted because trimming happens before the length check [REQ-040] [A-15] [OQ-01] | Token T-user1 available; ticket #1001 Open | 1. Build a body of 2000 "A" characters followed by 5 spaces<br>2. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1<br>3. Check stored body length | Body: JSON with `body` = 2000 `A` + 5 spaces | Response is 201; stored body is the 2000 "A" characters without spaces | P3 |
| CMT-TC-023 | UI blocks a comment of 2001 characters [REQ-040] [OQ-01] [Provisional] | Logged in as user1; Ticket Details of #1001 open; note comment count | 1. Paste 2001 "A" characters into the text area<br>2. Click "Add Comment" | Comment text: 2001 characters of `A` | Inline error "Comment must not exceed 2000 characters" is shown (or input is limited to 2000 characters — UI behaviour TBD); no comment of 2001 characters is saved; comment count unchanged | P2 |

## Decision Table Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-024 | Decision table: User, own ticket, Resolved, add comment is allowed [REQ-040] | Token T-user1 available; ticket #1004 is Resolved and owned by user1 | 1. Send POST {baseUrl}/api/tickets/ID-1004/comments with T-user1 | Body: `{"body":"Thanks, the issue is fixed."}` | Response is 201; comment returned with author user1; ticket status remains Resolved | P1 |
| CMT-TC-025 | Decision table: User, not own ticket, Open, list comments is blocked [REQ-041] [REQ-002] [OQ-27] | Token T-user2 available; ticket #1001 owned by user1 | 1. Send GET {baseUrl}/api/tickets/ID-1001/comments with T-user2 | None | Response is 403 (or 404 per OQ-27) in the error contract format; no comment data in the response | P1 |
| CMT-TC-026 | Decision table: Agent, Closed ticket, add comment is blocked [REQ-040] [OQ-23] [OQ-26] [Provisional] | Token T-agent1 available; ticket #1005 is Closed | 1. Send POST {baseUrl}/api/tickets/ID-1005/comments with T-agent1<br>2. Count comments of #1005 | Body: `{"body":"Agent note on closed ticket"}` | Response is 409 with `error` TICKET_CLOSED; comment count of #1005 remains 2 | P1 |
| CMT-TC-027 | Decision table: Closed ticket comments can be listed by the owner and by an Agent [REQ-041] [OQ-23] [Provisional] | Tokens T-user1 and T-agent1 available; ticket #1005 Closed with 2 comments | 1. Send GET {baseUrl}/api/tickets/ID-1005/comments with T-user1<br>2. Send GET {baseUrl}/api/tickets/ID-1005/comments with T-agent1 | None | Both responses are 200 and contain the same 2 comments in oldest-first order | P2 |
| CMT-TC-028 | Decision table: non-owner User on a Closed ticket receives a permission error, not the state error [REQ-040] [REQ-002] [OQ-23] [OQ-27] | Token T-user1 available; ticket #1010 is Closed and owned by user2 | 1. Send POST {baseUrl}/api/tickets/ID-1010/comments with T-user1 | Body: `{"body":"Trying a closed foreign ticket"}` | Response is 403 (or 404 per OQ-27), not 409; no row inserted | P2 |

## State-Dependent Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-029 | Comment is allowed on an In Progress ticket by the owner [REQ-040] | Token T-user1 available; ticket #1003 is In Progress | 1. Send POST {baseUrl}/api/tickets/ID-1003/comments with T-user1 | Body: `{"body":"Any update on this ticket?"}` | Response is 201; comment stored; ticket status unchanged (In Progress) | P2 |
| CMT-TC-030 | Comment is allowed on a Resolved ticket by an Agent [REQ-040] | Token T-agent1 available; ticket #1004 is Resolved | 1. Send POST {baseUrl}/api/tickets/ID-1004/comments with T-agent1 | Body: `{"body":"Marking as resolved, please confirm."}` | Response is 201; comment stored with author agent1; ticket status unchanged (Resolved) | P2 |
| CMT-TC-031 | Comment is allowed on a Resolved ticket and blocked after the owner closes it [REQ-040] [REQ-036] [OQ-23] [Provisional] | Logged in as user1 in browser A and as agent1 in browser B; ticket #1009 is Resolved | 1. In browser B open Ticket Details of #1009 and keep the form open without submitting<br>2. In browser A add comment "Closing now" to #1009 (expect success)<br>3. In browser A close the ticket (Resolved to Closed) using the Close action<br>4. In browser B type "Late comment" and click "Add Comment" | Comments: `Closing now`, `Late comment` | Step 2 succeeds; in step 4 the request is rejected with 409, a message is shown and the typed text is kept; "Late comment" is not stored; after reload the add-comment form is no longer available | P1 |

## Role / Permission Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-032 | User cannot open another user's ticket and see its comments via URL [REQ-041] [REQ-002] [OQ-27] | Logged in as user2; ticket #1005 (owned by user1) has 2 comments | 1. Note the Ticket Details URL of #1005 (open it first as user1 if needed)<br>2. As user2 paste that URL in the browser address bar | URL: `{baseUrl}/tickets/ID-1005` (route format Provisional) | Access-denied or not-found page is shown; no comments, ticket data or add-comment form of #1005 are displayed | P1 |
| CMT-TC-033 | No edit or delete controls exist on comments [REQ-040] [A-06] | Logged in as user1 and then as agent1; ticket #1005 has comments by both | 1. As user1 open Ticket Details of #1005 and inspect every comment item including own comment<br>2. Repeat as agent1 on a ticket with comments (#1008) | None | No edit, delete or similar control is present on any comment for either role | P2 |
| CMT-TC-034 | Update and delete endpoints for comments do not exist and change nothing [REQ-040] [A-06] | Token T-user1 available; ticket #1005 has comments; take the id `C` of the first comment from GET /api/tickets/ID-1005/comments | 1. Send PUT {baseUrl}/api/tickets/ID-1005/comments/C with T-user1<br>2. Send DELETE {baseUrl}/api/tickets/ID-1005/comments/C with T-user1<br>3. Send GET {baseUrl}/api/tickets/ID-1005/comments with T-user1 | PUT body: `{"body":"Edited text"}` | PUT and DELETE return 404 or 405; the GET still returns the original 2 comments with unchanged text | P2 |

## API Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-035 | POST success response structure [REQ-040] [OQ-26] | Token T-user1 available; ticket #1001 Open | 1. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1<br>2. Inspect status code, headers and JSON body | Body: `{"body":"Structure check comment"}` | Status 201 (Provisional); JSON contains `id` (number), `ticketId` equal to ID-1001, `author` with `id`, `name` "User One" and `role` USER, `body` "Structure check comment", `createdAt` in ISO 8601 UTC format; Content-Type is application/json | P1 |
| CMT-TC-036 | GET success response structure and order [REQ-041] [OQ-26] | Token T-agent1 available; ticket #1005 has 2 comments | 1. Send GET {baseUrl}/api/tickets/ID-1005/comments with T-agent1<br>2. Inspect status code and each array item | None | Status 200; JSON array of 2 items, each with `id`, `ticketId`, `author` (`id`, `name`, `role`), `body`, `createdAt`; items sorted by `createdAt` ascending (Provisional) | P1 |
| CMT-TC-037 | GET returns an empty list for a ticket without comments [REQ-041] [OQ-26] | Token T-user1 available; ticket #1007 has no comments | 1. Send GET {baseUrl}/api/tickets/ID-1007/comments with T-user1 | None | Status 200 and an empty JSON array `[]` (Provisional) | P2 |
| CMT-TC-038 | GET without a token is rejected [REQ-041] [REQ-003] | None | 1. Send GET {baseUrl}/api/tickets/ID-1005/comments with no Authorization header | None | Status 401 with `error` UNAUTHORIZED; no comment data returned | P1 |
| CMT-TC-039 | GET for a non-existent ticket returns 404 [REQ-041] | Token T-agent1 available | 1. Send GET {baseUrl}/api/tickets/999999/comments with T-agent1 | Ticket id: `999999` | Status 404 with `error` NOT_FOUND in the error contract format | P2 |
| CMT-TC-040 | API responses do not expose sensitive author data [REQ-041] [REQ-060] [Provisional field set] | Token T-user1 available; ticket #1005 has comments | 1. Send GET {baseUrl}/api/tickets/ID-1005/comments with T-user1<br>2. Search the raw response text for forbidden terms | Search terms: `password`, `hash`, `user1@helpdesk.test`, `agent1@helpdesk.test` | Response contains no password or hash fields and no e-mail addresses; author data limited to id, name, role (OQ-36) | P2 |

## Integration (UI to API)

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-041 | UI submission produces the API call and the stored row end to end [REQ-040] [REQ-041] [REQ-062] | Logged in as user1; ticket #1001 Open; browser developer tools open on the Network tab; database access available | 1. Open Ticket Details of #1001<br>2. Submit the comment text<br>3. Inspect the network request and response<br>4. Query the `comments` table for the newest row of ticket #1001 | Comment text: `E2E integration comment 01` | One POST to /api/tickets/ID-1001/comments with JSON body containing only `body`; response 201; the database row has the same body, `ticket_id` ID-1001, `user_id` of user1; the UI list shows the comment without manual reload | P1 |
| CMT-TC-042 | A comment posted by the User is visible to the Agent and vice versa [REQ-040] [REQ-041] | user1 in browser A and agent1 in browser B; ticket #1002 Assigned | 1. In browser A (user1) add comment "User question" to #1002<br>2. In browser B (agent1) open Ticket Details of #1002 (or reload it)<br>3. In browser B add comment "Agent answer"<br>4. In browser A reload Ticket Details of #1002 | Comments: `User question`, `Agent answer` | Browser B shows "User question" with author User One; browser A shows both comments in order with correct authors and roles | P1 |
| CMT-TC-043 | Expired session on submit redirects to Login [REQ-040] [REQ-003] | Logged in as user1 with Ticket Details of #1001 open; the token is then invalidated (expire it, or delete it from browser storage) | 1. Type a comment in the form<br>2. Click "Add Comment" | Comment text: `Comment after expiry` | API returns 401; UI redirects to the Login screen; comment is not stored | P2 |

## Database Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-044 | A saved comment row contains all expected fields [REQ-040] [REQ-062] | Database access; ticket #1002 Assigned | 1. Note the current UTC time<br>2. As agent1 add a comment to #1002 via API<br>3. Query the newest `comments` row for the ticket | Body: `{"body":"  DB row check  "}` | Row has auto-generated `id`, `ticket_id` = ID-1002, `user_id` = id of agent1, `body` = `DB row check` (trimmed), `created_at` within 5 seconds of the noted UTC time; no NULL in required columns | P1 |
| CMT-TC-045 | Foreign key on ticket_id rejects a comment for a non-existent ticket [REQ-062] | Direct database access with insert rights (test environment only) | 1. Execute an INSERT into `comments` with `ticket_id` = 999999, a valid `user_id` of user1, body and created_at | Values: ticket_id 999999, user_id id of user1, body `fk test` | Database rejects the insert with a foreign key violation; no row is created | P2 |
| CMT-TC-046 | Foreign key on user_id rejects a comment by a non-existent user [REQ-062] | Direct database access with insert rights (test environment only) | 1. Execute an INSERT into `comments` with a valid `ticket_id` (ID-1001), `user_id` = 999999, body and created_at | Values: ticket_id ID-1001, user_id 999999, body `fk test` | Database rejects the insert with a foreign key violation; no row is created | P2 |

## Security Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-047 | Script tag in a comment is rendered as text (stored XSS) [REQ-040] [REQ-041] [REQ-060] | Logged in as user1 in browser A; agent1 in browser B; ticket #1002 | 1. In browser A add the comment containing the script tag<br>2. Observe the page in browser A<br>3. In browser B open Ticket Details of #1002 and observe the page | Comment text: `<script>alert('xss1')</script>` | No alert dialog appears in either browser; the comment text is displayed literally as typed; page source shows the characters encoded (for example `&lt;script&gt;`) | P1 |
| CMT-TC-048 | HTML attribute and event-handler payloads are rendered as text [REQ-041] [REQ-060] | Logged in as user1; Ticket Details of #1002 open | 1. Add the first comment payload and submit<br>2. Add the second comment payload and submit<br>3. Reload the page and observe | Payload 1: `<img src=x onerror=alert('xss2')>`<br>Payload 2: `"><svg onload=alert('xss3')>` | No dialog appears; no image or SVG element is created in the DOM; both payloads are displayed literally; page layout is intact | P1 |
| CMT-TC-049 | SQL injection string in the body is stored as data [REQ-040] [REQ-060] | Token T-user1 available; ticket #1002; database access | 1. Send POST {baseUrl}/api/tickets/ID-1002/comments with T-user1<br>2. Verify the `comments` table still exists and row count increased by 1<br>3. Send GET {baseUrl}/api/tickets/ID-1002/comments | Body: `{"body":"'; DROP TABLE comments; --"}` | Response is 201; text is returned unchanged by GET; `comments` table intact; no SQL error in any response | P1 |
| CMT-TC-050 | SQL injection in the ticket id path parameter is rejected safely [REQ-041] [REQ-060] | Token T-user1 available | 1. Send GET {baseUrl}/api/tickets/1%20OR%201=1/comments with T-user1<br>2. Send GET {baseUrl}/api/tickets/1';DROP%20TABLE%20comments;--/comments with T-user1 | Path values: `1 OR 1=1` (URL encoded) and `1';DROP TABLE comments;--` (URL encoded) | Both responses are 400 or 404 in the error contract format; no comments of other tickets are returned; no SQL text or stack trace in the response; `comments` table intact | P1 |
| CMT-TC-051 | Author, role, timestamp and ticket id supplied by the client are ignored [REQ-040] [REQ-060] | Token T-user1 available; ticket #1001 Open; agent1 user id known as `A`; database access | 1. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1 and the body below<br>2. Inspect the response<br>3. Query the stored row | Body: `{"body":"Spoof attempt","userId":A,"role":"AGENT","createdAt":"2000-01-01T00:00:00Z","ticketId":ID-1006}` | Response is 201 with author = user1, role USER, `ticketId` = ID-1001 and `createdAt` equal to the current server time (not year 2000); stored row has `user_id` of user1 and the server-generated `created_at`; no row is created for ticket #1006 | P1 |

## Error Handling Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-052 | Malformed JSON body is rejected with a clean error [REQ-040] [REQ-064] | Token T-user1 available; ticket #1001 Open | 1. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1 and the malformed raw body | Raw body: `{"body": "unterminated` | Response is 400 in the error contract format (`status`, `error`, `message`); no stack trace, class names or SQL text; no row inserted | P2 |
| CMT-TC-053 | Server or database failure returns a generic 500 and stores nothing [REQ-040] [REQ-064] [REQ-062] | Test environment where the database connection can be stopped; Token T-user1 available | 1. Stop the database service<br>2. Send POST {baseUrl}/api/tickets/ID-1001/comments with T-user1<br>3. Restart the database service<br>4. Send GET {baseUrl}/api/tickets/ID-1001/comments | Body: `{"body":"Comment during outage"}` | Step 2 returns 500 with a generic message and no stack trace or connection details; after restart the comment "Comment during outage" is not present | P3 |

## Edge Cases

| TC ID | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CMT-TC-054 | Unicode and emoji text is stored and displayed unchanged [REQ-040] [REQ-041] [OQ-01] | Logged in as user1; Ticket Details of #1003 open | 1. Submit the comment text<br>2. Reload the page<br>3. Compare the displayed text and the stored database value with the input | Comment text: `Привет, 你好, مرحبا, नमस्ते 😀🚀 café` | Comment is saved; displayed and stored text are identical to the input with no replacement characters; counting of emoji against the 2000 limit is TBD (OQ-01) | P2 |
| CMT-TC-055 | Multi-line comment keeps its line breaks [REQ-040] [REQ-041] | Logged in as user1; Ticket Details of #1003 open | 1. Type line 1, press Shift+Enter (or Enter in the text area), type line 2, then a blank line, then line 3<br>2. Submit<br>3. Reload and observe | Comment text: `Line 1`, `Line 2`, empty line, `Line 3` | Comment is displayed on separate lines in the same layout, including the blank line; stored body contains the line breaks | P3 |
| CMT-TC-056 | Ticket with 120 comments lists all of them in order [REQ-041] [OQ-34] | Token T-agent1 and agent1 UI session available; ticket #1008 has 120 comments | 1. Send GET {baseUrl}/api/tickets/ID-1008/comments with T-agent1 and count items<br>2. Open Ticket Details of #1008 in the UI and scroll through the Comments section | None | API returns all 120 comments (Provisional: no pagination) from "Seed comment 001" to "Seed comment 120" in order; UI shows all of them in the same order without errors or visible performance problems; if pagination is later defined (OQ-34) this case must be updated | P3 |
| CMT-TC-057 | Rapid double-click on submit creates only one comment [REQ-040] [OQ-37] [Provisional] | Logged in as user1; Ticket Details of #1002 open; note comment count | 1. Type the comment text<br>2. Double-click "Add Comment" quickly (or click twice within 200 ms)<br>3. Reload and count comments with that text | Comment text: `Double click test` | The submit button is disabled after the first click and exactly one comment with that text is stored; no duplicate | P2 |
| CMT-TC-058 | Two users commenting at the same time are both saved with the correct author [REQ-040] [REQ-062] | user1 in browser A and agent1 in browser B on Ticket Details of #1003 | 1. Type "Concurrent from user" in browser A and "Concurrent from agent" in browser B<br>2. Click "Add Comment" in both browsers at the same time (or send both API requests in parallel)<br>3. Reload Ticket Details of #1003 | Comments: `Concurrent from user`, `Concurrent from agent` | Both comments are stored once; each has the correct author and role; ordering is by `created_at` then `id`; no error or lost comment | P2 |

---

## Acceptance Criteria Coverage

- CMT-AC-01: CMT-TC-001, 002, 003, 041
- CMT-AC-02: CMT-TC-002, 003, 030
- CMT-AC-03: CMT-TC-012, 025, 028, 032
- CMT-AC-04: CMT-TC-010, 011, 026, 028, 031
- CMT-AC-05: CMT-TC-008, 009, 015, 017, 018
- CMT-AC-06: CMT-TC-019, 020, 021, 022, 023
- CMT-AC-07: CMT-TC-006, 022
- CMT-AC-08: CMT-TC-004, 005, 036
- CMT-AC-09: CMT-TC-007, 037
- CMT-AC-10: CMT-TC-016, 047, 048, 049, 050
- CMT-AC-11: CMT-TC-033, 034
- CMT-AC-12: CMT-TC-051
- CMT-AC-13: CMT-TC-013, 038, 043
- CMT-AC-14: CMT-TC-014, 039
- CMT-AC-15: CMT-TC-044, 045, 046
- CMT-AC-16: CMT-TC-027
- CMT-AC-17: CMT-TC-018, 052, 053
- CMT-AC-18: CMT-TC-054, 055, 056, 057, 058

Requirement coverage: REQ-040 (CMT-TC-001 to 003, 006 to 023, 026, 029 to 031, 033 to 035, 041 to 044, 047 to 049, 051 to 055, 057, 058); REQ-041 (CMT-TC-004, 005, 007, 025, 027, 032, 036 to 042, 047, 048, 050, 054 to 056); supporting REQ-002, REQ-003, REQ-036, REQ-060, REQ-062, REQ-064 as tagged per case.
