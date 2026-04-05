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

const requiredEnvNames = [
  "SITE_PASSWORD",
  "STUNDEN_FORM_PASSWORD",
  "STUNDEN_FORM_LINK_TOKEN",
];

const missing = requiredEnvNames.filter((name) => {
  const value = process.env[name]?.trim();
  return !value;
});

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const databaseUrl = normalizeDatabaseUrl(
  process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
);
process.env.DATABASE_URL = databaseUrl;

if (!databaseUrl.startsWith("file:")) {
  console.error(`DATABASE_URL is invalid. Expected a SQLite file: URL, got "${databaseUrl}".`);
  process.exit(1);
}

console.log("Runtime environment variables look valid.");
