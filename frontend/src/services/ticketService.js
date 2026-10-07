import { ApiError, wait } from './apiError';
import { readDb, writeDb } from './mockDb';
import { requireUser } from './authService';
import { LIMITS, ROLES } from '../utils/constants';
import { validateTicket } from '../utils/validators';
import { getAllowedActions } from '../utils/workflow';

const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3, Critical: 4 };
const STATUS_RANK = { Open: 1, Assigned: 2, 'In Progress': 3, Resolved: 4, Closed: 5 };

// Adds the readable names the API would return alongside the ids.
export function enrichTicket(ticket, db = readDb()) {
  const name = (id) => db.users.find((u) => u.id === id)?.name ?? null;
  return {
    ...ticket,
    categoryName: db.categories.find((c) => c.id === ticket.categoryId)?.name ?? '—',
    ownerName: name(ticket.userId),
    assigneeName: name(ticket.assignedTo),
  };
}

// A user may only access their own tickets; agents may access all (BR-10, A-05).
export function getAccessibleTicket(id, user) {
  const ticket = readDb().tickets.find((t) => t.id === Number(id));
  if (!ticket || (user.role === ROLES.USER && ticket.userId !== user.id)) {
    throw new ApiError(404, 'Ticket not found.');
  }
  return ticket;
}

function addHistory(db, ticket, fromStatus, toStatus, userId) {
  db.history.push({
    id: db.seq.history++, ticketId: ticket.id, fromStatus, toStatus, changedBy: userId, changedAt: new Date().toISOString(),
  });
}

function saveStatus(ticket, toStatus, userId) {
  const db = readDb();
  addHistory(db, ticket, ticket.status, toStatus, userId); // BR-7: every change is recorded
  ticket.status = toStatus;
  ticket.updatedAt = new Date().toISOString();
  writeDb();
}

// GET /api/categories
export async function listCategories() {
  await wait(120);
  return readDb().categories;
}

// GET /api/tickets  (role scoped; search, filter, sort, paginate – REQ-019)
export async function listTickets({ search = '', status = '', priority = '', categoryId = '', sort = 'createdAt:desc', page = 1, pageSize = LIMITS.pageSize } = {}) {
  await wait();
  const user = requireUser();
  const db = readDb();
  const q = search.trim().toLowerCase();

  let rows = db.tickets
    .filter((t) => user.role === ROLES.AGENT || t.userId === user.id)
    .map((t) => enrichTicket(t, db))
    .filter((t) => !q || t.subject.toLowerCase().includes(q) || String(t.ticketNumber).includes(q.replace('#', '')))
    .filter((t) => !status || t.status === status)
    .filter((t) => !priority || t.priority === priority)
    .filter((t) => !categoryId || t.categoryId === Number(categoryId));

  const [field, order] = sort.split(':');
  const dir = order === 'asc' ? 1 : -1;
  const key = (t) => (field === 'priority' ? PRIORITY_RANK[t.priority] : field === 'status' ? STATUS_RANK[t.status] : t.createdAt);
  rows = rows.sort((a, b) => (key(a) > key(b) ? dir : key(a) < key(b) ? -dir : b.id - a.id));

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return { data: rows.slice(start, start + pageSize), page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

// GET /api/tickets/{id}
export async function getTicket(id) {
  await wait();
  const user = requireUser();
  return enrichTicket(getAccessibleTicket(id, user));
}

// POST /api/tickets
export async function createTicket(input) {
  await wait(400);
  const user = requireUser();
  if (user.role !== ROLES.USER) throw new ApiError(403, 'Only users can create tickets.'); // A-18
  const errors = validateTicket(input);
  if (Object.keys(errors).length) {
    throw new ApiError(400, 'Validation failed.', Object.entries(errors).map(([field, message]) => ({ field, message })));
  }
  const db = readDb();
  const now = new Date().toISOString();
  const ticket = {
    id: db.seq.ticket - 1000, ticketNumber: db.seq.ticket++, userId: user.id,
    subject: input.subject.trim(), description: input.description.trim(), categoryId: Number(input.categoryId),
    priority: input.priority, status: 'Open', assignedTo: null,
    attachments: input.attachment ? [{ name: input.attachment.name, size: input.attachment.size, type: input.attachment.type }] : [],
    createdAt: now, updatedAt: now,
  };
  db.tickets.push(ticket);
  writeDb();
  return enrichTicket(ticket, db);
}

// PUT /api/tickets/{id}  – owner only, while Open (A-07, provisional)
export async function updateTicket(id, input) {
  await wait(400);
  const user = requireUser();
  const ticket = getAccessibleTicket(id, user);
  if (ticket.status === 'Closed') throw new ApiError(409, 'A closed ticket cannot be edited.');
  if (!getAllowedActions(ticket, user).canEdit) throw new ApiError(403, 'You cannot edit this ticket.');
  const errors = validateTicket({ ...input, attachment: null });
  if (Object.keys(errors).length) {
    throw new ApiError(400, 'Validation failed.', Object.entries(errors).map(([field, message]) => ({ field, message })));
  }
  Object.assign(ticket, {
    subject: input.subject.trim(), description: input.description.trim(),
    categoryId: Number(input.categoryId), priority: input.priority, updatedAt: new Date().toISOString(),
  });
  writeDb();
  return enrichTicket(ticket);
}

// PUT /api/tickets/{id}/assign  – agent self-assignment, Open -> Assigned (A-01)
export async function assignTicket(id) {
  await wait();
  const user = requireUser();
  if (user.role !== ROLES.AGENT) throw new ApiError(403, 'Only support agents can assign tickets.'); // BR-4
  const ticket = getAccessibleTicket(id, user);
  if (ticket.status === 'Closed') throw new ApiError(409, 'A closed ticket cannot be edited.');
  if (ticket.status !== 'Open') throw new ApiError(409, `Ticket is already ${ticket.status}; only Open tickets can be assigned.`);
  ticket.assignedTo = user.id;
  saveStatus(ticket, 'Assigned', user.id);
  return enrichTicket(ticket);
}

// PUT /api/tickets/{id}/status
export async function changeStatus(id, toStatus) {
  await wait();
  const user = requireUser();
  const ticket = getAccessibleTicket(id, user);
  if (ticket.status === 'Closed') throw new ApiError(409, 'A closed ticket cannot be edited.'); // BR-6
  if (toStatus === 'Resolved' && user.role !== ROLES.AGENT) throw new ApiError(403, 'Only support agents can resolve tickets.'); // BR-5
  const actions = getAllowedActions(ticket, user);
  const allowed = toStatus === 'Closed' ? actions.canClose : toStatus === actions.nextStatus;
  if (!allowed) {
    throw new ApiError(409, `Cannot change status from ${ticket.status} to ${toStatus}.`); // BR-8 and other invalid transitions
  }
  saveStatus(ticket, toStatus, user.id);
  return enrichTicket(ticket);
}

// GET /api/tickets/{id}/history  (proposed endpoint, OQ-26)
export async function getHistory(id) {
  await wait(200);
  const user = requireUser();
  getAccessibleTicket(id, user);
  const db = readDb();
  return db.history
    .filter((h) => h.ticketId === Number(id))
    .sort((a, b) => a.changedAt.localeCompare(b.changedAt))
    .map((h) => ({ ...h, changedByName: db.users.find((u) => u.id === h.changedBy)?.name ?? 'Unknown' }));
}
