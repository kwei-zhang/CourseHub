import grpc from "@grpc/grpc-js";
import type {
  GetResponse,
  GetUserResponse,
  UpdateUserRequest,
  DeleteUserResponse,
  SearchUsersByNameResponse,
  GetUserByEmailResponse,
  ListEnrollmentsResponse,
  EnrollUserRequest,
  EnrollUserResponse,
  UnenrollUserRequest,
  UnenrollUserResponse,
  ListCoursesResponse,
  CourseInfo,
  CreateCourseRequest,
  DeleteCourseRequest,
  DeleteCourseResponse,
  ListAllUsersResponse,
} from "../../types/grpc";
import { userClient } from "./client";

export function userGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    userClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
      if (err) reject(err);
      else resolve(res ?? { message: "" });
    });
  });
}

export function userGetUser(userId: string, metadata?: grpc.Metadata): Promise<GetUserResponse> {
  return new Promise((resolve, reject) => {
    userClient.getUser(
      { user_id: userId },
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: GetUserResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}

export function userUpdateUser(
  request: UpdateUserRequest,
  metadata?: grpc.Metadata
): Promise<GetUserResponse> {
  return new Promise((resolve, reject) => {
    userClient.updateUser(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: GetUserResponse) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}

export function userDeleteUser(userId: string, metadata?: grpc.Metadata): Promise<DeleteUserResponse> {
  return new Promise((resolve, reject) => {
    userClient.deleteUser(
      { user_id: userId },
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: DeleteUserResponse) => {
        if (err) reject(err);
        else resolve(res ?? { ok: false });
      }
    );
  });
}

export function userSearchUsersByName(
  nameQuery: string,
  metadata?: grpc.Metadata
): Promise<SearchUsersByNameResponse> {
  return new Promise((resolve, reject) => {
    userClient.searchUsersByName(
      { name_query: nameQuery },
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: SearchUsersByNameResponse) => {
        if (err) reject(err);
        else resolve(res ?? { users: [] });
      }
    );
  });
}

export function userGetUserByEmail(
  email: string,
  metadata?: grpc.Metadata
): Promise<GetUserByEmailResponse> {
  return new Promise((resolve, reject) => {
    userClient.getUserByEmail(
      { email },
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: GetUserByEmailResponse) => {
        if (err) reject(err);
        else resolve(res ?? {});
      }
    );
  });
}

export function userListEnrollments(
  userId: string,
  metadata?: grpc.Metadata
): Promise<ListEnrollmentsResponse> {
  return new Promise((resolve, reject) => {
    userClient.listEnrollments(
      { user_id: userId },
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: ListEnrollmentsResponse) => {
        if (err) reject(err);
        else resolve(res ?? { enrollments: [] });
      }
    );
  });
}

export function userEnrollUser(
  request: EnrollUserRequest,
  metadata?: grpc.Metadata
): Promise<EnrollUserResponse> {
  return new Promise((resolve, reject) => {
    userClient.enrollUser(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: EnrollUserResponse) => {
        if (err) reject(err);
        else resolve(res ?? { ok: false, enrollment_id: "" });
      }
    );
  });
}

export function userUnenrollUser(
  request: UnenrollUserRequest,
  metadata?: grpc.Metadata
): Promise<UnenrollUserResponse> {
  return new Promise((resolve, reject) => {
    userClient.unenrollUser(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: UnenrollUserResponse) => {
        if (err) reject(err);
        else resolve(res ?? { ok: false });
      }
    );
  });
}

export function userListCourses(metadata?: grpc.Metadata): Promise<ListCoursesResponse> {
  return new Promise((resolve, reject) => {
    userClient.listCourses(
      {},
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: ListCoursesResponse) => {
        if (err) reject(err);
        else resolve(res ?? { courses: [] });
      }
    );
  });
}

export function userCreateCourse(
  request: CreateCourseRequest,
  metadata?: grpc.Metadata
): Promise<CourseInfo> {
  return new Promise((resolve, reject) => {
    userClient.createCourse(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: CourseInfo) => {
        if (err) reject(err);
        else if (!res) reject(new Error("Empty response"));
        else resolve(res);
      }
    );
  });
}

export function userDeleteCourse(
  request: DeleteCourseRequest,
  metadata?: grpc.Metadata
): Promise<DeleteCourseResponse> {
  return new Promise((resolve, reject) => {
    userClient.deleteCourse(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: DeleteCourseResponse) => {
        if (err) reject(err);
        else resolve(res ?? { ok: false });
      }
    );
  });
}

export function userListAllUsers(metadata?: grpc.Metadata): Promise<ListAllUsersResponse> {
  return new Promise((resolve, reject) => {
    userClient.listAllUsers(
      {},
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: ListAllUsersResponse) => {
        if (err) reject(err);
        else resolve(res ?? { users: [] });
      }
    );
  });
}
