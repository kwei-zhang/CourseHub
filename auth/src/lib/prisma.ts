import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { recordDbMetric } from "./dbMetrics";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prismaBase = new PrismaClient({ adapter });
const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const startedAt = Date.now();
        try {
          const result = await query(args);
          recordDbMetric("auth", `${model ?? "raw"}.${operation}`, true, Date.now() - startedAt);
          return result;
        } catch (err) {
          recordDbMetric("auth", `${model ?? "raw"}.${operation}`, false, Date.now() - startedAt);
          throw err;
        }
      },
    },
  },
});

export { prisma };
