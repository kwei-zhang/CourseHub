import { Router, type Request, type Response } from "express";
import grpc from "@grpc/grpc-js";
import { fromNodeHeaders } from "better-auth/node";
import {
  userGet,
  userGetUser,
  userUpdateUser,
  userDeleteUser,
  userSearchUsersByName,
  userGetUserByEmail,
  userListEnrollments,
  userEnrollUser,
  userUnenrollUser,
  userListCourses,
  userCreateCourse,
  userDeleteCourse,
} from "../../lib/grpc";
import { createProxyHandler, metadataForUser } from "../../lib/grpcProxy";
import { auth } from "../../lib/auth";

const router = Router();

router.get("/get", createProxyHandler(userGet, "User"));

router.get("/search", async (req: Request, res: Response): Promise<void> => {
  const name = (req.query.name as string) ?? "";
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userSearchUsersByName(name, metadata);
    res.json(data);
  } catch (err) {
    console.error("User proxy SearchUsersByName error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.get("/by-email", async (req: Request, res: Response): Promise<void> => {
  const email = req.query.email as string;
  if (!email) {
    res.status(400).json({ error: "email query is required" });
    return;
  }
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userGetUserByEmail(email, metadata);
    res.json(data.user != null ? data : { user: null });
  } catch (err) {
    console.error("User proxy GetUserByEmail error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.get("/enrollments", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const data = await userListEnrollments(req.user.id, metadataForUser(req.user.id));
    res.json(data);
  } catch (err) {
    console.error("User proxy ListEnrollments error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.get("/courses", async (req: Request, res: Response): Promise<void> => {
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userListCourses(metadata);
    res.json(data);
  } catch (err) {
    console.error("User proxy ListCourses error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.post("/enroll", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { course_code } = req.body ?? {};
  if (!course_code) { res.status(400).json({ error: "course_code is required" }); return; }
  try {
    const data = await userEnrollUser(
      { user_id: req.user.id, course_code, role: req.user.role ?? "student" },
      metadataForUser(req.user.id)
    );
    res.json(data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === grpc.status.NOT_FOUND) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    console.error("User proxy EnrollUser error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.delete("/enroll/:courseCode", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  const courseCode = req.params.courseCode;
  try {
    const data = await userUnenrollUser(
      { user_id: req.user.id, course_code: courseCode },
      metadataForUser(req.user.id)
    );
    res.json(data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === grpc.status.NOT_FOUND) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    console.error("User proxy UnenrollUser error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.post("/courses", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  if ((req.user.role as string) !== "instructor") {
    res.status(403).json({ error: "Only instructors can create courses" });
    return;
  }
  const { code, name } = req.body ?? {};
  if (!code || !name) { res.status(400).json({ error: "code and name are required" }); return; }
  try {
    const data = await userCreateCourse({ code, name, instructor_id: req.user.id }, metadataForUser(req.user.id));
    res.status(201).json(data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === grpc.status.ALREADY_EXISTS) {
      res.status(409).json({ error: "Course code already exists" });
      return;
    }
    console.error("User proxy CreateCourse error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.delete("/courses/:code", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  if ((req.user.role as string) !== "instructor") {
    res.status(403).json({ error: "Only instructors can delete courses" });
    return;
  }
  try {
    const data = await userDeleteCourse({ code: req.params.code }, metadataForUser(req.user.id));
    res.json(data);
  } catch (err) {
    console.error("User proxy DeleteCourse error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.post("/change-password", async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  try {
    const response = await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: false },
      headers: fromNodeHeaders(req.headers),
    });

    if (!response) {
      res.status(400).json({ error: "Password change failed" });
      return;
    }

    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Password change failed";
    console.error("change-password error:", err);
    res.status(400).json({ error: message });
  }
});

// Dynamic /:userId routes must come LAST to avoid shadowing static routes above
router.get("/:userId", async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  if (!userId) {
    res.status(400).json({ error: "user id is required" });
    return;
  }
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userGetUser(userId, metadata);
    res.json(data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === grpc.status.NOT_FOUND) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    console.error("User proxy GetUser error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.put("/:userId", async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  if (!userId) {
    res.status(400).json({ error: "user id is required" });
    return;
  }
  const { name, image, role, email_verified } = req.body ?? {};
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userUpdateUser(
      { user_id: userId, name, image, role, email_verified },
      metadata
    );
    res.json(data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === grpc.status.NOT_FOUND) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    console.error("User proxy UpdateUser error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

router.delete("/:userId", async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  if (!userId) {
    res.status(400).json({ error: "user id is required" });
    return;
  }
  try {
    const metadata = req.user ? metadataForUser(req.user.id) : undefined;
    const data = await userDeleteUser(userId, metadata);
    res.json(data);
  } catch (err) {
    console.error("User proxy DeleteUser error:", err);
    res.status(502).json({ error: "User service unavailable" });
  }
});

export default router;
