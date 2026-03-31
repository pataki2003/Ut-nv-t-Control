import { importShipmentsFromCsv } from '@/lib/csv/shipment-import-service';
import { requireMerchant } from '@/lib/auth/require-merchant';
import { AuthRequiredError } from '@/lib/auth/require-user';
import { errorResponse, successResponse } from '@/lib/utils/api-response';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const CSV_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
]);

function isCsvUpload(file: File) {
  const normalizedName = file.name.trim().toLowerCase();
  const normalizedType = file.type.trim().toLowerCase();

  return (
    normalizedName.endsWith('.csv') ||
    CSV_MIME_TYPES.has(normalizedType)
  );
}

function getImportErrors(result: Awaited<ReturnType<typeof importShipmentsFromCsv>>) {
  if (result.issues.length > 0) {
    return result.issues;
  }

  if (!result.job.errorMessage) {
    return [];
  }

  return result.job.errorMessage
    .split('\n')
    .map((message) => message.trim())
    .filter((message) => message !== '')
    .map((message) => ({
      rowNumber: null,
      trackingNumber: null,
      type: 'failed' as const,
      message,
    }));
}

export async function POST(request: Request) {
  try {
    const auth = await requireMerchant();
    const formData = await request.formData();
    const fileEntry = formData.get('file');

    if (!(fileEntry instanceof File)) {
      return errorResponse('A CSV file upload is required.', 400);
    }

    if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse('CSV file must be 5 MB or smaller.', 413);
    }

    if (!isCsvUpload(fileEntry)) {
      return errorResponse('Only CSV uploads are supported.', 400);
    }

    const csvText = await fileEntry.text();
    const result = await importShipmentsFromCsv({
      merchantId: auth.merchantId,
      userId: auth.userId,
      fileName: fileEntry.name,
      csvText,
    });

    return successResponse({
      jobId: result.job.id,
      totalRows: result.job.totalRows,
      successRows: result.job.successfulRows,
      failedRows: result.job.failedRows,
      skippedRows: result.job.skippedRows,
      errors: getImportErrors(result),
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to import shipments.', 500);
  }
}
