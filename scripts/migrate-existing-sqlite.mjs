import { constants as fsConstants } from "node:fs";
import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const DEFAULT_DATABASE_URL = "file:./data/stundenalfio.db";
const PRISMA_CLI_PATH = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");

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

function getBackupFolderName() {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z").replace(/:/g, "-");
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function backupExistingDatabase(databasePath) {
  const backupDirectory = path.join(
    path.dirname(databasePath),
    "backups",
    getBackupFolderName(),
  );

  await mkdir(backupDirectory, { recursive: true });

  const filesToCopy = [databasePath, `${databasePath}-wal`, `${databasePath}-shm`];
  const copiedFiles = [];

  for (const filePath of filesToCopy) {
    if (!(await fileExists(filePath))) {
      continue;
    }

    const targetPath = path.join(backupDirectory, path.basename(filePath));
    await copyFile(filePath, targetPath);
    copiedFiles.push(targetPath);
  }

  return { backupDirectory, copiedFiles };
}

function runPrismaMigrateDeploy() {
  const result = spawnSync(process.execPath, [PRISMA_CLI_PATH, "migrate", "deploy"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`Prisma migration failed with exit code ${result.status ?? "unknown"}.`);
  }
}

async function main() {
  loadEnvConfig(process.cwd());

  const databaseUrl = normalizeDatabaseUrl(
    process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
  );
  process.env.DATABASE_URL = databaseUrl;

  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      `DATABASE_URL must point to an existing SQLite file for safe migration, got "${databaseUrl}".`,
    );
  }

  const databasePath = databaseUrl.slice("file:".length);

  if (!(await fileExists(databasePath))) {
    throw new Error(
      `SQLite database not found at ${databasePath}. Aborting so no new empty database is created by mistake.`,
    );
  }

  console.log(`Using existing SQLite database: ${databasePath}`);

  const { backupDirectory, copiedFiles } = await backupExistingDatabase(databasePath);
  console.log(`Backup created in: ${backupDirectory}`);

  if (copiedFiles.length > 0) {
    console.log(`Backed up files: ${copiedFiles.map((filePath) => path.basename(filePath)).join(", ")}`);
  }

  runPrismaMigrateDeploy();

  console.log("SQLite migration completed successfully.");
}

main().catch((error) => {
  console.error("Safe SQLite migration failed.", error);
  process.exit(1);
});
