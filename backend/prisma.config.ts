import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL!,
  },
});
