import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { metricsMiddleware } from "./lib/metrics";
import healthRouter from "./routes/health";
import proxyRouter from "./routes/proxy";

const app = express();
const port = process.env.PORT ?? 3000;

// Better Auth must handle /api/auth/* before express.json() (see Better Auth Express docs)
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());
app.use(metricsMiddleware);
app.use("/health", healthRouter);

app.get("/", (_req, res) => {
  res.json({ ok: true });
});

app.get("/metrics", (_req, res) => {
  res.redirect(307, "/health/metrics");
});

/** Proxy to backend servers (user, file, system) after auth. Requires Bearer token or X-Auth-Token. */
app.use(proxyRouter);

const host = process.env.HOST ?? "0.0.0.0";
app.listen(Number(port), host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
