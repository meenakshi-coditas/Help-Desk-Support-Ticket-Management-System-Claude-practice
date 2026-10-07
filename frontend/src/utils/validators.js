import { LIMITS, PRIORITIES } from './constants';

// Each validator returns an object of { field: message }. Empty object = valid.
// Mirrors the business rules BR-1..BR-3 and the provisional limits in requirement.md section 13.

export function validateAttachment(file) {
  if (!file) return null;
  if (!LIMITS.attachmentTypes.includes(file.type)) {
    return `Unsupported file type. Allowed: ${LIMITS.attachmentExtensions}.`;
  }
  if (file.size > LIMITS.attachmentMaxBytes) {
    return `File is too large. Maximum size is ${LIMITS.attachmentMaxBytes / (1024 * 1024)} MB.`;
  }
  return null;
}

export function validateTicket({ subject, description, categoryId, priority, attachment }) {
  const errors = {};
  const s = (subject ?? '').trim();
  const d = (description ?? '').trim();

  if (!s) errors.subject = 'Subject is required.';
  else if (s.length > LIMITS.subjectMax) errors.subject = `Subject must be at most ${LIMITS.subjectMax} characters.`;

  if (!d) errors.description = 'Description is required.';
  else if (d.length < LIMITS.descriptionMin) {
    errors.description = `Description must contain at least ${LIMITS.descriptionMin} characters.`;
  } else if (d.length > LIMITS.descriptionMax) {
    errors.description = `Description must be at most ${LIMITS.descriptionMax} characters.`;
  }

  if (!categoryId) errors.categoryId = 'Please select a category.';
  if (!priority) errors.priority = 'Please select a priority.';
  else if (!PRIORITIES.includes(priority)) errors.priority = 'Invalid priority.';

  const attachmentError = validateAttachment(attachment);
  if (attachmentError) errors.attachment = attachmentError;
  return errors;
}

export function validateComment(body) {
  const b = (body ?? '').trim();
  if (!b) return { body: 'Comment cannot be empty.' };
  if (b.length > LIMITS.commentMax) return { body: `Comment must be at most ${LIMITS.commentMax} characters.` };
  return {};
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}
