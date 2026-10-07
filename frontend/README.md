# Help Desk — Frontend

React 19 + Vite + React Router. Plain CSS (design tokens in `src/styles/global.css`). Icons: `lucide-react`.

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

## Mock backend
The real backend does not exist yet, so `src/services/*` implements the API contract from `requirement.md` §12 on top of a localStorage "database" (`services/mockDb.js`). It enforces the business rules (validation, role checks, status transitions, closed-ticket lock, history). To connect a real API, replace the function bodies in `src/services` — components do not change. Reset demo data by clearing the `helpdesk.mockdb.v1` and `helpdesk.session` localStorage keys.

Provisional seed accounts (OQ-08): `user1@helpdesk.test` / `User@1234`, `user2@helpdesk.test`, `agent1@helpdesk.test` / `Agent@1234`, `agent2@helpdesk.test`. The Login screen has buttons that fill them in.

## Structure
```
src/
  components/{common,navigation,tickets}   reusable UI (Button, Modal, Field, Pagination, TicketTable, …)
  context/      Auth + Toast providers
  hooks/        useAsync, useDebounce, useDocumentTitle
  layouts/      AppLayout (sidebar/drawer), AuthLayout
  pages/        Login, Dashboard, Tickets, CreateTicket, TicketDetails, UpdateTicket, error pages
  services/     API-shaped functions + mock database
  styles/       global (tokens), components, layout (responsive rules)
  utils/        constants, validators, workflow (allowed actions), formatting
```

## Choices to confirm
- JavaScript (not TypeScript) – `plan.md` proposed TypeScript; changed on request (`App.jsx`/`main.jsx` structure).
- Provisional limits (subject 150, description 5000, comment 2000, attachment 5 MB png/jpg/pdf/txt, page size 10) live in `src/utils/constants.js`.
- Ticket **delete** is not implemented (OQ-04 unresolved); ticket **edit** is limited to the owner while Open (A-07, OQ-03).
- Attachment download is a placeholder (metadata only) until the backend stores files.
- Agent reassignment, reopen and notifications are out of scope (requirement.md §18).
