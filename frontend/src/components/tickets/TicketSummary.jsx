import { Download } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../common/Badges';
import { formatDateTime, formatFileSize, formatTicketNumber } from '../../utils/format';

/** Read-only ticket information block used on Ticket Details and Update Ticket. */
export default function TicketSummary({ ticket }) {
  return (
    <>
      <div className="summary-head">
        <span className="mono muted">{formatTicketNumber(ticket.ticketNumber)}</span>
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>
      <p className="description" data-testid="ticket-description-text">{ticket.description}</p>

      <dl className="meta-grid">
        <div><dt>Category</dt><dd>{ticket.categoryName}</dd></div>
        <div><dt>Requester</dt><dd>{ticket.ownerName}</dd></div>
        <div><dt>Assigned to</dt><dd>{ticket.assigneeName ?? <span className="muted">Unassigned</span>}</dd></div>
        <div><dt>Created</dt><dd>{formatDateTime(ticket.createdAt)}</dd></div>
        <div><dt>Last updated</dt><dd>{formatDateTime(ticket.updatedAt)}</dd></div>
        <div>
          <dt>Attachment</dt>
          <dd>
            {ticket.attachments.length === 0 ? <span className="muted">None</span> : ticket.attachments.map((a) => (
              <span key={a.name} className="file-chip" title="Download is available once the backend is connected">
                <Download size={14} /> {a.name} <span className="muted small">{formatFileSize(a.size)}</span>
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </>
  );
}
