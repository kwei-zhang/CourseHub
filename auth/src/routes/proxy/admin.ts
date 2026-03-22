import { Router, type Request, type Response } from "express";
import grpc from "@grpc/grpc-js";
import {
  userListAllUsers,
  userListCourses,
  userDeleteCourse,
  resourceListAllResources,
  resourceDeleteResource,
} from "../../lib/grpc";
import { metadataForUser } from "../../lib/grpcProxy";

const router = Router();

function grpcErr(err: unknown, res: Response): void {
  const code = (err as { code?: number })?.code;
  const message = (err as { message?: string })?.message;
  if (code === grpc.status.NOT_FOUND) { res.status(404).json({ error: message ?? "Not found" }); return; }
  if (code === grpc.status.UNAVAILABLE) { res.status(503).json({ error: message ?? "Service unavailable" }); return; }
  console.error("Admin proxy error:", err);
  res.status(502).json({ error: "Service unavailable" });
}

router.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userListAllUsers(metadata);
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.get("/courses", async (req: Request, res: Response): Promise<void> => {
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userListCourses(metadata);
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.delete("/courses/:code", async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userDeleteCourse({ code }, metadata);
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.get("/resources", async (req: Request, res: Response): Promise<void> => {
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await resourceListAllResources(metadata);
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.delete("/resources/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await resourceDeleteResource({ id }, metadata);
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.post("/announcements", async (req: Request, res: Response): Promise<void> => {
  const { subject, body } = req.body ?? {};
  if (!subject || !body) {
    res.status(400).json({ error: "subject and body are required" });
    return;
  }

  const fnUrl = process.env.DO_FUNCTION_URL;
  if (!fnUrl) {
    res.status(503).json({ error: "Announcement service not configured (DO_FUNCTION_URL missing)" });
    return;
  }

  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const usersData = await userListAllUsers(metadata);
    const emails = usersData.users.map((u) => u.email).filter(Boolean);

    if (emails.length === 0) {
      res.json({ ok: true, sent: 0 });
      return;
    }

    const fnRes = await fetch(fnUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, emails }),
    });

    if (!fnRes.ok) {
      const text = await fnRes.text();
      console.error("DO Function error:", fnRes.status, text);
      res.status(502).json({ error: "Failed to send announcement" });
      return;
    }

    res.json({ ok: true, sent: emails.length });
  } catch (err) {
    console.error("Admin announcements error:", err);
    res.status(502).json({ error: "Failed to send announcement" });
  }
});

export default router;
