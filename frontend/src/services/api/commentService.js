import { request } from './http';

export const listComments = (ticketId) => request(`/tickets/${ticketId}/comments`);
export const addComment = (ticketId, body) => request(`/tickets/${ticketId}/comments`, { method: 'POST', json: { body } });
