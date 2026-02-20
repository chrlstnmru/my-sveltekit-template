import { boolean, integer, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";

import { createSystemTable, timestamptz, uuidv7 } from "../helpers";
import { sharedPermissionScope, sharedPermissionsTable } from "../shared";
import { systemGroupsTable } from "./groups";
import { systemOrganizationsTable } from "./organizations";
import { systemUsersTable } from "./users";

export const systemRolesTable = createSystemTable('roles', {
  id: uuidv7().notNull().primaryKey(),
  organizationId: uuidv7({ withDefault: false }).references(() => systemOrganizationsTable.id),
  name: text().notNull(),
  priority: integer().notNull().default(0),
  isBuiltIn: boolean().notNull().default(false),
  isAssignable: boolean().notNull().default(true),
  isRemovable: boolean().notNull().default(false),
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
  deletedAt: timestamptz(),
});

export const systemRolePermissionsTable = createSystemTable('role_permissions', {
  roleId: uuidv7({ withDefault: false }).notNull().references(() => systemRolesTable.id),
  permissionKey: text().notNull().references(() => sharedPermissionsTable.key),
  scope: sharedPermissionScope().notNull()
}, (t) => [
  uniqueIndex().on(t.roleId, t.permissionKey, t.scope),
]);

export const systemUserRolesTable = createSystemTable('user_roles', {
  userId: uuidv7({ withDefault: false }).references(() => systemUsersTable.id),
  roleId: uuidv7({ withDefault: false }).references(() => systemRolesTable.id),
}, (t) => [
  primaryKey({columns: [t.userId, t.roleId]})
]);

export const systemGroupRolesTable = createSystemTable('group_roles', {
  groupId: uuidv7({ withDefault: false }).references(() => systemGroupsTable.id),
  roleId: uuidv7({ withDefault: false }).references(() => systemRolesTable.id),
}, (t) => [
  primaryKey({columns: [t.groupId, t.roleId]})
]);