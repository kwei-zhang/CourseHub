import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { renderPrometheusMetrics } from "../lib/metrics";
import { fileClient, resourceClient, systemClient, userClient } from "../lib/grpc/client";

type DependencyStatus = "ok" | "error";

type CheckResult = {
  name: string;
  status: DependencyStatus;
  detail?: string;
};

const router = Router();
const readinessTimeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? 1000);

function checkGrpcClient(name: string, client: { waitForReady: grpcDeadlineCallback }): Promise<CheckResult> {
  return new Promise((resolve) => {
    const deadline = new Date(Date.now() + readinessTimeoutMs);
    client.waitForReady(deadline, (err?: Error | null) => {
      if (err) {
        resolve({ name, status: "error", detail: err.message });
        return;
      }

      resolve({ name, status: "ok" });
    });
  });
}

type grpcDeadlineCallback = (
  deadline: Date,
  callback: (error?: Error | null) => void
) => void;

export async function runReadinessChecks(): Promise<CheckResult[]> {
  const checks = await Promise.all([
    prisma.$queryRawUnsafe("SELECT 1")
      .then(() => ({ name: "database", status: "ok" as const }))
      .catch((err: unknown) => ({
        name: "database",
        status: "error" as const,
        detail: err instanceof Error ? err.message : "Unknown database error",
      })),
    checkGrpcClient("user-grpc", userClient),
    checkGrpcClient("resource-grpc", resourceClient),
    checkGrpcClient("file-grpc", fileClient),
    checkGrpcClient("system-grpc", systemClient),
  ]);

  return checks;
}

router.get("/live", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "auth",
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get("/ready", async (_req: Request, res: Response): Promise<void> => {
  const checks = await runReadinessChecks();
  const healthy = checks.every((check) => check.status === "ok");

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    service: "auth",
    timestamp: new Date().toISOString(),
    checks,
  });
});

router.get("/metrics", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(renderPrometheusMetrics());
});

export default router;
