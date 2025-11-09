import { UserRole } from '@/types/auth';

export type Permission =
  | 'projects:create'
  | 'projects:read'
  | 'projects:update'
  | 'projects:delete'
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'indicators:create'
  | 'indicators:read'
  | 'indicators:update'
  | 'indicators:delete'
  | 'settings:manage';

const PERMISSIONS_MATRIX: Record<UserRole, Permission[]> = {
  admin: [
    'projects:create',
    'projects:read',
    'projects:update',
    'projects:delete',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'indicators:read',
    'settings:manage',
  ],
  chef_projet: [
    'projects:read',
    'indicators:create',
    'indicators:read',
    'indicators:update',
  ],
  donateur: ['projects:read', 'indicators:read'],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS_MATRIX[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function getAccessiblePages(role: UserRole): string[] {
  switch (role) {
    case 'admin':
      return ['/admin/dashboard', '/admin/users', '/admin/projects'];
    case 'chef_projet':
      return ['/chef/dashboard', '/chef/projects', '/chef/indicators'];
    case 'donateur':
      return ['/donateur/dashboard', '/donateur/projects'];
    default:
      return [];
  }
}
