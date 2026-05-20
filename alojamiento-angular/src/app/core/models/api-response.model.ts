export interface ApiResponse<T> {
  datos: T;
  mensaje?: string;
  errores?: string[];
  exitoso?: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  totalRecords: number;
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}
