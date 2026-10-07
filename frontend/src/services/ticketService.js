import { USE_MOCK } from './config';
import * as mock from './mock/ticketService';
import * as api from './api/ticketService';
import { ApiError } from './apiError';

const impl = USE_MOCK ? mock : api;
export const { listCategories, listTickets, getTicket, createTicket, updateTicket, assignTicket, changeStatus, getHistory } = impl;

export const downloadAttachment = USE_MOCK
  ? async () => { throw new ApiError(501, 'Attachment download needs the real backend (mock mode only stores file details).'); }
  : api.downloadAttachment;
