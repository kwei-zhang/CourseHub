import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { bearer } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";
const frontendURL = process.env.FRONTEND_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [baseURL, frontendURL, "http://localhost:4000", "http://127.0.0.1:4000"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: true,
      },
    },
  },
  plugins: [bearer()],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const method = ctx.request?.method ?? "UNKNOWN";
      console.log("[auth request]", { method, path: ctx.path, query: ctx.query });
    }),
    after: createAuthMiddleware(async (ctx) => {
      const returned = ctx.context.returned;
      const err = returned as { status?: number; body?: unknown } | undefined;
      if (err && typeof err === "object" && typeof err.status === "number" && err.status >= 400) {
        console.error("[auth error]", {
          path: ctx.path,
          status: err.status,
          body: err.body,
        });
      }
    }),
  },
});
