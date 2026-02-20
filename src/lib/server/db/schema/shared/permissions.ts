import { createSharedTable, text } from "../helpers";

export const sharedPermissionsTable = createSharedTable('permissions', {
  key: text().notNull().primaryKey(),
  name: text().notNull(),
  description: text(),
});