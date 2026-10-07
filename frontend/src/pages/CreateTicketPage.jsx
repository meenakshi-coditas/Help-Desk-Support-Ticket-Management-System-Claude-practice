import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import { ErrorState, PageLoader } from '../components/common/States';
import TicketForm from '../components/tickets/TicketForm';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { createTicket, listCategories } from '../services/ticketService';

export default function CreateTicketPage() {
  useDocumentTitle('Create Ticket');
  const navigate = useNavigate();
  const toast = useToast();
  const { data: categories, loading, error, reload } = useAsync(listCategories, []);

  const handleSubmit = async (values) => {
    const ticket = await createTicket(values);
    toast.success(`Ticket #${ticket.ticketNumber} created.`);
    navigate(`/tickets/${ticket.id}`);
  };

  return (
    <>
      <PageHeader title="Create ticket" subtitle="Tell us what went wrong and we will get an agent on it" />
      <Card className="narrow">
        {loading ? <PageLoader /> : error ? <ErrorState error={error} onRetry={reload} /> : (
          <TicketForm categories={categories} onSubmit={handleSubmit} onCancel={() => navigate('/tickets')} submitLabel="Submit ticket" />
        )}
      </Card>
    </>
  );
}
