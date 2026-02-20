import type { DrizzleConfig } from 'drizzle-orm';
import type { Sql } from 'postgres';

import { relations } from './relations';
import * as schema from './schema';

export function createDrizzleConfig<TClient extends Sql>(
  client: TClient
): DrizzleConfig<Record<string, unknown>> & { client: TClient } {
  return {
    client,
    schema,
    relations,
    casing: 'snake_case'
  };
}
