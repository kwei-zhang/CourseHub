/**
 * gRPC client layer: shared client instances and per-service RPC wrappers.
 * Import from here for backward compatibility, or from ./user, ./file, ./system for direct access.
 */

export { userClient, resourceClient, fileClient, systemClient } from "./client";
export {
  userGet,
  userGetUser,
  userUpdateUser,
  userDeleteUser,
  userSearchUsersByName,
  userGetUserByEmail,
} from "./user";
export {
  resourceCreateResource,
  resourceGetResource,
  resourceListResources,
  resourceUpdateResource,
  resourceDeleteResource,
  resourceRecordAccessLog,
} from "./resource";
export { fileGet, fileGetUploadUrl, fileGetDownloadUrl } from "./file";
export { systemGet } from "./system";
export type {
  GetResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
  GetDownloadUrlRequest,
  GetDownloadUrlResponse,
  ResourceResponse,
  CreateResourceRequest,
  GetResourceRequest,
  ListResourcesRequest,
  ListResourcesResponse,
  UpdateResourceRequest,
  DeleteResourceRequest,
  DeleteResourceResponse,
  RecordAccessLogRequest,
  RecordAccessLogResponse,
  GetUserResponse,
  UpdateUserRequest,
  DeleteUserResponse,
  SearchUsersByNameResponse,
  GetUserByEmailResponse,
} from "../../types/grpc";
