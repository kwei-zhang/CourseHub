import { Router, type Request, type Response } from "express";
import grpc from "@grpc/grpc-js";
import {
  userGet,
  userGetUser,
  userUpdateUser,
  userDeleteUser,
  userSearchUsersByName,
  userGetUserByEmail,
} from "../../lib/grpc";
import { createProxyHandler, metadataForUser } from "../../lib/grpcProxy";

const router = Router();

router.get("/get", createProxyHandler(userGet, "User"));

router.get("/search", async (req: Request, res: Response): Promise<void> => {
  const name = (req.query.name as string) ?? "";
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userSearchUsersByName(name, metadata);
    res.json(data);
  } catch (err) {
    console.error("User proxy SearchUsersByName error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.get("/by-email", async (req: Request, res: Response): Promise<void> => {
  const email = req.query.email as string;
  if (!email) {
    res.status(400).json({ error: "email query is required" });
    return;
  }
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userGetUserByEmail(email, metadata);
    res.json(data.user != null ? data : { user: null });
  } catch (err) {
    console.error("User proxy GetUserByEmail error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.get("/:userId", async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  if (!userId) {
    res.status(400).json({ error: "user id is required" });
    return;
  }
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userGetUser(userId, metadata);
    res.json(data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === grpc.status.NOT_FOUND) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    console.error("User proxy GetUser error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.put("/:userId", async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  if (!userId) {
    res.status(400).json({ error: "user id is required" });
    return;
  }
  const { name, image, role, email_verified } = req.body ?? {};
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userUpdateUser(
      { user_id: userId, name, image, role, email_verified },
      metadata
    );
    res.json(data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === grpc.status.NOT_FOUND) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    console.error("User proxy UpdateUser error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.delete("/:userId", async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  if (!userId) {
    res.status(400).json({ error: "user id is required" });
    return;
  }
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userDeleteUser(userId, metadata);
    res.json(data);
  } catch (err) {
    console.error("User proxy DeleteUser error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

export default router;
