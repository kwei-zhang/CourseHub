const { initMetricsTable, pool } = require("./db");

const DEFAULT_WINDOW_MINUTES = 24 * 60;
const DEFAULT_STEP_MINUTES = 60;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSummaryRow(row = {}) {
  const requestCount = toNumber(row.request_count);
  const errorCount = toNumber(row.error_count);
  return {
    service_name: row.service_name,
    request_count: String(requestCount),
    error_count: String(errorCount),
    error_rate_pct: toNumber(row.error_rate_pct),
    p95_latency_ms: toNumber(row.p95_latency_ms),
  };
}

async function ensureTableAndRetry(operation) {
  try {
    return await operation();
  } catch (err) {
    if (err && err.code === "42P01") {
      await initMetricsTable();
      return operation();
    }
    throw err;
  }
}

async function recordMetricEvent(event) {
  await initMetricsTable();
  const occurredAtMs = toNumber(event.occurred_at_ms, Date.now());
  await ensureTableAndRetry(() =>
    pool.query(
      `
        INSERT INTO public.metric_event (
          service_name,
          route_key,
          status_code,
          latency_ms,
          occurred_at
        )
        VALUES ($1, $2, $3, $4, TO_TIMESTAMP($5 / 1000.0))
      `,
      [
        event.service_name || "unknown",
        event.route_key || "unknown",
        toNumber(event.status_code),
        toNumber(event.latency_ms),
        occurredAtMs,
      ]
    )
  );

  return { ok: true };
}

async function getMetricsOverview(request = {}) {
  await initMetricsTable();
  const windowMinutes = Math.max(1, toNumber(request.window_minutes, DEFAULT_WINDOW_MINUTES));

  const [overviewResult, servicesResult] = await Promise.all([
    ensureTableAndRetry(() =>
      pool.query(
        `
          WITH filtered AS (
            SELECT *
            FROM public.metric_event
            WHERE occurred_at >= NOW() - MAKE_INTERVAL(mins => $1)
          )
          SELECT
            COUNT(*)::int AS request_count,
            COUNT(*) FILTER (WHERE status_code >= 500)::int AS error_count,
            COALESCE(
              ROUND((COUNT(*) FILTER (WHERE status_code >= 500) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 1),
              0
            )::float8 AS error_rate_pct,
            COALESCE(
              percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms),
              0
            )::float8 AS p95_latency_ms
          FROM filtered
        `,
        [windowMinutes]
      )
    ),
    ensureTableAndRetry(() =>
      pool.query(
        `
          WITH filtered AS (
            SELECT *
            FROM public.metric_event
            WHERE occurred_at >= NOW() - MAKE_INTERVAL(mins => $1)
          )
          SELECT
            service_name,
            COUNT(*)::int AS request_count,
            COUNT(*) FILTER (WHERE status_code >= 500)::int AS error_count,
            COALESCE(
              ROUND((COUNT(*) FILTER (WHERE status_code >= 500) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 1),
              0
            )::float8 AS error_rate_pct,
            COALESCE(
              percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms),
              0
            )::float8 AS p95_latency_ms
          FROM filtered
          GROUP BY service_name
          ORDER BY service_name
        `,
        [windowMinutes]
      )
    ),
  ]);

  const overview = overviewResult.rows[0] ?? {};

  return {
    window_minutes: windowMinutes,
    request_count: String(toNumber(overview.request_count)),
    error_count: String(toNumber(overview.error_count)),
    error_rate_pct: toNumber(overview.error_rate_pct),
    p95_latency_ms: toNumber(overview.p95_latency_ms),
    services: servicesResult.rows.map(normalizeSummaryRow),
  };
}

async function getMetricsTimeseries(request = {}) {
  await initMetricsTable();
  const metric = request.metric || "request_count";
  const serviceName = request.service_name || "";
  const windowMinutes = Math.max(1, toNumber(request.window_minutes, DEFAULT_WINDOW_MINUTES));
  const stepMinutes = Math.max(1, toNumber(request.step_minutes, DEFAULT_STEP_MINUTES));

  const end = new Date(Math.ceil(Date.now() / (stepMinutes * 60 * 1000)) * (stepMinutes * 60 * 1000));
  const start = new Date(end.getTime() - windowMinutes * 60 * 1000);

  const result = await ensureTableAndRetry(() =>
    pool.query(
      `
        WITH buckets AS (
          SELECT generate_series(
            $1::timestamptz,
            $2::timestamptz - ($3 || ' minutes')::interval,
            ($3 || ' minutes')::interval
          ) AS bucket_start
        ),
        filtered AS (
          SELECT *
          FROM public.metric_event
          WHERE occurred_at >= $1::timestamptz
            AND occurred_at < $2::timestamptz
            AND ($4::text = '' OR service_name = $4::text)
        )
        SELECT
          FLOOR(EXTRACT(EPOCH FROM b.bucket_start) * 1000)::bigint AS ts_ms,
          CASE
            WHEN $5::text = 'error_count' THEN
              COALESCE(COUNT(f.*) FILTER (WHERE f.status_code >= 500), 0)::float8
            WHEN $5::text = 'p95_latency_ms' THEN
              COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY f.latency_ms), 0)::float8
            ELSE
              COALESCE(COUNT(f.*), 0)::float8
          END AS value
        FROM buckets b
        LEFT JOIN filtered f
          ON f.occurred_at >= b.bucket_start
         AND f.occurred_at < b.bucket_start + ($3 || ' minutes')::interval
        GROUP BY b.bucket_start
        ORDER BY b.bucket_start
      `,
      [start.toISOString(), end.toISOString(), stepMinutes, serviceName, metric]
    )
  );

  return {
    metric,
    service_name: serviceName,
    window_minutes: windowMinutes,
    step_minutes: stepMinutes,
    points: result.rows.map((row) => ({
      ts_ms: String(toNumber(row.ts_ms)),
      value: toNumber(row.value),
    })),
  };
}

async function listIncidents(request = {}) {
  await initMetricsTable();
  const overview = await getMetricsOverview(request);
  const incidents = [];

  for (const service of overview.services) {
    const requestCount = toNumber(service.request_count);
    if (requestCount >= 5 && service.error_rate_pct >= 5) {
      incidents.push({
        id: `${service.service_name}-error-rate`,
        source: service.service_name,
        severity: service.error_rate_pct >= 20 ? "critical" : "warning",
        status: "open",
        title: "High error rate",
        message: `${service.service_name} error rate is ${service.error_rate_pct.toFixed(1)}% in the selected window`,
        started_at_ms: String(Date.now()),
      });
    }

    if (requestCount >= 5 && service.p95_latency_ms >= 1000) {
      incidents.push({
        id: `${service.service_name}-latency`,
        source: service.service_name,
        severity: service.p95_latency_ms >= 2000 ? "critical" : "warning",
        status: "open",
        title: "High latency",
        message: `${service.service_name} p95 latency is ${service.p95_latency_ms.toFixed(0)} ms in the selected window`,
        started_at_ms: String(Date.now()),
      });
    }
  }

  return { incidents };
}

module.exports = {
  getMetricsOverview,
  getMetricsTimeseries,
  listIncidents,
  recordMetricEvent,
};
