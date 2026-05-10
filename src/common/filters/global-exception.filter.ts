import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const now = new Date().toISOString();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exResponse = exception.getResponse();

      // Validation errors (class-validator) from ValidationPipe
      if (
        exception instanceof BadRequestException &&
        typeof exResponse === "object" &&
        (exResponse as any).message
      ) {
        return response.status(status).json(exResponse);
      }

      const message =
        typeof exResponse === "string"
          ? exResponse
          : ((exResponse as any).message ?? exception.message);

      return response.status(status).json({
        timestamp: now,
        status,
        error: exception.name,
        message,
      });
    }

    // Non-HTTP errors (unexpected) — log so we can see the real cause
    console.error("[GlobalExceptionFilter] Unhandled exception:", exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      timestamp: now,
      status: 500,
      error: "Internal Server Error",
      message:
        exception instanceof Error
          ? exception.message
          : "An unexpected error occurred",
    });
  }
}
