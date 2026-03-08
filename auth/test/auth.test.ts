import { describe, it, mock } from "node:test";
import assert from "node:assert";
import type { Request, Response, NextFunction } from "express";
import type { Router } from "express";
import grpc from "@grpc/grpc-js";
import { isRole, type AuthUser, type Role } from "../src/types/auth";
import { requireRole } from "../src/middleware/auth";
import fileProxyRouter from "../src/routes/proxy/file";
import resourceProxyRouter from "../src/routes/proxy/resource";
import { fileClient, resourceClient } from "../src/lib/grpc/client";

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

describe("file proxy routes", () => {
  type RouteHandler = (req: Request, res: Response, next: NextFunction) => unknown;

  function getRouteHandler(router: Router, method: "post", path: string): RouteHandler {
    const stack = (router as unknown as { stack?: Array<{ route?: { path?: string; methods?: Record<string, boolean>; stack?: Array<{ handle: RouteHandler }> } }> }).stack ?? [];
    const layer = stack.find((entry) => entry.route?.path === path && entry.route?.methods?.[method]);
    if (!layer?.route?.stack?.[0]?.handle) {
      throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
    }
    return layer.route.stack[0].handle;
  }

  function mockReqWithUser(body: Record<string, unknown>, userId = "user-1"): Request {
    return {
      body,
      user: {
        id: userId,
        email: "user@example.com",
        name: "User",
        role: "user" as Role,
      },
    } as Request;
  }

  function mockRes() {
    const res = {} as Response;
    res.status = mock.fn(() => res);
    res.json = mock.fn(() => res);
    return res;
  }

  it("POST /upload-url returns upload URL and object key", async () => {
    const handler = getRouteHandler(fileProxyRouter, "post", "/upload-url");
    const req = mockReqWithUser({
      title: "Week 1 Slides",
      courseCode: "ECE1779",
      contentType: "application/pdf",
      policy: "LECTURE",
      tags: ["week1"],
      expires_in: 120,
    });
    const res = mockRes() as Response;

    const original = fileClient.getUploadUrl;
    fileClient.getUploadUrl = ((request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null, res?: { url: string; object_key: string }) => void) => {
      cb(null, { url: "https://upload.example", object_key: "obj/key.pdf" });
    }) as typeof fileClient.getUploadUrl;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      fileClient.getUploadUrl = original;
    }

    assert.strictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls.length, 0);
    assert.deepStrictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0], {
      url: "https://upload.example",
      object_key: "obj/key.pdf",
    });
  });

  it("POST /upload-url returns 400 for INVALID_ARGUMENT", async () => {
    const handler = getRouteHandler(fileProxyRouter, "post", "/upload-url");
    const req = mockReqWithUser({
      courseCode: "ECE1779",
      contentType: "application/pdf",
      policy: "INVALID_POLICY",
    });
    const res = mockRes() as Response;

    const original = fileClient.getUploadUrl;
    fileClient.getUploadUrl = ((_request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null) => void) => {
      const err = Object.assign(new Error("Invalid policy"), { code: grpc.status.INVALID_ARGUMENT });
      cb(err);
    }) as typeof fileClient.getUploadUrl;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      fileClient.getUploadUrl = original;
    }

    assert.deepStrictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments, [400]);
    assert.deepStrictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0], {
      error: "Invalid policy",
    });
  });

  it("POST /download-url returns download URL", async () => {
    const handler = getRouteHandler(fileProxyRouter, "post", "/download-url");
    const req = mockReqWithUser({ resource_id: "res-1", expires_in: 180 });
    const res = mockRes() as Response;

    const original = fileClient.getDownloadUrl;
    fileClient.getDownloadUrl = ((_request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null, res?: { url: string }) => void) => {
      cb(null, { url: "https://download.example" });
    }) as typeof fileClient.getDownloadUrl;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      fileClient.getDownloadUrl = original;
    }

    assert.strictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls.length, 0);
    assert.deepStrictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0], {
      url: "https://download.example",
    });
  });

  it("POST /download-url returns 404 for NOT_FOUND", async () => {
    const handler = getRouteHandler(fileProxyRouter, "post", "/download-url");
    const req = mockReqWithUser({ resource_id: "missing-resource" });
    const res = mockRes() as Response;

    const original = fileClient.getDownloadUrl;
    fileClient.getDownloadUrl = ((_request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null) => void) => {
      const err = Object.assign(new Error("Resource object key not found"), { code: grpc.status.NOT_FOUND });
      cb(err);
    }) as typeof fileClient.getDownloadUrl;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      fileClient.getDownloadUrl = original;
    }

    assert.deepStrictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments, [404]);
    assert.deepStrictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0], {
      error: "Resource object key not found",
    });
  });
});

describe("resource proxy routes", () => {
  type RouteHandler = (req: Request, res: Response, next: NextFunction) => unknown;

  function getRouteHandler(
    router: Router,
    method: "post" | "get" | "put" | "delete",
    path: string
  ): RouteHandler {
    const stack = (router as unknown as { stack?: Array<{ route?: { path?: string; methods?: Record<string, boolean>; stack?: Array<{ handle: RouteHandler }> } }> }).stack ?? [];
    const layer = stack.find((entry) => entry.route?.path === path && entry.route?.methods?.[method]);
    if (!layer?.route?.stack?.[0]?.handle) {
      throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
    }
    return layer.route.stack[0].handle;
  }

  function mockReqWithUser({
    body = {},
    query = {},
    params = {},
    userId = "user-1",
  }: {
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, string>;
    userId?: string;
  }): Request {
    return {
      body,
      query,
      params,
      user: {
        id: userId,
        email: "user@example.com",
        name: "User",
        role: "user" as Role,
      },
    } as Request;
  }

  function mockRes() {
    const res = {} as Response;
    res.status = mock.fn(() => res);
    res.json = mock.fn(() => res);
    return res;
  }

  it("POST / returns created resource", async () => {
    const handler = getRouteHandler(resourceProxyRouter, "post", "/");
    const req = mockReqWithUser({
      body: {
        title: "Week 1",
        courseCode: "ECE1779",
        contentType: "application/pdf",
        objectKey: "k1",
        policy: "LECTURE",
        tags: ["week1"],
      },
    });
    const res = mockRes() as Response;

    const original = resourceClient.createResource;
    resourceClient.createResource = ((_request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null, res?: Record<string, unknown>) => void) => {
      cb(null, {
        id: "res-1",
        title: "Week 1",
        courseCode: "ECE1779",
        contentType: "application/pdf",
        objectKey: "k1",
        policy: "LECTURE",
        tags: ["week1"],
        uploaderId: "user-1",
      });
    }) as typeof resourceClient.createResource;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      resourceClient.createResource = original;
    }

    assert.strictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls.length, 0);
    assert.strictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0].id, "res-1");
  });

  it("GET /list returns resources for a course", async () => {
    const handler = getRouteHandler(resourceProxyRouter, "get", "/list");
    const req = mockReqWithUser({ query: { courseCode: "ECE1779" } });
    const res = mockRes() as Response;

    const original = resourceClient.listResources;
    resourceClient.listResources = ((_request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null, res?: { resources: Array<{ id: string }> }) => void) => {
      cb(null, { resources: [{ id: "res-1" }] });
    }) as typeof resourceClient.listResources;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      resourceClient.listResources = original;
    }

    assert.deepStrictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0], {
      resources: [{ id: "res-1" }],
    });
  });

  it("GET /:id returns 404 for NOT_FOUND", async () => {
    const handler = getRouteHandler(resourceProxyRouter, "get", "/:id");
    const req = mockReqWithUser({ params: { id: "missing" } });
    const res = mockRes() as Response;

    const original = resourceClient.getResource;
    resourceClient.getResource = ((_request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null) => void) => {
      const err = Object.assign(new Error("Resource not found"), { code: grpc.status.NOT_FOUND });
      cb(err);
    }) as typeof resourceClient.getResource;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      resourceClient.getResource = original;
    }

    assert.deepStrictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments, [404]);
    assert.deepStrictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0], {
      error: "Resource not found",
    });
  });

  it("PUT /:id updates a resource", async () => {
    const handler = getRouteHandler(resourceProxyRouter, "put", "/:id");
    const req = mockReqWithUser({
      params: { id: "res-1" },
      body: { title: "Week 1 Updated" },
    });
    const res = mockRes() as Response;

    const original = resourceClient.updateResource;
    resourceClient.updateResource = ((_request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null, res?: Record<string, unknown>) => void) => {
      cb(null, { id: "res-1", title: "Week 1 Updated" });
    }) as typeof resourceClient.updateResource;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      resourceClient.updateResource = original;
    }

    assert.strictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0].title, "Week 1 Updated");
  });

  it("DELETE /:id returns delete result", async () => {
    const handler = getRouteHandler(resourceProxyRouter, "delete", "/:id");
    const req = mockReqWithUser({ params: { id: "res-1" } });
    const res = mockRes() as Response;

    const original = resourceClient.deleteResource;
    resourceClient.deleteResource = ((_request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null, res?: { id: string; deleted: boolean }) => void) => {
      cb(null, { id: "res-1", deleted: true });
    }) as typeof resourceClient.deleteResource;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      resourceClient.deleteResource = original;
    }

    assert.deepStrictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0], {
      id: "res-1",
      deleted: true,
    });
  });

  it("POST /access-log returns 400 for INVALID_ARGUMENT", async () => {
    const handler = getRouteHandler(resourceProxyRouter, "post", "/access-log");
    const req = mockReqWithUser({
      body: {
        resourceId: "",
        action: "UPLOAD",
      },
    });
    const res = mockRes() as Response;

    const original = resourceClient.recordAccessLog;
    resourceClient.recordAccessLog = ((_request: Record<string, unknown>, _md: grpc.Metadata, cb: (err: Error | null) => void) => {
      const err = Object.assign(new Error("userId and resourceId are required"), {
        code: grpc.status.INVALID_ARGUMENT,
      });
      cb(err);
    }) as typeof resourceClient.recordAccessLog;

    try {
      await handler(req, res, (() => {}) as NextFunction);
    } finally {
      resourceClient.recordAccessLog = original;
    }

    assert.deepStrictEqual((res.status as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments, [400]);
    assert.deepStrictEqual((res.json as ReturnType<typeof mock.fn>).mock.calls[0]?.arguments[0], {
      error: "userId and resourceId are required",
    });
  });
});
