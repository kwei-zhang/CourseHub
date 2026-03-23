const { initMetricsTable, pool } = require("./db");

const DEFAULT_WINDOW_MINUTES = 24 * 60;
const DEFAULT_STEP_MINUTES = 60;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSummaryRow(row = {}) {
  const requestCount = toNumber(row.request_count);
  const clientErrorCount = toNumber(row.client_error_count);
  const serverErrorCount = toNumber(row.server_error_count);
  const errorCount = toNumber(row.error_count);
  return {
    service_name: row.service_name,
    request_count: String(requestCount),
    client_error_count: String(clientErrorCount),
    server_error_count: String(serverErrorCount),
    error_count: String(errorCount),
    client_error_rate_pct: toNumber(row.client_error_rate_pct),
    server_error_rate_pct: toNumber(row.server_error_rate_pct),
    error_rate_pct: toNumber(row.error_rate_pct),
    p95_latency_ms: toNumber(row.p95_latency_ms),
  };
}

async function ensureTableAndRetry(operation) {
  try {
    return await operation();
  } catch (err) {
    if (err && err.code === "42P01") {
      await initMetricsTable({ force: true });
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

async function recordDbMetricEvent(event) {
  await initMetricsTable();
  const occurredAtMs = toNumber(event.occurred_at_ms, Date.now());
  await ensureTableAndRetry(() =>
    pool.query(
      `
        INSERT INTO public.db_metric_event (
          service_name,
          operation,
          success,
          latency_ms,
          occurred_at
        )
        VALUES ($1, $2, $3, $4, TO_TIMESTAMP($5 / 1000.0))
      `,
      [
        event.service_name || "unknown",
        event.operation || "query",
        Boolean(event.success),
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
            COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500)::int AS client_error_count,
            COUNT(*) FILTER (WHERE status_code >= 500)::int AS error_count,
            COUNT(*) FILTER (WHERE status_code >= 500)::int AS server_error_count,
            COALESCE(
              ROUND((COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 1),
              0
            )::float8 AS client_error_rate_pct,
            COALESCE(
              ROUND((COUNT(*) FILTER (WHERE status_code >= 500) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 1),
              0
            )::float8 AS server_error_rate_pct,
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
            COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500)::int AS client_error_count,
            COUNT(*) FILTER (WHERE status_code >= 500)::int AS server_error_count,
            COUNT(*) FILTER (WHERE status_code >= 500)::int AS error_count,
            COALESCE(
              ROUND((COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 1),
              0
            )::float8 AS client_error_rate_pct,
            COALESCE(
              ROUND((COUNT(*) FILTER (WHERE status_code >= 500) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 1),
              0
            )::float8 AS server_error_rate_pct,
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
    client_error_count: String(toNumber(overview.client_error_count)),
    server_error_count: String(toNumber(overview.server_error_count)),
    error_count: String(toNumber(overview.error_count)),
    client_error_rate_pct: toNumber(overview.client_error_rate_pct),
    server_error_rate_pct: toNumber(overview.server_error_rate_pct),
    error_rate_pct: toNumber(overview.error_rate_pct),
    p95_latency_ms: toNumber(overview.p95_latency_ms),
    services: servicesResult.rows.map(normalizeSummaryRow),
  };
}

async function getDbMetricsOverview(request = {}) {
  await initMetricsTable();
  const windowMinutes = Math.max(1, toNumber(request.window_minutes, DEFAULT_WINDOW_MINUTES));

  const [overviewResult, servicesResult] = await Promise.all([
    ensureTableAndRetry(() =>
      pool.query(
        `
          WITH filtered AS (
            SELECT *
            FROM public.db_metric_event
            WHERE occurred_at >= NOW() - MAKE_INTERVAL(mins => $1)
          )
          SELECT
            COUNT(*)::int AS query_count,
            COUNT(*) FILTER (WHERE success = false)::int AS failed_query_count,
            COALESCE(
              ROUND((COUNT(*) FILTER (WHERE success = false) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 1),
              0
            )::float8 AS failed_query_rate_pct,
            COALESCE(
              percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms),
              0
            )::float8 AS p95_query_latency_ms
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
            FROM public.db_metric_event
            WHERE occurred_at >= NOW() - MAKE_INTERVAL(mins => $1)
          )
          SELECT
            service_name,
            COUNT(*)::int AS query_count,
            COUNT(*) FILTER (WHERE success = false)::int AS failed_query_count,
            COALESCE(
              ROUND((COUNT(*) FILTER (WHERE success = false) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 1),
              0
            )::float8 AS failed_query_rate_pct,
            COALESCE(
              percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms),
              0
            )::float8 AS p95_query_latency_ms
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
    query_count: String(toNumber(overview.query_count)),
    failed_query_count: String(toNumber(overview.failed_query_count)),
    failed_query_rate_pct: toNumber(overview.failed_query_rate_pct),
    p95_query_latency_ms: toNumber(overview.p95_query_latency_ms),
    services: servicesResult.rows.map((row) => ({
      service_name: row.service_name,
      query_count: String(toNumber(row.query_count)),
      failed_query_count: String(toNumber(row.failed_query_count)),
      failed_query_rate_pct: toNumber(row.failed_query_rate_pct),
      p95_query_latency_ms: toNumber(row.p95_query_latency_ms),
    })),
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
            WHEN $5::text = 'client_error_count' THEN
              COALESCE(COUNT(f.*) FILTER (WHERE f.status_code >= 400 AND f.status_code < 500), 0)::float8
            WHEN $5::text = 'error_count' THEN
              COALESCE(COUNT(f.*) FILTER (WHERE f.status_code >= 500), 0)::float8
            WHEN $5::text = 'server_error_count' THEN
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

async function recordBackupRun(request = {}) {
  await initMetricsTable();
  const startedAtMs = toNumber(request.started_at_ms, Date.now());
  const finishedAtMs = request.finished_at_ms ? toNumber(request.finished_at_ms) : null;

  await ensureTableAndRetry(() =>
    pool.query(
      `
        INSERT INTO public.backup_run (
          status,
          started_at,
          finished_at,
          object_key,
          size_bytes,
          error_message
        )
        VALUES (
          $1,
          TO_TIMESTAMP($2 / 1000.0),
          CASE WHEN $3::bigint IS NULL THEN NULL ELSE TO_TIMESTAMP($3 / 1000.0) END,
          $4,
          $5,
          $6
        )
      `,
      [
        request.status || "unknown",
        startedAtMs,
        finishedAtMs,
        request.object_key || null,
        request.size_bytes ? toNumber(request.size_bytes) : null,
        request.error_message || null,
      ]
    )
  );

  return { ok: true };
}

async function getBackupStatus() {
  await initMetricsTable();
  const result = await ensureTableAndRetry(() =>
    pool.query(
      `
        SELECT
          status AS latest_status,
          FLOOR(EXTRACT(EPOCH FROM started_at) * 1000)::bigint AS last_started_at_ms,
          COALESCE(FLOOR(EXTRACT(EPOCH FROM finished_at) * 1000)::bigint, 0) AS last_finished_at_ms,
          COALESCE(FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 60)::bigint, 0) AS age_minutes,
          COALESCE(size_bytes, 0)::bigint AS latest_size_bytes,
          COALESCE(object_key, '') AS latest_object_key,
          COALESCE(error_message, '') AS latest_error_message
        FROM public.backup_run
        ORDER BY started_at DESC
        LIMIT 1
      `
    )
  );

  const row = result.rows[0];
  if (!row) {
    return {
      has_backup: false,
      latest_status: "",
      last_started_at_ms: 0,
      last_finished_at_ms: 0,
      age_minutes: 0,
      latest_size_bytes: 0,
      latest_object_key: "",
      latest_error_message: "",
    };
  }

  return {
    has_backup: true,
    latest_status: row.latest_status,
    last_started_at_ms: String(toNumber(row.last_started_at_ms)),
    last_finished_at_ms: String(toNumber(row.last_finished_at_ms)),
    age_minutes: String(toNumber(row.age_minutes)),
    latest_size_bytes: String(toNumber(row.latest_size_bytes)),
    latest_object_key: row.latest_object_key,
    latest_error_message: row.latest_error_message,
  };
}

module.exports = {
  getBackupStatus,
  getDbMetricsOverview,
  getMetricsOverview,
  getMetricsTimeseries,
  listIncidents,
  recordBackupRun,
  recordDbMetricEvent,
  recordMetricEvent,
};
