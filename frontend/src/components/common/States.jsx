import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import Button from './Button';

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="state" role="status">
      <Loader2 size={28} className="spin" />
      <p className="muted">{label}</p>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="state" data-testid="empty-state">
      <Inbox size={32} className="state-icon" />
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state" role="alert" data-testid="error-state">
      <AlertTriangle size={32} className="state-icon danger" />
      <h3>Something went wrong</h3>
      <p className="muted">{error?.message ?? 'Please try again.'}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
