import { Router } from "express";

const router = Router();

router.get("/health/live", (_req, res) => {
  res.status(200).json({ ok: true, status: "live" });
});

router.get("/health/ready", (_req, res) => {
  res.status(200).json({ ok: true, status: "ready" });
});

export default router;
