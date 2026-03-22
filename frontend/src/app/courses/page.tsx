"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { authFetch, readAuthJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Course {
  course_id: string;
  course_code: string;
  course_name: string;
  role: string;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const fetchCourses = async () => {
    if (!user) return;
    try {
      const res = await authFetch("/user/enrollments", user.token);
      if (!res.ok) {
        toast.error("Could not load courses.");
        return;
      }
      const d = await readAuthJson<{ enrollments?: Course[] }>(res);
      const instructorCourses = (d.enrollments ?? []).filter(
        (e: Course) => e.role === "instructor"
      );
      setCourses(instructorCourses);
    } catch {
      toast.error("Could not load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const res = await authFetch("/user/courses", user.token, {
        method: "POST",
        body: JSON.stringify({ code: code.trim().toUpperCase(), name: name.trim() }),
      });
      const d = await readAuthJson<{ error?: string; code?: string }>(res);
      if (!res.ok) {
        toast.error(d.error ?? "Failed to create course.");
        return;
      }
      toast.success(`Course ${d.code} created.`);
      setCreateOpen(false);
      setCode("");
      setName("");
      await fetchCourses();
    } catch {
      toast.error("Could not connect to server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseCode: string) => {
    if (!user) return;
    setDeletingCode(courseCode);
    try {
      const res = await authFetch(`/user/courses/${encodeURIComponent(courseCode)}`, user.token, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await readAuthJson<{ error?: string }>(res);
        toast.error(d.error ?? "Failed to delete course.");
        return;
      }
      setCourses((prev) => prev.filter((c) => c.course_code !== courseCode));
      toast.success(`Course ${courseCode} deleted.`);
    } catch {
      toast.error("Could not connect to server.");
    } finally {
      setDeletingCode(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage courses available on the platform.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New Course
        </Button>
      </div>

      <Separator />

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No courses yet. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((c) => (
                <TableRow key={c.course_id}>
                  <TableCell className="font-mono font-medium">{c.course_code}</TableCell>
                  <TableCell>{c.course_name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(c.course_code)}
                      disabled={deletingCode === c.course_code}
                      title="Delete course"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="course-code">Course Code</Label>
              <Input
                id="course-code"
                placeholder="e.g. ECE1779"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="course-name">Course Name</Label>
              <Input
                id="course-name"
                placeholder="e.g. Cloud Computing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
