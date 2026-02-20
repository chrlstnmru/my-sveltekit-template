import type { DrizzleConfig } from 'drizzle-orm';
import type { Sql } from 'postgres';

import { relations } from './relations';
import * as schema from './schema';

type Schema = typeof schema;
type Relations = typeof relations;

export function createDrizzleConfig<TClient extends Sql>(
  client: TClient
): DrizzleConfig<Schema, Relations> & { client: TClient } {
  return {
    client,
    schema,
    relations,
    casing: 'snake_case'
  };
}
