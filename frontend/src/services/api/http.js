import { API_URL } from '../config';
import { ApiError } from '../apiError';

const TOKEN_KEY = 'helpdesk.token';
const USER_KEY = 'helpdesk.user';

export const session = {
  get token() { return localStorage.getItem(TOKEN_KEY); },
  get user() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

function buildUrl(path, params) {
  const url = new URL(`${API_URL.replace(/\/$/, '')}${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== '' && value != null) url.searchParams.set(key, value);
  });
  return url;
}

/** Thin fetch wrapper: adds the bearer token, parses JSON and converts error responses into ApiError. */
export async function request(path, { method = 'GET', params, json, formData, raw = false } = {}) {
  const headers = {};
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  if (json !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildUrl(path, params), { method, headers, body: formData ?? (json !== undefined ? JSON.stringify(json) : undefined) });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the backend is running.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.message ?? 'Request failed.', body.details ?? []);
  }
  if (raw) return response;
  return response.status === 204 ? null : response.json();
}
