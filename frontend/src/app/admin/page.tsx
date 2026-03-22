"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import {
  authFetch,
  getAdminIncidents,
  getAdminMetricsOverview,
  getAdminMetricsTimeseries,
  readAuthJson,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Incident, MetricsOverview, MetricsTimeseries } from "@/lib/types";

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
  const [tab, setTab] = useState<"courses" | "resources" | "announcements" | "monitoring">("courses");

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
  const [metricsOverview, setMetricsOverview] = useState<MetricsOverview | null>(null);
  const [requestSeries, setRequestSeries] = useState<MetricsTimeseries | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [monitoringError, setMonitoringError] = useState("");

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

  const loadMonitoring = useCallback(async () => {
    if (!user) return;
    setMonitoringLoading(true);
    setMonitoringError("");
    try {
      const [overview, series, incidentList] = await Promise.all([
        getAdminMetricsOverview(user.token),
        getAdminMetricsTimeseries(user.token, {
          metric: "request_count",
          window_minutes: 24 * 60,
          step_minutes: 60,
        }),
        getAdminIncidents(user.token),
      ]);
      setMetricsOverview(overview);
      setRequestSeries(series);
      setIncidents(incidentList);
    } catch {
      setMonitoringError("Failed to load monitoring data");
    } finally {
      setMonitoringLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (tab === "courses") loadCourses();
    else if (tab === "resources") loadResources();
    else if (tab === "monitoring") loadMonitoring();
  }, [tab, loadCourses, loadResources, loadMonitoring]);

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

  const requestPoints = (requestSeries?.points ?? []).map((point) => ({
    ...point,
    value: Number(point.value ?? 0),
  }));
  const visibleRequestPoints = requestPoints.filter((point) => point.value > 0);
  const maxRequestValue = Math.max(1, ...requestPoints.map((point) => point.value));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="flex gap-2 mb-6 border-b">
        {(["courses", "resources", "announcements", "monitoring"] as const).map((t) => (
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

      {tab === "monitoring" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Monitoring</h2>
            <Button variant="outline" size="sm" onClick={loadMonitoring} disabled={monitoringLoading}>
              Refresh
            </Button>
          </div>

          {monitoringError && <p className="text-sm text-destructive">{monitoringError}</p>}

          {monitoringLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : metricsOverview ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-md border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Requests (24h)</p>
                  <p className="mt-2 text-2xl font-semibold">{metricsOverview.request_count}</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Errors (24h)</p>
                  <p className="mt-2 text-2xl font-semibold">{metricsOverview.error_count}</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Error Rate</p>
                  <p className="mt-2 text-2xl font-semibold">{metricsOverview.error_rate_pct.toFixed(1)}%</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs uppercase text-muted-foreground">P95 Latency</p>
                  <p className="mt-2 text-2xl font-semibold">{metricsOverview.p95_latency_ms.toFixed(0)} ms</p>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Request Volume</h3>
                  <p className="text-xs text-muted-foreground">Last 24 hours, hourly buckets</p>
                </div>
                {visibleRequestPoints.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                    No recorded request buckets yet.
                  </div>
                ) : (
                  <div className="flex h-40 items-end gap-2">
                    {requestPoints.map((point) => (
                      <div key={String(point.ts_ms)} className="flex h-full flex-1 items-end">
                        {point.value > 0 ? (
                          <div
                            className="w-full rounded-sm bg-primary/70"
                            style={{ height: `${Math.max(12, (point.value / maxRequestValue) * 100)}%` }}
                            title={`${new Date(Number(point.ts_ms)).toLocaleString()}: ${point.value}`}
                          />
                        ) : (
                          <div
                            className="w-full rounded-sm bg-muted"
                            style={{ height: "6px" }}
                            title={`${new Date(Number(point.ts_ms)).toLocaleString()}: 0`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-md border overflow-hidden">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-semibold">Service Breakdown</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Service</th>
                      <th className="px-4 py-2 text-left font-medium">Requests</th>
                      <th className="px-4 py-2 text-left font-medium">Errors</th>
                      <th className="px-4 py-2 text-left font-medium">Error Rate</th>
                      <th className="px-4 py-2 text-left font-medium">P95 Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricsOverview.services.map((service) => (
                      <tr key={service.service_name} className="border-t">
                        <td className="px-4 py-2 font-medium">{service.service_name}</td>
                        <td className="px-4 py-2">{service.request_count}</td>
                        <td className="px-4 py-2">{service.error_count}</td>
                        <td className="px-4 py-2">{service.error_rate_pct.toFixed(1)}%</td>
                        <td className="px-4 py-2">{service.p95_latency_ms.toFixed(0)} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-md border overflow-hidden">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-semibold">Open Incidents</h3>
                </div>
                {incidents.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">No active incidents in the current window.</p>
                ) : (
                  <div className="divide-y">
                    {incidents.map((incident) => (
                      <div key={incident.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">{incident.title}</p>
                            <p className="text-sm text-muted-foreground">{incident.message}</p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>{incident.source}</p>
                            <p>{incident.severity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
