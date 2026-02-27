/**
 * Integration tests: run after `docker compose up` to verify the full stack.
 *
 * From project root:
 *   cd integration-test && npm install && npm test
 *
 * Optional: BASE_URL=http://localhost:3000 (default)
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const AUTH_BASE = `${BASE}/api/auth`;
const TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS) || 10_000;

let authToken: string;
let userId: string;
let testEmail: string;

async function fetchOk(
  url: string,
  options?: RequestInit
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

describe("Integration: Auth server", { timeout: TIMEOUT_MS }, () => {
  before(async () => {
    try {
      const { status } = await fetchOk(BASE);
      if (status >= 400) {
        throw new Error(`Got ${status} from ${BASE}`);
      }
    } catch (err) {
      throw new Error(
        `Cannot reach ${BASE}. Start the stack first (docker compose up) then run: cd integration-test && npm test. ${err instanceof Error ? err.message : ""}`
      );
    }
  });

  it("GET / returns 200 and ok: true", async () => {
    const { status, data } = await fetchOk(BASE);
    assert.strictEqual(status, 200);
    assert.strictEqual((data as { ok?: boolean }).ok, true);
  });

  it("GET /api/auth/ok returns 200", async () => {
    const { status, data } = await fetchOk(`${AUTH_BASE}/ok`);
    assert.strictEqual(status, 200);
    assert.strictEqual((data as { ok?: boolean }).ok, true);
  });

  it("POST /api/auth/sign-up/email creates user", async () => {
    testEmail = `integration-${Date.now()}@example.com`;
    const { status, data } = await fetchOk(`${AUTH_BASE}/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE,
        Referer: `${BASE}/`,
      },
      body: JSON.stringify({
        email: testEmail,
        password: "secret123",
        name: "Integration Test User",
      }),
    });
    assert.strictEqual(status, 200);
    const user = (data as { user?: { id: string } }).user;
    assert.ok(user?.id);
    userId = user.id;
  });

  it("POST /api/auth/sign-in/email returns token and user", async () => {
    const res = await fetch(`${AUTH_BASE}/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE,
        Referer: `${BASE}/`,
      },
      body: JSON.stringify({ email: testEmail, password: "secret123" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    assert.strictEqual(res.status, 200);
    authToken = res.headers.get("set-auth-token") ?? "";
    assert.ok(authToken, "Expected Set-Auth-Token header");
    const data = (await res.json()) as { user?: { id: string } };
    assert.ok(data.user?.id);
    userId = data.user.id;
  });

  it("POST /api/auth/sign-in/email wrong password returns 401", async () => {
    const { status, data } = await fetchOk(`${AUTH_BASE}/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE,
        Referer: `${BASE}/`,
      },
      body: JSON.stringify({ email: testEmail, password: "wrong" }),
    });
    assert.strictEqual(status, 401);
    assert.ok((data as { code?: string }).code);
  });
});

describe("Integration: User server (via auth proxy)", { timeout: TIMEOUT_MS }, () => {
  before(async () => {
    if (!authToken) {
      throw new Error("Run Auth server tests first or ensure sign-in succeeded");
    }
  });

  it("GET /user/get with token returns 200", async () => {
    const { status, data } = await fetchOk(`${BASE}/user/get`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(status, 200);
    assert.ok((data as { message?: string }).message !== undefined);
  });

  it("GET /user/:userId with token returns user object", async () => {
    const { status, data } = await fetchOk(`${BASE}/user/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(status, 200);
    const u = data as { id?: string; name?: string; email?: string };
    assert.strictEqual(u.id, userId);
    assert.strictEqual(u.email, testEmail);
    assert.ok(u.name);
  });

  it("GET /user/nonexistent with token returns 404", async () => {
    const { status, data } = await fetchOk(
      `${BASE}/user/cuid00000000000000000nonexistent`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    assert.strictEqual(status, 404);
    assert.ok((data as { error?: string }).error);
  });

  it("PUT /user/:userId with token updates user and returns updated object", async () => {
    const newName = "Integration Test User Updated";
    const { status, data } = await fetchOk(`${BASE}/user/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    });
    assert.strictEqual(status, 200);
    const u = data as { id?: string; name?: string };
    assert.strictEqual(u.id, userId);
    assert.strictEqual(u.name, newName);
    // Restore name for later tests that might expect it
    await fetchOk(`${BASE}/user/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Integration Test User" }),
    });
  });

  it("PUT /user/nonexistent with token returns 404", async () => {
    const { status, data } = await fetchOk(
      `${BASE}/user/cuid00000000000000000nonexistent`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "No" }),
      }
    );
    assert.strictEqual(status, 404);
    assert.ok((data as { error?: string }).error);
  });

  it("GET /user/search?name= with token returns users array", async () => {
    const { status, data } = await fetchOk(
      `${BASE}/user/search?name=Integration`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    assert.strictEqual(status, 200);
    const d = data as { users?: Array<{ id: string; name: string }> };
    assert.ok(Array.isArray(d.users));
    const found = d.users?.find((u) => u.id === userId);
    assert.ok(found, "Created user should appear in search");
    assert.ok((found as { name: string }).name.includes("Integration"));
  });

  it("GET /user/search?name= with no match returns empty array", async () => {
    const { status, data } = await fetchOk(
      `${BASE}/user/search?name=NonExistentNobody${Date.now()}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    assert.strictEqual(status, 200);
    const d = data as { users?: unknown[] };
    assert.ok(Array.isArray(d.users));
    assert.strictEqual(d.users?.length, 0);
  });

  it("GET /user/by-email?email= with token returns user", async () => {
    const { status, data } = await fetchOk(
      `${BASE}/user/by-email?email=${encodeURIComponent(testEmail)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    assert.strictEqual(status, 200);
    const d = data as { user?: { id: string; email: string } };
    assert.ok(d.user);
    assert.strictEqual(d.user.id, userId);
    assert.strictEqual(d.user.email, testEmail);
  });

  it("GET /user/by-email without email query returns 400", async () => {
    const { status, data } = await fetchOk(`${BASE}/user/by-email`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(status, 400);
    assert.ok((data as { error?: string }).error);
  });

  it("DELETE /user/:userId with token returns ok and user is gone", async () => {
    const deleteEmail = `integration-delete-${Date.now()}@example.com`;
    const signUpRes = await fetchOk(`${AUTH_BASE}/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE,
        Referer: `${BASE}/`,
      },
      body: JSON.stringify({
        email: deleteEmail,
        password: "secret123",
        name: "To Be Deleted",
      }),
    });
    assert.strictEqual(signUpRes.status, 200);
    const created = signUpRes.data as { user?: { id: string } };
    const toDeleteId = created.user?.id;
    assert.ok(toDeleteId, "Second user should be created");

    const delRes = await fetchOk(`${BASE}/user/${toDeleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual((delRes.data as { ok?: boolean }).ok, true);

    const getRes = await fetchOk(`${BASE}/user/${toDeleteId}`, {
      headers: { Authorization: `Bearer ${authToken}` } },
    );
    assert.strictEqual(getRes.status, 404);
  });

  it("GET /user/get without token returns 401", async () => {
    const { status } = await fetchOk(`${BASE}/user/get`);
    assert.strictEqual(status, 401);
  });
});

describe("Integration: File server (via auth proxy)", { timeout: TIMEOUT_MS }, () => {
  it("GET /file/get with token returns 200", async () => {
    const { status, data } = await fetchOk(`${BASE}/file/get`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(status, 200);
    assert.ok((data as { message?: string }).message !== undefined);
  });

  it("GET /file/get without token returns 401", async () => {
    const { status } = await fetchOk(`${BASE}/file/get`);
    assert.strictEqual(status, 401);
  });
});

describe("Integration: System server (via auth proxy)", { timeout: TIMEOUT_MS }, () => {
  it("GET /system/get with non-admin token returns 403", async () => {
    const { status, data } = await fetchOk(`${BASE}/system/get`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(status, 403);
    const d = data as { error?: string; required?: string[] };
    assert.strictEqual(d.error, "Insufficient role");
    assert.deepStrictEqual(d.required, ["admin"]);
  });

  it("GET /system/get without token returns 401", async () => {
    const { status } = await fetchOk(`${BASE}/system/get`);
    assert.strictEqual(status, 401);
  });
});

describe("Cleanup", { timeout: TIMEOUT_MS }, () => {
  after(async () => {
    if (!authToken) return;
    try {
      await fetchOk(`${AUTH_BASE}/sign-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          Origin: BASE,
          Referer: `${BASE}/`,
        },
      });
    } catch {
      // ignore cleanup errors
    }
  });

  it("runs after all tests (cleanup in after hook)", () => {
    // Placeholder so after() runs; session is revoked above; user row remains in DB
  });
});
