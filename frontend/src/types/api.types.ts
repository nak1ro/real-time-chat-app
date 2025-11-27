// Standard API Response Wrapper
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

// API Error Response
export interface ApiError {
  status: 'error';
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

// Pagination Options
export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

