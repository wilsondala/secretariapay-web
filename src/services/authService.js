import api from './api.js';

export async function login({ email, password }) {
  const { data } = await api.post('/api/v1/auth/login', { email, password });
  const token = data?.token || data?.accessToken || data?.access_token;
  const user = data?.user || {
    email: data?.email,
    role: data?.role,
    status: data?.status,
    mustChangePassword: data?.mustChangePassword,
  };

  if (!token) throw new Error('Token não retornado pela API.');

  return { token, user };
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  const { data } = await api.post('/api/v1/auth/change-password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });

  return data;
}

export function persistSession(session) {
  localStorage.setItem('secretariapay.token', session.token);
  localStorage.setItem('secretariapay.user', JSON.stringify(session.user || {}));
}

export function getStoredSession() {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem('secretariapay.user') || 'null');
  } catch {
    user = null;
  }

  return {
    token: localStorage.getItem('secretariapay.token'),
    user,
  };
}

export function clearSession() {
  localStorage.removeItem('secretariapay.token');
  localStorage.removeItem('secretariapay.user');
}
