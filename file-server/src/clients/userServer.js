const grpc = require("@grpc/grpc-js");

function createUserServerClients(proto, target) {
  const resourceClient = new proto.ResourceService(target, grpc.credentials.createInsecure());
  const userClient = new proto.UserService(target, grpc.credentials.createInsecure());

  function recordAccessLog({ userId, resourceId, action, details }) {
    return new Promise((resolve, reject) => {
      resourceClient.recordAccessLog({ userId, resourceId, action, details }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  function getResourceById(resourceId) {
    return new Promise((resolve, reject) => {
      resourceClient.getResource({ id: resourceId }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  function getUserById(userId) {
    return new Promise((resolve, reject) => {
      userClient.getUser({ user_id: userId }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  return {
    getResourceById,
    getUserById,
    recordAccessLog,
  };
}

module.exports = {
  createUserServerClients,
};
