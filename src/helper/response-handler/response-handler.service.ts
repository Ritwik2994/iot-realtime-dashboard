import { HttpException, HttpStatus } from '@nestjs/common';

import { GlobalPaginatedResponse, GlobalResponse, ResponseOptions } from './response-handler.interface';

export class ResponseHandler {
  /**
   * Create a standardized success response
   * @param options Success response configuration
   * @returns Standardized success response object
   */
  static success<T = any>(options: ResponseOptions<T> = {}): GlobalResponse<T> {
    const { message, data = null, metadata = {}, statusCode = HttpStatus.OK } = options;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode,
      message,
      data,
      metadata,
    };
  }

  static created<T = any>(options: ResponseOptions<T> = {}): GlobalResponse<T> {
    const { message, data = null, metadata = {}, statusCode = HttpStatus.CREATED } = options;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode,
      message,
      data,
      metadata,
    };
  }

  /**
   * Create a standardized error response
   * @param options Error response configuration
   * @returns Standardized error response object
   */
  static error(options: ResponseOptions = {}): GlobalResponse<any> {
    const {
      message = 'An unexpected error occurred',
      data = null,
      metadata = {},
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    } = options;

    const response = {
      success: false,
      timestamp: new Date().toISOString(),
      statusCode,
      message,
      error: {
        message,
        // details: data,
      },
      metadata,
    };

    throw new HttpException(response, statusCode);
  }

  /**
   * Predefined error response types
   */
  static errors = {
    // Authentication Errors
    UNAUTHORIZED: (message?: string, metadata?: Record<string, any>) =>
      this.error({
        message: message || 'Unauthorized access',
        statusCode: HttpStatus.UNAUTHORIZED,
        metadata,
      }),

    FORBIDDEN: (message?: string, metadata?: Record<string, any>) =>
      this.error({
        message: message || 'Access forbidden',
        statusCode: HttpStatus.FORBIDDEN,
        metadata,
      }),

    // Validation Errors
    BAD_REQUEST: (message?: string, details?: any, metadata?: Record<string, any>) =>
      this.error({
        message: message || 'Invalid request parameters',
        data: details,
        statusCode: HttpStatus.BAD_REQUEST,
        metadata,
      }),

    // Resource Errors
    NOT_FOUND: (resource?: string, metadata?: Record<string, any>) =>
      this.error({
        message: `${resource || 'Resource'}`,
        statusCode: HttpStatus.NOT_FOUND,
        metadata,
      }),

    // Database Errors
    CONFLICT: (message?: string, metadata?: Record<string, any>) =>
      this.error({
        message: message || 'Resource conflict',
        statusCode: HttpStatus.CONFLICT,
        metadata,
      }),

    // Generic Server Errors
    INTERNAL: (message?: string, metadata?: Record<string, any>) =>
      this.error({
        message: message || 'Internal server error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        metadata,
      }),
  };

  /**
   * Paginated response helper
   * @param data Paginated items
   * @param options Pagination metadata
   * @returns Standardized paginated response
   */
  static paginate<T = any>(
    data: T[],
    options: {
      total: number;
      page: number;
      limit: number;
      metadata?: Record<string, any>;
    },
  ): GlobalPaginatedResponse<T> {
    const { total, page, limit, metadata = {} } = options;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      metadata,
    };
  }

  /**
   * Transform any error into a standardized error response
   * @param error Original error object
   * @returns Standardized error response
   */
  static transformError(error: any): GlobalResponse {
    // If it's already a structured error, return it
    if (error?.success === false) return error;

    // Generic error handling
    return this.error({
      message: error?.response?.message || 'An unexpected error occurred',
      data: error?.details || null,
      statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
