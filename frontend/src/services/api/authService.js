import { request, session } from './http';

export async function login({ email, password }) {
  const { token, user } = await request('/auth/login', { method: 'POST', json: { email: email.trim(), password } });
  session.save(token, user);
  return user;
}

export function logout() {
  session.clear();
}

export const getSessionUser = () => (session.token ? session.user : null);
