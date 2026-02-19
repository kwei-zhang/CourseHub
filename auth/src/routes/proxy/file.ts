import { Router } from "express";
import { fileGet } from "../../lib/grpc";
import { createProxyHandler } from "../../lib/grpcProxy";

const router = Router();

router.get("/get", createProxyHandler(fileGet, "File"));

export default router;
