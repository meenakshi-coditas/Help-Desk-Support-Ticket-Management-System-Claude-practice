import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const notify = useCallback((type, message) => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, type, message }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (m) => notify('success', m),
    error: (m) => notify('error', m),
    info: (m) => notify('info', m),
  }), [notify]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map(({ id, type, message }) => {
          const Icon = ICONS[type];
          return (
            <div key={id} className={`toast toast-${type}`} role="status" data-testid={`toast-${type}`}>
              <Icon size={18} />
              <span>{message}</span>
              <button type="button" className="icon-btn" aria-label="Dismiss notification" onClick={() => dismiss(id)}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
