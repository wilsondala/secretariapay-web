import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  changePassword as changePasswordRequest,
  clearSession,
  getStoredSession,
  login as loginRequest,
  persistSession,
} from '../../services/authService.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const stored = getStoredSession();
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (form) => {
    setLoading(true);

    try {
      const session = await loginRequest(form);
      persistSession(session);
      setToken(session.token);
      setUser(session.user);
      return session;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (form) => {
    setLoading(true);

    try {
      const updatedUser = await changePasswordRequest(form);
      const session = { token, user: updatedUser };
      persistSession(session);
      setUser(updatedUser);
      return updatedUser;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('secretariapay:logout', logout);
    return () => window.removeEventListener('secretariapay:logout', logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      changePassword,
      logout,
    }),
    [token, user, loading, login, changePassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
