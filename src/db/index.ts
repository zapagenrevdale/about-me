import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// biome-ignore lint/performance/noNamespaceImport: Drizzle expects a schema object built from table exports.
import * as schema from "./schema";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const turso = createClient(
  authToken
    ? {
        url: databaseUrl,
        authToken,
      }
    : {
        url: databaseUrl,
      }
);

export const db = drizzle(turso, { schema });
