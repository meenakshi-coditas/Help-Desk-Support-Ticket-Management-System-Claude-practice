import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', variant = 'primary', loading, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading} data-testid="confirm-action">{confirmLabel}</Button>
        </>
      )}
    >
      <p>{message}</p>
    </Modal>
  );
}
