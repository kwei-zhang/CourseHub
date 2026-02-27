import { Router, type Request, type Response } from "express";
import grpc from "@grpc/grpc-js";
import { userGet, userGetUser } from "../../lib/grpc";
import { createProxyHandler, metadataForUser } from "../../lib/grpcProxy";

const router = Router();

router.get("/get", createProxyHandler(userGet, "User"));

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

export default router;
