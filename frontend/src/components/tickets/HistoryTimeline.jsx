import { ArrowRight } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { getHistory } from '../../services/ticketService';
import { formatDateTime } from '../../utils/format';
import { StatusBadge } from '../common/Badges';
import { EmptyState, ErrorState, PageLoader } from '../common/States';

/** REQ-037/038: chronological list of status changes (Open → Assigned → …). `refreshKey` forces a reload. */
export default function HistoryTimeline({ ticketId, refreshKey }) {
  const { data, loading, error, reload } = useAsync(() => getHistory(ticketId), [ticketId, refreshKey]);
  if (loading && !data) return <PageLoader label="Loading history…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState title="No status changes yet" message="Every status change will be listed here." />;

  return (
    <ol className="timeline" data-testid="history-list">
      {data.map((h) => (
        <li key={h.id}>
          <span className="timeline-dot" />
          <div className="timeline-row">
            <StatusBadge status={h.fromStatus} /> <ArrowRight size={14} className="muted" /> <StatusBadge status={h.toStatus} />
          </div>
          <div className="muted small">{formatDateTime(h.changedAt)} · {h.changedByName}</div>
        </li>
      ))}
    </ol>
  );
}
