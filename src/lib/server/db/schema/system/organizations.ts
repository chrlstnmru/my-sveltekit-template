import { isNull } from "drizzle-orm";
import { boolean, index, jsonb } from "drizzle-orm/pg-core";

import { DEFAULT_LOCKOUT_POLICY_CONFIG, DEFAULT_MFA_POLICY_CONFIG, DEFAULT_OAUTH_POLICY_CONFIG, DEFAULT_PASSOWRD_POLICY_CONFIG, DEFAULT_SESSION_POLICY_CONFIG } from "$lib/const";

import type { LockoutPolicyConfig, MFAPolicyConfig, OAuthPolicyConfig, PasswordPolicyConfig, SessionPolicyConfig } from "../../types";

import { createSystemTable, text, timestamptz, uuidv7 } from "../helpers";
import { systemUsersTable } from "./users";

export const systemOrganizationsTable = createSystemTable('organizations', {
  id: uuidv7().notNull().primaryKey(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
  deletedAt: timestamptz(),
}, (t) => [
  index().on(t.slug).where(isNull(t.deletedAt)),
]);

export const systemOrganizationSettingsTable = createSystemTable('organization_settings', {
  organizationId: uuidv7({ withDefault: false }).notNull().primaryKey().references(() => systemOrganizationsTable.id),
  enableSessionPolicy: boolean().default(false),
  sessionPolicyConfig: jsonb().$type<Partial<SessionPolicyConfig>>().default(DEFAULT_SESSION_POLICY_CONFIG),
  enableMFAPolicy: boolean().default(false),
  mfaPolicyConfig: jsonb().$type<Partial<MFAPolicyConfig>>().default(DEFAULT_MFA_POLICY_CONFIG),
  enablePasswordPolicy: boolean().default(true),
  passwordPolicyConfig: jsonb().$type<Partial<PasswordPolicyConfig>>().default(DEFAULT_PASSOWRD_POLICY_CONFIG),
  enableOAuthPolicy: boolean().default(false),
  oauthPolicyConfig: jsonb().$type<Partial<OAuthPolicyConfig>>().default(DEFAULT_OAUTH_POLICY_CONFIG),
  enableLockoutPolicy: boolean().default(false),
  lockoutPolicyConfig: jsonb().$type<Partial<LockoutPolicyConfig>>().default(DEFAULT_LOCKOUT_POLICY_CONFIG),
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
});

export const systemSetupTable = createSystemTable('setup', {
  id: uuidv7().notNull().primaryKey(),
  organizationId: uuidv7({ withDefault: false}).notNull().references(() => systemOrganizationsTable.id),
  rootUserId: uuidv7({ withDefault: false}).notNull().references(() => systemUsersTable.id),
  completedAt: timestamptz(),
  appVersion: text().notNull().default('1.0.0'),
  createdAt: timestamptz().defaultNow(),
});