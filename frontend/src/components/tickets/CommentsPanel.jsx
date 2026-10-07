import { useState } from 'react';
import { Lock, MessageSquare } from 'lucide-react';
import { addComment, listComments } from '../../services/commentService';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { validateComment } from '../../utils/validators';
import { LIMITS } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Field from '../common/Field';
import { EmptyState, ErrorState, PageLoader } from '../common/States';

export default function CommentsPanel({ ticketId, canComment, onCountChange }) {
  const toast = useToast();
  const { data: comments, loading, error, reload } = useAsync(async () => {
    const list = await listComments(ticketId);
    onCountChange?.(list.length);
    return list;
  }, [ticketId]);
  const [body, setBody] = useState('');
  const [error_, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const found = validateComment(body);
    if (found.body) return setError(found.body);
    setSending(true);
    try {
      await addComment(ticketId, body);
      setBody('');
      setError('');
      toast.success('Comment added.');
      await reload();
    } catch (err) {
      setError(err.details?.[0]?.message ?? err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading && !comments) return <PageLoader label="Loading comments…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="comments">
      {comments.length === 0 ? (
        <EmptyState title="No comments yet" message="Be the first to add a comment on this ticket." />
      ) : (
        <ul className="comment-list" data-testid="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <Avatar name={c.authorName} />
              <div className="comment-body">
                <div className="comment-meta">
                  <strong>{c.authorName}</strong>
                  <span className={`role-tag ${c.authorRole === 'AGENT' ? 'agent' : ''}`}>{c.authorRole === 'AGENT' ? 'Agent' : 'User'}</span>
                  <span className="muted small">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="comment-text">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment ? (
        <form className="comment-form" onSubmit={submit} noValidate>
          <Field as="textarea" rows={3} label="Add a comment" value={body} error={error_} placeholder="Write your comment…"
            onChange={(e) => { setBody(e.target.value); setError(''); }} counter={`${body.trim().length}/${LIMITS.commentMax}`} data-testid="comment-input" />
          <div className="form-actions">
            <Button type="submit" icon={MessageSquare} loading={sending} data-testid="comment-submit">Post comment</Button>
          </div>
        </form>
      ) : (
        <div className="alert alert-info"><Lock size={16} /> Comments are disabled because this ticket is closed.</div>
      )}
    </div>
  );
}
