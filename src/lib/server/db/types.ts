import type { InferEnum, InferInsertModel } from 'drizzle-orm';
import type * as v from 'valibot';

import type { SessionPolicySchema } from '$lib/validators';

import type {
  sharedMFAMethods,
  sharedOAuthProviders,
  sharedPermissionScope,
  sharedRevokeReasons,
  systemBranchesTable,
  systemOrganizationsTable,
  systemUserMfaBackupCodesTable,
  systemUserMfaChallengesTable,
  systemUserMfaTable,
  systemUsersTable
} from './schema';

export type RoleScope = InferEnum<typeof sharedPermissionScope>;
export type MFAMethod = InferEnum<typeof sharedMFAMethods>;
export type OAuthProvider = InferEnum<typeof sharedOAuthProviders>;
export type RevokeReason = InferEnum<typeof sharedRevokeReasons>;

export type SessionPolicyConfig = v.InferOutput<typeof SessionPolicySchema>;

export type MFAPolicyConfig = {
  required: boolean;
  allowedMethods: MFAMethod[];
  allowBackupCodes: boolean;
};

export type OAuthPolicyConfig = {
  allowedProviders: OAuthProvider[] | [];
  autoLinkEmail: boolean;
};

export type LockoutPolicyConfig = {
  maxFailedAttempts: number;
  failedAttemptsTimeoutMinutes: number;
  lockoutTimeoutMinutes: number;
};

export type SystemOrganizationPayload = InferInsertModel<typeof systemOrganizationsTable>;
export type SystemBranchPayload = InferInsertModel<typeof systemBranchesTable>;
export type SystemUserPayload = InferInsertModel<typeof systemUsersTable>;
export type SystemUserMfaPayload = InferInsertModel<typeof systemUserMfaTable>;
export type SystemUserMfaBackupCodePayload = InferInsertModel<typeof systemUserMfaBackupCodesTable>;
export type SystemUserMfaChallengePayload = InferInsertModel<typeof systemUserMfaChallengesTable>;
