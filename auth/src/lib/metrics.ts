import type { NextFunction, Request, Response } from "express";

type CounterKey = `${string}|${string}|${string}`;

const REQUEST_DURATION_BUCKETS_SECONDS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];

const requestTotals = new Map<CounterKey, number>();
const requestDurationBuckets = new Map<CounterKey, number[]>();
let requestDurationCount = 0;
let requestDurationSumSeconds = 0;

function normalizeRoute(req: Request): string {
  if (req.baseUrl && req.route?.path) {
    return `${req.baseUrl}${req.route.path}`;
  }
  if (typeof req.route?.path === "string") {
    return req.route.path;
  }
  return req.path || "unknown";
}

function incrementCounter(method: string, route: string, statusClass: string): void {
  const key: CounterKey = `${method}|${route}|${statusClass}`;
  requestTotals.set(key, (requestTotals.get(key) ?? 0) + 1);
}

function observeDuration(method: string, route: string, statusClass: string, durationSeconds: number): void {
  const key: CounterKey = `${method}|${route}|${statusClass}`;
  const values =
    requestDurationBuckets.get(key) ??
    new Array(REQUEST_DURATION_BUCKETS_SECONDS.length + 1).fill(0);

  const bucketIndex = REQUEST_DURATION_BUCKETS_SECONDS.findIndex(
    (bucket) => durationSeconds <= bucket
  );
  const normalizedIndex = bucketIndex === -1 ? REQUEST_DURATION_BUCKETS_SECONDS.length : bucketIndex;

  values[normalizedIndex] += 1;
  requestDurationBuckets.set(key, values);
  requestDurationCount += 1;
  requestDurationSumSeconds += durationSeconds;
}

export function recordHttpMetric(
  method: string,
  route: string,
  statusCode: number,
  durationSeconds: number
): void {
  const normalizedMethod = method.toUpperCase();
  const normalizedStatusClass = `${Math.floor(statusCode / 100)}xx`;
  incrementCounter(normalizedMethod, route, normalizedStatusClass);
  observeDuration(normalizedMethod, route, normalizedStatusClass, durationSeconds);
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedNanoseconds = Number(process.hrtime.bigint() - startedAt);
    const durationSeconds = elapsedNanoseconds / 1_000_000_000;
    recordHttpMetric(req.method, normalizeRoute(req), res.statusCode, durationSeconds);
  });

  next();
}

function escapeLabelValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
}

export function renderPrometheusMetrics(): string {
  const lines = [
    "# HELP auth_http_requests_total Total HTTP requests handled by the auth service.",
    "# TYPE auth_http_requests_total counter",
  ];

  for (const [key, total] of requestTotals.entries()) {
    const [method, route, statusClass] = key.split("|");
    lines.push(
      `auth_http_requests_total{method="${escapeLabelValue(method)}",route="${escapeLabelValue(
        route
      )}",status_class="${escapeLabelValue(statusClass)}"} ${total}`
    );
  }

  lines.push(
    "# HELP auth_http_request_duration_seconds HTTP request duration observed by the auth service.",
    "# TYPE auth_http_request_duration_seconds histogram"
  );

  for (const [key, buckets] of requestDurationBuckets.entries()) {
    const [method, route, statusClass] = key.split("|");
    let cumulative = 0;

    for (const [index, bucketCount] of buckets.entries()) {
      cumulative += bucketCount;
      const le =
        index < REQUEST_DURATION_BUCKETS_SECONDS.length
          ? REQUEST_DURATION_BUCKETS_SECONDS[index]
          : "+Inf";
      lines.push(
        `auth_http_request_duration_seconds_bucket{method="${escapeLabelValue(
          method
        )}",route="${escapeLabelValue(route)}",status_class="${escapeLabelValue(
          statusClass
        )}",le="${le}"} ${cumulative}`
      );
    }
  }

  lines.push(
    `auth_http_request_duration_seconds_count ${requestDurationCount}`,
    `auth_http_request_duration_seconds_sum ${requestDurationSumSeconds}`
  );

  return `${lines.join("\n")}\n`;
}

export function resetMetrics(): void {
  requestTotals.clear();
  requestDurationBuckets.clear();
  requestDurationCount = 0;
  requestDurationSumSeconds = 0;
}
