export interface FileInfo {
  id: number;
  filename: string;
  originalFilename: string;
  path: string;
  fileSize: number;
  fileType: string;
  parentId: number;
  isFolder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationState {
  page: number;
  rowsPerPage: number;
  count: number;
}

export interface PaginationHandlers {
  handlePageChange: (event: unknown, newPage: number) => void;
  handleRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ShareInfo {
  shareCode: string;
  expireTime: string;
  hasPassword: boolean;
  fileId: number;
  filename: string;
  fileSize: number;
  createTime: string;
  visitCount: number;
  isExpired: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
} 