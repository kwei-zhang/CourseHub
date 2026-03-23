const http = require('http');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { initMetricsTable } = require('./db');
const {
  getBackupStatus,
  getDbMetricsOverview,
  getMetricsOverview,
  getMetricsTimeseries,
  listIncidents,
  recordBackupRun,
  recordDbMetricEvent,
  recordMetricEvent,
} = require('./metricsStore');

const PROTO_PATH = path.join(__dirname, '../proto/services.proto');
const PORT = process.env.PORT || 5003;
const HEALTH_PORT = Number(process.env.HEALTH_PORT) || 8080;
const BACKUP_REPORT_TOKEN = process.env.BACKUP_REPORT_TOKEN || "";
let grpcReady = false;
let storageReady = false;

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition).ece1779;

function get(call, callback) {
  callback(null, { message: 'hello' });
}

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health/live') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, status: 'live' }));
    return;
  }

  if (req.url === '/health/ready') {
    const isReady = grpcReady && storageReady;
    const statusCode = isReady ? 200 : 503;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: isReady, status: isReady ? 'ready' : 'starting' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/internal/backup-report') {
    if (!BACKUP_REPORT_TOKEN || req.headers['x-backup-report-token'] !== BACKUP_REPORT_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        await recordBackupRun(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error('Backup report ingestion failed:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'backup report failed' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false }));
});

const server = new grpc.Server();
server.addService(proto.SystemService.service, {
  get,
  recordMetricEvent: async (call, callback) => {
    try {
      callback(null, await recordMetricEvent(call.request));
    } catch (err) {
      callback(err);
    }
  },
  recordDbMetricEvent: async (call, callback) => {
    try {
      callback(null, await recordDbMetricEvent(call.request));
    } catch (err) {
      callback(err);
    }
  },
  getMetricsOverview: async (call, callback) => {
    try {
      callback(null, await getMetricsOverview(call.request));
    } catch (err) {
      callback(err);
    }
  },
  getDbMetricsOverview: async (call, callback) => {
    try {
      callback(null, await getDbMetricsOverview(call.request));
    } catch (err) {
      callback(err);
    }
  },
  getMetricsTimeseries: async (call, callback) => {
    try {
      callback(null, await getMetricsTimeseries(call.request));
    } catch (err) {
      callback(err);
    }
  },
  listIncidents: async (call, callback) => {
    try {
      callback(null, await listIncidents(call.request));
    } catch (err) {
      callback(err);
    }
  },
  recordBackupRun: async (call, callback) => {
    try {
      callback(null, await recordBackupRun(call.request));
    } catch (err) {
      callback(err);
    }
  },
  getBackupStatus: async (_call, callback) => {
    try {
      callback(null, await getBackupStatus());
    } catch (err) {
      callback(err);
    }
  },
});
healthServer.listen(HEALTH_PORT, '0.0.0.0', () => {
  console.log(`System server health endpoint listening on port ${HEALTH_PORT}`);
});

async function start() {
  await initMetricsTable();
  storageReady = true;

  const boundPort = await new Promise((resolve, reject) => {
    server.bindAsync(
      `0.0.0.0:${PORT}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(port);
      }
    );
  });

  grpcReady = true;
  console.log(`System server (gRPC) listening on port ${boundPort}`);
}

process.on('SIGTERM', async () => {
  grpcReady = false;
  storageReady = false;
  healthServer.close();
  server.forceShutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  grpcReady = false;
  storageReady = false;
  healthServer.close();
  server.forceShutdown();
  process.exit(0);
});

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
