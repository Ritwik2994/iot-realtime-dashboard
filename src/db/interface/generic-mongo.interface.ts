export interface FindOptions {
  filter?: any;
  sort?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface LookupOptions {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
  select?: ProjectionFields; // Added select option for lookup fields
  pipeline?: any;
  unwind?: boolean; // Added option to control unwinding
}

type ProjectionFields = {
  [key: string]: 0 | 1 | boolean | number | ProjectionFields;
};
