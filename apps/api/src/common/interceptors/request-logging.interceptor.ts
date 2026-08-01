import { randomUUID } from "node:crypto";

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import type { Response } from "express";
import { Observable, catchError, tap, throwError } from "rxjs";

import type { AuthenticatedRequest } from "../guards/authenticated-request";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId = request.headers["x-request-id"];
    const normalizedRequestId =
      typeof requestId === "string" && /^[a-zA-Z0-9._:-]{8,128}$/.test(requestId)
        ? requestId
        : randomUUID();
    request.requestId = normalizedRequestId;
    response.setHeader("X-Request-Id", normalizedRequestId);
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const adminId = request.auth?.type === "admin" ? request.auth.sub : "-";
        this.logger.log(
          JSON.stringify({
            requestId: normalizedRequestId,
            method: request.method,
            path: request.path,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
            principalType: request.auth?.type ?? "anonymous",
            adminId,
          }),
        );
      }),
      catchError((error: unknown) => {
        this.logger.warn(
          JSON.stringify({
            requestId: normalizedRequestId,
            method: request.method,
            path: request.path,
            durationMs: Date.now() - startedAt,
            error: error instanceof Error ? error.name : "UnknownError",
          }),
        );
        return throwError(() => error);
      }),
    );
  }
}
