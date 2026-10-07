import { ApiError, wait } from './apiError';
import { readDb, writeDb } from './mockDb';
import { requireUser } from './authService';
import { getAccessibleTicket } from './ticketService';
import { validateComment } from '../utils/validators';
import { getAllowedActions } from '../utils/workflow';

// GET /api/tickets/{id}/comments  – oldest first (provisional, OQ-33)
export async function listComments(ticketId) {
  await wait(200);
  const user = requireUser();
  getAccessibleTicket(ticketId, user);
  const db = readDb();
  return db.comments
    .filter((c) => c.ticketId === Number(ticketId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => {
      const author = db.users.find((u) => u.id === c.userId);
      return { ...c, authorName: author?.name ?? 'Unknown', authorRole: author?.role };
    });
}

// POST /api/tickets/{id}/comments
export async function addComment(ticketId, body) {
  await wait(300);
  const user = requireUser();
  const ticket = getAccessibleTicket(ticketId, user);
  const errors = validateComment(body);
  if (errors.body) throw new ApiError(400, 'Validation failed.', [{ field: 'body', message: errors.body }]);
  if (!getAllowedActions(ticket, user).canComment) {
    throw new ApiError(409, 'Comments are not allowed on a closed ticket.'); // A-06, OQ-23
  }
  const db = readDb();
  const comment = { id: db.seq.comment++, ticketId: ticket.id, userId: user.id, body: body.trim(), createdAt: new Date().toISOString() };
  db.comments.push(comment);
  writeDb();
  return { ...comment, authorName: user.name, authorRole: user.role };
}
