import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import proxyRouter from "./routes/proxy";
import cors from "cors";

function logError(message: string, err: unknown): void {
  const timestamp = new Date().toISOString();
  const payload: Record<string, unknown> = {
    timestamp,
    message,
    error: err instanceof Error ? err.message : String(err),
  };
  if (err instanceof Error && err.stack) {
    payload.stack = err.stack;
  }
  console.error(JSON.stringify({ level: "error", ...payload }));
}

const app = express();
const port = process.env.PORT ?? 3000;

// Better Auth must handle /api/auth/* before express.json() (see Better Auth Express docs)
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
}));

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true });
});

/** Proxy to backend servers (user, file, system) after auth. Requires Bearer token or X-Auth-Token. */
app.use(proxyRouter);

/** Global error handler: log and respond for any unhandled route errors. */
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError("Unhandled request error", err);
  res.status(500).json({ error: "Internal server error" });
});

process.on("uncaughtException", (err) => {
  logError("Uncaught exception", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logError("Unhandled promise rejection", reason instanceof Error ? reason : { reason, promise });
});

const host = process.env.HOST ?? "0.0.0.0";
app.listen(Number(port), host, () => {
  console.log(`Server listening on http://${host}:${port}`);
}).on("error", (err) => {
  logError("Server listen error", err);
  process.exit(1);
});
