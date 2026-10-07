import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { StatusBadge } from '../components/common/Badges';
import { ErrorState, PageLoader } from '../components/common/States';
import TicketSummary from '../components/tickets/TicketSummary';
import HistoryTimeline from '../components/tickets/HistoryTimeline';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { assignTicket, changeStatus, getTicket } from '../services/ticketService';
import { getAllowedActions } from '../utils/workflow';

/** Agent-only screen: assign a ticket, or move it to the next status. Only valid next steps are offered (REQ-030..034). */
export default function UpdateTicketPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const { data: ticket, loading, error, reload } = useAsync(() => getTicket(id), [id]);
  useDocumentTitle('Update Ticket');

  const back = <Link to={`/tickets/${id}`} className="back-link"><ArrowLeft size={16} /> Back to ticket</Link>;
  if (loading && !ticket) return <>{back}<PageLoader /></>;
  if (error) return <>{back}<ErrorState error={error} onRetry={reload} /></>;

  const { canAssign, nextStatus } = getAllowedActions(ticket, user);

  const run = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      toast.success(message);
      setHistoryKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConfirm(false);
      setBusy(false);
      await reload();
    }
  };

  let panel;
  if (ticket.status === 'Closed') {
    panel = <p className="muted"><Lock size={14} /> This ticket is closed and cannot be changed.</p>;
  } else if (canAssign) {
    panel = (
      <>
        <p className="muted">This ticket is unassigned. Assign it to yourself to start working on it.</p>
        <Button loading={busy} onClick={() => run(() => assignTicket(ticket.id), 'Ticket assigned to you.')} data-testid="assign-btn">Assign to me</Button>
      </>
    );
  } else if (nextStatus) {
    panel = (
      <>
        <div className="status-step">
          <StatusBadge status={ticket.status} /> <ArrowRight size={16} className="muted" /> <StatusBadge status={nextStatus} />
        </div>
        <p className="muted">
          {nextStatus === 'Resolved' ? 'Mark the ticket as resolved once the issue is fixed. The requester will then be able to close it.' : 'Start working on this ticket.'}
        </p>
        <Button onClick={() => (nextStatus === 'Resolved' ? setConfirm(true) : run(() => changeStatus(ticket.id, nextStatus), `Status changed to ${nextStatus}.`))} loading={busy && !confirm} data-testid="status-btn">
          Move to {nextStatus}
        </Button>
      </>
    );
  } else if (ticket.status === 'Resolved') {
    panel = <p className="muted">Waiting for the requester to close this ticket.</p>;
  } else {
    panel = <p className="muted">Only the assigned agent ({ticket.assigneeName}) can change the status of this ticket.</p>;
  }

  return (
    <>
      {back}
      <PageHeader title="Update ticket" subtitle={`#${ticket.ticketNumber} · ${ticket.subject}`} />
      <div className="details-grid">
        <Card title="Next step"><div className="stack">{panel}</div></Card>
        <Card title="Ticket"><TicketSummary ticket={ticket} /></Card>
        <Card title="Status history" className="span-all"><HistoryTimeline ticketId={ticket.id} refreshKey={historyKey} /></Card>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Resolve this ticket?"
          message="The requester will be able to close the ticket. Make sure the issue is fixed."
          confirmLabel="Mark as resolved"
          loading={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={() => run(() => changeStatus(ticket.id, 'Resolved'), 'Ticket resolved.')}
        />
      )}
    </>
  );
}
