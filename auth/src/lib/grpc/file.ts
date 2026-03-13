import grpc from "@grpc/grpc-js";
import type {
  GetResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
  GetDownloadUrlRequest,
  GetDownloadUrlResponse,
} from "../../types/grpc";
import { fileClient } from "./client";

export function fileGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    fileClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
      if (err) reject(err);
      else resolve(res ?? { message: "" });
    });
  });
}

export function fileGetUploadUrl(
  request: GetUploadUrlRequest,
  metadata?: grpc.Metadata
): Promise<GetUploadUrlResponse> {
  return new Promise((resolve, reject) => {
    fileClient.getUploadUrl(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: GetUploadUrlResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}

export function fileGetDownloadUrl(
  request: GetDownloadUrlRequest,
  metadata?: grpc.Metadata
): Promise<GetDownloadUrlResponse> {
  return new Promise((resolve, reject) => {
    fileClient.getDownloadUrl(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: GetDownloadUrlResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}
