import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import Field from '../components/common/Field';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { validateLogin } from '../utils/validators';
import { SEED_PASSWORDS } from '../services/mock/mockDb';

// Provisional seed accounts (OQ-08, created by backend/seed.py) – convenience for demos only; remove for production.
const DEMO_ACCOUNTS = [
  { label: 'User', email: 'user1@helpdesk.test', password: SEED_PASSWORDS.USER },
  { label: 'Support Agent', email: 'agent1@helpdesk.test', password: SEED_PASSWORDS.AGENT },
];

export default function LoginPage() {
  useDocumentTitle('Sign in');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
    setFormError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setLoading(true);
    try {
      await login(values);
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Sign in</h1>
      <p className="muted">Use your account to raise or manage support tickets.</p>

      <form className="form" onSubmit={submit} noValidate>
        {formError && <div className="alert alert-error" role="alert" data-testid="login-error">{formError}</div>}
        <Field label="Email" type="email" autoComplete="username" value={values.email} onChange={set('email')} error={errors.email} placeholder="you@company.com" data-testid="login-email" />
        <div className="password-field">
          <Field label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={values.password} onChange={set('password')} error={errors.password} data-testid="login-password" />
          <button type="button" className="icon-btn password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((s) => !s)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <Button type="submit" icon={LogIn} loading={loading} className="btn-block" data-testid="login-submit">Sign in</Button>
      </form>

      <div className="demo-box">
        <p className="small"><strong>Demo accounts</strong> (seeded data) – click to fill in:</p>
        <div className="demo-actions">
          {DEMO_ACCOUNTS.map((a) => (
            <Button key={a.label} variant="secondary" size="sm" onClick={() => { setValues({ email: a.email, password: a.password }); setErrors({}); setFormError(''); }}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
