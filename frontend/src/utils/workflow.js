import { ROLES } from './constants';

/**
 * Single place describing which actions an actor may take on a ticket
 * (requirement.md section 7, working assumptions A-02..A-07).
 * Used by the UI to show/hide controls and by the mock API to enforce the rules.
 */
export function getAllowedActions(ticket, user) {
  const none = { canAssign: false, nextStatus: null, canClose: false, canEdit: false, canComment: false };
  if (!ticket || !user) return none;

  const isClosed = ticket.status === 'Closed';
  const isAgent = user.role === ROLES.AGENT;
  const isOwner = ticket.userId === user.id;
  const isAssignee = ticket.assignedTo === user.id;

  let nextStatus = null;
  if (isAgent && isAssignee) {
    if (ticket.status === 'Assigned') nextStatus = 'In Progress';
    if (ticket.status === 'In Progress') nextStatus = 'Resolved';
  }

  return {
    canAssign: isAgent && ticket.status === 'Open',
    nextStatus,
    canClose: !isAgent && isOwner && ticket.status === 'Resolved',
    canEdit: !isAgent && isOwner && ticket.status === 'Open', // A-07, OQ-03 (provisional)
    canComment: !isClosed && (isAgent || isOwner), // A-06, OQ-23 (provisional)
  };
}
