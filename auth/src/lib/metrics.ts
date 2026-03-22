import type { Request, Response, NextFunction } from "express";
import { systemRecordMetricEvent } from "./grpc";

function normalizePath(path: string): string {
  return path.split("?")[0] || "/";
}

function mapServiceName(path: string): string {
  const normalizedPath = normalizePath(path);
  if (normalizedPath.startsWith("/api/user")) return "user-server";
  if (normalizedPath.startsWith("/api/file") || normalizedPath.startsWith("/api/resource")) return "file-server";
  if (normalizedPath.startsWith("/api/system")) return "system-server";
  if (normalizedPath.startsWith("/api/admin")) return "admin";
  return "auth";
}

function shouldSkipMetrics(path: string): boolean {
  return normalizePath(path).startsWith("/api/admin/metrics");
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on("finish", () => {
    const requestPath = req.originalUrl || req.url || req.path;
    const normalizedPath = normalizePath(requestPath);
    if (shouldSkipMetrics(normalizedPath)) return;

    void systemRecordMetricEvent({
      service_name: mapServiceName(normalizedPath),
      route_key: normalizedPath,
      status_code: res.statusCode,
      latency_ms: Date.now() - startedAt,
      occurred_at_ms: Date.now(),
    }).catch((err) => {
      console.error("Metrics capture error:", err);
    });
  });

  next();
}
