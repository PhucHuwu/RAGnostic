import path from "node:path";
import express from "express";
import next from "next";
import { createApiServer } from "./index";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
  dir: path.resolve(import.meta.dirname, ".."),
  hostname: host,
  port,
});
const handle = app.getRequestHandler();

async function bootstrap() {
  await app.prepare();

  const server = express();
  server.use(createApiServer());

  server.all("/{*path}", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, host, () => {
    console.log(`RAGnostic server running at http://${host}:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start frontend server", error);
  process.exit(1);
});
