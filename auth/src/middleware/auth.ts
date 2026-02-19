import type { Request, Response, NextFunction } from "express";
import { getSessionUser } from "../lib/session";

export type AuthUser = { id: string; email: string | null; name: string | null; role: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Reads Bearer token from Authorization header (or X-Auth-Token) and sets req.user if valid.
 * Responds with 401 if missing or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader?.startsWith("Bearer ") && authHeader.slice(7)) ||
    (req.headers["x-auth-token"] as string | undefined);

  if (!token) {
    res.status(401).json({ error: "Missing auth token (Authorization: Bearer <token> or X-Auth-Token)" });
    return;
  }

  getSessionUser(token)
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }
      req.user = user;
      next();
    })
    .catch(() => {
      res.status(500).json({ error: "Auth check failed" });
    });
}
