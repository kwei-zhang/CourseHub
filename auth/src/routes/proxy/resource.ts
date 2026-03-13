import { Router, type Request, type Response } from "express";
import grpc from "@grpc/grpc-js";
import {
  resourceCreateResource,
  resourceGetResource,
  resourceListResources,
  resourceUpdateResource,
  resourceDeleteResource,
  resourceRecordAccessLog,
} from "../../lib/grpc";
import { metadataForUser } from "../../lib/grpcProxy";

const router = Router();

function mapGrpcErrorToHttp(err: unknown, res: Response, serviceLabel: string): void {
  const code = (err as { code?: number })?.code;
  const message = (err as { message?: string })?.message;

  if (code === grpc.status.INVALID_ARGUMENT) {
    res.status(400).json({ error: message ?? "Invalid request" });
    return;
  }
  if (code === grpc.status.NOT_FOUND) {
    res.status(404).json({ error: message ?? "Not found" });
    return;
  }
  if (code === grpc.status.ALREADY_EXISTS) {
    res.status(409).json({ error: message ?? "Already exists" });
    return;
  }
  if (code === grpc.status.PERMISSION_DENIED) {
    res.status(403).json({ error: message ?? "Forbidden" });
    return;
  }
  if (code === grpc.status.UNAVAILABLE) {
    res.status(503).json({ error: message ?? "Service unavailable" });
    return;
  }

  console.error(`${serviceLabel} error:`, err);
  res.status(502).json({ error: "User service unavailable" });
}

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { title, courseCode, contentType, objectKey, policy, tags } = req.body ?? {};
  try {
    const data = await resourceCreateResource(
      {
        title,
        courseCode,
        contentType,
        objectKey,
        policy,
        tags,
        uploaderId: userId,
      },
      metadataForUser(userId)
    );
    res.json(data);
  } catch (err) {
    mapGrpcErrorToHttp(err, res, "Resource proxy CreateResource");
  }
});

router.get("/list", async (req: Request, res: Response): Promise<void> => {
  const courseCode = req.query.courseCode as string;
  if (!courseCode) {
    res.status(400).json({ error: "courseCode query is required" });
    return;
  }

  const metadata = req.user ? metadataForUser(req.user.id) : undefined;
  try {
    const data = await resourceListResources({ courseCode }, metadata);
    res.json(data);
  } catch (err) {
    mapGrpcErrorToHttp(err, res, "Resource proxy ListResources");
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const metadata = req.user ? metadataForUser(req.user.id) : undefined;
  try {
    const data = await resourceGetResource({ id }, metadata);
    res.json(data);
  } catch (err) {
    mapGrpcErrorToHttp(err, res, "Resource proxy GetResource");
  }
});

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const { title, courseCode, contentType, objectKey, policy, tags, uploaderId } = req.body ?? {};
  const metadata = req.user ? metadataForUser(req.user.id) : undefined;
  try {
    const data = await resourceUpdateResource(
      { id, title, courseCode, contentType, objectKey, policy, tags, uploaderId },
      metadata
    );
    res.json(data);
  } catch (err) {
    mapGrpcErrorToHttp(err, res, "Resource proxy UpdateResource");
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const metadata = req.user ? metadataForUser(req.user.id) : undefined;
  try {
    const data = await resourceDeleteResource({ id }, metadata);
    res.json(data);
  } catch (err) {
    mapGrpcErrorToHttp(err, res, "Resource proxy DeleteResource");
  }
});

router.post("/access-log", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { resourceId, action, details } = req.body ?? {};
  try {
    const data = await resourceRecordAccessLog(
      { userId, resourceId, action, details },
      metadataForUser(userId)
    );
    res.json(data);
  } catch (err) {
    mapGrpcErrorToHttp(err, res, "Resource proxy RecordAccessLog");
  }
});

export default router;
