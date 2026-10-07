# Help Desk — Backend API

Flask + SQLAlchemy (Flask-SQLAlchemy) + SQLite, JWT bearer authentication. Implements `requirement.md` §12 and the module specifications.

## Run
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py            # demo users, categories, 10 sample tickets (add --reset to recreate the database)
python run.py             # http://127.0.0.1:5000  (health check: GET /api/health)
```
The SQLite file `helpdesk.db` is created next to `run.py`; attachments are stored in `uploads/`. Optional settings (see `.env.example`) are read from environment variables: `SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, `TOKEN_TTL_MINUTES`, `UPLOAD_DIR`.

Run the frontend against it: `cd ../frontend && npm install && npm run dev` (it uses `http://localhost:5000/api` by default; override with `VITE_API_URL`).

## Seed accounts (provisional – OQ-08)
| Role | Email | Password |
|---|---|---|
| User | `user1@helpdesk.test`, `user2@helpdesk.test` | `User@1234` |
| Support Agent | `agent1@helpdesk.test`, `agent2@helpdesk.test` | `Agent@1234` |

Change these before any real deployment.

## Authentication
`POST /api/auth/login` → `{ "token": "<JWT>", "user": {...} }`. Send `Authorization: Bearer <token>` on every other request. Tokens are HS256, expire after 60 minutes (`TOKEN_TTL_MINUTES`) and carry only the user id; the user's role and active flag are re-read from the database on each request. Passwords are hashed (Werkzeug scrypt). Login failures always return the same message.

## Endpoints
| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | Log in |
| GET | `/api/auth/me` | any | Current user |
| POST | `/api/auth/logout` | any | Returns 204 (client discards the token) |
| GET | `/api/categories` | any | Active categories |
| GET | `/api/tickets` | any (User: own, Agent: all) | List. Query: `page`, `pageSize` (1–100, default 10), `search` (subject or ticket number), `status`, `priority`, `categoryId`, `sort` = `createdAt\|priority\|status\|ticketNumber` + `:asc\|:desc` |
| POST | `/api/tickets` | User | Create. JSON, or `multipart/form-data` with optional `attachment` (png/jpg/jpeg/pdf/txt, ≤ 5 MB) |
| GET | `/api/tickets/{id}` | owner / Agent | Details (+ `allowedActions`) |
| PUT | `/api/tickets/{id}` | owner, while Open | Edit subject, description, categoryId, priority |
| PUT | `/api/tickets/{id}/assign` | Agent | Assign to the calling agent (Open → Assigned) |
| PUT | `/api/tickets/{id}/status` | see rules | Body `{"status": "In Progress" \| "Resolved" \| "Closed"}` |
| GET | `/api/tickets/{id}/history` | owner / Agent | Status history, oldest first |
| GET | `/api/tickets/{id}/attachments/{attachmentId}` | owner / Agent | Download |
| GET | `/api/tickets/{id}/comments` | owner / Agent | Comments, oldest first |
| POST | `/api/tickets/{id}/comments` | owner / Agent | Body `{"body": "..."}` |
| GET | `/api/dashboard` | any | Counts + 5 recent tickets (Agent: all tickets, User: own) |

Not implemented: `DELETE /api/tickets/{id}` (OQ-04 – rules unknown; returns 405).

### Business rules enforced
Subject required (≤150 chars); description ≥ 10 chars (≤5000); priority one of Low/Medium/High/Critical; category must exist. Only agents assign; only agents resolve; flow is strictly `Open → Assigned → In Progress → Resolved → Closed` (no skips, no going back, `Open → Closed` rejected); only the assigned agent moves a ticket forward; only the owner closes a Resolved ticket; Closed tickets reject edits, assignment, status changes and new comments; every status change (including assignment) is written to `ticket_history` in the same transaction as the ticket update. Working assumptions and provisional limits are listed in `requirement.md` §16 and `app/config.py`.

### Error format
```json
{ "status": 400, "error": "VALIDATION_ERROR", "message": "Validation failed.", "details": [{ "field": "subject", "message": "Subject is required." }] }
```
Codes: 400 validation, 401 missing/invalid token or bad login, 403 role not allowed, 404 not found (also used when a User asks for someone else's ticket), 409 invalid transition / closed ticket, 500 unexpected.

## Database
`users`, `categories`, `tickets`, `comments`, `ticket_history`, `attachments` (SQLAlchemy models in `app/models.py`; foreign keys and CHECK constraints are enforced; SQLite foreign keys are switched on per connection). Tables are created automatically on start (`db.create_all()`); a migration tool is a TODO.

## Test
```bash
cd backend && python -m pytest          # 105 API tests, in-memory database, ~5 s
```
Postman: import `postman/helpdesk.postman_collection.json`, run **1 Auth → Login as User/Agent** (the token is saved to a collection variable), then the other folders in order. Or with curl:
```bash
TOKEN=$(curl -s localhost:5000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"agent1@helpdesk.test","password":"Agent@1234"}' | python -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s localhost:5000/api/dashboard -H "Authorization: Bearer $TOKEN"
```

## Layout
```
app/__init__.py   app factory, CORS, FK pragma      app/models.py      SQLAlchemy models
app/config.py     settings + business limits        app/auth.py        JWT + login_required / role_required
app/errors.py     error contract + handlers         app/workflow.py    transition rules + allowedActions
app/validation.py field validators                  app/access.py      ownership check, status change + history
app/routes/       auth, categories, tickets, workflow, comments, dashboard blueprints
seed.py  run.py  tests/  postman/
```
