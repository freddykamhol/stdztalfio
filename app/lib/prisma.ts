import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
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
