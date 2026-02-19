import { Router } from "express";
import { userGet } from "../../lib/grpc";
import { createProxyHandler } from "../../lib/grpcProxy";

const router = Router();

router.get("/get", createProxyHandler(userGet, "User"));

export default router;
