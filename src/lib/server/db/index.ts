import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { DATABASE_URL } from '$env/static/private';

import { createDrizzleConfig } from './config';

const client = postgres(DATABASE_URL);
const config = createDrizzleConfig(client);
export const db = drizzle(config);
export type DB = typeof db;
