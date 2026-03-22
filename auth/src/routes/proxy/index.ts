import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import userProxy from "./user";
import resourceProxy from "./resource";
import fileProxy from "./file";
import systemProxy from "./system";
import adminProxy from "./admin";

const router = Router();

/** All proxy routes require a valid session (Bearer token or X-Auth-Token). */
router.use(requireAuth);

router.use("/user", userProxy);
router.use("/resource", resourceProxy);
router.use("/file", fileProxy);
router.use("/system", requireRole("admin"), systemProxy);
router.use("/admin", requireRole("admin"), adminProxy);

export default router;
