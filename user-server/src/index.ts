import "dotenv/config";
import path from "path";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { resourceServiceHandlers } from "./grpc/resourceService";
import { userServiceHandlers } from "./grpc/userService";

// Docker: cwd is /app/user-server, proto at /app/proto. Local: cwd is user-server, proto at ../proto.
const PROTO_PATH =
  process.env.PROTO_PATH ?? path.resolve(process.cwd(), "..", "proto", "services.proto");
const PORT = Number(process.env.PORT) || 5001;

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
    ResourceService: { service: grpc.ServiceDefinition };
  };
}

const proto = (grpc.loadPackageDefinition(packageDefinition) as unknown as LoadedProto).ece1779;

const server = new grpc.Server();
server.addService(proto.UserService.service, userServiceHandlers);
server.addService(proto.ResourceService.service, resourceServiceHandlers);
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`User server (gRPC) listening on port ${port}`);
  }
);
