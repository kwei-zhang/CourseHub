import * as grpc from "@grpc/grpc-js";

export function createUserServerClients(proto, target) {
  const client = new proto.UserService(target, grpc.credentials.createInsecure());

  function getUserById(userId) {
    return new Promise((resolve, reject) => {
      client.GetUser({ user_id: userId }, (err, response) => {
        if (err) {
          if (err.code === grpc.status.NOT_FOUND) return resolve(null);
          return reject(err);
        }
        resolve(response);
      });
    });
  }

  function checkEnrollment(userId, courseCode) {
    return new Promise((resolve, reject) => {
      client.CheckEnrollment({ user_id: userId, course_code: courseCode }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }

  return { getUserById, checkEnrollment };
}
