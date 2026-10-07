import { Link } from 'react-router-dom';
import { AlertOctagon, CheckCircle2, CircleDot, Loader, PlusCircle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { PriorityBadge, StatusBadge } from '../components/common/Badges';
import { EmptyState, ErrorState, PageLoader } from '../components/common/States';
import StatCard from '../components/tickets/StatCard';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getDashboard } from '../services/dashboardService';
import { formatTicketNumber, timeAgo } from '../utils/format';

export default function DashboardPage() {
  const { user, isAgent } = useAuth();
  useDocumentTitle(isAgent ? 'Agent Dashboard' : 'Dashboard');
  const { data, loading, error, reload } = useAsync(getDashboard, []);

  const header = (
    <PageHeader
      title={isAgent ? 'Support Dashboard' : `Welcome back, ${user.name.split(' ')[0]}`}
      subtitle={isAgent ? 'Overview of all tickets in the system' : 'Overview of your tickets'}
      actions={!isAgent && <Link to="/tickets/new"><Button icon={PlusCircle}>New ticket</Button></Link>}
    />
  );

  if (loading && !data) return <>{header}<PageLoader /></>;
  if (error) return <>{header}<ErrorState error={error} onRetry={reload} /></>;

  const { counts, recentTickets } = data;
  return (
    <>
      {header}
      <div className="stat-grid">
        <StatCard label="Open Tickets" value={counts.open} icon={CircleDot} tone="blue" testId="count-open" />
        <StatCard label="In Progress" value={counts.inProgress} icon={Loader} tone="amber" testId="count-in-progress" />
        <StatCard label="Resolved" value={counts.resolved} icon={CheckCircle2} tone="green" testId="count-resolved" />
        <StatCard label="Critical" value={counts.critical} icon={AlertOctagon} tone="red" testId="count-critical" />
      </div>

      <Card title="Recent tickets" actions={<Link to="/tickets" className="link-sm">View all</Link>} padded={false}>
        {recentTickets.length === 0 ? (
          <EmptyState title="No tickets yet" message={isAgent ? 'New tickets will appear here.' : 'Create your first ticket to get help.'} />
        ) : (
          <ul className="recent-list" data-testid="recent-tickets">
            {recentTickets.map((t) => (
              <li key={t.id}>
                <Link to={`/tickets/${t.id}`} className="recent-item">
                  <span className="mono muted">{formatTicketNumber(t.ticketNumber)}</span>
                  <span className="recent-subject">{t.subject}</span>
                  <PriorityBadge priority={t.priority} />
                  <span className="hide-sm"><StatusBadge status={t.status} /></span>
                  <span className="muted small hide-sm">{timeAgo(t.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
