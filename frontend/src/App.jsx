import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/navigation/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailsPage from './pages/TicketDetailsPage';
import UpdateTicketPage from './pages/UpdateTicketPage';
import { ForbiddenPage, NotFoundPage } from './pages/ErrorPages';
import { ROLES } from './utils/constants';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/:id" element={<TicketDetailsPage />} />
          <Route element={<ProtectedRoute roles={[ROLES.USER]} />}>
            <Route path="/tickets/new" element={<CreateTicketPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={[ROLES.AGENT]} />}>
            <Route path="/tickets/:id/update" element={<UpdateTicketPage />} />
          </Route>
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
