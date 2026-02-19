import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma";
import { hashPassword, verifyPassword } from "./lib/password";
import { createSession } from "./lib/session";
import type { LoginBody, RegisterBody } from "./types/requests";
import { isRole } from "./types/requests";
import proxyRouter from "./routes/proxy";

const app = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true });
});

app.post("/register", async (req, res) => {
  try {
    const body = req.body as RegisterBody;
    const { email, password, name, role } = body;
    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }
    if (role !== undefined && !isRole(role)) {
      res.status(400).json({
        error: "Invalid role",
        allowed: ["user", "publisher", "admin"],
      });
      return;
    }
    const roleValue = role ?? "user";
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: roleValue,
        credential: {
          create: { passwordHash },
        },
      },
    });
    res.json(user);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    console.error("register error:", err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: "Registration failed",
      ...(process.env.NODE_ENV !== "production" && { detail: message }),
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const body = req.body as LoginBody;
    const { email, password } = body;
    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { email },
      include: { credential: true },
    });
    if (
      !user?.credential ||
      !(await verifyPassword(password, user.credential.passwordHash))
    ) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const { credential: _, ...safeUser } = user;
    const { token, expiresAt } = await createSession(user.id);
    res.json({ user: safeUser, token, expiresAt: expiresAt.toISOString() });
  } catch (err: unknown) {
    console.error("login error:", err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: "Login failed",
      ...(process.env.NODE_ENV !== "production" && { detail: message }),
    });
  }
});

/** Proxy to backend servers (user, file, system) after auth. Requires Bearer token or X-Auth-Token. */
app.use(proxyRouter);

const host = process.env.HOST ?? "0.0.0.0";
app.listen(Number(port), host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
