import { isNull } from "drizzle-orm";
import { index, text } from "drizzle-orm/pg-core";

import { createSystemTable, timestamptz, uuidv7 } from "../helpers";
import { systemOrganizationsTable } from "./organizations";

export const systemBranchesTable = createSystemTable('branches', {
  id: uuidv7().notNull().primaryKey(),
  code: text().notNull().unique(),
  name: text().notNull(),
  organizationId: uuidv7().notNull().references(() => systemOrganizationsTable.id),
  createdAt: timestamptz().defaultNow(),
  updatedAt: timestamptz({ update: true }).defaultNow(),
  deletedAt: timestamptz(),
}, (t) => [
  index().on(t.code).where(isNull(t.deletedAt)),
  index().on(t.organizationId).where(isNull(t.deletedAt)),
]);
