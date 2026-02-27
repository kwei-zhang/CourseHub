/**
 * gRPC client layer: shared client instances and per-service RPC wrappers.
 * Import from here for backward compatibility, or from ./user, ./file, ./system for direct access.
 */

export { userClient, fileClient, systemClient } from "./client";
export {
  userGet,
  userGetUser,
  userUpdateUser,
  userDeleteUser,
  userSearchUsersByName,
  userGetUserByEmail,
} from "./user";
export { fileGet } from "./file";
export { systemGet } from "./system";
export type {
  GetResponse,
  GetUserResponse,
  UpdateUserRequest,
  DeleteUserResponse,
  SearchUsersByNameResponse,
  GetUserByEmailResponse,
} from "../../types/grpc";
