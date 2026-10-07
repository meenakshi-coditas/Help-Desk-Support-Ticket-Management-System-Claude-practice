// In-browser mock database persisted in localStorage.
// It stands in for the backend (not built yet) – see services/*.js for the API-shaped functions.
// Provisional seed data (requirement.md OQ-08, OQ-12). Replace by real API calls later.

const KEY = 'helpdesk.mockdb.v1';
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

export const SEED_PASSWORDS = { USER: 'User@1234', AGENT: 'Agent@1234' };

function buildSeed() {
  const users = [
    { id: 1, name: 'Alice Morgan', email: 'user1@helpdesk.test', role: 'USER', password: SEED_PASSWORDS.USER },
    { id: 2, name: 'Brian Lee', email: 'user2@helpdesk.test', role: 'USER', password: SEED_PASSWORDS.USER },
    { id: 3, name: 'Priya Nair', email: 'agent1@helpdesk.test', role: 'AGENT', password: SEED_PASSWORDS.AGENT },
    { id: 4, name: 'Carlos Diaz', email: 'agent2@helpdesk.test', role: 'AGENT', password: SEED_PASSWORDS.AGENT },
  ];
  const categories = ['Login', 'Payment', 'Account', 'Technical', 'Other'].map((name, i) => ({ id: i + 1, name }));

  // [number, user, subject, description, category, priority, status, assignee, ageMinutes]
  const rows = [
    [1001, 1, 'Login issue', 'Unable to login with my registered email address.', 1, 'High', 'Open', null, 50],
    [1002, 2, 'Payment issue', 'My card was charged twice for the same order.', 2, 'Critical', 'Open', null, 130],
    [1003, 1, 'Password reset', 'Reset email never arrives in my inbox.', 3, 'Medium', 'Assigned', 3, 300],
    [1004, 2, 'App crashes on upload', 'The app closes when I upload a PDF file.', 4, 'High', 'In Progress', 3, 600],
    [1005, 1, 'Wrong invoice amount', 'Invoice shows an amount different from my plan.', 2, 'Medium', 'Resolved', 4, 1500],
    [1006, 2, 'Update profile name', 'I cannot change the display name in my profile.', 3, 'Low', 'Closed', 3, 3000],
    [1007, 1, 'Dashboard is slow', 'Pages take more than 10 seconds to load.', 4, 'Critical', 'In Progress', 4, 900],
    [1008, 2, 'Two-factor code not received', 'SMS code does not arrive on my phone.', 1, 'Critical', 'Assigned', 4, 400],
    [1009, 1, 'Feature question', 'How do I export my ticket list to a file?', 5, 'Low', 'Open', null, 20],
    [1010, 2, 'Cannot attach screenshot', 'Attachment button does nothing on Safari.', 4, 'Medium', 'Resolved', 3, 2100],
  ];

  const tickets = rows.map(([ticketNumber, userId, subject, description, categoryId, priority, status, assignedTo, age]) => ({
    id: ticketNumber - 1000, ticketNumber, userId, subject, description, categoryId, priority, status,
    assignedTo, attachments: [], createdAt: minutesAgo(age), updatedAt: minutesAgo(Math.max(age - 30, 1)),
  }));

  // Build history that is consistent with each ticket's status (no entry for creation – A-13).
  const flow = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
  const history = [];
  tickets.forEach((t) => {
    const reached = flow.indexOf(t.status);
    for (let i = 1; i <= reached; i += 1) {
      const actor = flow[i] === 'Closed' ? t.userId : t.assignedTo;
      history.push({
        id: history.length + 1, ticketId: t.id, fromStatus: flow[i - 1], toStatus: flow[i],
        changedBy: actor, changedAt: minutesAgo(Math.max(rows[t.id - 1][8] - i * 15, 1)),
      });
    }
  });

  const comments = [
    { id: 1, ticketId: 4, userId: 3, body: 'I can reproduce this with a 3 MB PDF. Investigating the upload handler.', createdAt: minutesAgo(500) },
    { id: 2, ticketId: 4, userId: 2, body: 'Thanks. It also happens with a smaller image file.', createdAt: minutesAgo(480) },
    { id: 3, ticketId: 5, userId: 4, body: 'Invoice corrected and re-sent to your email. Please confirm.', createdAt: minutesAgo(1400) },
  ];

  return { users, categories, tickets, history, comments, seq: { ticket: 1011, history: history.length + 1, comment: 4 } };
}

let cache = null;

export function readDb() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : buildSeed();
  } catch {
    cache = buildSeed();
  }
  return cache;
}

export function writeDb() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage unavailable: keep in-memory state only */
  }
}

export function resetDb() {
  cache = buildSeed();
  writeDb();
}
