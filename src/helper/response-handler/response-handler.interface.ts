export interface GlobalResponse<T = any> {
  success: boolean;
  timestamp: string;
  statusCode: number;
  message?: string;
  data?: T | T[] | null;
  error?: {
    message: string;
    details?: any;
  };
  metadata?: Record<string, any>;
}

export interface GlobalPaginatedResponse<T = any> extends GlobalResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ResponseOptions<T = any> {
  message?: string;
  data?: T;
  metadata?: Record<string, any>;
  statusCode?: number;
}
