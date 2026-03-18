import { Resource, CourseEnrollment } from "./types";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:4000";

export async function authFetch(
  path: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${AUTH_URL}${path}`, {
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
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Failed to get upload URL");
  }
  return res.json() as Promise<GetUploadUrlResponse>;
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
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Failed to create resource");
  }
  return res.json() as Promise<Resource>;
}

/** Fetch the current user's course enrollments. */
export async function getEnrollments(token: string): Promise<CourseEnrollment[]> {
  const res = await authFetch("/user/enrollments", token);
  if (!res.ok) return [];
  const data = await res.json() as { enrollments?: CourseEnrollment[] };
  return data.enrollments ?? [];
}

/** Fetch all resources for a given course code. */
export async function listResourcesByCourse(
  token: string,
  courseCode: string
): Promise<Resource[]> {
  const res = await authFetch(`/resource/list?courseCode=${encodeURIComponent(courseCode)}`, token);
  if (!res.ok) return [];
  const data = await res.json() as { resources?: Resource[] };
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
  return res.json() as Promise<Resource>;
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
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Failed to update resource");
  }
  return res.json() as Promise<Resource>;
}
