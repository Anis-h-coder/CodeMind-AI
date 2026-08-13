import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

export default defineConfig({
  schema: './backend/src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
});
