import type grpc from "@grpc/grpc-js";

/** Response shape from user/file/system get RPCs. */
export type GetResponse = { message: string };

/** Request payload for FileService.GetUploadUrl. */
export type GetUploadUrlRequest = {
  title?: string;
  courseCode: string;
  contentType: string;
  policy: string;
  tags?: string[];
  uploaderId: string;
  expires_in?: number;
};

/** Response payload from FileService.GetUploadUrl. */
export type GetUploadUrlResponse = {
  url: string;
  object_key: string;
};

/** Request payload for FileService.GetDownloadUrl. */
export type GetDownloadUrlRequest = {
  resource_id: string;
  expires_in?: number;
  requester_user_id: string;
};

/** Response payload from FileService.GetDownloadUrl. */
export type GetDownloadUrlResponse = {
  url: string;
};

/** Response shape from UserService.GetUser / UpdateUser RPC. */
export type GetUserResponse = {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image: string;
  created_at: string;
  updated_at: string;
  role: string;
};

/** Request payload for UserService.UpdateUser (optional fields). */
export type UpdateUserRequest = {
  user_id: string;
  name?: string;
  image?: string;
  role?: string;
  email_verified?: boolean;
};

/** Response from UserService.DeleteUser. */
export type DeleteUserResponse = { ok: boolean };

/** Response from UserService.SearchUsersByName. */
export type SearchUsersByNameResponse = { users: GetUserResponse[] };

/** Response from UserService.GetUserByEmail. */
export type GetUserByEmailResponse = { user?: GetUserResponse };

/** Loaded proto package with service constructors. */
export interface Ece1779Package {
  UserService: grpc.ServiceClientConstructor;
  FileService: grpc.ServiceClientConstructor;
  SystemService: grpc.ServiceClientConstructor;
}

/** gRPC call signature used by proxy handlers. */
export type GrpcCall<T> = (metadata?: grpc.Metadata) => Promise<T>;
