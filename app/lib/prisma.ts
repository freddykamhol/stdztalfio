import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getDatabaseUrl } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

function createPrismaClient() {
  const databaseUrl = getDatabaseUrl();

  const pool =
    globalForPrisma.prismaPool ??
    new Pool({
      connectionString: databaseUrl,
      max: process.env.NODE_ENV === "production" ? 10 : 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: process.env.NODE_ENV !== "production",
    });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaPool = pool;
  }

  return client;
}

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export async function checkDatabaseHealth() {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRawUnsafe("SELECT 1");

    return {
      detail: "Database connection succeeded.",
      ok: true,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown database error.";

    return {
      detail,
      ok: false,
    };
  }
}
