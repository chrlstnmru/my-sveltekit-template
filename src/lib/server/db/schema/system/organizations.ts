import { isNull } from "drizzle-orm";
import { index, jsonb } from "drizzle-orm/pg-core";

import { DEFAULT_LOCKOUT_POLICY_CONFIG, DEFAULT_MFA_POLICY_CONFIG, DEFAULT_OAUTH_POLICY_CONFIG, DEFAULT_PASSOWRD_POLICY_CONFIG, DEFAULT_SESSION_POLICY_CONFIG } from "$lib/constants/policies";

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
  sessionPolicyConfig: jsonb().$type<Partial<SessionPolicyConfig>>().default(DEFAULT_SESSION_POLICY_CONFIG),
  mfaPolicyConfig: jsonb().$type<Partial<MFAPolicyConfig>>().default(DEFAULT_MFA_POLICY_CONFIG),
  passwordPolicyConfig: jsonb().$type<Partial<PasswordPolicyConfig>>().default(DEFAULT_PASSOWRD_POLICY_CONFIG),
  oauthPolicyConfig: jsonb().$type<Partial<OAuthPolicyConfig>>().default(DEFAULT_OAUTH_POLICY_CONFIG),
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