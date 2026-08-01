import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

import { EnvService } from "../env/env.service";
import type { AuthenticatedRequest } from "../guards/authenticated-request";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly envService: EnvService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<AuthenticatedRequest>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? extractMessage(exception.getResponse())
        : "Internal server error";

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
      );
    }

    const safeMessage =
      status >= 500 && this.envService.isProduction
        ? "Internal server error"
        : message;
    response.status(status).json({
      error: safeMessage,
      message: safeMessage,
      statusCode: status,
      requestId: request.requestId,
    });
  }
}

function extractMessage(response: string | object): string {
  if (typeof response === "string") {
    return response;
  }

  if ("message" in response) {
    const value = response.message;
    return Array.isArray(value) ? value.join(", ") : String(value);
  }

  return "Request failed";
}
