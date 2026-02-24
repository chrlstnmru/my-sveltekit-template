import { and, isNotNull, isNull } from "drizzle-orm";
import { boolean, index, inet, integer, text, uniqueIndex } from "drizzle-orm/pg-core";

import { createSystemTable, timestamptz, uuidv7 } from "../helpers";
import { sharedMFAMethods, sharedRevokeReasons } from "../shared/enums";
import { systemOrganizationsTable } from "./organizations";

export const systemUsersTable = createSystemTable('users', {
  id: uuidv7().notNull().primaryKey(),
  organizationId: uuidv7().notNull().references(() => systemOrganizationsTable.id),
  email: text().notNull(),
  username: text(),
  password: text(),
  displayName: text(),
  failedLoginAttempts: integer().notNull().default(0),
  lockedUntil: timestamptz(),
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
  deletedAt: timestamptz(),
}, (t) => [
  uniqueIndex().on(t.organizationId, t.email).where(isNull(t.deletedAt)),
  uniqueIndex().on(t.organizationId, t.username).where(and(isNotNull(t.username), isNull(t.deletedAt))!),
  index().on(t.organizationId).where(isNull(t.deletedAt)),
  index().on(t.email),
]);

export const systemUserPasswordHistoryTable = createSystemTable('user_password_history', {
  id: uuidv7().notNull().primaryKey(),
  userId: uuidv7({ withDefault: false }).references(() => systemUsersTable.id),
  passwordHash: text().notNull(),
  createdAt: timestamptz().defaultNow(),
});

export const systemUserSessionsTable = createSystemTable('user_sessions', {
  id: uuidv7().notNull().primaryKey(),
  userId: uuidv7({ withDefault: false }).notNull().references(() => systemUsersTable.id),
  ipAddress: inet(),
  userAgent: text(),
  accessToken: text().notNull().unique(),
  accessTokenExpiresAt: timestamptz().notNull(),
  refreshToken: text().notNull().unique(),
  refreshTokenExpiresAt: timestamptz().notNull(),
  lastActivityAt: timestamptz().defaultNow(),
  revokeReason: sharedRevokeReasons(),
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
  revokedAt: timestamptz(),
}, (t) => [
  index().on(t.userId, t.revokedAt),
  index().on(t.accessToken).where(isNull(t.revokedAt)),
  index().on(t.refreshToken).where(isNull(t.revokedAt)),
]);

export const systemUserMfaTable = createSystemTable('user_mfa', {
  id: uuidv7().notNull().primaryKey(),
  userId: uuidv7({ withDefault: false }).notNull().references(() => systemUsersTable.id, { onDelete: 'cascade' }).unique(),
  method: sharedMFAMethods().notNull(),
  secret: text(),
  emailVerified: boolean().notNull().default(false),
  enabled: boolean().notNull().default(false),
  verifiedAt: timestamptz(),
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
}, (t) => [
  index().on(t.userId),
]);

export const systemUserMfaBackupCodesTable = createSystemTable('user_mfa_backup_codes', {
  id: uuidv7().notNull().primaryKey(),
  mfaId: uuidv7({ withDefault: false }).notNull().references(() => systemUserMfaTable.id, { onDelete: 'cascade' }),
  codeHash: text().notNull(),
  usedAt: timestamptz(),
  createdAt: timestamptz().defaultNow(),
}, (t) => [
  index().on(t.mfaId),
]);

export const systemUserMfaChallengesTable = createSystemTable('user_mfa_challenges', {
  id: uuidv7().notNull().primaryKey(),
  userId: uuidv7({ withDefault: false }).notNull().references(() => systemUsersTable.id, { onDelete: 'cascade' }),
  sessionId: uuidv7({ withDefault: false }).references(() => systemUserSessionsTable.id, { onDelete: 'cascade' }),
  method: sharedMFAMethods().notNull(),
  code: text(),
  codeHash: text(),
  attempts: integer().notNull().default(0),
  verifiedAt: timestamptz(),
  expiresAt: timestamptz().notNull(),
  createdAt: timestamptz().defaultNow(),
}, (t) => [
  index().on(t.userId),
  index().on(t.sessionId),
]);