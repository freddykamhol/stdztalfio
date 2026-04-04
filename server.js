import { createServer } from "node:http";
import { parse } from "node:url";
import { loadEnvConfig } from "@next/env";
import next from "next";

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
