import { systemRecordDbMetricEvent } from "./grpc";

export function recordDbMetric(serviceName: string, operation: string, success: boolean, latencyMs: number): void {
  void systemRecordDbMetricEvent({
    service_name: serviceName,
    operation,
    success,
    latency_ms: latencyMs,
    occurred_at_ms: Date.now(),
  }).catch((err) => {
    console.error("DB metric capture error:", err);
  });
}
