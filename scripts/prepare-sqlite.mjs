import { mkdir } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const DEFAULT_DATABASE_URL = "file:./data/stundenalfio.db";

function normalizeDatabaseUrl(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  const sqlitePath = databaseUrl.slice("file:".length);
  const resolvedPath = path.isAbsolute(sqlitePath)
    ? sqlitePath
    : path.resolve(process.cwd(), "prisma", sqlitePath);

  return `file:${resolvedPath}`;
}

loadEnvConfig(process.cwd());

const databaseUrl = normalizeDatabaseUrl(
  process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
);
process.env.DATABASE_URL = databaseUrl;

if (!databaseUrl.startsWith("file:")) {
  console.log(`Skipping SQLite preparation for non-file DATABASE_URL: ${databaseUrl}`);
  process.exit(0);
}

const sqlitePath = databaseUrl.slice("file:".length);
await mkdir(path.dirname(sqlitePath), { recursive: true });

console.log(`SQLite directory ready: ${path.dirname(sqlitePath)}`);
