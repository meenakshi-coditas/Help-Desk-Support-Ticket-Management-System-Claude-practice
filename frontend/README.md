# Help Desk — Frontend

React 19 + Vite + React Router. Plain CSS (design tokens in `src/styles/global.css`). Icons: `lucide-react`.

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

## Backend connection
By default the app calls the Flask API at `http://localhost:5000/api` (see `../backend/README.md`; start it with `python seed.py && python run.py`). Override with `VITE_API_URL` (`.env.example`). The token is kept in localStorage.

Run without a backend: `VITE_USE_MOCK=true npm run dev`. This uses `src/services/mock/*` (a localStorage "database" that enforces the same rules). `src/services/{auth,ticket,comment,dashboard}Service.js` pick the implementation; real calls live in `src/services/api/`.

Seed accounts: `user1@helpdesk.test` / `User@1234`, `agent1@helpdesk.test` / `Agent@1234` (the Login screen has buttons that fill them in).

## Structure
```
src/
  components/{common,navigation,tickets}   reusable UI (Button, Modal, Field, Pagination, TicketTable, …)
  context/      Auth + Toast providers
  hooks/        useAsync, useDebounce, useDocumentTitle
  layouts/      AppLayout (sidebar/drawer), AuthLayout
  pages/        Login, Dashboard, Tickets, CreateTicket, TicketDetails, UpdateTicket, error pages
  services/     api/ (fetch calls), mock/ (offline demo), selectors
  styles/       global (tokens), components, layout (responsive rules)
  utils/        constants, validators, workflow (allowed actions), formatting
```

## Choices to confirm
- JavaScript (not TypeScript) – `plan.md` proposed TypeScript; changed on request (`App.jsx`/`main.jsx` structure).
- Provisional limits (subject 150, description 5000, comment 2000, attachment 5 MB png/jpg/pdf/txt, page size 10) live in `src/utils/constants.js`.
- Ticket **delete** is not implemented (OQ-04 unresolved); ticket **edit** is limited to the owner while Open (A-07, OQ-03).
- Attachment download works against the real API only (mock mode shows an error toast).
- Agent reassignment, reopen and notifications are out of scope (requirement.md §18).
