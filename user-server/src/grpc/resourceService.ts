import grpc from "@grpc/grpc-js";
import { VisibilityPolicy, type Resource } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type {
  AccessAction,
  CreateResourceRequest,
  DeleteResourceRequest,
  DeleteResourceResponse,
  GetResourceRequest,
  ListResourcesRequest,
  ListResourcesResponse,
  RecordAccessLogRequest,
  RecordAccessLogResponse,
  ResourceGrpcResponse,
  UpdateResourceRequest,
} from "../types";

const VALID_ACCESS_ACTIONS = new Set<AccessAction>([
  "UPLOAD",
  "DOWNLOAD_URL_ISSUED",
  "DOWNLOAD_DENIED",
  "METADATA_CREATED",
  "RESOURCE_DELETED",
]);

function mapResourceToGrpcResponse(resource: Resource): ResourceGrpcResponse {
  return {
    id: resource.id,
    title: resource.title,
    courseCode: resource.courseCode,
    contentType: resource.contentType,
    objectKey: resource.objectKey,
    policy: resource.policy,
    tags: resource.tags,
    uploaderId: resource.uploaderId,
  };
}

function parsePolicy(policy: string | undefined): VisibilityPolicy {
  if (!policy) return VisibilityPolicy.LECTURE;
  const normalized = policy.trim().toUpperCase();
  if (normalized in VisibilityPolicy) {
    return VisibilityPolicy[normalized as keyof typeof VisibilityPolicy];
  }
  throw new Error(`Invalid policy. Allowed values: ${Object.values(VisibilityPolicy).join(", ")}`);
}

function createResourceHandler(
  call: grpc.ServerUnaryCall<CreateResourceRequest, ResourceGrpcResponse>,
  callback: grpc.sendUnaryData<ResourceGrpcResponse>
): void {
  const { title, courseCode, contentType, objectKey, policy, tags, uploaderId } = call.request;

  if (!title || !courseCode || !contentType || !objectKey || !uploaderId) {
    callback(
      {
        code: grpc.status.INVALID_ARGUMENT,
        message: "title, courseCode, contentType, objectKey, and uploaderId are required",
      },
      undefined
    );
    return;
  }

  if (!prisma) {
    callback(
      { code: grpc.status.UNAVAILABLE, message: "Database not configured (DATABASE_URL required)" },
      undefined
    );
    return;
  }

  let parsedPolicy: VisibilityPolicy;
  try {
    parsedPolicy = parsePolicy(policy);
  } catch (err) {
    callback(
      {
        code: grpc.status.INVALID_ARGUMENT,
        message: err instanceof Error ? err.message : "Invalid policy",
      },
      undefined
    );
    return;
  }

  prisma.resource
    .create({
      data: {
        title,
        courseCode,
        contentType,
        objectKey,
        policy: parsedPolicy,
        tags: tags ?? [],
        uploaderId,
      },
    })
    .then((resource) => callback(null, mapResourceToGrpcResponse(resource)))
    .catch((err: { code?: string } | Error) => {
      if ((err as { code?: string }).code === "P2002") {
        callback(
          { code: grpc.status.ALREADY_EXISTS, message: "Resource with this objectKey already exists" },
          undefined
        );
        return;
      }
      if ((err as { code?: string }).code === "P2003") {
        callback({ code: grpc.status.NOT_FOUND, message: "Uploader user not found" }, undefined);
        return;
      }
      console.error("CreateResource error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function updateResourceHandler(
  call: grpc.ServerUnaryCall<UpdateResourceRequest, ResourceGrpcResponse>,
  callback: grpc.sendUnaryData<ResourceGrpcResponse>
): void {
  const { id, title, courseCode, contentType, objectKey, policy, tags, uploaderId } = call.request;
  if (!id) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "id is required" }, undefined);
    return;
  }
  if (!prisma) {
    callback(
      { code: grpc.status.UNAVAILABLE, message: "Database not configured (DATABASE_URL required)" },
      undefined
    );
    return;
  }

  const data: Partial<
    Pick<Resource, "title" | "courseCode" | "contentType" | "objectKey" | "policy" | "tags" | "uploaderId">
  > = {};
  if (title !== undefined) data.title = title;
  if (courseCode !== undefined) data.courseCode = courseCode;
  if (contentType !== undefined) data.contentType = contentType;
  if (objectKey !== undefined) data.objectKey = objectKey;
  if (tags !== undefined) data.tags = tags;
  if (uploaderId !== undefined) data.uploaderId = uploaderId;
  if (policy !== undefined) {
    try {
      data.policy = parsePolicy(policy);
    } catch (err) {
      callback(
        {
          code: grpc.status.INVALID_ARGUMENT,
          message: err instanceof Error ? err.message : "Invalid policy",
        },
        undefined
      );
      return;
    }
  }

  if (Object.keys(data).length === 0) {
    callback(
      { code: grpc.status.INVALID_ARGUMENT, message: "At least one updatable field is required" },
      undefined
    );
    return;
  }

  prisma.resource
    .update({
      where: { id },
      data,
    })
    .then((resource) => callback(null, mapResourceToGrpcResponse(resource)))
    .catch((err: { code?: string } | Error) => {
      if ((err as { code?: string }).code === "P2025") {
        callback({ code: grpc.status.NOT_FOUND, message: "Resource not found" }, undefined);
        return;
      }
      if ((err as { code?: string }).code === "P2002") {
        callback(
          { code: grpc.status.ALREADY_EXISTS, message: "Resource with this objectKey already exists" },
          undefined
        );
        return;
      }
      if ((err as { code?: string }).code === "P2003") {
        callback({ code: grpc.status.NOT_FOUND, message: "Uploader user not found" }, undefined);
        return;
      }
      console.error("UpdateResource error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function getResourceHandler(
  call: grpc.ServerUnaryCall<GetResourceRequest, ResourceGrpcResponse>,
  callback: grpc.sendUnaryData<ResourceGrpcResponse>
): void {
  const resourceId = call.request.id;
  if (!resourceId) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "id is required" }, undefined);
    return;
  }
  if (!prisma) {
    callback(
      { code: grpc.status.UNAVAILABLE, message: "Database not configured (DATABASE_URL required)" },
      undefined
    );
    return;
  }

  prisma.resource
    .findUnique({ where: { id: resourceId } })
    .then((resource) => {
      if (!resource) {
        callback({ code: grpc.status.NOT_FOUND, message: "Resource not found" }, undefined);
        return;
      }
      callback(null, mapResourceToGrpcResponse(resource));
    })
    .catch((err) => {
      console.error("GetResource error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function deleteResourceHandler(
  call: grpc.ServerUnaryCall<DeleteResourceRequest, DeleteResourceResponse>,
  callback: grpc.sendUnaryData<DeleteResourceResponse>
): void {
  const resourceId = call.request.id;
  if (!resourceId) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "id is required" }, undefined);
    return;
  }
  if (!prisma) {
    callback(
      { code: grpc.status.UNAVAILABLE, message: "Database not configured (DATABASE_URL required)" },
      undefined
    );
    return;
  }

  prisma.resource
    .delete({ where: { id: resourceId } })
    .then(() => callback(null, { id: resourceId, deleted: true }))
    .catch((err: { code?: string } | Error) => {
      if ((err as { code?: string }).code === "P2025") {
        callback(null, { id: resourceId, deleted: false });
        return;
      }
      console.error("DeleteResource error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function recordAccessLogHandler(
  call: grpc.ServerUnaryCall<RecordAccessLogRequest, RecordAccessLogResponse>,
  callback: grpc.sendUnaryData<RecordAccessLogResponse>
): void {
  const { userId, resourceId, action } = call.request;
  if (!userId || !resourceId) {
    callback(
      { code: grpc.status.INVALID_ARGUMENT, message: "userId and resourceId are required" },
      undefined
    );
    return;
  }
  if (!action || !VALID_ACCESS_ACTIONS.has(action)) {
    callback(
      {
        code: grpc.status.INVALID_ARGUMENT,
        message: `Invalid action. Allowed values: ${Array.from(VALID_ACCESS_ACTIONS).join(", ")}`,
      },
      undefined
    );
    return;
  }
  if (!prisma) {
    callback(
      { code: grpc.status.UNAVAILABLE, message: "Database not configured (DATABASE_URL required)" },
      undefined
    );
    return;
  }

  prisma.accessLog
    .create({
      data: {
        userId,
        resourceId,
        action,
      },
    })
    .then((log) =>
      callback(null, {
        logId: log.id,
        timestampMs: String(log.createdAt.getTime()),
      })
    )
    .catch((err) => {
      console.error("RecordAccessLog error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function listResourcesHandler(
  call: grpc.ServerUnaryCall<ListResourcesRequest, ListResourcesResponse>,
  callback: grpc.sendUnaryData<ListResourcesResponse>
): void {
  const courseCode = call.request.courseCode;
  if (!courseCode) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "courseCode is required" }, undefined);
    return;
  }
  if (!prisma) {
    callback(
      { code: grpc.status.UNAVAILABLE, message: "Database not configured (DATABASE_URL required)" },
      undefined
    );
    return;
  }

  prisma.resource
    .findMany({
      where: { courseCode },
      orderBy: { createdAt: "desc" },
    })
    .then((resources) => callback(null, { resources: resources.map(mapResourceToGrpcResponse) }))
    .catch((err) => {
      console.error("ListResources error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

export const resourceServiceHandlers = {
  createResource: createResourceHandler,
  getResource: getResourceHandler,
  listResources: listResourcesHandler,
  updateResource: updateResourceHandler,
  deleteResource: deleteResourceHandler,
  recordAccessLog: recordAccessLogHandler,
};
