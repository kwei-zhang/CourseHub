import path from "path";
import { fileURLToPath } from "url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROTO_PATH =
  process.env.PROTO_PATH ??
  path.resolve(__dirname, "../../../proto/services.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

interface Ece1779Package {
  UserService: grpc.ServiceClientConstructor;
  FileService: grpc.ServiceClientConstructor;
  SystemService: grpc.ServiceClientConstructor;
}
const proto = (grpc.loadPackageDefinition(packageDefinition) as unknown as { ece1779: Ece1779Package }).ece1779;

const userTarget = process.env.USER_SERVER ?? "localhost:5001";
const fileTarget = process.env.FILE_SERVER ?? "localhost:5002";
const systemTarget = process.env.SYSTEM_SERVER ?? "localhost:5003";

export const userClient = new (proto.UserService as grpc.ServiceClientConstructor)(userTarget, grpc.credentials.createInsecure());
export const fileClient = new (proto.FileService as grpc.ServiceClientConstructor)(fileTarget, grpc.credentials.createInsecure());
export const systemClient = new (proto.SystemService as grpc.ServiceClientConstructor)(systemTarget, grpc.credentials.createInsecure());

export type GetResponse = { message: string };

export function userGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    userClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
      if (err) reject(err);
      else resolve(res ?? { message: "" });
    });
  });
}

export function fileGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    fileClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
      if (err) reject(err);
      else resolve(res ?? { message: "" });
    });
  });
}

export function systemGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    systemClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
      if (err) reject(err);
      else resolve(res ?? { message: "" });
    });
  });
}
