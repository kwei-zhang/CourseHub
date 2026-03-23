import { Router, type Request, type Response } from "express";
import grpc from "@grpc/grpc-js";
import {
  userListAllUsers,
  userListCourses,
  userDeleteCourse,
  resourceListAllResources,
  resourceDeleteResource,
  systemGetBackupStatus,
  systemGetDbMetricsOverview,
  systemGetMetricsOverview,
  systemGetMetricsTimeseries,
  systemListIncidents,
} from "../../lib/grpc";
import { metadataForUser } from "../../lib/grpcProxy";
import { prisma } from "../../lib/prisma";

const router = Router();
const enableMetricTestRoutes = process.env.ENABLE_METRIC_TEST_ROUTES === "true";

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

router.get("/metrics/overview", async (req: Request, res: Response): Promise<void> => {
  const windowMinutes = Number(req.query.window_minutes) || 24 * 60;
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await systemGetMetricsOverview({ window_minutes: windowMinutes }, metadata);
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.get("/metrics/timeseries", async (req: Request, res: Response): Promise<void> => {
  const metric = typeof req.query.metric === "string" ? req.query.metric : "request_count";
  const serviceName = typeof req.query.service_name === "string" ? req.query.service_name : "";
  const windowMinutes = Number(req.query.window_minutes) || 24 * 60;
  const stepMinutes = Number(req.query.step_minutes) || 60;

  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await systemGetMetricsTimeseries(
      {
        metric,
        service_name: serviceName,
        window_minutes: windowMinutes,
        step_minutes: stepMinutes,
      },
      metadata
    );
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.get("/metrics/incidents", async (req: Request, res: Response): Promise<void> => {
  const windowMinutes = Number(req.query.window_minutes) || 24 * 60;
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await systemListIncidents({ window_minutes: windowMinutes }, metadata);
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.get("/metrics/backups", async (req: Request, res: Response): Promise<void> => {
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await systemGetBackupStatus({}, metadata);
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.get("/metrics/database", async (req: Request, res: Response): Promise<void> => {
  const windowMinutes = Number(req.query.window_minutes) || 24 * 60;
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await systemGetDbMetricsOverview({ window_minutes: windowMinutes }, metadata);
    res.json(data);
  } catch (err) {
    grpcErr(err, res);
  }
});

router.post("/metrics/database/test-failure", async (req: Request, res: Response): Promise<void> => {
  if (!enableMetricTestRoutes) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `db-metric-test-${nonce}@local.test`;

  try {
    await prisma.user.create({
      data: {
        name: "DB Metric Test User",
        email,
        role: "user",
      },
    });

    try {
      await prisma.user.create({
        data: {
          name: "DB Metric Test User",
          email,
          role: "user",
        },
      });

      res.status(500).json({ error: "Expected duplicate-email insert to fail" });
      return;
    } catch {
      res.status(201).json({
        ok: true,
        message: "Triggered one duplicate-key database failure for metrics testing",
        email,
      });
      return;
    }
  } catch (err) {
    console.error("DB metric test route failed:", err);
    res.status(500).json({ error: "Failed to run DB metric test" });
    return;
  } finally {
    try {
      await prisma.user.deleteMany({ where: { email } });
    } catch (cleanupErr) {
      console.error("DB metric test cleanup failed:", cleanupErr);
    }
  }
});

export default router;
