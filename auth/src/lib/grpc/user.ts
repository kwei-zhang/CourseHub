import grpc from "@grpc/grpc-js";
import type {
  GetResponse,
  GetUserResponse,
  UpdateUserRequest,
  DeleteUserResponse,
  SearchUsersByNameResponse,
  GetUserByEmailResponse,
} from "../../types/grpc";
import { userClient } from "./client";

export function userGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    userClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
      if (err) reject(err);
      else resolve(res ?? { message: "" });
    });
  });
}

export function userGetUser(userId: string, metadata?: grpc.Metadata): Promise<GetUserResponse> {
  return new Promise((resolve, reject) => {
    userClient.getUser(
      { user_id: userId },
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: GetUserResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}

export function userUpdateUser(
  request: UpdateUserRequest,
  metadata?: grpc.Metadata
): Promise<GetUserResponse> {
  return new Promise((resolve, reject) => {
    userClient.updateUser(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: GetUserResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}

export function userDeleteUser(userId: string, metadata?: grpc.Metadata): Promise<DeleteUserResponse> {
  return new Promise((resolve, reject) => {
    userClient.deleteUser(
      { user_id: userId },
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: DeleteUserResponse) => {
        if (err) reject(err);
        else resolve(res ?? { ok: false });
      }
    );
  });
}

export function userSearchUsersByName(
  nameQuery: string,
  metadata?: grpc.Metadata
): Promise<SearchUsersByNameResponse> {
  return new Promise((resolve, reject) => {
    userClient.searchUsersByName(
      { name_query: nameQuery },
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: SearchUsersByNameResponse) => {
        if (err) reject(err);
        else resolve(res ?? { users: [] });
      }
    );
  });
}

export function userGetUserByEmail(
  email: string,
  metadata?: grpc.Metadata
): Promise<GetUserByEmailResponse> {
  return new Promise((resolve, reject) => {
    userClient.getUserByEmail(
      { email },
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: GetUserByEmailResponse) => {
        if (err) reject(err);
        else resolve(res ?? {});
      }
    );
  });
}
