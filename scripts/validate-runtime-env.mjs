import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const requiredEnvNames = [
  "DATABASE_URL",
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

const databaseUrl = process.env.DATABASE_URL;

try {
  const parsed = new URL(databaseUrl);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(`Expected postgres:// or postgresql://, got ${parsed.protocol}`);
  }
} catch (error) {
  console.error("DATABASE_URL is invalid.", error);
  process.exit(1);
}

console.log("Runtime environment variables look valid.");
