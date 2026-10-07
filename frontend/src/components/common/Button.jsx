import { Loader2 } from 'lucide-react';

/** variant: primary | secondary | danger | ghost. `loading` disables the button and shows a spinner. */
export default function Button({ variant = 'primary', size = 'md', loading = false, icon: Icon, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={16} className="spin" /> : Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
