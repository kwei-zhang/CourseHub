const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = process.env.PROTO_PATH || path.join(__dirname, "../../../proto/services.proto");
const SYSTEM_SERVER = process.env.SYSTEM_SERVER || "localhost:5003";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition).ece1779;
const systemClient = new proto.SystemService(SYSTEM_SERVER, grpc.credentials.createInsecure());

function recordDbMetric(operation, success, latencyMs) {
  systemClient.recordDbMetricEvent(
    {
      service_name: "file-server",
      operation,
      success,
      latency_ms: latencyMs,
      occurred_at_ms: Date.now(),
    },
    new grpc.Metadata(),
    (err) => {
      if (err) {
        console.error("DB metric capture error:", err);
      }
    }
  );
}

module.exports = { recordDbMetric };
