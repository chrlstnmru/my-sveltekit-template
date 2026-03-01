import type { InferEnum } from 'drizzle-orm';

import type { sharedPermissionScope } from '$lib/server/db/schema';

export const PERMISSIONS = [
  { key: '*', name: 'Root' },

  { key: 'auth.session.update-policy', name: 'Update Session Policy' },

  { key: 'auth.user.create', name: 'Create User' },
  { key: 'auth.user.list', name: 'List All Users' },
  { key: 'auth.user.view', name: 'View User' },
  { key: 'auth.user.update', name: 'Update User' },
  { key: 'auth.user.delete', name: 'Delete User' },

  { key: 'hr.employee.create', name: 'Create Employee' },
  { key: 'hr.employee.list', name: 'List All Employees' },
  { key: 'hr.employee.view', name: 'View Employee' },
  { key: 'hr.employee.update', name: 'Update Employee' },
  { key: 'hr.employee.update.request', name: 'Request Employee Update' },
  { key: 'hr.employee.update.approve', name: 'Update Employee' },
  { key: 'hr.employee.update.reject', name: 'Reject Employee Update' },
  { key: 'hr.employee.delete', name: 'Delete Employee' }
] as const;

type PermissionKey = (typeof PERMISSIONS)[number]['key'];

type Permission = {
  key: PermissionKey;
  name: string;
  description?: string | null;
};

type Role = {
  name: string;
  description?: string | null;
  permissions: (Permission['key'] | '*')[];
  scope: InferEnum<typeof sharedPermissionScope>;
  isAssignable?: boolean;
  isRemovable?: boolean;
};

export const BUILTIN_ROLES: Role[] = [
  {
    name: 'Owner',
    description: 'Owner of the organization',
    permissions: ['*'],
    scope: 'organization',
    isAssignable: false,
    isRemovable: false
  },
  {
    name: 'Employee',
    description: 'Default role for employees',
    permissions: ['auth.user.view', 'hr.employee.update.request'],
    scope: 'self',
    isAssignable: false,
    isRemovable: false
  }
];
