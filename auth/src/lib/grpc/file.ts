import grpc from "@grpc/grpc-js";
import type { GetResponse } from "../../types/grpc";
import { fileClient } from "./client";

export function fileGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    fileClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
      if (err) reject(err);
      else resolve(res ?? { message: "" });
    });
  });
}
