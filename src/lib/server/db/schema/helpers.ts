import type { PgUUIDBuilder, SetHasDefault } from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';
import { pgSchema, pgTable, text as pgText, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const publicSchema = pgTable;
export const systemSchema = pgSchema('system');
export const sharedSchema = pgSchema('shared');

export const createPublicTable = publicSchema;
export const createSystemTable = systemSchema.table;
export const createSharedTable = sharedSchema.table;

export function createSharedEnum<U extends string, T extends Readonly<[U, ...U[]]>>(
  name: string,
  values: T
) {
  return sharedSchema.enum(name, values);
}

type UUIDv7Options = {
  withDefault: boolean;
};

type TimestamptzOptions = {
  update: boolean;
};

type TextOptions = Parameters<typeof varchar>[1];

export function uuidv7(): SetHasDefault<PgUUIDBuilder>;
export function uuidv7<T extends { withDefault: true }>(config: T): SetHasDefault<PgUUIDBuilder>;
export function uuidv7<T extends UUIDv7Options>(config: T): PgUUIDBuilder;
export function uuidv7(config: Partial<UUIDv7Options> = {}) {
  const { withDefault = true } = config;
  return withDefault ? uuid().default(sql`uuidv7()`) : uuid();
}

export function timestamptz({ update }: Partial<TimestamptzOptions> | undefined = {}) {
  const base = timestamp({ withTimezone: true });
  return update ? base.$onUpdate(() => sql`CURRENT_TIMESTAMP`) : base;
}

export function text({ length, enum: enumValues }: Partial<TextOptions> | undefined = {}) {
  const enumData = enumValues ? { enum: enumValues } : {};
  return length ? varchar({ length, ...enumData }) : pgText({ ...enumData });
}
