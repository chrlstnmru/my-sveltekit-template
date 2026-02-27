import type { InferEnum } from 'drizzle-orm';

import type {
  LockoutPolicyConfig,
  MFAPolicyConfig,
  OAuthPolicyConfig,
  PasswordPolicyConfig,
  SessionPolicyConfig
} from '$lib/server/db/types';

import type { sharedPermissionScope } from './server/db/schema';

export const DEFAULT_SESSION_POLICY_CONFIG: SessionPolicyConfig = {
  maxConcurrentSessions: 1,
  sessionIdleTimeoutMinutes: 15,
  sessionAbsoluteTimeoutMinutes: 28800, // 8 hours
  rememberMeAbsoluteTimeoutDays: 30,
  sessionExpiryWarningMinutes: 10
};

export const DEFAULT_PASSOWRD_POLICY_CONFIG: PasswordPolicyConfig = {
  minLength: 8,
  requirements: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  },
  preventPasswordReuse: 5
};

export const DEFAULT_MFA_POLICY_CONFIG: MFAPolicyConfig = {
  required: false,
  allowBackupCodes: true,
  allowedMethods: ['totp']
};

export const DEFAULT_OAUTH_POLICY_CONFIG: OAuthPolicyConfig = {
  allowedProviders: [],
  autoLinkEmail: false
};

export const DEFAULT_LOCKOUT_POLICY_CONFIG: LockoutPolicyConfig = {
  maxFailedAttempts: 5,
  failedAttemptsTimeoutMinutes: 5,
  lockoutTimeoutMinutes: -1 // Permanent lockout
};

export const PERMISSIONS = [
  { key: '*', name: 'Root' },

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
