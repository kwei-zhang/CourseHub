import type grpc from "@grpc/grpc-js";

/** Response shape from user/file/system get RPCs. */
export type GetResponse = { message: string };

/** Request payload for FileService.GetUploadUrl. */
export type GetUploadUrlRequest = {
  title?: string;
  courseCode: string;
  contentType: string;
  policy: string;
  tags?: string[];
  uploaderId: string;
  expires_in?: number;
};

/** Response payload from FileService.GetUploadUrl. */
export type GetUploadUrlResponse = {
  url: string;
  object_key: string;
};

/** Request payload for FileService.GetDownloadUrl. */
export type GetDownloadUrlRequest = {
  resource_id: string;
  expires_in?: number;
  requester_user_id: string;
};

/** Response payload from FileService.GetDownloadUrl. */
export type GetDownloadUrlResponse = {
  url: string;
};

/** Resource shape returned by ResourceService RPCs. */
export type ResourceResponse = {
  id: string;
  title: string;
  courseCode: string;
  contentType: string;
  objectKey: string;
  policy: string;
  tags: string[];
  uploaderId: string;
};

/** Request payload for ResourceService.CreateResource. */
export type CreateResourceRequest = {
  title: string;
  courseCode: string;
  contentType: string;
  objectKey: string;
  policy: string;
  tags?: string[];
  uploaderId: string;
};

/** Request payload for ResourceService.GetResource. */
export type GetResourceRequest = { id: string };

/** Request/response payloads for ResourceService.ListResources. */
export type ListResourcesRequest = { courseCode: string };
export type ListResourcesResponse = { resources: ResourceResponse[] };

/** Request payload for ResourceService.UpdateResource. */
export type UpdateResourceRequest = {
  id: string;
  title?: string;
  courseCode?: string;
  contentType?: string;
  objectKey?: string;
  policy?: string;
  tags?: string[];
  uploaderId?: string;
};

/** Request/response payloads for ResourceService.DeleteResource. */
export type DeleteResourceRequest = { id: string };
export type DeleteResourceResponse = { id: string; deleted: boolean };

/** Request/response payloads for ResourceService.RecordAccessLog. */
export type RecordAccessLogRequest = {
  userId: string;
  resourceId: string;
  action: string;
  details?: string;
};
export type RecordAccessLogResponse = { logId: string; timestampMs: string };

/** Response shape from UserService.GetUser / UpdateUser RPC. */
export type GetUserResponse = {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image: string;
  created_at: string;
  updated_at: string;
  role: string;
};

/** Request payload for UserService.UpdateUser (optional fields). */
export type UpdateUserRequest = {
  user_id: string;
  name?: string;
  image?: string;
  role?: string;
  email_verified?: boolean;
};

/** Response from UserService.DeleteUser. */
export type DeleteUserResponse = { ok: boolean };

/** Response from UserService.SearchUsersByName. */
export type SearchUsersByNameResponse = { users: GetUserResponse[] };

/** Response from UserService.GetUserByEmail. */
export type GetUserByEmailResponse = { user?: GetUserResponse };

/** Enrollment types. */
export type CourseEnrollment = {
  course_id: string;
  course_code: string;
  course_name: string;
  role: string;
};
export type ListEnrollmentsResponse = { enrollments: CourseEnrollment[] };

export type EnrollUserRequest = { user_id: string; course_code: string; role: string };
export type EnrollUserResponse = { ok: boolean; enrollment_id: string };

export type UnenrollUserRequest = { user_id: string; course_code: string };
export type UnenrollUserResponse = { ok: boolean };

export type CourseInfo = { id: string; code: string; name: string };
export type ListCoursesResponse = { courses: CourseInfo[] };

export type CreateCourseRequest = { code: string; name: string; instructor_id: string };
export type DeleteCourseRequest = { code: string };
export type DeleteCourseResponse = { ok: boolean };

export type UserInfo = { id: string; name: string; email: string; role: string };
export type ListAllUsersResponse = { users: UserInfo[] };

export type ListAllResourcesResponse = { resources: ResourceResponse[] };
export type RecordMetricEventRequest = {
  service_name: string;
  route_key: string;
  status_code: number;
  latency_ms: number;
  occurred_at_ms: number | string;
};
export type RecordMetricEventResponse = { ok: boolean };
export type RecordDbMetricEventRequest = {
  service_name: string;
  operation: string;
  success: boolean;
  latency_ms: number;
  occurred_at_ms: number | string;
};
export type RecordDbMetricEventResponse = { ok: boolean };
export type ServiceMetricSummary = {
  service_name: string;
  request_count: number | string;
  client_error_count: number | string;
  server_error_count: number | string;
  error_count: number | string;
  client_error_rate_pct: number;
  server_error_rate_pct: number;
  error_rate_pct: number;
  p95_latency_ms: number;
};
export type GetMetricsOverviewRequest = { window_minutes?: number };
export type DbMetricSummary = {
  service_name: string;
  query_count: number | string;
  failed_query_count: number | string;
  failed_query_rate_pct: number;
  p95_query_latency_ms: number;
};
export type GetDbMetricsOverviewRequest = { window_minutes?: number };
export type GetDbMetricsOverviewResponse = {
  window_minutes: number;
  query_count: number | string;
  failed_query_count: number | string;
  failed_query_rate_pct: number;
  p95_query_latency_ms: number;
  services: DbMetricSummary[];
};
export type GetMetricsOverviewResponse = {
  window_minutes: number;
  request_count: number | string;
  client_error_count: number | string;
  server_error_count: number | string;
  error_count: number | string;
  client_error_rate_pct: number;
  server_error_rate_pct: number;
  error_rate_pct: number;
  p95_latency_ms: number;
  services: ServiceMetricSummary[];
};
export type GetMetricsTimeseriesRequest = {
  metric: string;
  service_name?: string;
  window_minutes?: number;
  step_minutes?: number;
};
export type MetricsPoint = { ts_ms: number | string; value: number };
export type GetMetricsTimeseriesResponse = {
  metric: string;
  service_name: string;
  window_minutes: number;
  step_minutes: number;
  points: MetricsPoint[];
};
export type ListIncidentsRequest = { window_minutes?: number };
export type Incident = {
  id: string;
  source: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  started_at_ms: number | string;
};
export type ListIncidentsResponse = { incidents: Incident[] };
export type RecordBackupRunRequest = {
  status: string;
  started_at_ms?: number | string;
  finished_at_ms?: number | string;
  object_key?: string;
  size_bytes?: number | string;
  error_message?: string;
};
export type RecordBackupRunResponse = { ok: boolean };
export type GetBackupStatusRequest = Record<string, never>;
export type GetBackupStatusResponse = {
  has_backup: boolean;
  latest_status: string;
  last_started_at_ms: number | string;
  last_finished_at_ms: number | string;
  age_minutes: number | string;
  latest_size_bytes: number | string;
  latest_object_key: string;
  latest_error_message: string;
};

/** Loaded proto package with service constructors. */
export interface Ece1779Package {
  UserService: grpc.ServiceClientConstructor;
  ResourceService: grpc.ServiceClientConstructor;
  FileService: grpc.ServiceClientConstructor;
  SystemService: grpc.ServiceClientConstructor;
}

/** gRPC call signature used by proxy handlers. */
export type GrpcCall<T> = (metadata?: grpc.Metadata) => Promise<T>;
