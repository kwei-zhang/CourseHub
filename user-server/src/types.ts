/** User shape returned by all UserService RPCs (GetUser, UpdateUser, SearchUsersByName, GetUserByEmail). */
export type GetUserGrpcResponse = {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image: string;
  created_at: string;
  updated_at: string;
  role: string;
};

/** Optional fields allowed in UpdateUser RPC. */
export type UpdateUserGrpcData = {
  name?: string;
  image?: string;
  role?: string;
  email_verified?: boolean;
};

/** Request/response types matching proto (for typing gRPC handlers). */
export type UpdateUserRequest = { user_id: string } & UpdateUserGrpcData;
export type DeleteUserRequest = { user_id: string };
export type DeleteUserResponse = { ok: boolean };
export type SearchUsersByNameRequest = { name_query: string };
export type SearchUsersByNameResponse = { users: GetUserGrpcResponse[] };
export type GetUserByEmailRequest = { email: string };
export type GetUserByEmailResponse = { user?: GetUserGrpcResponse };

/** Resource shape returned by ResourceService RPCs. */
export type ResourceGrpcResponse = {
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
  tags: string[];
  uploaderId: string;
};

/** Request payload for ResourceService.GetResource. */
export type GetResourceRequest = { id: string };

/** Request payload for ResourceService.ListResources. */
export type ListResourcesRequest = { courseCode: string };

/** Response payload for ResourceService.ListResources. */
export type ListResourcesResponse = { resources: ResourceGrpcResponse[] };

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

/** Access action enum names from proto AccessAction. */
export type AccessAction =
  | "UPLOAD"
  | "DOWNLOAD_URL_ISSUED"
  | "DOWNLOAD_DENIED"
  | "METADATA_CREATED"
  | "RESOURCE_DELETED";

/** Request/response payloads for ResourceService.RecordAccessLog. */
export type RecordAccessLogRequest = {
  userId: string;
  resourceId: string;
  action: AccessAction;
  details?: string;
};
export type RecordAccessLogResponse = { logId: string; timestampMs: string };
