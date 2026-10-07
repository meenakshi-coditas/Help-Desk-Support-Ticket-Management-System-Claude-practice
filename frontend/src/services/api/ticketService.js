import { request } from './http';

export const listCategories = () => request('/categories');

export const listTickets = ({ search, status, priority, categoryId, sort, page, pageSize } = {}) =>
  request('/tickets', { params: { search: search?.trim(), status, priority, categoryId, sort, page, pageSize } });

export const getTicket = (id) => request(`/tickets/${id}`);

// Multipart so the optional attachment can be sent together with the fields.
export function createTicket({ subject, description, categoryId, priority, attachment }) {
  const formData = new FormData();
  Object.entries({ subject, description, categoryId, priority }).forEach(([k, v]) => formData.append(k, v ?? ''));
  if (attachment) formData.append('attachment', attachment);
  return request('/tickets', { method: 'POST', formData });
}

export const updateTicket = (id, { subject, description, categoryId, priority }) =>
  request(`/tickets/${id}`, { method: 'PUT', json: { subject, description, categoryId: Number(categoryId), priority } });

export const assignTicket = (id) => request(`/tickets/${id}/assign`, { method: 'PUT' });
export const changeStatus = (id, status) => request(`/tickets/${id}/status`, { method: 'PUT', json: { status } });
export const getHistory = (id) => request(`/tickets/${id}/history`);

export async function downloadAttachment(ticketId, attachment) {
  const response = await request(`/tickets/${ticketId}/attachments/${attachment.id}`, { raw: true });
  const url = URL.createObjectURL(await response.blob());
  const link = Object.assign(document.createElement('a'), { href: url, download: attachment.name });
  link.click();
  URL.revokeObjectURL(url);
}
