import crypto from "crypto";
import { prisma } from "./prisma";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function randomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: { userId, token, expiresAt },
  });
  return { token, expiresAt };
}

export async function getSessionUser(token: string): Promise<{ id: string; email: string | null; name: string | null; role: string } | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}
