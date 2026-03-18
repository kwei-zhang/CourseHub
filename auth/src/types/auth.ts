/** Allowed user roles (must match schema and Better Auth user.additionalFields). */
export type Role = "user" | "student" | "ta" | "instructor" | "admin";

const ROLES: Role[] = ["user", "student", "ta", "instructor", "admin"];

export function isRole(s: string): s is Role {
  return ROLES.includes(s as Role);
}

/** Authenticated user set by requireAuth middleware (from Better Auth session). */
export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
