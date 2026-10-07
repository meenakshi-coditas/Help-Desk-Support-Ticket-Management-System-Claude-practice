import { USE_MOCK } from './config';
import * as mock from './mock/dashboardService';
import * as api from './api/dashboardService';

export const { getDashboard } = USE_MOCK ? mock : api;
