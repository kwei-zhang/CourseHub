const grpc = require("@grpc/grpc-js");
const { VisibilityPolicy } = require("@prisma/client");
const { prisma } = require("../lib/prisma");

const VALID_ACCESS_ACTIONS = new Set([
  "UPLOAD_URL_ISSUED",
  "UPLOAD_URL_DENIED",
  "DOWNLOAD_URL_ISSUED",
  "DOWNLOAD_URL_DENIED",
  "METADATA_CREATED",
  "RESOURCE_DELETED",
]);

function mapResourceToGrpcResponse(resource) {
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

function parsePolicy(policy) {
  if (!policy) return VisibilityPolicy.LECTURE;
  const normalized = policy.trim().toUpperCase();
  if (normalized in VisibilityPolicy) {
    return VisibilityPolicy[normalized];
  }
  throw new Error(`Invalid policy. Allowed values: ${Object.keys(VisibilityPolicy).join(", ")}`);
}

function createResourceHandler(call, callback) {
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

  let parsedPolicy;
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
        tags: tags || [],
        uploaderId,
      },
    })
    .then((resource) => callback(null, mapResourceToGrpcResponse(resource)))
    .catch((err) => {
      if (err.code === "P2002") {
        callback(
          { code: grpc.status.ALREADY_EXISTS, message: "Resource with this objectKey already exists" },
          undefined
        );
        return;
      }
      console.error("CreateResource error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function updateResourceHandler(call, callback) {
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

  const data = {};
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
    .catch((err) => {
      if (err.code === "P2025") {
        callback({ code: grpc.status.NOT_FOUND, message: "Resource not found" }, undefined);
        return;
      }
      if (err.code === "P2002") {
        callback(
          { code: grpc.status.ALREADY_EXISTS, message: "Resource with this objectKey already exists" },
          undefined
        );
        return;
      }
      console.error("UpdateResource error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function getResourceHandler(call, callback) {
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

function deleteResourceHandler(call, callback) {
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
    .catch((err) => {
      if (err.code === "P2025") {
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

function recordAccessLogHandler(call, callback) {
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

function listResourcesHandler(call, callback) {
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

function createResourceServiceHandlers() {
  return {
    createResource: createResourceHandler,
    getResource: getResourceHandler,
    listResources: listResourcesHandler,
    updateResource: updateResourceHandler,
    deleteResource: deleteResourceHandler,
    recordAccessLog: recordAccessLogHandler,
  };
}

module.exports = {
  createResourceServiceHandlers,
};
