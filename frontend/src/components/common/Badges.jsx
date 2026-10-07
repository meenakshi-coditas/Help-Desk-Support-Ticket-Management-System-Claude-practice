const slug = (value) => value.toLowerCase().replace(/\s+/g, '-');

export function StatusBadge({ status }) {
  return <span className={`badge status-${slug(status)}`} data-testid="status-badge">{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge priority-${slug(priority)}`} data-testid="priority-badge">{priority}</span>;
}
