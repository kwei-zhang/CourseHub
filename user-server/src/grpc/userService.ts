import grpc from "@grpc/grpc-js";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type {
  DeleteUserResponse,
  GetUserByEmailRequest,
  GetUserByEmailResponse,
  GetUserGrpcResponse,
  SearchUsersByNameRequest,
  SearchUsersByNameResponse,
  UpdateUserRequest,
  CheckEnrollmentRequest,
  CheckEnrollmentResponse,
} from "../types";

function mapUserToGrpcResponse(user: User): GetUserGrpcResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.emailVerified,
    image: user.image ?? "",
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
    role: user.role ?? "user",
  };
}

async function updateUser(
  userId: string,
  data: Partial<Pick<User, "name" | "image" | "role" | "emailVerified">>
): Promise<GetUserGrpcResponse> {
  if (!prisma) throw new Error("Database not configured (DATABASE_URL required)");
  if (!userId) throw new Error("userId is required");
  const updated = await prisma.user.update({ where: { id: userId }, data });
  return mapUserToGrpcResponse(updated);
}

async function deleteUser(userId: string): Promise<boolean> {
  if (!prisma) throw new Error("Database not configured (DATABASE_URL required)");
  if (!userId) throw new Error("userId is required");
  try {
    await prisma.user.delete({ where: { id: userId } });
    return true;
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025") return false;
    throw err;
  }
}

async function searchUsersByName(nameQuery: string): Promise<GetUserGrpcResponse[]> {
  if (!prisma) throw new Error("Database not configured (DATABASE_URL required)");
  if (!nameQuery) return [];
  const users = await prisma.user.findMany({
    where: { name: { contains: nameQuery, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });
  return users.map(mapUserToGrpcResponse);
}

async function getUserByEmail(email: string): Promise<GetUserGrpcResponse | null> {
  if (!prisma) throw new Error("Database not configured (DATABASE_URL required)");
  if (!email) throw new Error("email is required");
  const user = await prisma.user.findUnique({ where: { email } });
  return user ? mapUserToGrpcResponse(user) : null;
}

function get(
  _call: grpc.ServerUnaryCall<Record<string, never>, { message: string }>,
  callback: grpc.sendUnaryData<{ message: string }>
): void {
  callback(null, { message: "hello" });
}

function getUser(
  call: grpc.ServerUnaryCall<{ user_id: string }, Record<string, unknown>>,
  callback: grpc.sendUnaryData<GetUserGrpcResponse>
): void {
  const userId = call.request.user_id;
  if (!userId) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "user_id is required" }, undefined);
    return;
  }
  if (!prisma) {
    callback(
      { code: grpc.status.UNAVAILABLE, message: "Database not configured (DATABASE_URL required)" },
      undefined
    );
    return;
  }

  prisma.user
    .findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
    })
    .then((user) => {
      if (!user) {
        callback({ code: grpc.status.NOT_FOUND, message: "User not found" }, undefined);
        return;
      }
      callback(null, mapUserToGrpcResponse(user));
    })
    .catch((err) => {
      console.error("GetUser DB error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function updateUserHandler(
  call: grpc.ServerUnaryCall<UpdateUserRequest, GetUserGrpcResponse>,
  callback: grpc.sendUnaryData<GetUserGrpcResponse>
): void {
  const { user_id, name, image, role, email_verified } = call.request;
  if (!user_id) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "user_id is required" }, undefined);
    return;
  }
  const data: Partial<Pick<User, "name" | "image" | "role" | "emailVerified">> = {};
  if (name !== undefined) data.name = name;
  if (image !== undefined) data.image = image;
  if (role !== undefined) data.role = role;
  if (email_verified !== undefined) data.emailVerified = email_verified;
  updateUser(user_id, data)
    .then((user) => callback(null, user))
    .catch((err) => {
      if ((err as { code?: string })?.code === "P2025") {
        callback({ code: grpc.status.NOT_FOUND, message: "User not found" }, undefined);
        return;
      }
      console.error("UpdateUser error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function deleteUserHandler(
  call: grpc.ServerUnaryCall<{ user_id: string }, DeleteUserResponse>,
  callback: grpc.sendUnaryData<DeleteUserResponse>
): void {
  const userId = call.request.user_id;
  if (!userId) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "user_id is required" }, undefined);
    return;
  }
  if (!prisma) {
    callback({ code: grpc.status.UNAVAILABLE, message: "Database not configured" }, undefined);
    return;
  }
  deleteUser(userId)
    .then((ok) => callback(null, { ok }))
    .catch((err) => {
      console.error("DeleteUser error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function searchUsersByNameHandler(
  call: grpc.ServerUnaryCall<SearchUsersByNameRequest, SearchUsersByNameResponse>,
  callback: grpc.sendUnaryData<SearchUsersByNameResponse>
): void {
  const nameQuery = call.request.name_query ?? "";
  searchUsersByName(nameQuery)
    .then((users) => callback(null, { users }))
    .catch((err) => {
      console.error("SearchUsersByName error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function getUserByEmailHandler(
  call: grpc.ServerUnaryCall<GetUserByEmailRequest, GetUserByEmailResponse>,
  callback: grpc.sendUnaryData<GetUserByEmailResponse>
): void {
  const email = call.request.email;
  if (!email) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "email is required" }, undefined);
    return;
  }
  getUserByEmail(email)
    .then((user) => callback(null, user != null ? { user } : {}))
    .catch((err) => {
      console.error("GetUserByEmail error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

function checkEnrollmentHandler(
  call: grpc.ServerUnaryCall<CheckEnrollmentRequest, CheckEnrollmentResponse>,
  callback: grpc.sendUnaryData<CheckEnrollmentResponse>
): void {
  const { user_id, course_code } = call.request;
  if (!user_id || !course_code) {
    callback(
      { code: grpc.status.INVALID_ARGUMENT, message: "user_id and course_code are required" },
      undefined
    );
    return;
  }
  if (!prisma) {
    callback(
      { code: grpc.status.UNAVAILABLE, message: "Database not configured" },
      undefined
    );
    return;
  }

  prisma.course
    .findUnique({
      where: { code: course_code },
      include: { enrollments: { where: { userId: user_id } } },
    })
    .then((course) => {
      if (!course) {
        callback(null, { is_enrolled: false, role: "" });
        return;
      }
      const enrollment = course.enrollments[0];
      if (!enrollment) {
        callback(null, { is_enrolled: false, role: "" });
        return;
      }
      callback(null, { is_enrolled: true, role: enrollment.role });
    })
    .catch((err) => {
      console.error("CheckEnrollment error:", err);
      callback(
        { code: grpc.status.INTERNAL, message: err instanceof Error ? err.message : "Database error" },
        undefined
      );
    });
}

export const userServiceHandlers = {
  get,
  getUser,
  updateUser: updateUserHandler,
  deleteUser: deleteUserHandler,
  searchUsersByName: searchUsersByNameHandler,
  getUserByEmail: getUserByEmailHandler,
  checkEnrollment: checkEnrollmentHandler,
};
