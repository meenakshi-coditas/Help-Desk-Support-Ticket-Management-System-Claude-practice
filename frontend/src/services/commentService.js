import { USE_MOCK } from './config';
import * as mock from './mock/commentService';
import * as api from './api/commentService';

const impl = USE_MOCK ? mock : api;
export const { listComments, addComment } = impl;
