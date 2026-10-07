import { Link } from 'react-router-dom';
import { ShieldAlert, SearchX } from 'lucide-react';
import Button from '../components/common/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function ErrorPage({ icon: Icon, title, message }) {
  return (
    <div className="state full-page">
      <Icon size={40} className="state-icon" />
      <h1>{title}</h1>
      <p className="muted">{message}</p>
      <Link to="/dashboard"><Button>Go to dashboard</Button></Link>
    </div>
  );
}

export function ForbiddenPage() {
  useDocumentTitle('Access denied');
  return <ErrorPage icon={ShieldAlert} title="Access denied" message="You do not have permission to view this page." />;
}

export function NotFoundPage() {
  useDocumentTitle('Not found');
  return <ErrorPage icon={SearchX} title="Page not found" message="The page you are looking for does not exist." />;
}
