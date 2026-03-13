const assert = require("assert");

// Setup mock before requiring the handler
const prismaModule = require("../src/lib/prisma");
const mockDb = {
  resources: [],
  accessLogs: []
};

prismaModule.prisma = {
  resource: {
    create: async ({ data }) => {
      const res = { id: `res_${Date.now()}`, ...data };
      mockDb.resources.push(res);
      return res;
    },
    findUnique: async ({ where }) => mockDb.resources.find(r => r.id === where.id),
    update: async ({ where, data }) => {
      const idx = mockDb.resources.findIndex(r => r.id === where.id);
      if (idx === -1) {
        const err = new Error("Not found");
        err.code = "P2025";
        throw err;
      }
      mockDb.resources[idx] = { ...mockDb.resources[idx], ...data };
      return mockDb.resources[idx];
    },
    delete: async ({ where }) => {
      const idx = mockDb.resources.findIndex(r => r.id === where.id);
      if (idx === -1) {
        const err = new Error("Not found");
        err.code = "P2025";
        throw err;
      }
      const deleted = mockDb.resources[idx];
      mockDb.resources.splice(idx, 1);
      return deleted;
    },
    findMany: async ({ where }) => mockDb.resources.filter(r => r.courseCode === where.courseCode)
  },
  accessLog: {
    create: async ({ data }) => {
      const log = { id: `log_${Date.now()}`, createdAt: new Date(), ...data };
      mockDb.accessLogs.push(log);
      return log;
    }
  }
};

const { createResourceServiceHandlers } = require("../src/handlers/resourceService");
const handlers = createResourceServiceHandlers();

async function runTests() {
  console.log("Running ResourceService unit tests...");

  // Test createResource
  const createPromise = new Promise((resolve, reject) => {
    handlers.createResource({
      request: {
        title: "Test Resource",
        courseCode: "CS101",
        contentType: "text/plain",
        objectKey: "test-key",
        uploaderId: "user1",
        policy: "LECTURE"
      }
    }, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });

  const created = await createPromise;
  assert.strictEqual(created.title, "Test Resource");
  assert.strictEqual(created.objectKey, "test-key");

  // Test getResource
  const getPromise = new Promise((resolve, reject) => {
    handlers.getResource({ request: { id: created.id } }, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });

  const fetched = await getPromise;
  assert.strictEqual(fetched.id, created.id);

  console.log("PASS ResourceService unit tests passed");
}

runTests().catch(err => {
  console.error("Unit test failed:", err);
  process.exit(1);
});
