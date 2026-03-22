import { BackupStatus, Incident, MetricsOverview, MetricsTimeseries, Resource, CourseEnrollment } from "./types";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:4000";

/**
 * Parse JSON from an auth API response. If the body is HTML (e.g. wrong
 * NEXT_PUBLIC_AUTH_URL pointing at the Next.js app), throws a clear error
 * instead of `Unexpected token '<'`.
 */
export async function readAuthJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      "Auth API returned non-JSON (often HTML). Set NEXT_PUBLIC_AUTH_URL to your auth service URL (e.g. http://localhost:4000), not the Next.js dev server."
    );
  }
}

export async function authFetch(
  path: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  const p = path.startsWith("/") ? path : `/${path}`;
  /** Auth REST gateway mounts proxies at `/api` (see auth/src/index.ts). */
  return fetch(`${AUTH_URL}/api${p}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

/** Request body for POST /file/upload-url (auth proxy → file-server GetUploadUrl). */
export type GetUploadUrlParams = {
  title: string;
  courseCode: string;
  contentType: string;
  policy: string;
  tags?: string[];
  expires_in?: number;
};

/** Response from POST /file/upload-url. */
export type GetUploadUrlResponse = { url: string; object_key: string };

export async function getUploadUrl(
  token: string,
  params: GetUploadUrlParams
): Promise<GetUploadUrlResponse> {
  const res = await authFetch("/file/upload-url", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await readAuthJson<{ error?: string }>(res).catch(() => ({
      error: res.statusText,
    }));
    throw new Error(err.error ?? "Failed to get upload URL");
  }
  return readAuthJson<GetUploadUrlResponse>(res);
}

/** Request body for POST /resource/ (auth proxy → file-server CreateResource). */
export type CreateResourceParams = {
  title: string;
  courseCode: string;
  contentType: string;
  objectKey: string;
  policy: string;
  tags?: string[];
};

export async function createResourceOnServer(
  token: string,
  params: CreateResourceParams
): Promise<Resource> {
  const res = await authFetch("/resource/", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await readAuthJson<{ error?: string }>(res).catch(() => ({
      error: res.statusText,
    }));
    throw new Error(err.error ?? "Failed to create resource");
  }
  return readAuthJson<Resource>(res);
}

/** Fetch the current user's course enrollments. */
export async function getEnrollments(token: string): Promise<CourseEnrollment[]> {
  const res = await authFetch("/user/enrollments", token);
  if (!res.ok) return [];
  const data = await readAuthJson<{ enrollments?: CourseEnrollment[] }>(res);
  return data.enrollments ?? [];
}

/** Fetch all resources for a given course code. */
export async function listResourcesByCourse(
  token: string,
  courseCode: string
): Promise<Resource[]> {
  const res = await authFetch(`/resource/list?courseCode=${encodeURIComponent(courseCode)}`, token);
  if (!res.ok) return [];
  const data = await readAuthJson<{ resources?: Resource[] }>(res);
  return data.resources ?? [];
}

/** Fetch resources across all of the user's enrolled courses, plus public resources. */
export async function getResourcesForUser(token: string): Promise<Resource[]> {
  const enrollments = await getEnrollments(token);
  const courseCodes = [...enrollments.map((e) => e.course_code), "PUBLIC"];
  const results = await Promise.all(
    courseCodes.map((code) => listResourcesByCourse(token, code))
  );
  return results.flat();
}

/** Fetch a single resource by ID. */
export async function getResource(token: string, id: string): Promise<Resource | null> {
  const res = await authFetch(`/resource/${id}`, token);
  if (!res.ok) return null;
  return readAuthJson<Resource>(res);
}

/** Delete a resource by ID. */
export async function deleteResource(token: string, id: string): Promise<void> {
  await authFetch(`/resource/${id}`, token, { method: "DELETE" });
}

export type UpdateResourceParams = {
  title?: string;
  courseCode?: string;
  policy?: string;
  tags?: string[];
};

/** Update a resource's metadata. */
export async function updateResource(
  token: string,
  id: string,
  params: UpdateResourceParams
): Promise<Resource> {
  const res = await authFetch(`/resource/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await readAuthJson<{ error?: string }>(res).catch(() => ({
      error: res.statusText,
    }));
    throw new Error(err.error ?? "Failed to update resource");
  }
  return readAuthJson<Resource>(res);
}

export async function getAdminMetricsOverview(
  token: string,
  windowMinutes = 24 * 60
): Promise<MetricsOverview> {
  const res = await authFetch(`/admin/metrics/overview?window_minutes=${windowMinutes}`, token);
  if (!res.ok) {
    throw new Error("Failed to load metrics overview");
  }
  return readAuthJson<MetricsOverview>(res);
}

export async function getAdminMetricsTimeseries(
  token: string,
  params: {
    metric: string;
    service_name?: string;
    window_minutes?: number;
    step_minutes?: number;
  }
): Promise<MetricsTimeseries> {
  const search = new URLSearchParams({
    metric: params.metric,
    service_name: params.service_name ?? "",
    window_minutes: String(params.window_minutes ?? 24 * 60),
    step_minutes: String(params.step_minutes ?? 60),
  });
  const res = await authFetch(`/admin/metrics/timeseries?${search.toString()}`, token);
  if (!res.ok) {
    throw new Error("Failed to load metrics timeseries");
  }
  return readAuthJson<MetricsTimeseries>(res);
}

export async function getAdminIncidents(
  token: string,
  windowMinutes = 24 * 60
): Promise<Incident[]> {
  const res = await authFetch(`/admin/metrics/incidents?window_minutes=${windowMinutes}`, token);
  if (!res.ok) {
    throw new Error("Failed to load incidents");
  }
  const data = await readAuthJson<{ incidents?: Incident[] }>(res);
  return data.incidents ?? [];
}

export async function getAdminBackupStatus(token: string): Promise<BackupStatus> {
  const res = await authFetch("/admin/metrics/backups", token);
  if (!res.ok) {
    throw new Error("Failed to load backup status");
  }
  return readAuthJson<BackupStatus>(res);
}
