const grpc = require("@grpc/grpc-js");
const { buildObjectKey } = require("../services/objectKey");
const { VisibilityPolicy } = require("@prisma/client");

function createFileServiceHandlers({
  presignUpload,
  presignDownload,
  getResourceById,
  checkEnrollment,
  recordAccessLog,
}) {
  async function safeRecordAccessLog(payload) {
    if (typeof recordAccessLog !== "function") {
      return;
    }
    try {
      await recordAccessLog(payload);
    } catch (err) {
      console.error("RecordAccessLog error:", err);
    }
  }

  function get(_call, callback) {
    callback(null, { message: "hello" });
  }

  function getUploadUrl(call, callback) {
    const { courseCode, contentType, policy, tags, uploaderId, expires_in: expiresIn } = call.request;

    function fail(code, message, details) {
      safeRecordAccessLog({
        userId: uploaderId || "",
        resourceId: "",
        action: "UPLOAD_URL_DENIED",
        details: `rpc=GetUploadUrl status=FAILURE ${details || message}`,
      }).finally(() => callback({ code, message }));
    }

    if (!courseCode || !contentType || !policy || !uploaderId) {
      fail(grpc.status.INVALID_ARGUMENT, "courseCode, contentType, policy, and uploaderId are required");
      return;
    }

    if (tags != null && !Array.isArray(tags)) {
      fail(grpc.status.INVALID_ARGUMENT, "tags must be a list");
      return;
    }

    const normalizedPolicy = policy?.trim().toUpperCase();
    if (!normalizedPolicy || !(normalizedPolicy in VisibilityPolicy)) {
      fail(
        grpc.status.INVALID_ARGUMENT,
        `Invalid policy. Allowed values: ${Object.keys(VisibilityPolicy).join(", ")}`
      );
      return;
    }

    if (expiresIn != null && expiresIn <= 0) {
      fail(grpc.status.INVALID_ARGUMENT, "expires_in must be > 0");
      return;
    }

    const objectKey = buildObjectKey({ courseCode, uploaderId, contentType });
    presignUpload({ objectKey, contentType, expiresIn: expiresIn || 300 })
      .then((url) =>
        safeRecordAccessLog({
          userId: uploaderId,
          resourceId: objectKey,
          action: "UPLOAD_URL_ISSUED",
          details: `rpc=GetUploadUrl status=SUCCESS objectKey=${objectKey} policy=${policy}`,
        }).finally(() => callback(null, { url, object_key: objectKey }))
      )
      .catch((err) => {
        console.error("GetUploadUrl error:", err);
        const message = err instanceof Error ? err.message : "Failed to generate upload URL";
        fail(grpc.status.INTERNAL, message, `error=${message}`);
      });
  }

  function getDownloadUrl(call, callback) {
    const { resource_id: resourceId, expires_in: expiresIn, requester_user_id: requesterUserId } = call.request;

    function fail(code, message, details) {
      safeRecordAccessLog({
        userId: requesterUserId || "",
        resourceId: resourceId || "",
        action: "DOWNLOAD_URL_DENIED",
        details: `rpc=GetDownloadUrl status=FAILURE ${details || message}`,
      }).finally(() => callback({ code, message }));
    }

    if (!resourceId) {
      fail(grpc.status.INVALID_ARGUMENT, "resource_id is required");
      return;
    }

    if (!requesterUserId) {
      fail(grpc.status.INVALID_ARGUMENT, "requester_user_id is required");
      return;
    }

    if (expiresIn != null && expiresIn <= 0) {
      fail(grpc.status.INVALID_ARGUMENT, "expires_in must be > 0");
      return;
    }

    (async () => {
      const resource = await getResourceById(resourceId);
      if (!resource?.objectKey) {
        fail(grpc.status.NOT_FOUND, "Resource object key not found");
        return;
      }

      if (resource.policy !== VisibilityPolicy.LECTURE && resource.policy !== VisibilityPolicy.ASSIGNMENT) {
        // Enforce course enrollment check
        if (typeof checkEnrollment !== "function") {
           fail(grpc.status.INTERNAL, "Enrollment checking is unavailable");
           return;
        }
        
        const enrollment = await checkEnrollment(requesterUserId, resource.courseCode);
        if (!enrollment?.is_enrolled) {
          fail(grpc.status.PERMISSION_DENIED, `Not enrolled in course ${resource.courseCode}`);
          return;
        }

        if (resource.policy === VisibilityPolicy.HIGHLY_SENSITIVE) {
           fail(grpc.status.PERMISSION_DENIED, "Download is not allowed for highly sensitive policies");
           return;
        }
        
        if (resource.policy === VisibilityPolicy.EXAM || resource.policy === VisibilityPolicy.SOLUTION) {
           if (enrollment.role !== "ta" && enrollment.role !== "instructor") {
             fail(grpc.status.PERMISSION_DENIED, `Download for policy ${resource.policy} requires TA or Instructor role`);
             return;
           }
        }
      }      const url = await presignDownload({ objectKey: resource.objectKey, expiresIn: expiresIn || 300 });
      safeRecordAccessLog({
        userId: requesterUserId,
        resourceId,
        action: "DOWNLOAD_URL_ISSUED",
        details: `rpc=GetDownloadUrl status=SUCCESS objectKey=${resource.objectKey} policy=${resource.policy}`,
      }).finally(() => callback(null, { url }));
    })().catch((err) => {
      if (typeof err?.code === "number") {
        fail(err.code, err.message || "Failed to resolve authorization");
        return;
      }
      console.error("GetDownloadUrl error:", err);
      const message = err instanceof Error ? err.message : "Failed to generate download URL";
      fail(grpc.status.INTERNAL, message, `error=${message}`);
    });
  }

  return {
    get,
    getUploadUrl,
    getDownloadUrl,
  };
}

module.exports = {
  createFileServiceHandlers,
};
