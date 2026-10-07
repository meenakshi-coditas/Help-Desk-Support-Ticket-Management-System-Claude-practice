import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LifeBuoy, LogOut, PlusCircle, Ticket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

export default function Sidebar({ open, onNavigate }) {
  const { user, isAgent, logout } = useAuth();
  const links = [
    { to: '/dashboard', label: isAgent ? 'Agent Dashboard' : 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets', label: isAgent ? 'All Tickets' : 'My Tickets', icon: Ticket, end: true },
    ...(isAgent ? [] : [{ to: '/tickets/new', label: 'Create Ticket', icon: PlusCircle }]),
  ];

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
      <div className="brand"><LifeBuoy size={22} /> Help Desk</div>
      <nav className="nav">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip">
          <Avatar name={user.name} />
          <div>
            <div className="user-name" data-testid="current-user">{user.name}</div>
            <div className="muted small">{isAgent ? 'Support Agent' : 'User'}</div>
          </div>
        </div>
        <button type="button" className="nav-link" onClick={logout} data-testid="logout"><LogOut size={18} /> Sign out</button>
      </div>
    </aside>
  );
}
