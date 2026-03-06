const path = require("path");
const assert = require("node:assert");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

process.env.SPACES_REGION = "tor1";
process.env.SPACES_ENDPOINT = "https://tor1.digitaloceanspaces.com";
process.env.SPACES_BUCKET = "integration-test-bucket";
process.env.SPACES_KEY = "test-access-key";
process.env.SPACES_SECRET = "test-secret-key";

const ROOT = path.resolve(__dirname, "..");
const PROTO_PATH = path.join(ROOT, "..", "proto", "services.proto");
const FILE_SERVER_PORT = String(5500 + Math.floor(Math.random() * 300));
const USER_SERVER_PORT = String(5900 + Math.floor(Math.random() * 300));
const FILE_SERVER_TARGET = `localhost:${FILE_SERVER_PORT}`;
const USER_SERVER_TARGET = `localhost:${USER_SERVER_PORT}`;

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition).ece1779;
const client = new proto.FileService(FILE_SERVER_TARGET, grpc.credentials.createInsecure());

const accessLogs = [];
const resourcesById = {
  res_lecture: {
    id: "res_lecture",
    title: "Lecture 1",
    courseCode: "ECE1779",
    contentType: "text/plain",
    objectKey: "ECE1779/20260305/uploader_1/lecture1.txt",
    policy: "LECTURE",
    tags: ["week1"],
    uploaderId: "uploader_1",
  },
  res_exam: {
    id: "res_exam",
    title: "Midterm",
    courseCode: "ECE1779",
    contentType: "application/pdf",
    objectKey: "ECE1779/20260305/instructor_1/midterm.pdf",
    policy: "EXAM",
    tags: ["exam"],
    uploaderId: "instructor_1",
  },
};
const usersById = {
  student_1: {
    id: "student_1",
    name: "Student One",
    email: "student@example.com",
    email_verified: true,
    image: "",
    created_at: "",
    updated_at: "",
    role: "STUDENT",
  },
  ta_1: {
    id: "ta_1",
    name: "TA One",
    email: "ta@example.com",
    email_verified: true,
    image: "",
    created_at: "",
    updated_at: "",
    role: "TA",
  },
};

function startMockUserServer(port) {
  const server = new grpc.Server();

  server.addService(proto.UserService.service, {
    getUser(call, callback) {
      const user = usersById[call.request.user_id];
      if (!user) {
        callback({ code: grpc.status.NOT_FOUND, message: "User not found" });
        return;
      }
      callback(null, user);
    },
  });

  server.addService(proto.ResourceService.service, {
    getResource(call, callback) {
      const resource = resourcesById[call.request.id];
      if (!resource) {
        callback({ code: grpc.status.NOT_FOUND, message: "Resource not found" });
        return;
      }
      callback(null, resource);
    },
    recordAccessLog(call, callback) {
      accessLogs.push({
        userId: call.request.userId,
        resourceId: call.request.resourceId,
        action: call.request.action,
        details: call.request.details,
      });
      callback(null, {
        logId: `log_${accessLogs.length}`,
        timestampMs: Date.now(),
      });
    },
  });

  return new Promise((resolve, reject) => {
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(server);
    });
  });
}

function rpc(method, payload) {
  return new Promise((resolve, reject) => {
    client[method](payload, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

async function run() {
  let grpcServer;
  let mockUserServer;
  try {
    mockUserServer = await startMockUserServer(USER_SERVER_PORT);
    process.env.USER_SERVER = USER_SERVER_TARGET;
    const { startServer } = require("../index");
    const started = await startServer(FILE_SERVER_PORT);
    grpcServer = started.server;

    const logsBeforeUploadSuccess = accessLogs.length;
    const uploadRes = await rpc("getUploadUrl", {
      title: "Week 1 Notes",
      courseCode: "ECE1779",
      contentType: "text/plain",
      policy: "LECTURE",
      tags: ["week1", "intro"],
      uploaderId: "user_123",
      expires_in: 300,
    });
    assert.ok(typeof uploadRes.url === "string" && uploadRes.url.length > 0);
    assert.ok(typeof uploadRes.object_key === "string" && uploadRes.object_key.length > 0);
    assert.match(uploadRes.url, /^https?:\/\//);
    assert.ok(
      uploadRes.url.includes(uploadRes.object_key) ||
        uploadRes.url.includes(encodeURIComponent(uploadRes.object_key))
    );
    const uploadSuccessLog = accessLogs[logsBeforeUploadSuccess];
    assert.ok(uploadSuccessLog);
    assert.strictEqual(uploadSuccessLog.action, "UPLOAD");
    assert.strictEqual(uploadSuccessLog.userId, "user_123");
    assert.strictEqual(uploadSuccessLog.resourceId, uploadRes.object_key);
    assert.match(uploadSuccessLog.details, /rpc=GetUploadUrl status=SUCCESS/);
    console.log("PASS GetUploadUrl returns a signed URL");

    const logsBeforeUploadFailure = accessLogs.length;
    await assert.rejects(
      () =>
        rpc("getUploadUrl", {
          title: "Missing metadata",
          courseCode: "ECE1779",
          policy: "LECTURE",
          tags: [],
          uploaderId: "user_123",
        }),
      (err) => err.code === grpc.status.INVALID_ARGUMENT
    );
    const uploadFailureLog = accessLogs[logsBeforeUploadFailure];
    assert.ok(uploadFailureLog);
    assert.strictEqual(uploadFailureLog.action, "UPLOAD");
    assert.strictEqual(uploadFailureLog.userId, "user_123");
    assert.strictEqual(uploadFailureLog.resourceId, "");
    assert.match(uploadFailureLog.details, /rpc=GetUploadUrl status=FAILURE/);
    console.log("PASS GetUploadUrl rejects missing content_type");

    const logsBeforeDownloadMissingResource = accessLogs.length;
    await assert.rejects(
      () => rpc("getDownloadUrl", {}),
      (err) => err.code === grpc.status.INVALID_ARGUMENT
    );
    const downloadMissingResourceLog = accessLogs[logsBeforeDownloadMissingResource];
    assert.ok(downloadMissingResourceLog);
    assert.strictEqual(downloadMissingResourceLog.action, "DOWNLOAD_DENIED");
    assert.strictEqual(downloadMissingResourceLog.resourceId, "");
    assert.match(downloadMissingResourceLog.details, /rpc=GetDownloadUrl status=FAILURE/);
    console.log("PASS GetDownloadUrl rejects missing resource_id");

    const logsBeforeDownloadSuccess = accessLogs.length;
    const downloadRes = await rpc("getDownloadUrl", {
      resource_id: "res_lecture",
      requester_user_id: "student_1",
      expires_in: 300,
    });
    assert.ok(typeof downloadRes.url === "string" && downloadRes.url.length > 0);
    const downloadSuccessLog = accessLogs[logsBeforeDownloadSuccess];
    assert.ok(downloadSuccessLog);
    assert.strictEqual(downloadSuccessLog.action, "DOWNLOAD_URL_ISSUED");
    assert.strictEqual(downloadSuccessLog.userId, "student_1");
    assert.strictEqual(downloadSuccessLog.resourceId, "res_lecture");
    assert.match(downloadSuccessLog.details, /rpc=GetDownloadUrl status=SUCCESS/);
    console.log("PASS GetDownloadUrl returns signed URL and logs DOWNLOAD_URL_ISSUED");

    const logsBeforeDownloadDenied = accessLogs.length;
    await assert.rejects(
      () =>
        rpc("getDownloadUrl", {
          resource_id: "res_exam",
          requester_user_id: "student_1",
          expires_in: 300,
        }),
      (err) => err.code === grpc.status.PERMISSION_DENIED
    );
    const downloadDeniedLog = accessLogs[logsBeforeDownloadDenied];
    assert.ok(downloadDeniedLog);
    assert.strictEqual(downloadDeniedLog.action, "DOWNLOAD_DENIED");
    assert.strictEqual(downloadDeniedLog.userId, "student_1");
    assert.strictEqual(downloadDeniedLog.resourceId, "res_exam");
    assert.match(downloadDeniedLog.details, /rpc=GetDownloadUrl status=FAILURE/);
    console.log("PASS GetDownloadUrl denial logs DOWNLOAD_DENIED");

    console.log("All file-server integration tests passed.");
  } finally {
    client.close();
    if (grpcServer) {
      await new Promise((resolve) => grpcServer.tryShutdown(resolve));
    }
    if (mockUserServer) {
      await new Promise((resolve) => mockUserServer.tryShutdown(resolve));
    }
  }
}

run().catch((err) => {
  console.error("Integration test failed:", err);
  process.exit(1);
});
