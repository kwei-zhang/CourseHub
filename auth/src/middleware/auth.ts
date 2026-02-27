import type { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { isRole, type AuthUser, type Role } from "../types/auth";

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
    const role = isRole(u.role ?? "user") ? u.role : "user";
    req.user = {
      id: u.id,
      email: u.email ?? null,
      name: u.name ?? null,
      role,
    };
    next();
  } catch {
    res.status(500).json({ error: "Auth check failed" });
  }
}

/**
 * Requires the user to have one of the given roles. Use after requireAuth.
 * Responds with 403 if role is not allowed.
 */
export function requireRole(...allowedRoles: Role[]) {
  const set = new Set(allowedRoles);
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!set.has(req.user.role)) {
      res.status(403).json({
        error: "Insufficient role",
        required: allowedRoles,
        role: req.user.role,
      });
      return;
    }
    next();
  };
}
