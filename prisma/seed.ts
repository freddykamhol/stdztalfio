import path from "node:path";
import { PrismaClient } from "@prisma/client";
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

loadEnvConfig(process.cwd());
process.env.DATABASE_URL = normalizeDatabaseUrl(
  process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
);

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: "alfio" },
    update: { name: "Alfio Workspace" },
    create: {
      name: "Alfio Workspace",
      slug: "alfio",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo@stundenalfio.local" },
    update: {
      name: "Demo User",
      workspaceId: workspace.id,
    },
    create: {
      workspaceId: workspace.id,
      name: "Demo User",
      email: "demo@stundenalfio.local",
    },
  });

  const project = await prisma.project.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: "onboarding",
      },
    },
    update: {
      name: "Onboarding",
      color: "#E20613",
    },
    create: {
      workspaceId: workspace.id,
      name: "Onboarding",
      slug: "onboarding",
      description: "Erster Seed für Stundenalfio.",
      color: "#E20613",
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.timeEntry.upsert({
    where: {
      userId_projectId_date: {
        userId: user.id,
        projectId: project.id,
        date: today,
      },
    },
    update: {
      minutes: 120,
      note: "Starter-Eintrag für das neue Projekt.",
      status: "SUBMITTED",
    },
    create: {
      userId: user.id,
      projectId: project.id,
      date: today,
      minutes: 120,
      note: "Starter-Eintrag für das neue Projekt.",
      status: "SUBMITTED",
    },
  });

  const jetzt = new Date();
  const arbeitsDatum = new Date(
    Date.UTC(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate(), 0, 0, 0),
  );

  await prisma.stunde.deleteMany({
    where: {
      baustellen: "Musterbaustelle",
    },
  });

  await prisma.stunde.create({
    data: {
      datum: arbeitsDatum,
      beginn: "07:00",
      ende: "16:00",
      pauseDauer: 30,
      stundenGes: 8.5,
      baustellen: "Musterbaustelle",
      uebernachtung: false,
      tankKosten: 42.5,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
