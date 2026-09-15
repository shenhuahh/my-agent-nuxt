/// <reference types="node" />

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL!,
    ssl: { rejectUnauthorized: false }
  },
  verbose: true
})
