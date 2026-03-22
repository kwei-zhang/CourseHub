export type Resource = {
  id: string;
  title: string;
  courseCode: string;
  contentType: string;
  objectKey: string;
  policy: string;
  tags: string[];
  uploaderId: string;
};

export type CourseEnrollment = {
  course_id: string;
  course_code: string;
  course_name: string;
  role: string;
};

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

export type MetricsOverview = {
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

export type MetricsPoint = {
  ts_ms: number | string;
  value: number;
};

export type MetricsTimeseries = {
  metric: string;
  service_name: string;
  window_minutes: number;
  step_minutes: number;
  points: MetricsPoint[];
};

export type Incident = {
  id: string;
  source: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  started_at_ms: number | string;
};

export type BackupStatus = {
  has_backup: boolean;
  latest_status: string;
  last_started_at_ms: number | string;
  last_finished_at_ms: number | string;
  age_minutes: number | string;
  latest_size_bytes: number | string;
  latest_object_key: string;
  latest_error_message: string;
};
