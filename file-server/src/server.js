const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { presignUpload, presignDownload } = require("../spaces");
const { createUserServerClients } = require("./clients/userServer");
const { createFileServiceHandlers } = require("./handlers/fileService");

const PROTO_PATH = process.env.PROTO_PATH || path.join(__dirname, "../../proto/services.proto");
const PORT = process.env.PORT || 5002;
const USER_SERVER_TARGET = process.env.USER_SERVER || "localhost:5001";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition).ece1779;

function createServer() {
  const clients = createUserServerClients(proto, USER_SERVER_TARGET);
  const handlers = createFileServiceHandlers({
    presignUpload,
    presignDownload,
    getResourceById: clients.getResourceById,
    getUserById: clients.getUserById,
    recordAccessLog: clients.recordAccessLog,
  });

  const server = new grpc.Server();
  server.addService(proto.FileService.service, handlers);
  return { server, handlers };
}

function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    const { server, handlers } = createServer();
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(`File server (gRPC) listening on port ${boundPort}`);
      resolve({ server, port: boundPort, handlers });
    });
  });
}

module.exports = {
  createServer,
  startServer,
};
