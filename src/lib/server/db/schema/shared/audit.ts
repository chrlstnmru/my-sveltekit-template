import { boolean } from 'drizzle-orm/pg-core';

import { createSharedTable, text, timestamptz } from '../helpers';

export const sharedAuditEventTypesTable = createSharedTable('audit_event_types', {
  code: text().notNull().primaryKey(),
  name: text().notNull(),
  description: text(),
  severity: text({ enum: ['info', 'warning', 'critical'] }),
  isSystem: boolean().default(true),
  createdAt: timestamptz().defaultNow(),
});

export const sharedRowStatusTypesTable = createSharedTable('row_status_types', {
  code: text().notNull().primaryKey(),
  name: text().notNull(),
  description: text(),
});
