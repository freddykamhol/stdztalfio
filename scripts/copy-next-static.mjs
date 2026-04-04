import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceDir = path.join(projectRoot, ".next", "static");
const targetDir = path.join(projectRoot, "public", "_next", "static");

async function main() {
  await stat(sourceDir);
  await rm(targetDir, { force: true, recursive: true });
  await mkdir(path.dirname(targetDir), { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });
  console.log(`Copied Next static assets to ${path.relative(projectRoot, targetDir)}`);
}

main().catch((error) => {
  console.error("Failed to copy Next static assets.", error);
  process.exit(1);
});
