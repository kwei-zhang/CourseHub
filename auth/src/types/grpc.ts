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

/** Resource shape returned by ResourceService RPCs. */
export type ResourceResponse = {
  id: string;
  title: string;
  courseCode: string;
  contentType: string;
  objectKey: string;
  policy: string;
  tags: string[];
  uploaderId: string;
};

/** Request payload for ResourceService.CreateResource. */
export type CreateResourceRequest = {
  title: string;
  courseCode: string;
  contentType: string;
  objectKey: string;
  policy: string;
  tags?: string[];
  uploaderId: string;
};

/** Request payload for ResourceService.GetResource. */
export type GetResourceRequest = { id: string };

/** Request/response payloads for ResourceService.ListResources. */
export type ListResourcesRequest = { courseCode: string };
export type ListResourcesResponse = { resources: ResourceResponse[] };

/** Request payload for ResourceService.UpdateResource. */
export type UpdateResourceRequest = {
  id: string;
  title?: string;
  courseCode?: string;
  contentType?: string;
  objectKey?: string;
  policy?: string;
  tags?: string[];
  uploaderId?: string;
};

/** Request/response payloads for ResourceService.DeleteResource. */
export type DeleteResourceRequest = { id: string };
export type DeleteResourceResponse = { id: string; deleted: boolean };

/** Request/response payloads for ResourceService.RecordAccessLog. */
export type RecordAccessLogRequest = {
  userId: string;
  resourceId: string;
  action: string;
  details?: string;
};
export type RecordAccessLogResponse = { logId: string; timestampMs: string };

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
  ResourceService: grpc.ServiceClientConstructor;
  FileService: grpc.ServiceClientConstructor;
  SystemService: grpc.ServiceClientConstructor;
}

/** gRPC call signature used by proxy handlers. */
export type GrpcCall<T> = (metadata?: grpc.Metadata) => Promise<T>;
