import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LifeBuoy, Menu } from 'lucide-react';
import Sidebar from '../components/navigation/Sidebar';

/** Authenticated shell: sidebar on desktop, slide-in drawer + top bar on small screens. */
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
        <span className="brand"><LifeBuoy size={20} /> Help Desk</span>
      </header>
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <main className="content"><Outlet /></main>
    </div>
  );
}
