import { createServer } from "node:http";
import { parse } from "node:url";
import nextEnv from "@next/env";
import next from "next";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const dev = process.env.NODE_ENV !== "production";
const host = process.env.HOST ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const app = next({
  dev,
  hostname: host,
  port,
});

const handle = app.getRequestHandler();

function requireServerEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} fehlt. Lege die Variable vor dem Start in der Runtime an.`);
  }
}

requireServerEnv("DATABASE_URL");
requireServerEnv("SITE_PASSWORD");
requireServerEnv("STUNDEN_FORM_PASSWORD");
requireServerEnv("STUNDEN_FORM_LINK_TOKEN");

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url ?? "/", true);
      handle(req, res, parsedUrl);
    }).listen(port, host, () => {
      console.log(`Stundenalfio laeuft auf http://${host}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Server konnte nicht gestartet werden.", error);
    process.exit(1);
  });
