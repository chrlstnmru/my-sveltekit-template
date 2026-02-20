import { isNull } from "drizzle-orm";
import { index, text, uniqueIndex } from "drizzle-orm/pg-core";

import { createSystemTable, timestamptz, uuidv7 } from "../helpers";
import { systemOrganizationsTable } from "./organizations";
import { systemUsersTable } from "./users";

export const systemEmployeesTable = createSystemTable('employees', {
  id: uuidv7().notNull().primaryKey(),
  organizationId: uuidv7({ withDefault: false }).references(() => systemOrganizationsTable.id),
  employeeId: text().notNull(),
  userId: uuidv7({ withDefault: false }).references(() => systemUsersTable.id),
  firstName: text().notNull(),
  lastName: text().notNull(),
  middleName: text(),
  suffix: text(),
  email: text().notNull(),
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
  deletedAt: timestamptz(),
}, (t) => [
  index().on(t.userId).where(isNull(t.deletedAt)),
  uniqueIndex().on(t.organizationId, t.employeeId).where(isNull(t.deletedAt))
]);