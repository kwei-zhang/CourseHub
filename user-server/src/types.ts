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
