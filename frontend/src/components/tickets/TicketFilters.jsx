import { Search, X } from 'lucide-react';
import { PRIORITIES, SORT_OPTIONS, STATUSES } from '../../utils/constants';
import Button from '../common/Button';

export default function TicketFilters({ filters, categories, onChange, onReset }) {
  const set = (name) => (e) => onChange({ [name]: e.target.value });
  const hasFilters = filters.search || filters.status || filters.priority || filters.categoryId;

  return (
    <div className="filters" role="search">
      <div className="search-box">
        <Search size={16} />
        <input type="search" placeholder="Search by subject or ticket number" value={filters.search} onChange={set('search')} aria-label="Search tickets" data-testid="search-input" />
      </div>
      <select value={filters.status} onChange={set('status')} aria-label="Filter by status" data-testid="filter-status">
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select value={filters.priority} onChange={set('priority')} aria-label="Filter by priority" data-testid="filter-priority">
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
      </select>
      <select value={filters.categoryId} onChange={set('categoryId')} aria-label="Filter by category" data-testid="filter-category">
        <option value="">All categories</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={filters.sort} onChange={set('sort')} aria-label="Sort tickets" data-testid="sort-select">
        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hasFilters && <Button variant="ghost" size="sm" icon={X} onClick={onReset}>Clear</Button>}
    </div>
  );
}
