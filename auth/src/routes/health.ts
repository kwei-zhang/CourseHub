import { Router } from "express";
import { systemGet } from "../lib/grpc/system";

const router = Router();

router.get("/health/live", (_req, res) => {
  res.status(200).json({ ok: true, status: "live" });
});

router.get("/health/ready", async (_req, res) => {
  try {
    await systemGet();
    res.status(200).json({ ok: true, status: "ready" });
  } catch (err) {
    console.error("Auth readiness dependency check failed:", err);
    res.status(503).json({ ok: false, status: "degraded", dependency: "system-server" });
  }
});

export default router;
