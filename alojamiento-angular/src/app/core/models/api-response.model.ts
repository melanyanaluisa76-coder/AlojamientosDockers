export interface ApiResponse<T> {
  data: T;
  message?: string | null;
  errors?: string[];
  success?: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  totalRecords: number;
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}
