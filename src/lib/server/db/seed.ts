import { DrizzleQueryError } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { exit } from 'node:process';
import postgres from 'postgres';

import { PERMISSIONS } from '$lib/const';
import { sharedPermissionsTable } from '$lib/server/db/schema';

import { createDrizzleConfig } from './config';

import 'dotenv/config';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const client = postgres(process!.env.DATABASE_URL);
const config = createDrizzleConfig(client);
const db = drizzle({ ...config, client });

async function createTransaction(callback: Parameters<typeof db.transaction>[0]) {
  return db.transaction(async (trx) => {
    try {
      await callback(trx);
    } catch (error: unknown) {
      if (error instanceof DrizzleQueryError) {
        console.error(error.cause);
      } else {
        console.error(error);
      }
      trx.rollback();
    }
  });
}

async function main() {
  // Permissions

  console.time('\ndb seeder took');
  await createTransaction(async (trx) => {
    for (const permission of PERMISSIONS) {
      console.info(`Creating permission ${permission.key}`);
      await trx
        .insert(sharedPermissionsTable)
        .values({
          key: permission.key,
          name: permission.name,
        })
        .onConflictDoNothing();
    }
  });

  console.timeEnd('\ndb seeder took');
  return exit();
}

main();
