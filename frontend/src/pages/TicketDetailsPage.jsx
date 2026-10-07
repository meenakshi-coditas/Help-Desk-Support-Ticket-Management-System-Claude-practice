import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCheck, Pencil, Settings2, UserCheck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Tabs from '../components/common/Tabs';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ErrorState, PageLoader } from '../components/common/States';
import TicketSummary from '../components/tickets/TicketSummary';
import TicketForm from '../components/tickets/TicketForm';
import CommentsPanel from '../components/tickets/CommentsPanel';
import HistoryTimeline from '../components/tickets/HistoryTimeline';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { assignTicket, changeStatus, getTicket, listCategories, updateTicket } from '../services/ticketService';
import { getAllowedActions } from '../utils/workflow';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const { user, isAgent } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('comments');
  const [dialog, setDialog] = useState(null); // 'close' | 'edit' | null
  const [busy, setBusy] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [commentCount, setCommentCount] = useState(null);

  const { data: ticket, loading, error, reload } = useAsync(() => getTicket(id), [id]);
  const { data: categories } = useAsync(listCategories, []);
  useDocumentTitle(ticket ? `#${ticket.ticketNumber} ${ticket.subject}` : 'Ticket');

  const back = (
    <Link to="/tickets" className="back-link"><ArrowLeft size={16} /> Back to {isAgent ? 'all tickets' : 'my tickets'}</Link>
  );
  if (loading && !ticket) return <>{back}<PageLoader /></>;
  if (error) return <>{back}<ErrorState error={error} onRetry={error.status === 404 ? () => navigate('/tickets') : reload} /></>;

  const actions = getAllowedActions(ticket, user);

  // Runs a workflow action, then refreshes ticket + history and reports the result.
  const run = async (fn, successMessage) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMessage);
      setDialog(null);
      setHistoryKey((k) => k + 1);
      await reload();
    } catch (err) {
      toast.error(err.message);
      setDialog(null);
      await reload(); // state may be stale (e.g. changed by another agent)
    } finally {
      setBusy(false);
    }
  };

  const headerActions = (
    <>
      {actions.canAssign && (
        <Button icon={UserCheck} loading={busy} onClick={() => run(() => assignTicket(ticket.id), 'Ticket assigned to you.')} data-testid="assign-btn">Assign to me</Button>
      )}
      {isAgent && ticket.status !== 'Closed' && ticket.status !== 'Open' && (
        <Link to={`/tickets/${ticket.id}/update`}><Button variant="secondary" icon={Settings2} data-testid="update-btn">Update ticket</Button></Link>
      )}
      {actions.canEdit && <Button variant="secondary" icon={Pencil} onClick={() => setDialog('edit')} data-testid="edit-btn">Edit</Button>}
      {actions.canClose && <Button icon={CheckCheck} onClick={() => setDialog('close')} data-testid="close-btn">Close ticket</Button>}
    </>
  );

  return (
    <>
      {back}
      <PageHeader title={ticket.subject} subtitle={`Raised by ${ticket.ownerName}`} actions={headerActions} />

      {ticket.status === 'Closed' && <div className="alert alert-info">This ticket is closed and can no longer be edited.</div>}
      {isAgent && ticket.status === 'Assigned' && ticket.assignedTo !== user.id && (
        <div className="alert alert-info">Assigned to {ticket.assigneeName}. Only the assigned agent can change its status.</div>
      )}
      {!isAgent && ticket.status === 'Resolved' && (
        <div className="alert alert-success">An agent marked this ticket as resolved. Close it if your issue is fixed.</div>
      )}

      <div className="details-grid">
        <Card title="Ticket details"><TicketSummary ticket={ticket} /></Card>
        <Card padded={false} className="activity-card">
          <div className="card-toolbar">
            <Tabs
              active={tab}
              onChange={setTab}
              tabs={[{ id: 'comments', label: 'Comments', count: commentCount }, { id: 'history', label: 'History' }]}
            />
          </div>
          <div className="card-body">
            {tab === 'comments'
              ? <CommentsPanel ticketId={ticket.id} canComment={actions.canComment} onCountChange={setCommentCount} />
              : <HistoryTimeline ticketId={ticket.id} refreshKey={historyKey} />}
          </div>
        </Card>
      </div>

      {dialog === 'close' && (
        <ConfirmDialog
          title="Close this ticket?"
          message="Once closed, the ticket can no longer be edited or commented on. This cannot be undone."
          confirmLabel="Close ticket"
          loading={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() => run(() => changeStatus(ticket.id, 'Closed'), 'Ticket closed.')}
        />
      )}
      {dialog === 'edit' && (
        <Modal title="Edit ticket" onClose={() => setDialog(null)}>
          <TicketForm
            allowAttachment={false}
            categories={categories ?? []}
            initial={{ subject: ticket.subject, description: ticket.description, categoryId: String(ticket.categoryId), priority: ticket.priority }}
            submitLabel="Save changes"
            onCancel={() => setDialog(null)}
            onSubmit={async (values) => {
              await updateTicket(ticket.id, values);
              toast.success('Ticket updated.');
              setDialog(null);
              await reload();
            }}
          />
        </Modal>
      )}
    </>
  );
}
