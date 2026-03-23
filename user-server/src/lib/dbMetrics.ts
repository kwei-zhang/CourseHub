import path from "node:path";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

const PROTO_PATH =
  process.env.PROTO_PATH ?? path.resolve(process.cwd(), "..", "proto", "services.proto");
const SYSTEM_SERVER = process.env.SYSTEM_SERVER ?? "localhost:5003";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

interface LoadedProto {
  ece1779: {
    SystemService: grpc.ServiceClientConstructor;
  };
}

const proto = (grpc.loadPackageDefinition(packageDefinition) as unknown as LoadedProto).ece1779;
const systemClient = new proto.SystemService(SYSTEM_SERVER, grpc.credentials.createInsecure());

export function recordDbMetric(operation: string, success: boolean, latencyMs: number): void {
  systemClient.recordDbMetricEvent(
    {
      service_name: "user-server",
      operation,
      success,
      latency_ms: latencyMs,
      occurred_at_ms: Date.now(),
    },
    new grpc.Metadata(),
    (err: Error | null) => {
      if (err) {
        console.error("DB metric capture error:", err);
      }
    }
  );
}
