import "dotenv/config";
import path from "path";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { prisma } from "./lib/prisma";

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
  };
}

const proto = (grpc.loadPackageDefinition(packageDefinition) as unknown as LoadedProto).ece1779;

function get(
  _call: grpc.ServerUnaryCall<Record<string, never>, { message: string }>,
  callback: grpc.sendUnaryData<{ message: string }>
): void {
  callback(null, { message: "hello" });
}

function getUser(
  call: grpc.ServerUnaryCall<{ user_id: string }, Record<string, unknown>>,
  callback: grpc.sendUnaryData<{
    id: string;
    name: string;
    email: string;
    email_verified: boolean;
    image: string;
    created_at: string;
    updated_at: string;
    role: string;
  }>
): void {
  const userId = call.request.user_id;
  if (!userId) {
    callback(
      {
        code: grpc.status.INVALID_ARGUMENT,
        message: "user_id is required",
      },
      undefined
    );
    return;
  }
  if (!prisma) {
    callback(
      {
        code: grpc.status.UNAVAILABLE,
        message: "Database not configured (DATABASE_URL required)",
      },
      undefined
    );
    return;
  }

  prisma.user
    .findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
    })
    .then((user) => {
      if (!user) {
        callback(
          {
            code: grpc.status.NOT_FOUND,
            message: "User not found",
          },
          undefined
        );
        return;
      }
      callback(null, {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified: user.emailVerified,
        image: user.image ?? "",
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
        role: user.role ?? "user",
      });
    })
    .catch((err) => {
      console.error("GetUser DB error:", err);
      callback(
        {
          code: grpc.status.INTERNAL,
          message: err instanceof Error ? err.message : "Database error",
        },
        undefined
      );
    });
}

const server = new grpc.Server();
server.addService(proto.UserService.service, { get, getUser });
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
