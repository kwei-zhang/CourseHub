import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import userProxy from "./user";
import fileProxy from "./file";
import systemProxy from "./system";

const router = Router();

/** All proxy routes require a valid session (Bearer token or X-Auth-Token). */
router.use(requireAuth);

router.use("/user", userProxy);
router.use("/file", fileProxy);
router.use("/system", systemProxy);

export default router;
