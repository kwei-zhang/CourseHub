import grpc from "@grpc/grpc-js";
import type { GetResponse, GetUserResponse } from "../../types/grpc";
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
