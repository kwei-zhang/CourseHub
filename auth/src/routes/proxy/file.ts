import { Router, type Request, type Response } from "express";
import grpc from "@grpc/grpc-js";
import { fileGet, fileGetUploadUrl, fileGetDownloadUrl } from "../../lib/grpc";
import { createProxyHandler, metadataForUser } from "../../lib/grpcProxy";

const router = Router();

router.get("/get", createProxyHandler(fileGet, "File"));

router.post("/upload-url", async (req: Request, res: Response): Promise<void> => {
  const { title, courseCode, contentType, policy, tags, expires_in } = req.body ?? {};
  const uploaderId = req.user?.id;
  if (!uploaderId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const metadata = metadataForUser(uploaderId);
    const data = await fileGetUploadUrl(
      { title, courseCode, contentType, policy, tags, uploaderId, expires_in },
      metadata
    );
    res.json(data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === grpc.status.INVALID_ARGUMENT) {
      res.status(400).json({ error: (err as { message?: string })?.message ?? "Invalid request" });
      return;
    }
    if (code === grpc.status.PERMISSION_DENIED) {
      res.status(403).json({ error: (err as { message?: string })?.message ?? "Forbidden" });
      return;
    }
    console.error("File proxy GetUploadUrl error:", err);
    res.status(502).json({ error: "File service unavailable" });
  }
});

router.post("/download-url", async (req: Request, res: Response): Promise<void> => {
  const { resource_id, expires_in } = req.body ?? {};
  const requesterUserId = req.user?.id;
  if (!requesterUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const metadata = metadataForUser(requesterUserId);
    const data = await fileGetDownloadUrl(
      { resource_id, expires_in, requester_user_id: requesterUserId },
      metadata
    );
    res.json(data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === grpc.status.INVALID_ARGUMENT) {
      res.status(400).json({ error: (err as { message?: string })?.message ?? "Invalid request" });
      return;
    }
    if (code === grpc.status.NOT_FOUND) {
      res.status(404).json({ error: (err as { message?: string })?.message ?? "Not found" });
      return;
    }
    if (code === grpc.status.PERMISSION_DENIED) {
      res.status(403).json({ error: (err as { message?: string })?.message ?? "Forbidden" });
      return;
    }
    console.error("File proxy GetDownloadUrl error:", err);
    res.status(502).json({ error: "File service unavailable" });
  }
});

export default router;
