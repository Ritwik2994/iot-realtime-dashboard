import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // Check if this is a GraphQL context by trying to get HTTP context
    // If it fails, it's likely a GraphQL context
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        name: exception.name,
        message: exception.message,
        error: exception.getResponse(),
      });
    } catch (error) {
      // If we can't get HTTP context, it's likely a GraphQL context
      // For GraphQL, we return the exception to let GraphQL handle it
      return exception;
    }
  }
}
