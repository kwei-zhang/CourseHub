/**
 * Unit tests for user-server gRPC handlers (userServiceHandlers).
 *
 * All tests monkey-patch the `prisma` export from "../src/lib/prisma" so no
 * real database connection is required. The pattern mirrors the existing
 * auth/test/auth.test.ts approach: import the handler directly, build fake
 * gRPC call/callback objects, run the handler, and assert on the callback
 * arguments.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import grpc from "@grpc/grpc-js";

// ─── prisma mock ─────────────────────────────────────────────────────────────

// We import the prisma module first so we can patch it before userService.ts
// imports it. Because Node ESM caches modules, both files share the same
// module instance once loaded.
import * as prismaModule from "../src/lib/prisma.js";
import { userServiceHandlers } from "../src/grpc/userService.js";

/** Faked Prisma user row */
const fakeUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  emailVerified: new Date("2024-01-01"),
  image: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-02-01"),
  role: "user",
};

/** The shape of GetUserGrpcResponse we expect for fakeUser */
const fakeUserGrpc = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  email_verified: fakeUser.emailVerified,
  image: "",
  created_at: fakeUser.createdAt.toISOString(),
  updated_at: fakeUser.updatedAt.toISOString(),
  role: "user",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a minimal fake ServerUnaryCall for a gRPC handler.
 */
function fakeCall<T>(request: T): grpc.ServerUnaryCall<T, unknown> {
  return { request } as grpc.ServerUnaryCall<T, unknown>;
}

type CallbackResult<T> = { err: grpc.ServiceError | null; response: T | undefined };

/** Returns a promise that resolves when the gRPC callback fires. */
function captureCallback<T>(): {
  callback: grpc.sendUnaryData<T>;
  result: Promise<CallbackResult<T>>;
} {
  let resolve!: (v: CallbackResult<T>) => void;
  const result = new Promise<CallbackResult<T>>((res) => { resolve = res; });
  const callback: grpc.sendUnaryData<T> = (err, response) => {
    resolve({ err: err as grpc.ServiceError | null, response: response ?? undefined });
  };
  return { callback, result };
}

// ─── getUser ─────────────────────────────────────────────────────────────────

describe("getUser handler", () => {
  it("returns INVALID_ARGUMENT when user_id is empty", async () => {
    const call = fakeCall({ user_id: "" });
    const { callback, result } = captureCallback();
    userServiceHandlers.getUser(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.INVALID_ARGUMENT);
  });

  it("returns the user when found", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        findUnique: async () => fakeUser,
      },
    };

    const call = fakeCall({ user_id: "user-1" });
    const { callback, result } = captureCallback();
    userServiceHandlers.getUser(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.deepStrictEqual(response, fakeUserGrpc);
  });

  it("returns NOT_FOUND when user does not exist", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        findUnique: async () => null,
      },
    };

    const call = fakeCall({ user_id: "no-such-user" });
    const { callback, result } = captureCallback();
    userServiceHandlers.getUser(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.NOT_FOUND);
  });

  it("returns INTERNAL on database error", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        findUnique: async () => { throw new Error("db error"); },
      },
    };

    const call = fakeCall({ user_id: "user-1" });
    const { callback, result } = captureCallback();
    userServiceHandlers.getUser(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.INTERNAL);
  });
});

// ─── updateUser ──────────────────────────────────────────────────────────────

describe("updateUser handler", () => {
  it("returns INVALID_ARGUMENT when user_id is empty", async () => {
    const call = fakeCall({ user_id: "", name: "Bob" });
    const { callback, result } = captureCallback();
    userServiceHandlers.updateUser(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.INVALID_ARGUMENT);
  });

  it("updates name and returns updated user", async () => {
    const updatedUser = { ...fakeUser, name: "Alice Updated" };
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        update: async () => updatedUser,
      },
    };

    const call = fakeCall({ user_id: "user-1", name: "Alice Updated" });
    const { callback, result } = captureCallback();
    userServiceHandlers.updateUser(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.strictEqual((response as typeof fakeUserGrpc).name, "Alice Updated");
  });

  it("returns NOT_FOUND when Prisma throws P2025", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        update: async () => { throw Object.assign(new Error("not found"), { code: "P2025" }); },
      },
    };

    const call = fakeCall({ user_id: "missing", name: "Ghost" });
    const { callback, result } = captureCallback();
    userServiceHandlers.updateUser(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.NOT_FOUND);
  });
});

// ─── deleteUser ──────────────────────────────────────────────────────────────

describe("deleteUser handler", () => {
  it("returns INVALID_ARGUMENT when user_id is empty", async () => {
    const call = fakeCall({ user_id: "" });
    const { callback, result } = captureCallback();
    userServiceHandlers.deleteUser(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.INVALID_ARGUMENT);
  });

  it("returns ok: true when user deleted successfully", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        delete: async () => fakeUser,
      },
    };

    const call = fakeCall({ user_id: "user-1" });
    const { callback, result } = captureCallback();
    userServiceHandlers.deleteUser(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.deepStrictEqual(response, { ok: true });
  });

  it("returns ok: false when user does not exist (P2025)", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        delete: async () => { throw Object.assign(new Error("not found"), { code: "P2025" }); },
      },
    };

    const call = fakeCall({ user_id: "no-such-user" });
    const { callback, result } = captureCallback();
    userServiceHandlers.deleteUser(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.deepStrictEqual(response, { ok: false });
  });

  it("returns INTERNAL on unexpected database error", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        delete: async () => { throw new Error("disk failure"); },
      },
    };

    const call = fakeCall({ user_id: "user-1" });
    const { callback, result } = captureCallback();
    userServiceHandlers.deleteUser(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.INTERNAL);
  });
});

// ─── searchUsersByName ────────────────────────────────────────────────────────

describe("searchUsersByName handler", () => {
  it("returns empty array for blank query", async () => {
    const call = fakeCall({ name_query: "" });
    const { callback, result } = captureCallback();
    userServiceHandlers.searchUsersByName(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.deepStrictEqual(response, { users: [] });
  });

  it("returns matching users", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        findMany: async () => [fakeUser],
      },
    };

    const call = fakeCall({ name_query: "Alice" });
    const { callback, result } = captureCallback();
    userServiceHandlers.searchUsersByName(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    const users = (response as { users: typeof fakeUserGrpc[] }).users;
    assert.strictEqual(users.length, 1);
    assert.strictEqual(users[0]?.name, "Alice");
  });

  it("returns INTERNAL on database error", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        findMany: async () => { throw new Error("db down"); },
      },
    };

    const call = fakeCall({ name_query: "Someone" });
    const { callback, result } = captureCallback();
    userServiceHandlers.searchUsersByName(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.INTERNAL);
  });
});

// ─── getUserByEmail ───────────────────────────────────────────────────────────

describe("getUserByEmail handler", () => {
  it("returns INVALID_ARGUMENT when email is empty", async () => {
    const call = fakeCall({ email: "" });
    const { callback, result } = captureCallback();
    userServiceHandlers.getUserByEmail(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.INVALID_ARGUMENT);
  });

  it("returns the user wrapped in { user } when found", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        findUnique: async () => fakeUser,
      },
    };

    const call = fakeCall({ email: "alice@example.com" });
    const { callback, result } = captureCallback();
    userServiceHandlers.getUserByEmail(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.deepStrictEqual(response, { user: fakeUserGrpc });
  });

  it("returns {} when email not found", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      user: {
        findUnique: async () => null,
      },
    };

    const call = fakeCall({ email: "nobody@example.com" });
    const { callback, result } = captureCallback();
    userServiceHandlers.getUserByEmail(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.deepStrictEqual(response, {});
  });
});

// ─── checkEnrollment ──────────────────────────────────────────────────────────

describe("checkEnrollment handler", () => {
  it("returns INVALID_ARGUMENT when user_id or course_code is missing", async () => {
    const call = fakeCall({ user_id: "", course_code: "ECE1779" });
    const { callback, result } = captureCallback();
    userServiceHandlers.checkEnrollment(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.INVALID_ARGUMENT);
  });

  it("returns is_enrolled: false when course does not exist", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      course: {
        findUnique: async () => null,
      },
    };

    const call = fakeCall({ user_id: "user-1", course_code: "NONE999" });
    const { callback, result } = captureCallback();
    userServiceHandlers.checkEnrollment(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.deepStrictEqual(response, { is_enrolled: false, role: "" });
  });

  it("returns is_enrolled: false when user not enrolled in course", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      course: {
        findUnique: async () => ({ code: "ECE1779", enrollments: [] }),
      },
    };

    const call = fakeCall({ user_id: "user-1", course_code: "ECE1779" });
    const { callback, result } = captureCallback();
    userServiceHandlers.checkEnrollment(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.deepStrictEqual(response, { is_enrolled: false, role: "" });
  });

  it("returns is_enrolled: true with role when enrolled", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      course: {
        findUnique: async () => ({
          code: "ECE1779",
          enrollments: [{ userId: "user-1", role: "student" }],
        }),
      },
    };

    const call = fakeCall({ user_id: "user-1", course_code: "ECE1779" });
    const { callback, result } = captureCallback();
    userServiceHandlers.checkEnrollment(call as never, callback as never);
    const { err, response } = await result;
    assert.strictEqual(err, null);
    assert.deepStrictEqual(response, { is_enrolled: true, role: "student" });
  });

  it("returns INTERNAL on database error", async () => {
    (prismaModule as { prisma: unknown }).prisma = {
      course: {
        findUnique: async () => { throw new Error("db failure"); },
      },
    };

    const call = fakeCall({ user_id: "user-1", course_code: "ECE1779" });
    const { callback, result } = captureCallback();
    userServiceHandlers.checkEnrollment(call as never, callback as never);
    const { err } = await result;
    assert.strictEqual(err?.code, grpc.status.INTERNAL);
  });
});

// ─── get (ping) ──────────────────────────────────────────────────────────────

describe("get (ping) handler", () => {
  it("responds with { message: 'hello' }", () => {
    const call = fakeCall({});
    const { callback, result } = captureCallback<{ message: string }>();
    userServiceHandlers.get(call as never, callback as never);
    // get() is synchronous, so the promise already resolved.
    return result.then(({ err, response }) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(response, { message: "hello" });
    });
  });
});
