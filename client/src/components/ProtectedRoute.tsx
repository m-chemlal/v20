import { ReactNode } from 'react';
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

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  // Check role if required
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      navigate('/unauthorized');
      return null;
    }
  }

  // Check permission if required
  if (requiredPermission) {
    if (!hasPermission(user.role, requiredPermission)) {
      navigate('/unauthorized');
      return null;
    }
  }

  return <>{children}</>;
}
