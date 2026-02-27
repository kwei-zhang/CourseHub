import type grpc from "@grpc/grpc-js";

/** Response shape from user/file/system get RPCs. */
export type GetResponse = { message: string };

/** Loaded proto package with service constructors. */
export interface Ece1779Package {
  UserService: grpc.ServiceClientConstructor;
  FileService: grpc.ServiceClientConstructor;
  SystemService: grpc.ServiceClientConstructor;
}

/** gRPC call signature used by proxy handlers. */
export type GrpcCall<T> = (metadata?: grpc.Metadata) => Promise<T>;
