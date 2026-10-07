import { useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import Field from '../common/Field';
import Button from '../common/Button';
import { LIMITS, PRIORITIES } from '../../utils/constants';
import { validateTicket } from '../../utils/validators';
import { formatFileSize } from '../../utils/format';

const EMPTY = { subject: '', description: '', categoryId: '', priority: '', attachment: null };

/**
 * Shared by Create Ticket (with attachment) and Edit Ticket (no attachment, A-07).
 * `onSubmit` may throw an ApiError with `details` – shown as field errors.
 */
export default function TicketForm({ initial = EMPTY, categories, onSubmit, onCancel, submitLabel, allowAttachment = true, formId = 'ticket-form' }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInput = useRef(null);

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const pickFile = (e) => {
    const file = e.target.files[0] ?? null;
    setValues((v) => ({ ...v, attachment: file }));
    setErrors((er) => ({ ...er, attachment: validateTicket({ ...values, ...EMPTY_REQUIRED, attachment: file }).attachment }));
  };

  const clearFile = () => {
    setValues((v) => ({ ...v, attachment: null }));
    setErrors((er) => ({ ...er, attachment: undefined }));
    if (fileInput.current) fileInput.current.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validateTicket(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(values);
    } catch (err) {
      if (err.details?.length) setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      else setFormError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form id={formId} className="form" onSubmit={submit} noValidate>
      {formError && <div className="alert alert-error" role="alert">{formError}</div>}

      <Field label="Subject" required value={values.subject} onChange={set('subject')} error={errors.subject}
        maxLength={LIMITS.subjectMax + 20} placeholder="Short summary of the problem" counter={`${values.subject.trim().length}/${LIMITS.subjectMax}`} data-testid="ticket-subject" />

      <Field as="textarea" rows={5} label="Description" required value={values.description} onChange={set('description')} error={errors.description}
        placeholder="Describe the problem (at least 10 characters)" hint={`Minimum ${LIMITS.descriptionMin} characters`} data-testid="ticket-description" />

      <div className="form-row">
        <Field as="select" label="Category" required value={values.categoryId} onChange={set('categoryId')} error={errors.categoryId} data-testid="ticket-category">
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Field>
        <Field as="select" label="Priority" required value={values.priority} onChange={set('priority')} error={errors.priority} data-testid="ticket-priority">
          <option value="">Select priority</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </Field>
      </div>

      {allowAttachment && (
        <div className={`field ${errors.attachment ? 'has-error' : ''}`}>
          <label htmlFor="attachment">Attachment <span className="muted small">(optional)</span></label>
          {values.attachment ? (
            <div className="file-chip">
              <Paperclip size={16} /> <span>{values.attachment.name}</span>
              <span className="muted small">{formatFileSize(values.attachment.size)}</span>
              <button type="button" className="icon-btn" aria-label="Remove attachment" onClick={clearFile}><X size={16} /></button>
            </div>
          ) : (
            <input id="attachment" ref={fileInput} type="file" onChange={pickFile} accept=".png,.jpg,.jpeg,.pdf,.txt" data-testid="ticket-attachment" />
          )}
          <div className="field-meta">
            {errors.attachment ? <span className="field-error" role="alert">{errors.attachment}</span>
              : <span className="muted small">{LIMITS.attachmentExtensions} · max {LIMITS.attachmentMaxBytes / (1024 * 1024)} MB (provisional)</span>}
          </div>
        </div>
      )}

      <div className="form-actions">
        {onCancel && <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>}
        <Button type="submit" loading={submitting} data-testid="ticket-submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

// Dummy values so attachment-only validation does not complain about other empty fields.
const EMPTY_REQUIRED = { subject: 'x', description: 'x'.repeat(LIMITS.descriptionMin), categoryId: '1', priority: 'Low' };
