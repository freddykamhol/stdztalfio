import { rm } from "node:fs/promises";
import path from "node:path";

const targetDir = path.join(process.cwd(), "public", "_next");

async function main() {
  await rm(targetDir, { force: true, recursive: true });
  console.log("Removed public/_next before build");
}

main().catch((error) => {
  console.error("Failed to remove public/_next before build.", error);
  process.exit(1);
});
