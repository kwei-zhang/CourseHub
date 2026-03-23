require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { recordDbMetric } = require("./dbMetrics");

const connectionString = process.env.DATABASE_URL;

// Extract schema from the connection string (?schema=...) and pass it
// explicitly to PrismaPg — the adapter does not honour the query param itself.
const schemaMatch = connectionString?.match(/[?&]schema=([^&]+)/);
const schema = schemaMatch ? schemaMatch[1] : "public";

const adapter = connectionString ? new PrismaPg({ connectionString }, { schema }) : null;
const prismaBase = adapter ? new PrismaClient({ adapter }) : null;
const prisma = prismaBase
  ? prismaBase.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const startedAt = Date.now();
            try {
              const result = await query(args);
              recordDbMetric(`${model ?? "raw"}.${operation}`, true, Date.now() - startedAt);
              return result;
            } catch (err) {
              recordDbMetric(`${model ?? "raw"}.${operation}`, false, Date.now() - startedAt);
              throw err;
            }
          },
        },
      },
    })
  : null;

module.exports = { prisma };
