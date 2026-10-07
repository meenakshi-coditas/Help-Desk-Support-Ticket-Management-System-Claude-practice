import { Download } from 'lucide-react';
import { downloadAttachment } from '../../services/ticketService';
import { useToast } from '../../context/ToastContext';
import { PriorityBadge, StatusBadge } from '../common/Badges';
import { formatDateTime, formatFileSize, formatTicketNumber } from '../../utils/format';

/** Read-only ticket information block used on Ticket Details and Update Ticket. */
export default function TicketSummary({ ticket }) {
  const toast = useToast();
  const download = (attachment) => downloadAttachment(ticket.id, attachment).catch((err) => toast.error(err.message));
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
              <button key={a.id ?? a.name} type="button" className="file-chip file-chip-btn" onClick={() => download(a)} data-testid="attachment-download">
                <Download size={14} /> {a.name} <span className="muted small">{formatFileSize(a.size)}</span>
              </button>
            ))}
          </dd>
        </div>
      </dl>
    </>
  );
}
