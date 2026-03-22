"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { authFetch, readAuthJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { BookOpen, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface CourseEnrollment {
  course_id: string;
  course_code: string;
  course_name: string;
  role: string;
}

interface CourseInfo {
  id: string;
  code: string;
  name: string;
}

const NAV_ITEMS = [
  { href: "/resources", label: "Resources", roles: ["student", "ta"] },
  { href: "/courses", label: "Courses", roles: ["instructor"] },
  { href: "/upload", label: "Upload", roles: ["ta", "instructor"] },
  { href: "/manage", label: "Manage", roles: ["ta", "instructor"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const role = user?.role ?? "student";

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [allCourses, setAllCourses] = useState<CourseInfo[]>([]);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  useEffect(() => {
    if (!user) return;
    authFetch("/user/enrollments", user.token)
      .then(async (r) => {
        if (!r.ok) return;
        const d = await readAuthJson<{ enrollments?: CourseEnrollment[] }>(r);
        setEnrollments(d.enrollments ?? []);
      })
      .catch(console.error);
  }, [user]);

  const openEnrollDialog = async () => {
    if (!user) return;
    try {
      const r = await authFetch("/user/courses", user.token);
      if (!r.ok) {
        toast.error("Could not load courses.");
        setAllCourses([]);
      } else {
        const d = await readAuthJson<{ courses?: CourseInfo[] }>(r);
        setAllCourses(d.courses ?? []);
      }
    } catch {
      toast.error("Could not load courses.");
      setAllCourses([]);
    }
    setSearch("");
    setEnrollOpen(true);
  };

  const handleEnroll = async (courseCode: string) => {
    if (!user) return;
    setEnrolling(courseCode);
    try {
      const res = await authFetch("/user/enroll", user.token, {
        method: "POST",
        body: JSON.stringify({ course_code: courseCode }),
      });
      if (!res.ok) {
        const d = await readAuthJson<{ error?: string }>(res);
        toast.error(d.error ?? "Enroll failed.");
        return;
      }
      const refreshed = await authFetch("/user/enrollments", user.token);
      if (!refreshed.ok) {
        toast.error("Could not refresh enrollments.");
        return;
      }
      const d = await readAuthJson<{ enrollments?: CourseEnrollment[] }>(refreshed);
      setEnrollments(d.enrollments ?? []);
      toast.success(`Enrolled in ${courseCode}`);
    } catch {
      toast.error("Could not connect to server.");
    } finally {
      setEnrolling(null);
    }
  };

  const handleUnenroll = async (courseCode: string) => {
    if (!user) return;
    try {
      const res = await authFetch(`/user/enroll/${encodeURIComponent(courseCode)}`, user.token, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await readAuthJson<{ error?: string }>(res);
        toast.error(d.error ?? "Unenroll failed.");
        return;
      }
      setEnrollments((prev) => prev.filter((e) => e.course_code !== courseCode));
      toast.success(`Left ${courseCode}`);
    } catch {
      toast.error("Could not connect to server.");
    }
  };

  const enrolledCodes = new Set(enrollments.map((e) => e.course_code));
  const filteredCourses = allCourses.filter(
    (c) =>
      !enrolledCodes.has(c.code) &&
      (c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <aside className="w-60 border-r min-h-[calc(100vh-4rem)] p-4 flex flex-col gap-4">
        {/* Navigation */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Navigation
          </p>
          <div className="space-y-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  pathname === item.href ? "bg-muted font-medium" : "hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Public resources — always visible */}
        <Separator />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Public
          </p>
          <Link
            href="/resources?course=PUBLIC"
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted ${
              pathname === "/resources" && searchParams.get("course") === "PUBLIC" ? "bg-muted font-medium" : ""
            }`}
          >
            <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
            <span>Public Resources</span>
          </Link>
        </div>

        {/* Courses — students only */}
        {role === "student" && (
          <>
            <Separator />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  My Courses
                </p>
                <button
                  onClick={openEnrollDialog}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Enroll in a course"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {enrollments.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">No courses yet.</p>
              ) : (
                <div className="space-y-1">
                  {enrollments.map((e) => (
                    <div
                      key={e.course_id}
                      className="group flex items-center justify-between rounded-md hover:bg-muted"
                    >
                      <Link
                        href={`/resources?course=${encodeURIComponent(e.course_code)}`}
                        className={`flex flex-1 items-center gap-2 min-w-0 px-3 py-2 ${
                          pathname === "/resources" ? "" : ""
                        }`}
                        title={e.course_name}
                      >
                        <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{e.course_code}</span>
                      </Link>
                      <button
                        onClick={() => handleUnenroll(e.course_code)}
                        className="opacity-0 group-hover:opacity-100 mr-2 text-muted-foreground hover:text-destructive transition-all"
                        title="Leave course"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full gap-2 text-xs"
                onClick={openEnrollDialog}
              >
                <Plus className="size-3.5" />
                Enroll in course
              </Button>
            </div>
          </>
        )}
      </aside>

      {/* Enroll dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll in a Course</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Search by code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <div className="max-h-64 overflow-y-auto space-y-1 mt-1">
            {filteredCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {search ? "No matching courses." : "All courses joined or none available."}
              </p>
            ) : (
              filteredCourses.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEnroll(c.code)}
                    disabled={enrolling === c.code}
                  >
                    {enrolling === c.code ? "Joining…" : "Join"}
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
