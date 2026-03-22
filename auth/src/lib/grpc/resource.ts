import grpc from "@grpc/grpc-js";
import type {
  CreateResourceRequest,
  ResourceResponse,
  GetResourceRequest,
  ListResourcesRequest,
  ListResourcesResponse,
  ListAllResourcesResponse,
  UpdateResourceRequest,
  DeleteResourceRequest,
  DeleteResourceResponse,
  RecordAccessLogRequest,
  RecordAccessLogResponse,
} from "../../types/grpc";
import { resourceClient } from "./client";

export function resourceCreateResource(
  request: CreateResourceRequest,
  metadata?: grpc.Metadata
): Promise<ResourceResponse> {
  return new Promise((resolve, reject) => {
    resourceClient.createResource(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: ResourceResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}

export function resourceGetResource(
  request: GetResourceRequest,
  metadata?: grpc.Metadata
): Promise<ResourceResponse> {
  return new Promise((resolve, reject) => {
    resourceClient.getResource(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: ResourceResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}

export function resourceListResources(
  request: ListResourcesRequest,
  metadata?: grpc.Metadata
): Promise<ListResourcesResponse> {
  return new Promise((resolve, reject) => {
    resourceClient.listResources(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: ListResourcesResponse) => {
        if (err) reject(err);
        else resolve(res ?? { resources: [] });
      }
    );
  });
}

export function resourceUpdateResource(
  request: UpdateResourceRequest,
  metadata?: grpc.Metadata
): Promise<ResourceResponse> {
  return new Promise((resolve, reject) => {
    resourceClient.updateResource(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: ResourceResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}

export function resourceDeleteResource(
  request: DeleteResourceRequest,
  metadata?: grpc.Metadata
): Promise<DeleteResourceResponse> {
  return new Promise((resolve, reject) => {
    resourceClient.deleteResource(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: DeleteResourceResponse) => {
        if (err) reject(err);
        else resolve(res ?? { id: request.id, deleted: false });
      }
    );
  });
}

export function resourceListAllResources(metadata?: grpc.Metadata): Promise<ListAllResourcesResponse> {
  return new Promise((resolve, reject) => {
    resourceClient.listAllResources(
      {},
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: ListAllResourcesResponse) => {
        if (err) reject(err);
        else resolve(res ?? { resources: [] });
      }
    );
  });
}

export function resourceRecordAccessLog(
  request: RecordAccessLogRequest,
  metadata?: grpc.Metadata
): Promise<RecordAccessLogResponse> {
  return new Promise((resolve, reject) => {
    resourceClient.recordAccessLog(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: RecordAccessLogResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}
