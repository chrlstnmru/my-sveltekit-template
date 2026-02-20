import { index, primaryKey, text } from "drizzle-orm/pg-core";

import { createSystemTable, timestamptz, uuidv7 } from "../helpers";
import { systemOrganizationsTable } from "./organizations";
import { systemUsersTable } from "./users";

export const systemGroupsTable = createSystemTable('groups', {
  id: uuidv7().notNull().primaryKey(),
  organizationId: uuidv7({ withDefault: false }).references(() => systemOrganizationsTable.id),
  name: text().notNull(),
  description: text(),
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
  deletedAt: timestamptz(),
});

export const systemGroupUsersTable = createSystemTable('group_users', {
  groupId: uuidv7({ withDefault: false }).references(() => systemGroupsTable.id),
  userId: uuidv7({ withDefault: false }).references(() => systemUsersTable.id),
}, (t) => [
  primaryKey({ columns: [t.groupId, t.userId] }),
  index().on(t.userId),
]);