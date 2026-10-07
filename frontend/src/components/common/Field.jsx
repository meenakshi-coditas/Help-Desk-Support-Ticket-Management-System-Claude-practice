import { useId } from 'react';

/** Label + control + inline error. `as` = input | textarea | select. */
export default function Field({ label, error, hint, required, as: Tag = 'input', children, counter, ...props }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {label}{required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      <Tag id={id} aria-invalid={!!error} aria-describedby={describedBy} {...props}>{children}</Tag>
      <div className="field-meta">
        {error ? <span id={`${id}-error`} className="field-error" role="alert">{error}</span>
          : hint ? <span id={`${id}-hint`} className="muted small">{hint}</span> : <span />}
        {counter && <span className="muted small">{counter}</span>}
      </div>
    </div>
  );
}
