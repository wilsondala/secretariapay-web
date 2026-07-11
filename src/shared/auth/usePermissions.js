import { useMemo } from 'react';
import useAuth from './useAuth.js';
import { can, canAccessRoute, normalizeRole } from './permissions.js';

export function usePermissions() {
  const { user } = useAuth();

  return useMemo(() => ({
    user,
    role: normalizeRole(user?.role),
    can: (action) => can(user, action),
    canAccessRoute: (path) => canAccessRoute(user, path),
  }), [user]);
}

export default usePermissions;
