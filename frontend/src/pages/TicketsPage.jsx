import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import { EmptyState, ErrorState, PageLoader } from '../components/common/States';
import TicketFilters from '../components/tickets/TicketFilters';
import TicketTable from '../components/tickets/TicketTable';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useDebounce } from '../hooks/useDebounce';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { listCategories, listTickets } from '../services/ticketService';
import { LIMITS } from '../utils/constants';

const DEFAULTS = { search: '', status: '', priority: '', categoryId: '', sort: 'createdAt:desc', page: 1 };

/** "My Tickets" for users, "All Tickets" for agents. Filter state lives in the URL so it survives reloads and back/forward. */
export default function TicketsPage() {
  const { isAgent } = useAuth();
  const title = isAgent ? 'All Tickets' : 'My Tickets';
  useDocumentTitle(title);

  const [params, setParams] = useSearchParams();
  const filters = { ...DEFAULTS, ...Object.fromEntries(params), page: Number(params.get('page')) || 1 };
  const [searchText, setSearchText] = useState(filters.search);
  const debouncedSearch = useDebounce(searchText);

  const update = useCallback((changes, resetPage = true) => {
    const next = { ...Object.fromEntries(params), ...changes };
    if (resetPage && !('page' in changes)) delete next.page;
    Object.keys(next).forEach((k) => (next[k] === '' || next[k] == null || String(next[k]) === String(DEFAULTS[k])) && delete next[k]);
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    if (debouncedSearch !== filters.search) update({ search: debouncedSearch });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: categories } = useAsync(listCategories, []);
  const { data, loading, error, reload } = useAsync(
    () => listTickets({ ...filters, pageSize: LIMITS.pageSize }),
    [filters.search, filters.status, filters.priority, filters.categoryId, filters.sort, filters.page],
  );

  const reset = () => { setSearchText(''); setParams({}, { replace: true }); };
  const onFilterChange = (changes) => {
    if ('search' in changes) setSearchText(changes.search);
    else update(changes);
  };

  return (
    <>
      <PageHeader
        title={title}
        subtitle={isAgent ? 'Search, filter and pick up tickets' : 'Track the tickets you have raised'}
        actions={!isAgent && <Link to="/tickets/new"><Button icon={PlusCircle}>New ticket</Button></Link>}
      />
      <Card padded={false}>
        <div className="card-toolbar">
          <TicketFilters filters={{ ...filters, search: searchText }} categories={categories ?? []} onChange={onFilterChange} onReset={reset} />
        </div>
        {loading && !data ? <PageLoader />
          : error ? <ErrorState error={error} onRetry={reload} />
            : data.data.length === 0 ? (
              <EmptyState
                title="No tickets found"
                message={params.size ? 'Try changing or clearing your filters.' : isAgent ? 'There are no tickets yet.' : 'You have not raised any tickets yet.'}
                action={params.size ? <Button variant="secondary" onClick={reset}>Clear filters</Button> : !isAgent && <Link to="/tickets/new"><Button>Create ticket</Button></Link>}
              />
            ) : (
              <div className={loading ? 'is-refreshing' : undefined}>
                <TicketTable tickets={data.data} showOwner={isAgent} />
                <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(page) => update({ page }, false)} />
              </div>
            )}
      </Card>
    </>
  );
}
