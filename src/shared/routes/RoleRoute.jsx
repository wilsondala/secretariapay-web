import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../auth/useAuth.js';
import { canAccessRoute, getDefaultRoute } from '../auth/permissions.js';

export default function RoleRoute({ path, children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!canAccessRoute(user, path)) {
    return <Navigate to={getDefaultRoute(user)} replace state={{ denied: path }} />;
  }

  return children;
}
