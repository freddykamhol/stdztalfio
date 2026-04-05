import "server-only";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const DEFAULT_DATABASE_URL = "file:./data/stundenalfio.db";

function normalizeDatabaseUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  const sqlitePath = databaseUrl.slice("file:".length);
  const resolvedPath = path.isAbsolute(sqlitePath)
    ? sqlitePath
    : path.resolve(process.cwd(), "prisma", sqlitePath);

  return `file:${resolvedPath}`;
}

const globalForEnv = globalThis as typeof globalThis & {
  stundenalfioEnvLoaded?: boolean;
};

if (!globalForEnv.stundenalfioEnvLoaded) {
  loadEnvConfig(process.cwd());
  process.env.DATABASE_URL = normalizeDatabaseUrl(
    process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
  );

  globalForEnv.stundenalfioEnvLoaded = true;
}
