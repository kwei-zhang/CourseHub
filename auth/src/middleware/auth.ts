import type { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export type AuthUser = { id: string; email: string | null; name: string | null; role: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Reads Bearer token from Authorization header (or X-Auth-Token) and sets req.user via Better Auth getSession.
 * Responds with 401 if missing or invalid.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader?.startsWith("Bearer ") && authHeader.slice(7)) ||
    (req.headers["x-auth-token"] as string | undefined);

  if (!token) {
    res.status(401).json({ error: "Missing auth token (Authorization: Bearer <token> or X-Auth-Token)" });
    return;
  }

  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders({ ...req.headers, authorization: `Bearer ${token}` }),
    });
    if (!session?.user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    const u = session.user as AuthUser & { role?: string };
    req.user = {
      id: u.id,
      email: u.email ?? null,
      name: u.name ?? null,
      role: u.role ?? "user",
    };
    next();
  } catch {
    res.status(500).json({ error: "Auth check failed" });
  }
}
