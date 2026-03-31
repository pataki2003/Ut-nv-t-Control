import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ImportJob, ImportStatus } from '@/lib/types/import';
import type { CodStatus, ShipmentStatus } from '@/lib/types/shipment';
import type {
  ShipmentImportFieldKey,
} from '@/lib/csv/shipment-import-mapper';
import type { CsvParseIssue } from '@/lib/csv/parse-csv';
import type { ValidatedShipmentImportRow } from '@/lib/csv/shipment-import-validator';

import { createClient } from '@/lib/supabase/server';
import { parseCsv } from '@/lib/csv/parse-csv';
import {
  getProvidedShipmentImportFields,
  mapShipmentImportRow,
} from '@/lib/csv/shipment-import-mapper';
import { validateShipmentImportRow } from '@/lib/csv/shipment-import-validator';

type ShipmentImportServiceArgs = {
  merchantId: string;
  userId: string;
  fileName: string;
  csvText: string;
};

type ShipmentImportIssue = {
  rowNumber: number | null;
  trackingNumber: string | null;
  type: 'failed' | 'skipped';
  message: string;
};

type ShipmentImportResult = {
  job: ImportJob;
  issues: ShipmentImportIssue[];
};

type CsvImportJobRow = {
  id: string;
  merchant_id: string;
  created_by: string | null;
  file_name: string;
  import_status: ImportStatus;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  skipped_rows: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ExistingShipmentRow = {
  id: string;
  merchant_id: string;
  tracking_number: string;
  order_number: string | null;
  carrier_name: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  customer_email: string | null;
  delivery_address: string | null;
  notes: string | null;
  is_returned: boolean;
  cod_amount: number | string | null;
  shipment_status: ShipmentStatus;
  cod_status: CodStatus;
  shipped_at: string | null;
  delivered_at: string | null;
};

type FinalizeImportJobArgs = {
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  errorMessage: string | null;
  status: ImportStatus;
};

type CodState = {
  codAmount: number;
  codStatus: CodStatus;
};

type RowOutcome =
  | {
      success: true;
    }
  | {
      success: false;
      issue: ShipmentImportIssue;
    };

const IMPORT_JOB_SELECT = [
  'id',
  'merchant_id',
  'created_by',
  'file_name',
  'import_status',
  'total_rows',
  'processed_rows',
  'successful_rows',
  'failed_rows',
  'skipped_rows',
  'error_message',
  'started_at',
  'completed_at',
  'created_at',
  'updated_at',
].join(', ');

const SHIPMENT_IMPORT_SELECT = [
  'id',
  'merchant_id',
  'tracking_number',
  'order_number',
  'carrier_name',
  'recipient_name',
  'recipient_phone',
  'customer_email',
  'delivery_address',
  'notes',
  'is_returned',
  'cod_amount',
  'shipment_status',
  'cod_status',
  'shipped_at',
  'delivered_at',
].join(', ');

function parseCodAmount(value: number | string | null) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

function mapImportJobRow(row: CsvImportJobRow): ImportJob {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    createdBy: row.created_by,
    fileName: row.file_name,
    importStatus: row.import_status,
    totalRows: row.total_rows,
    processedRows: row.processed_rows,
    successfulRows: row.successful_rows,
    failedRows: row.failed_rows,
    skippedRows: row.skipped_rows,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function groupParseErrorsByRowNumber(parseErrors: CsvParseIssue[]) {
  const fatalErrors: string[] = [];
  const rowErrors = new Map<number, string[]>();

  for (const error of parseErrors) {
    if (error.rowNumber === null || error.type === 'header') {
      fatalErrors.push(error.message);
      continue;
    }

    const currentErrors = rowErrors.get(error.rowNumber) ?? [];
    currentErrors.push(error.message);
    rowErrors.set(error.rowNumber, currentErrors);
  }

  return {
    fatalErrors,
    rowErrors,
  };
}

function getDuplicateTrackingKey(trackingNumber: string) {
  return trackingNumber.trim();
}

function getImportCodState(
  currentShipment: ExistingShipmentRow | null,
  row: ValidatedShipmentImportRow,
  providedFields: Set<ShipmentImportFieldKey>
): CodState {
  if (!providedFields.has('codAmount')) {
    if (currentShipment) {
      return {
        codAmount: parseCodAmount(currentShipment.cod_amount),
        codStatus: currentShipment.cod_status,
      };
    }

    return {
      codAmount: 0,
      codStatus: 'not_applicable',
    };
  }

  if (!currentShipment) {
    return {
      codAmount: row.codAmount,
      codStatus: row.codAmount > 0 ? 'pending' : 'not_applicable',
    };
  }

  if (row.codAmount === 0) {
    return {
      codAmount: 0,
      codStatus:
        currentShipment.cod_status === 'collected' ||
        currentShipment.cod_status === 'remitted'
          ? currentShipment.cod_status
          : 'not_applicable',
    };
  }

  return {
    codAmount: row.codAmount,
    codStatus:
      currentShipment.cod_status === 'not_applicable'
        ? 'pending'
        : currentShipment.cod_status,
  };
}

function getNextDeliveredAt(
  currentShipment: ExistingShipmentRow | null,
  row: ValidatedShipmentImportRow
) {
  if (row.shipmentStatus === 'delivered' && !currentShipment?.delivered_at) {
    return row.lastStatusAt ?? new Date().toISOString();
  }

  return currentShipment?.delivered_at ?? null;
}

function getNextIsReturned(
  currentShipment: ExistingShipmentRow | null,
  row: ValidatedShipmentImportRow
) {
  if (
    row.shipmentStatus === 'return_initiated' ||
    row.shipmentStatus === 'returned'
  ) {
    return true;
  }

  return currentShipment?.is_returned ?? false;
}

function buildHistoryNote(
  currentShipment: ExistingShipmentRow | null,
  row: ValidatedShipmentImportRow,
  nextCodStatus: CodStatus,
  shipmentStatusChanged: boolean,
  codStatusChanged: boolean
) {
  if (row.notes) {
    return row.notes;
  }

  if (!currentShipment) {
    return null;
  }

  if (shipmentStatusChanged && codStatusChanged) {
    return `Import updated shipment status from ${currentShipment.shipment_status} to ${row.shipmentStatus} and COD status from ${currentShipment.cod_status} to ${nextCodStatus}.`;
  }

  if (!shipmentStatusChanged && codStatusChanged) {
    return `Import updated COD status from ${currentShipment.cod_status} to ${nextCodStatus}.`;
  }

  return null;
}

function buildShipmentUpsertPayload({
  merchantId,
  currentShipment,
  row,
  providedFields,
  codState,
}: {
  merchantId: string;
  currentShipment: ExistingShipmentRow | null;
  row: ValidatedShipmentImportRow;
  providedFields: Set<ShipmentImportFieldKey>;
  codState: CodState;
}) {
  const payload: Record<string, unknown> = {
    merchant_id: merchantId,
    tracking_number: row.trackingNumber,
    shipment_status: row.shipmentStatus,
  };

  if (!currentShipment || providedFields.has('orderNumber')) {
    payload.order_number = row.orderNumber;
  }

  if (!currentShipment || providedFields.has('customerName')) {
    payload.recipient_name = row.customerName;
  }

  if (!currentShipment || providedFields.has('customerPhone')) {
    payload.recipient_phone = row.customerPhone;
  }

  if (!currentShipment || providedFields.has('customerEmail')) {
    payload.customer_email = row.customerEmail;
  }

  if (!currentShipment || providedFields.has('deliveryAddress')) {
    payload.delivery_address = row.deliveryAddress;
  }

  if (!currentShipment || providedFields.has('courierName')) {
    payload.carrier_name = row.courierName;
  }

  if (!currentShipment || providedFields.has('notes')) {
    payload.notes = row.notes;
  }

  if (!currentShipment || providedFields.has('codAmount')) {
    payload.cod_amount = codState.codAmount;
    payload.cod_status = codState.codStatus;
  }

  const nextDeliveredAt = getNextDeliveredAt(currentShipment, row);

  if (!currentShipment || nextDeliveredAt !== currentShipment.delivered_at) {
    payload.delivered_at = nextDeliveredAt;
  }

  const nextIsReturned = getNextIsReturned(currentShipment, row);

  if (!currentShipment || nextIsReturned !== currentShipment.is_returned) {
    payload.is_returned = nextIsReturned;
  }

  return payload;
}

function buildErrorSummary(
  fatalErrors: string[],
  issues: ShipmentImportIssue[],
  maxLines = 12
) {
  const lines: string[] = [];

  for (const error of fatalErrors) {
    lines.push(error);
  }

  for (const issue of issues.slice(0, maxLines - lines.length)) {
    const rowLabel = issue.rowNumber ? `Row ${issue.rowNumber}` : 'Import';
    lines.push(`${rowLabel}: ${issue.message}`);
  }

  if (lines.length === 0) {
    return null;
  }

  const summary = lines.join('\n');
  return summary.length > 2000 ? `${summary.slice(0, 1997)}...` : summary;
}

async function createImportJob(
  supabase: SupabaseClient,
  merchantId: string,
  userId: string,
  fileName: string
) {
  const { data, error } = await supabase
    .from('csv_import_jobs')
    .insert({
      merchant_id: merchantId,
      created_by: userId,
      file_name: fileName,
      import_status: 'queued',
    })
    .select(IMPORT_JOB_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as CsvImportJobRow;
}

async function markImportJobProcessing(
  supabase: SupabaseClient,
  jobId: string
) {
  const { error } = await supabase
    .from('csv_import_jobs')
    .update({
      import_status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    throw error;
  }
}

async function finalizeImportJob(
  supabase: SupabaseClient,
  jobId: string,
  args: FinalizeImportJobArgs
) {
  const { data, error } = await supabase
    .from('csv_import_jobs')
    .update({
      import_status: args.status,
      total_rows: args.totalRows,
      processed_rows: args.processedRows,
      successful_rows: args.successfulRows,
      failed_rows: args.failedRows,
      skipped_rows: args.skippedRows,
      error_message: args.errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select(IMPORT_JOB_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapImportJobRow(data as unknown as CsvImportJobRow);
}

async function getExistingShipmentsMap(
  supabase: SupabaseClient,
  merchantId: string,
  trackingNumbers: string[]
) {
  if (trackingNumbers.length === 0) {
    return new Map<string, ExistingShipmentRow>();
  }

  const { data, error } = await supabase
    .from('shipments')
    .select(SHIPMENT_IMPORT_SELECT)
    .eq('merchant_id', merchantId)
    .in('tracking_number', trackingNumbers);

  if (error) {
    throw error;
  }

  const shipmentMap = new Map<string, ExistingShipmentRow>();

  for (const shipment of (data ?? []) as unknown as ExistingShipmentRow[]) {
    shipmentMap.set(shipment.tracking_number, shipment);
  }

  return shipmentMap;
}

async function processValidatedRow({
  supabase,
  merchantId,
  userId,
  providedFields,
  row,
  currentShipment,
}: {
  supabase: SupabaseClient;
  merchantId: string;
  userId: string;
  providedFields: Set<ShipmentImportFieldKey>;
  row: ValidatedShipmentImportRow;
  currentShipment: ExistingShipmentRow | null;
}): Promise<RowOutcome> {
  try {
    const codState = getImportCodState(currentShipment, row, providedFields);
    const shipmentStatusChanged =
      !currentShipment || currentShipment.shipment_status !== row.shipmentStatus;
    const codStatusChanged =
      !currentShipment || currentShipment.cod_status !== codState.codStatus;

    const shipmentPayload = buildShipmentUpsertPayload({
      merchantId,
      currentShipment,
      row,
      providedFields,
      codState,
    });

    const { data: shipmentData, error: shipmentError } = await supabase
      .from('shipments')
      .upsert(shipmentPayload, {
        onConflict: 'merchant_id,tracking_number',
      })
      .select(SHIPMENT_IMPORT_SELECT)
      .single();

    if (shipmentError) {
      throw shipmentError;
    }

    const persistedShipment = shipmentData as unknown as ExistingShipmentRow;

    if (shipmentStatusChanged || codStatusChanged) {
      const { error: historyError } = await supabase
        .from('shipment_status_history')
        .insert({
          merchant_id: merchantId,
          shipment_id: persistedShipment.id,
          status: row.shipmentStatus,
          source: 'import',
          note: buildHistoryNote(
            currentShipment,
            row,
            codState.codStatus,
            shipmentStatusChanged,
            codStatusChanged
          ),
          changed_by: userId,
          created_at: row.lastStatusAt ?? new Date().toISOString(),
        });

      if (historyError) {
        throw historyError;
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to import this row.';

    return {
      success: false,
      issue: {
        rowNumber: row.rowNumber,
        trackingNumber: row.trackingNumber,
        type: 'failed',
        message,
      },
    };
  }
}

export async function importShipmentsFromCsv({
  merchantId,
  userId,
  fileName,
  csvText,
}: ShipmentImportServiceArgs): Promise<ShipmentImportResult> {
  const supabase = await createClient();
  const job = await createImportJob(supabase, merchantId, userId, fileName);

  await markImportJobProcessing(supabase, job.id);

  const parseResult = parseCsv(csvText);
  const { fatalErrors, rowErrors } = groupParseErrorsByRowNumber(parseResult.errors);
  const providedFields = getProvidedShipmentImportFields(parseResult.headers);
  const mappedRows = parseResult.rows.map((row, index) =>
    mapShipmentImportRow(row, index + 2)
  );
  const issues: ShipmentImportIssue[] = [];
  const seenTrackingNumbers = new Set<string>();
  const validRows: ValidatedShipmentImportRow[] = [];

  for (const row of mappedRows) {
    const parserMessages = rowErrors.get(row.rowNumber);

    if (parserMessages) {
      for (const message of parserMessages) {
        issues.push({
          rowNumber: row.rowNumber,
          trackingNumber: row.trackingNumber,
          type: 'failed',
          message,
        });
      }

      continue;
    }

    const validationResult = validateShipmentImportRow(row);

    if (!validationResult.success) {
      issues.push({
        rowNumber: validationResult.rowNumber,
        trackingNumber: row.trackingNumber,
        type: 'failed',
        message: validationResult.errors.join(' '),
      });
      continue;
    }

    const duplicateKey = getDuplicateTrackingKey(
      validationResult.data.trackingNumber
    );

    if (seenTrackingNumbers.has(duplicateKey)) {
      issues.push({
        rowNumber: validationResult.data.rowNumber,
        trackingNumber: validationResult.data.trackingNumber,
        type: 'skipped',
        message: 'Duplicate tracking number found later in the same file.',
      });
      continue;
    }

    seenTrackingNumbers.add(duplicateKey);
    validRows.push(validationResult.data);
  }

  const totalRows = mappedRows.length;
  const processedRows = mappedRows.length;
  const failedRows = issues.filter((issue) => issue.type === 'failed').length;
  const skippedRows = issues.filter((issue) => issue.type === 'skipped').length;

  if (fatalErrors.length > 0 && totalRows === 0) {
    const finalizedJob = await finalizeImportJob(supabase, job.id, {
      totalRows,
      processedRows,
      successfulRows: 0,
      failedRows,
      skippedRows,
      errorMessage: buildErrorSummary(fatalErrors, issues),
      status: 'failed',
    });

    return {
      job: finalizedJob,
      issues,
    };
  }

  if (totalRows === 0) {
    const finalizedJob = await finalizeImportJob(supabase, job.id, {
      totalRows,
      processedRows,
      successfulRows: 0,
      failedRows,
      skippedRows,
      errorMessage: buildErrorSummary(
        ['No import rows were found in the CSV file.'],
        issues
      ),
      status: 'failed',
    });

    return {
      job: finalizedJob,
      issues,
    };
  }

  if (validRows.length === 0) {
    const finalizedJob = await finalizeImportJob(supabase, job.id, {
      totalRows,
      processedRows,
      successfulRows: 0,
      failedRows,
      skippedRows,
      errorMessage: buildErrorSummary(fatalErrors, issues),
      status: 'failed',
    });

    return {
      job: finalizedJob,
      issues,
    };
  }

  const existingShipments = await getExistingShipmentsMap(
    supabase,
    merchantId,
    validRows.map((row) => row.trackingNumber)
  );

  let successfulRows = 0;

  for (const row of validRows) {
    const rowResult = await processValidatedRow({
      supabase,
      merchantId,
      userId,
      providedFields,
      row,
      currentShipment: existingShipments.get(row.trackingNumber) ?? null,
    });

    if (rowResult.success) {
      successfulRows += 1;
      continue;
    }

    issues.push(rowResult.issue);
  }

  const finalFailedRows = issues.filter((issue) => issue.type === 'failed').length;
  const finalSkippedRows = issues.filter((issue) => issue.type === 'skipped').length;

  const status: ImportStatus =
    successfulRows === 0
      ? 'failed'
      : finalFailedRows > 0 || finalSkippedRows > 0
        ? 'completed_with_errors'
        : 'completed';

  const finalizedJob = await finalizeImportJob(supabase, job.id, {
    totalRows,
    processedRows,
    successfulRows,
    failedRows: finalFailedRows,
    skippedRows: finalSkippedRows,
    errorMessage: buildErrorSummary(fatalErrors, issues),
    status,
  });

  return {
    job: finalizedJob,
    issues,
  };
}
