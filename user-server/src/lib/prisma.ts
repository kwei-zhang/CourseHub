import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { recordDbMetric } from "./dbMetrics";

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : null;
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

export { prisma };
