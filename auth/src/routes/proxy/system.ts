import { Router } from "express";
import { systemGet } from "../../lib/grpc";
import { createProxyHandler } from "../../lib/grpcProxy";

const router = Router();

router.get("/get", createProxyHandler(systemGet, "System"));

export default router;
