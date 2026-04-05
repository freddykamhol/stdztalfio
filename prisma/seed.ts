import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, TimeEntryStatus } from "@prisma/client";
import { Pool } from "pg";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL fehlt. Lege sie in "./.env" oder in der Server-Umgebung an.');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      status: TimeEntryStatus.SUBMITTED,
    },
    create: {
      userId: user.id,
      projectId: project.id,
      date: today,
      minutes: 120,
      note: "Starter-Eintrag für das neue Projekt.",
      status: TimeEntryStatus.SUBMITTED,
    },
  });

  const jetzt = new Date();

  // UTC-Konstruktion verhindert Datums- und Uhrzeitverschiebungen beim Schreiben in Postgres.
  const arbeitsDatum = new Date(
    Date.UTC(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate(), 0, 0, 0),
  );
  const beginn = new Date(Date.UTC(1970, 0, 1, 7, 0, 0));
  const ende = new Date(Date.UTC(1970, 0, 1, 16, 0, 0));

  await prisma.stunde.deleteMany({
    where: {
      baustellen: "Musterbaustelle",
    },
  });

  await prisma.stunde.create({
    data: {
      datum: arbeitsDatum,
      beginn,
      ende,
      pauseDauer: 30,
      stundenGes: "8.50",
      baustellen: "Musterbaustelle",
      uebernachtung: false,
      tankKosten: "42.50",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
