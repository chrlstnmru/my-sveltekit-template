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