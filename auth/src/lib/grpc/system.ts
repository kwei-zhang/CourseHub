import grpc from "@grpc/grpc-js";
import type {
  GetBackupStatusRequest,
  GetBackupStatusResponse,
  GetDbMetricsOverviewRequest,
  GetDbMetricsOverviewResponse,
  GetMetricsOverviewRequest,
  GetMetricsOverviewResponse,
  GetMetricsTimeseriesRequest,
  GetMetricsTimeseriesResponse,
  GetResponse,
  ListIncidentsRequest,
  ListIncidentsResponse,
  RecordBackupRunRequest,
  RecordBackupRunResponse,
  RecordDbMetricEventRequest,
  RecordDbMetricEventResponse,
  RecordMetricEventRequest,
  RecordMetricEventResponse,
} from "../../types/grpc";
import { systemClient, waitForGrpcClientReady } from "./client";

export function systemGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    waitForGrpcClientReady(systemClient)
      .then(() => {
        systemClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
          if (err) reject(err);
          else resolve(res ?? { message: "" });
        });
      })
      .catch(reject);
  });
}

export function systemRecordMetricEvent(
  request: RecordMetricEventRequest,
  metadata?: grpc.Metadata
): Promise<RecordMetricEventResponse> {
  return new Promise((resolve, reject) => {
    waitForGrpcClientReady(systemClient)
      .then(() => {
        systemClient.recordMetricEvent(
          request,
          metadata ?? new grpc.Metadata(),
          (err: Error | null, res?: RecordMetricEventResponse) => {
            if (err) reject(err);
            else resolve(res ?? { ok: false });
          }
        );
      })
      .catch(reject);
  });
}

export function systemRecordDbMetricEvent(
  request: RecordDbMetricEventRequest,
  metadata?: grpc.Metadata
): Promise<RecordDbMetricEventResponse> {
  return new Promise((resolve, reject) => {
    waitForGrpcClientReady(systemClient)
      .then(() => {
        systemClient.recordDbMetricEvent(
          request,
          metadata ?? new grpc.Metadata(),
          (err: Error | null, res?: RecordDbMetricEventResponse) => {
            if (err) reject(err);
            else resolve(res ?? { ok: false });
          }
        );
      })
      .catch(reject);
  });
}

export function systemGetMetricsOverview(
  request: GetMetricsOverviewRequest,
  metadata?: grpc.Metadata
): Promise<GetMetricsOverviewResponse> {
  return new Promise((resolve, reject) => {
    waitForGrpcClientReady(systemClient)
      .then(() => {
        systemClient.getMetricsOverview(
          request,
          metadata ?? new grpc.Metadata(),
          (err: Error | null, res?: GetMetricsOverviewResponse) => {
            if (err) reject(err);
            else {
              resolve(
                res ?? {
                  window_minutes: request.window_minutes ?? 1440,
                  request_count: 0,
                  client_error_count: 0,
                  server_error_count: 0,
                  error_count: 0,
                  client_error_rate_pct: 0,
                  server_error_rate_pct: 0,
                  error_rate_pct: 0,
                  p95_latency_ms: 0,
                  services: [],
                }
              );
            }
          }
        );
      })
      .catch(reject);
  });
}

export function systemGetDbMetricsOverview(
  request: GetDbMetricsOverviewRequest,
  metadata?: grpc.Metadata
): Promise<GetDbMetricsOverviewResponse> {
  return new Promise((resolve, reject) => {
    waitForGrpcClientReady(systemClient)
      .then(() => {
        systemClient.getDbMetricsOverview(
          request,
          metadata ?? new grpc.Metadata(),
          (err: Error | null, res?: GetDbMetricsOverviewResponse) => {
            if (err) reject(err);
            else {
              resolve(
                res ?? {
                  window_minutes: request.window_minutes ?? 1440,
                  query_count: 0,
                  failed_query_count: 0,
                  failed_query_rate_pct: 0,
                  p95_query_latency_ms: 0,
                  services: [],
                }
              );
            }
          }
        );
      })
      .catch(reject);
  });
}

export function systemGetMetricsTimeseries(
  request: GetMetricsTimeseriesRequest,
  metadata?: grpc.Metadata
): Promise<GetMetricsTimeseriesResponse> {
  return new Promise((resolve, reject) => {
    waitForGrpcClientReady(systemClient)
      .then(() => {
        systemClient.getMetricsTimeseries(
          request,
          metadata ?? new grpc.Metadata(),
          (err: Error | null, res?: GetMetricsTimeseriesResponse) => {
            if (err) reject(err);
            else {
              resolve(
                res ?? {
                  metric: request.metric,
                  service_name: request.service_name ?? "",
                  window_minutes: request.window_minutes ?? 1440,
                  step_minutes: request.step_minutes ?? 60,
                  points: [],
                }
              );
            }
          }
        );
      })
      .catch(reject);
  });
}

export function systemListIncidents(
  request: ListIncidentsRequest,
  metadata?: grpc.Metadata
): Promise<ListIncidentsResponse> {
  return new Promise((resolve, reject) => {
    waitForGrpcClientReady(systemClient)
      .then(() => {
        systemClient.listIncidents(
          request,
          metadata ?? new grpc.Metadata(),
          (err: Error | null, res?: ListIncidentsResponse) => {
            if (err) reject(err);
            else resolve(res ?? { incidents: [] });
          }
        );
      })
      .catch(reject);
  });
}

export function systemRecordBackupRun(
  request: RecordBackupRunRequest,
  metadata?: grpc.Metadata
): Promise<RecordBackupRunResponse> {
  return new Promise((resolve, reject) => {
    waitForGrpcClientReady(systemClient)
      .then(() => {
        systemClient.recordBackupRun(
          request,
          metadata ?? new grpc.Metadata(),
          (err: Error | null, res?: RecordBackupRunResponse) => {
            if (err) reject(err);
            else resolve(res ?? { ok: false });
          }
        );
      })
      .catch(reject);
  });
}

export function systemGetBackupStatus(
  request: GetBackupStatusRequest = {},
  metadata?: grpc.Metadata
): Promise<GetBackupStatusResponse> {
  return new Promise((resolve, reject) => {
    waitForGrpcClientReady(systemClient)
      .then(() => {
        systemClient.getBackupStatus(
          request,
          metadata ?? new grpc.Metadata(),
          (err: Error | null, res?: GetBackupStatusResponse) => {
            if (err) reject(err);
            else {
              resolve(
                res ?? {
                  has_backup: false,
                  latest_status: "",
                  last_started_at_ms: 0,
                  last_finished_at_ms: 0,
                  age_minutes: 0,
                  latest_size_bytes: 0,
                  latest_object_key: "",
                  latest_error_message: "",
                }
              );
            }
          }
        );
      })
      .catch(reject);
  });
}
