import "server-only";
import { loadEnvConfig } from "@next/env";

const globalForEnv = globalThis as typeof globalThis & {
  stundenalfioEnvLoaded?: boolean;
};

if (!globalForEnv.stundenalfioEnvLoaded) {
  loadEnvConfig(process.cwd());
  globalForEnv.stundenalfioEnvLoaded = true;
}
