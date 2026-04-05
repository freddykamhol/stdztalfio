import "server-only";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const globalForEnv = globalThis as typeof globalThis & {
  stundenalfioEnvLoaded?: boolean;
};

if (!globalForEnv.stundenalfioEnvLoaded) {
  loadEnvConfig(process.cwd());
  globalForEnv.stundenalfioEnvLoaded = true;
}
