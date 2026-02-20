/* eslint-disable node/no-process-env */
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
  schema: './src/lib/server/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
  schemaFilter: ['shared', 'system'],
  casing: 'snake_case',
  verbose: true,
  strict: true
});
