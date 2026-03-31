export type ImportStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ImportJob {
  id: string;
  merchantId: string;
  createdBy: string | null;
  fileName: string;
  importStatus: ImportStatus;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
