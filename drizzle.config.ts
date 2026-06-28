import "dotenv/config";

import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: authToken
    ? {
        url: databaseUrl,
        authToken,
      }
    : {
        url: databaseUrl,
      },
});
