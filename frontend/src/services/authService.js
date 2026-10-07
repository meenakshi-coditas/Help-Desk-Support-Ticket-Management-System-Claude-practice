import { ApiError, wait } from './apiError';
import { readDb } from './mockDb';

const SESSION_KEY = 'helpdesk.session';
const publicUser = ({ password, ...user }) => user;

// POST /api/auth/login  (A-11: email + password)
export async function login({ email, password }) {
  await wait();
  const user = readDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    // Generic message on purpose (REQ-060): do not reveal which credential was wrong.
    throw new ApiError(401, 'Invalid email or password.');
  }
  localStorage.setItem(SESSION_KEY, String(user.id));
  return publicUser(user);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSessionUser() {
  try {
    const id = Number(localStorage.getItem(SESSION_KEY));
    const user = readDb().users.find((u) => u.id === id);
    return user ? publicUser(user) : null;
  } catch {
    return null;
  }
}

export function requireUser() {
  const user = getSessionUser();
  if (!user) throw new ApiError(401, 'Your session has expired. Please sign in again.');
  return user;
}
