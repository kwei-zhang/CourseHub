const http = require('http');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '../proto/services.proto');
const PORT = process.env.PORT || 5003;
const HEALTH_PORT = Number(process.env.HEALTH_PORT) || 8080;
let grpcReady = false;

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
    const statusCode = grpcReady ? 200 : 503;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: grpcReady, status: grpcReady ? 'ready' : 'starting' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false }));
});

const server = new grpc.Server();
server.addService(proto.SystemService.service, { get });
healthServer.listen(HEALTH_PORT, '0.0.0.0', () => {
  console.log(`System server health endpoint listening on port ${HEALTH_PORT}`);
});
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    grpcReady = true;
    console.log(`System server (gRPC) listening on port ${port}`);
  }
);
