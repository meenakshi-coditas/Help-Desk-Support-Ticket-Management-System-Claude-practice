import { USE_MOCK } from './config';
import * as mock from './mock/authService';
import * as api from './api/authService';

const impl = USE_MOCK ? mock : api;
export const { login, logout, getSessionUser } = impl;
