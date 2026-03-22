"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { authFetch, readAuthJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Course = { id: string; code: string; name: string };
type Resource = {
  id: string;
  title: string;
  courseCode: string;
  contentType: string;
  policy: string;
  tags: string[];
  uploaderId: string;
};

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"courses" | "resources" | "announcements">("courses");

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");

  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState("");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [announcementStatus, setAnnouncementStatus] = useState("");
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/resources");
    }
  }, [user, isLoading, router]);

  const loadCourses = useCallback(async () => {
    if (!user) return;
    setCoursesLoading(true);
    setCoursesError("");
    try {
      const res = await authFetch("/admin/courses", user.token);
      if (!res.ok) { setCoursesError("Failed to load courses"); return; }
      const data = await readAuthJson<{ courses?: Course[] }>(res);
      setCourses(data.courses ?? []);
    } catch {
      setCoursesError("Failed to load courses");
    } finally {
      setCoursesLoading(false);
    }
  }, [user]);

  const loadResources = useCallback(async () => {
    if (!user) return;
    setResourcesLoading(true);
    setResourcesError("");
    try {
      const res = await authFetch("/admin/resources", user.token);
      if (!res.ok) { setResourcesError("Failed to load resources"); return; }
      const data = await readAuthJson<{ resources?: Resource[] }>(res);
      setResources(data.resources ?? []);
    } catch {
      setResourcesError("Failed to load resources");
    } finally {
      setResourcesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (tab === "courses") loadCourses();
    else if (tab === "resources") loadResources();
  }, [tab, loadCourses, loadResources]);

  const deleteCourse = async (code: string) => {
    if (!user || !confirm(`Delete course ${code}?`)) return;
    const res = await authFetch(`/admin/courses/${encodeURIComponent(code)}`, user.token, { method: "DELETE" });
    if (res.ok) setCourses((prev) => prev.filter((c) => c.code !== code));
    else alert("Failed to delete course");
  };

  const deleteResource = async (id: string, title: string) => {
    if (!user || !confirm(`Delete resource "${title}"?`)) return;
    const res = await authFetch(`/admin/resources/${encodeURIComponent(id)}`, user.token, { method: "DELETE" });
    if (res.ok) setResources((prev) => prev.filter((r) => r.id !== id));
    else alert("Failed to delete resource");
  };

  const sendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAnnouncementLoading(true);
    setAnnouncementStatus("");
    try {
      const res = await authFetch("/admin/announcements", user.token, {
        method: "POST",
        body: JSON.stringify({ subject, body }),
      });
      if (res.ok) {
        const data = await readAuthJson<{ sent?: number }>(res);
        setAnnouncementStatus(`Sent to ${data.sent ?? 0} users.`);
        setSubject("");
        setBody("");
      } else {
        const err = await readAuthJson<{ error?: string }>(res).catch(
          (): { error?: string } => ({})
        );
        setAnnouncementStatus(`Error: ${err.error ?? "Failed to send"}`);
      }
    } catch {
      setAnnouncementStatus("Error: Could not reach server");
    } finally {
      setAnnouncementLoading(false);
    }
  };

  if (isLoading || !user || user.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="flex gap-2 mb-6 border-b">
        {(["courses", "resources", "announcements"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "courses" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Courses</h2>
            <Button variant="outline" size="sm" onClick={loadCourses} disabled={coursesLoading}>Refresh</Button>
          </div>
          {coursesError && <p className="text-sm text-destructive mb-2">{coursesError}</p>}
          {coursesLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses found.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Code</th>
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-2 font-mono">{c.code}</td>
                      <td className="px-4 py-2">{c.name}</td>
                      <td className="px-4 py-2 text-right">
                        <Button variant="destructive" size="sm" onClick={() => deleteCourse(c.code)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "resources" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Resources</h2>
            <Button variant="outline" size="sm" onClick={loadResources} disabled={resourcesLoading}>Refresh</Button>
          </div>
          {resourcesError && <p className="text-sm text-destructive mb-2">{resourcesError}</p>}
          {resourcesLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resources found.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Title</th>
                    <th className="px-4 py-2 text-left font-medium">Course</th>
                    <th className="px-4 py-2 text-left font-medium">Policy</th>
                    <th className="px-4 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-2">{r.title}</td>
                      <td className="px-4 py-2 font-mono">{r.courseCode}</td>
                      <td className="px-4 py-2">{r.policy}</td>
                      <td className="px-4 py-2 text-right">
                        <Button variant="destructive" size="sm" onClick={() => deleteResource(r.id, r.title)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "announcements" && (
        <div className="max-w-lg">
          <h2 className="text-lg font-semibold mb-4">Send Announcement</h2>
          <p className="text-sm text-muted-foreground mb-4">Emails all registered users via Resend.</p>
          <form onSubmit={sendAnnouncement} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Announcement subject"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="body">Message</Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your announcement here…"
                required
                rows={6}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>
            {announcementStatus && (
              <p className={`text-sm ${announcementStatus.startsWith("Error") ? "text-destructive" : "text-green-600"}`}>
                {announcementStatus}
              </p>
            )}
            <Button type="submit" disabled={announcementLoading}>
              {announcementLoading ? "Sending…" : "Send to all users"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
