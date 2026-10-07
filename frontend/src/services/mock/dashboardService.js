import { wait } from '../apiError';
import { readDb } from './mockDb';
import { requireUser } from './authService';
import { enrichTicket } from './ticketService';
import { LIMITS, ROLES } from '../../utils/constants';

// GET /api/dashboard (proposed, OQ-26). Count definitions follow A-10 / A-17 (provisional, OQ-18, OQ-19).
export async function getDashboard() {
  await wait();
  const user = requireUser();
  const db = readDb();
  const scope = user.role === ROLES.AGENT ? 'all' : 'own';
  const tickets = db.tickets.filter((t) => scope === 'all' || t.userId === user.id);

  return {
    scope,
    counts: {
      open: tickets.filter((t) => t.status === 'Open').length,
      inProgress: tickets.filter((t) => t.status === 'In Progress').length,
      resolved: tickets.filter((t) => t.status === 'Resolved').length,
      critical: tickets.filter((t) => t.priority === 'Critical' && t.status !== 'Closed').length,
    },
    recentTickets: [...tickets]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
      .slice(0, LIMITS.recentTickets)
      .map((t) => enrichTicket(t, db)),
  };
}
