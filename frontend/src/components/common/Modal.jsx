import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Accessible dialog: closes on Escape / backdrop click, focuses itself on open. */
export default function Modal({ title, onClose, children, footer, size = 'md' }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  );
}
