import type {
  LockoutPolicyConfig,
  MFAPolicyConfig,
  OAuthPolicyConfig,
  PasswordPolicyConfig,
  SessionPolicyConfig
} from '$lib/server/db/types';

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
