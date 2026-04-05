import "server-only";
import "./load-env";

function leseEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function requireEnv(name: string) {
  const value = leseEnv(name);

  if (!value) {
    throw new Error(
      `${name} fehlt. Lege die Variable in der Server-Umgebung oder in "./.env" im Projekt-Root an.`,
    );
  }

  return value;
}

export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function getDatabaseUrl() {
  return requireEnv("DATABASE_URL");
}

export function getSitePassword() {
  return requireEnv("SITE_PASSWORD");
}

export function getStundenFormPassword() {
  return requireEnv("STUNDEN_FORM_PASSWORD");
}

export function getStundenFormLinkToken() {
  return requireEnv("STUNDEN_FORM_LINK_TOKEN");
}

export function getRuntimeConfigurationStatus() {
  const databaseUrl = leseEnv("DATABASE_URL");
  const sitePassword = leseEnv("SITE_PASSWORD");
  const stundenFormPassword = leseEnv("STUNDEN_FORM_PASSWORD");
  const stundenFormLinkToken = leseEnv("STUNDEN_FORM_LINK_TOKEN");

  return {
    databaseConfigured: Boolean(databaseUrl),
    databaseUrlScheme:
      databaseUrl && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))
        ? databaseUrl.split(":")[0]
        : null,
    environment: process.env.NODE_ENV ?? "development",
    sitePasswordConfigured: Boolean(sitePassword),
    stundenFormLinkTokenConfigured: Boolean(stundenFormLinkToken),
    stundenFormPasswordConfigured: Boolean(stundenFormPassword),
  };
}
