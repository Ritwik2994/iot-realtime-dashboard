export interface ISort {
  [key: string]: 1 | -1;
}

export interface ISearchQuery {
  [key: string]: any;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}
