import { describe, it, mock } from "node:test";
import assert from "node:assert";
import type { Request, Response, NextFunction } from "express";
import { isRole, type AuthUser, type Role } from "../src/types/auth";
import { requireRole } from "../src/middleware/auth";

describe("isRole", () => {
  it("returns true for valid roles", () => {
    assert.strictEqual(isRole("user"), true);
    assert.strictEqual(isRole("publisher"), true);
    assert.strictEqual(isRole("admin"), true);
  });

  it("returns false for invalid roles", () => {
    assert.strictEqual(isRole(""), false);
    assert.strictEqual(isRole("guest"), false);
    assert.strictEqual(isRole("ADMIN"), false);
    assert.strictEqual(isRole("user "), false);
  });
});

describe("requireRole", () => {
  function mockReq(user?: AuthUser): Partial<Request> {
    return { user };
  }

  function mockRes() {
    const res = {} as Response;
    res.status = mock.fn(() => res);
    res.json = mock.fn(() => res);
    return res;
  }

  it("calls next() when user has allowed role", () => {
    const middleware = requireRole("publisher", "admin");
    const req = mockReq({
      id: "1",
      email: "a@b.com",
      name: "A",
      role: "publisher",
    }) as Request;
    const res = mockRes() as Response;
    const next = mock.fn();

    middleware(req, res, next);

    assert.strictEqual(next.mock.calls.length, 1);
    assert.strictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls.length, 0);
  });

  it("returns 403 when user role is not allowed", () => {
    const middleware = requireRole("admin");
    const req = mockReq({
      id: "1",
      email: "a@b.com",
      name: "A",
      role: "user",
    }) as Request;
    const res = mockRes() as Response;
    const next = mock.fn();

    middleware(req, res, next);

    assert.strictEqual(next.mock.calls.length, 0);
    assert.deepStrictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments, [403]);
    const jsonArg = (res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0];
    assert.strictEqual(jsonArg.error, "Insufficient role");
    assert.deepStrictEqual(jsonArg.required, ["admin"]);
    assert.strictEqual(jsonArg.role, "user");
  });

  it("returns 401 when req.user is missing", () => {
    const middleware = requireRole("user");
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mock.fn();

    middleware(req, res, next);

    assert.strictEqual(next.mock.calls.length, 0);
    assert.deepStrictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments, [401]);
  });
});
