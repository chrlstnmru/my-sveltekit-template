import { createSharedEnum } from "../helpers";

export const sharedPermissionScope = createSharedEnum('permission_scope', [
  'self',
  'organization',
  'branch',
  'any'
]);

export const sharedOAuthProviders = createSharedEnum('oauth_provider', [
  'google',
  'github',
]);

export const sharedMFAMethods = createSharedEnum('mfa_method', [
  'totp',
  'email',
]);

export const sharedRevokeReasons = createSharedEnum('revoke_reason', [
  'expired',
  'password_change',
  'mfa_change',
  'session_limit_exceeded',
  'admin_revoked'
]);