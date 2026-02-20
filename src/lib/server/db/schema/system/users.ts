import { and, isNotNull, isNull } from "drizzle-orm";
import { index, inet, text, uniqueIndex } from "drizzle-orm/pg-core";

import { createSystemTable, timestamptz, uuidv7 } from "../helpers";
import { systemOrganizationsTable } from "./organizations";

export const systemUsersTable = createSystemTable('users', {
  id: uuidv7().notNull().primaryKey(),
  organizationId: uuidv7().notNull().references(() => systemOrganizationsTable.id),
  email: text().notNull(),
  username: text(),
  password: text(),
  displayName: text(),
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
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
  revokedAt: timestamptz(),
}, (t) => [
  index().on(t.userId, t.revokedAt),
  index().on(t.accessToken).where(isNull(t.revokedAt)),
  index().on(t.refreshToken).where(isNull(t.revokedAt)),
]);