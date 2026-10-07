import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted small" data-testid="page-summary">Showing {from}–{to} of {total}</span>
      <div className="pagination-controls">
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">Prev</Button>
        <span className="small">Page {page} of {totalPages}</span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </nav>
  );
}
