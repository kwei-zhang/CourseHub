/** Allowed user roles (must match schema). */
export type Role = "user" | "publisher" | "admin";

const ROLES: Role[] = ["user", "publisher", "admin"];

export function isRole(s: string): s is Role {
  return ROLES.includes(s as Role);
}

/** Request body for POST /register (email + password sign-up). */
export interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  role?: Role;
}

/** Request body for POST /login (email + password sign-in). */
export interface LoginBody {
  email: string;
  password: string;
}
