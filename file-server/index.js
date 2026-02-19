const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '../proto/services.proto');
const PORT = process.env.PORT || 5002;

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition).ece1779;

function get(call, callback) {
  callback(null, { message: 'hello' });
}

const server = new grpc.Server();
server.addService(proto.FileService.service, { get });
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`File server (gRPC) listening on port ${port}`);
  }
);
