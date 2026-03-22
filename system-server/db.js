const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for system-server metrics storage");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

let initPromise = null;

async function initMetricsTable() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.metric_event (
      id BIGSERIAL PRIMARY KEY,
      service_name TEXT NOT NULL,
      route_key TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      latency_ms INTEGER NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_metric_event_occurred_at
    ON public.metric_event (occurred_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_metric_event_service_name_occurred_at
    ON public.metric_event (service_name, occurred_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.backup_run (
      id BIGSERIAL PRIMARY KEY,
      status TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      finished_at TIMESTAMPTZ NULL,
      object_key TEXT NULL,
      size_bytes BIGINT NULL,
      error_message TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_backup_run_started_at
    ON public.backup_run (started_at DESC);
  `);
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

module.exports = {
  initMetricsTable,
  pool,
};
