import grpc from "@grpc/grpc-js";
import type {
  GetMetricsOverviewRequest,
  GetMetricsOverviewResponse,
  GetMetricsTimeseriesRequest,
  GetMetricsTimeseriesResponse,
  GetResponse,
  ListIncidentsRequest,
  ListIncidentsResponse,
  RecordMetricEventRequest,
  RecordMetricEventResponse,
} from "../../types/grpc";
import { systemClient } from "./client";

export function systemGet(metadata?: grpc.Metadata): Promise<GetResponse> {
  return new Promise((resolve, reject) => {
    systemClient.get({}, metadata ?? new grpc.Metadata(), (err: Error | null, res?: GetResponse) => {
      if (err) reject(err);
      else resolve(res ?? { message: "" });
    });
  });
}

export function systemRecordMetricEvent(
  request: RecordMetricEventRequest,
  metadata?: grpc.Metadata
): Promise<RecordMetricEventResponse> {
  return new Promise((resolve, reject) => {
    systemClient.recordMetricEvent(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: RecordMetricEventResponse) => {
        if (err) reject(err);
        else resolve(res ?? { ok: false });
      }
    );
  });
}

export function systemGetMetricsOverview(
  request: GetMetricsOverviewRequest,
  metadata?: grpc.Metadata
): Promise<GetMetricsOverviewResponse> {
  return new Promise((resolve, reject) => {
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
              error_count: 0,
              error_rate_pct: 0,
              p95_latency_ms: 0,
              services: [],
            }
          );
        }
      }
    );
  });
}

export function systemGetMetricsTimeseries(
  request: GetMetricsTimeseriesRequest,
  metadata?: grpc.Metadata
): Promise<GetMetricsTimeseriesResponse> {
  return new Promise((resolve, reject) => {
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
  });
}

export function systemListIncidents(
  request: ListIncidentsRequest,
  metadata?: grpc.Metadata
): Promise<ListIncidentsResponse> {
  return new Promise((resolve, reject) => {
    systemClient.listIncidents(
      request,
      metadata ?? new grpc.Metadata(),
      (err: Error | null, res?: ListIncidentsResponse) => {
        if (err) reject(err);
        else resolve(res ?? { incidents: [] });
      }
    );
  });
}
