import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../auth/useAuth.js';

const PASSWORD_CHANGE_PATH = '/alterar-senha';

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const passwordChangeRequired = Boolean(user?.mustChangePassword);

  if (passwordChangeRequired && location.pathname !== PASSWORD_CHANGE_PATH) {
    return <Navigate to={PASSWORD_CHANGE_PATH} replace />;
  }

  if (!passwordChangeRequired && location.pathname === PASSWORD_CHANGE_PATH) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
