import { ReactNode, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from 'wouter';
import { UserRole } from '@/types/auth';
import { hasPermission, Permission } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: Permission;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [, navigate] = useLocation();

  const redirectTarget = useMemo(() => {
    if (!isAuthenticated || !user) {
      return '/login';
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(user.role)) {
        return '/unauthorized';
      }
    }

    if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
      return '/unauthorized';
    }

    return null;
  }, [isAuthenticated, requiredRole, requiredPermission, user]);

  useEffect(() => {
    if (redirectTarget) {
      navigate(redirectTarget, { replace: true });
    }
  }, [navigate, redirectTarget]);

  if (redirectTarget) {
    return null;
  }

  return <>{children}</>;
}
