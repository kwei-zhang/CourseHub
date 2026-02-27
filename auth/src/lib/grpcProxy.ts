import type { Request, Response } from "express";
import grpc from "@grpc/grpc-js";
import type { GrpcCall } from "../types/grpc";

/** Build gRPC metadata with user id for backend services. */
export function metadataForUser(userId: string): grpc.Metadata {
  const md = new grpc.Metadata();
  md.add("x-user-id", userId);
  return md;
}

/**
 * Factory for proxy handlers: call a gRPC method with auth user metadata and return JSON.
 * Use in route handlers so we don't repeat try/catch and 502 logic.
 */
export function createProxyHandler<T>(
  grpcCall: GrpcCall<T>,
  serviceName: string
): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const metadata = req.user ? metadataForUser(req.user.id) : undefined;
      const data = await grpcCall(metadata);
      res.json(data);
    } catch (err) {
      console.error(`${serviceName} proxy error:`, err);
      res.status(502).json({ error: `${serviceName} service unavailable` });
    }
  };
}
