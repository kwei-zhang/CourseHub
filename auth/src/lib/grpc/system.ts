import grpc from "@grpc/grpc-js";
import type { GetResponse } from "../../types/grpc";
import { systemClient } from "./client";

export function systemGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    systemClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
      if (err) reject(err);
      else resolve(res ?? { message: "" });
    });
  });
}
