import { ApiError, wait } from '../apiError';
import { readDb } from './mockDb';

const SESSION_KEY = 'helpdesk.session';
let memorySession = null; // used when localStorage is unavailable (private mode, embedded frames)

const store = {
  get() { try { return localStorage.getItem(SESSION_KEY); } catch { return memorySession; } },
  set(v) { memorySession = v; try { localStorage.setItem(SESSION_KEY, v); } catch { /* ignore */ } },
  clear() { memorySession = null; try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } },
};
const publicUser = ({ password, ...user }) => user;

// POST /api/auth/login  (A-11: email + password)
export async function login({ email, password }) {
  await wait();
  const user = readDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    // Generic message on purpose (REQ-060): do not reveal which credential was wrong.
    throw new ApiError(401, 'Invalid email or password.');
  }
  store.set(String(user.id));
  return publicUser(user);
}

export function logout() {
  store.clear();
}

export function getSessionUser() {
  const id = Number(store.get());
  const user = readDb().users.find((u) => u.id === id);
  return user ? publicUser(user) : null;
}

export function requireUser() {
  const user = getSessionUser();
  if (!user) throw new ApiError(401, 'Your session has expired. Please sign in again.');
  return user;
}
