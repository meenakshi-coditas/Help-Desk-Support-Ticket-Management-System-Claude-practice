import { Link } from 'react-router-dom';
import { Paperclip } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../common/Badges';
import { formatDate, formatTicketNumber } from '../../utils/format';

/** Table on wide screens; each row turns into a labelled card on narrow screens (see .responsive-table CSS). */
export default function TicketTable({ tickets, showOwner }) {
  return (
    <div className="table-wrap">
      <table className="table responsive-table" data-testid="ticket-table">
        <thead>
          <tr>
            <th>Ticket</th><th>Subject</th>{showOwner && <th>Requester</th>}<th>Category</th>
            <th>Priority</th><th>Status</th>{showOwner && <th>Assignee</th>}<th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} data-testid={`ticket-row-${t.ticketNumber}`}>
              <td data-label="Ticket" className="mono">{formatTicketNumber(t.ticketNumber)}</td>
              <td data-label="Subject" className="cell-main">
                <Link to={`/tickets/${t.id}`}>{t.subject}</Link>
                {t.attachments.length > 0 && <Paperclip size={14} className="muted" aria-label="Has attachment" />}
              </td>
              {showOwner && <td data-label="Requester">{t.ownerName}</td>}
              <td data-label="Category">{t.categoryName}</td>
              <td data-label="Priority"><PriorityBadge priority={t.priority} /></td>
              <td data-label="Status"><StatusBadge status={t.status} /></td>
              {showOwner && <td data-label="Assignee">{t.assigneeName ?? <span className="muted">Unassigned</span>}</td>}
              <td data-label="Created">{formatDate(t.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
