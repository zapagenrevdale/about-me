import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// biome-ignore lint/performance/noNamespaceImport: Drizzle expects a schema object built from table exports.
import * as schema from "./schema";

type TursoClient = ReturnType<typeof createClient>;
type Database = ReturnType<typeof createDatabase>;

let tursoClient: TursoClient | null = null;
let database: Database | null = null;

function getTursoClient() {
  if (tursoClient) {
    return tursoClient;
  }

  const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  tursoClient = createClient(
    authToken
      ? {
          url: databaseUrl,
          authToken,
        }
      : {
          url: databaseUrl,
        }
  );

  return tursoClient;
}

function createDatabase() {
  return drizzle(getTursoClient(), { schema });
}

export function getDb() {
  database ??= createDatabase();
  return database;
}
