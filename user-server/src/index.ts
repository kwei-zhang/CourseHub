import "dotenv/config";
import http from "node:http";
import path from "path";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { userServiceHandlers } from "./grpc/userService";

// Docker: cwd is /app/user-server, proto at /app/proto. Local: cwd is user-server, proto at ../proto.
const PROTO_PATH =
  process.env.PROTO_PATH ?? path.resolve(process.cwd(), "..", "proto", "services.proto");
const PORT = Number(process.env.PORT) || 5001;
const HEALTH_PORT = Number(process.env.HEALTH_PORT) || 8080;

let grpcReady = false;

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

interface LoadedProto {
  ece1779: {
    UserService: { service: grpc.ServiceDefinition };
  };
}

const proto = (grpc.loadPackageDefinition(packageDefinition) as unknown as LoadedProto).ece1779;

const server = new grpc.Server();
server.addService(proto.UserService.service, userServiceHandlers);

const healthServer = http.createServer((req, res) => {
  if (req.url === "/health/live") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: "live" }));
    return;
  }

  if (req.url === "/health/ready") {
    const statusCode = grpcReady ? 200 : 503;
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: grpcReady, status: grpcReady ? "ready" : "starting" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false }));
});

healthServer.listen(HEALTH_PORT, "0.0.0.0", () => {
  console.log(`User server health endpoint listening on port ${HEALTH_PORT}`);
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
    console.log(`User server (gRPC) listening on port ${port}`);
  }
);
