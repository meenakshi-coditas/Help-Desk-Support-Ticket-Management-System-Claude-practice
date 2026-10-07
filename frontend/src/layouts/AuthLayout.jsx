import { LifeBuoy } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand"><LifeBuoy size={28} /><span>Help Desk</span></div>
        {children}
      </div>
    </div>
  );
}
