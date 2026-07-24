import axios from 'axios';
import { env } from '../config/env.js';

const TOKEN_KEY = 'secretariapay.token';
const USER_KEY = 'secretariapay.user';

const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('secretariapay:logout'));
}

function tokenIsExpired(token) {
  if (!token) return false;

  try {
    const [, encodedPayload] = token.split('.');
    if (!encodedPayload) return false;

    const normalized = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
    const bytes = Uint8Array.from(window.atob(normalized), (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));

    return Number.isFinite(Number(payload?.exp))
      && Date.now() >= Number(payload.exp) * 1000;
  } catch {
    return false;
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const token = localStorage.getItem(TOKEN_KEY);
    const expiredSession = status === 403 && tokenIsExpired(token);

    if (status === 401 || expiredSession) {
      if (expiredSession && error?.response) {
        error.response.data = {
          ...(typeof error.response.data === 'object' ? error.response.data : {}),
          message: 'A sua sessão expirou. Entre novamente para continuar.',
        };
      }
      clearStoredSession();
    }

    return Promise.reject(error);
  },
);

export default api;
