import 'server-only';

import type { ReturnRecord, ReturnShipmentSummary } from '@/lib/types/return';
import type {
  ReturnsListQuery,
  UpdateReturnInput,
} from '@/lib/validations/return';

import { createClient } from '@/lib/supabase/server';

export type ReturnsListResult = {
  items: ReturnRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type ReturnRow = {
  id: string;
  merchant_id: string;
  shipment_id: string;
  return_status: ReturnRecord['returnStatus'];
  reason: string | null;
  notes: string | null;
  received_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type ShipmentSummaryRow = {
  id: string;
  tracking_number: string;
  order_number: string | null;
  recipient_name: string | null;
};

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsedValue = Date.parse(value);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function mapShipmentSummaryRow(row: ShipmentSummaryRow): ReturnShipmentSummary {
  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    orderNumber: row.order_number,
    recipientName: row.recipient_name,
  };
}

function mapReturnRow(
  row: ReturnRow,
  shipment: ReturnShipmentSummary | null
): ReturnRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    shipmentId: row.shipment_id,
    returnStatus: row.return_status,
    reason: row.reason,
    notes: row.notes,
    receivedAt: row.received_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shipment,
  };
}

function matchesSearch(
  shipment: ReturnShipmentSummary | null,
  search?: string
) {
  if (!search) {
    return true;
  }

  if (!shipment) {
    return false;
  }

  const normalizedSearch = search.toLowerCase();

  return (
    shipment.trackingNumber.toLowerCase().includes(normalizedSearch) ||
    (shipment.recipientName?.toLowerCase().includes(normalizedSearch) ?? false)
  );
}

function getAlignedIsReturnedValue(returnStatus: ReturnRecord['returnStatus']) {
  return returnStatus !== 'cancelled';
}

async function getShipmentSummaryMap(
  merchantId: string,
  shipmentIds: string[]
): Promise<Map<string, ReturnShipmentSummary>> {
  if (shipmentIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shipments')
    .select('id, tracking_number, order_number, recipient_name')
    .eq('merchant_id', merchantId)
    .in('id', shipmentIds);

  if (error) {
    throw error;
  }

  const shipmentSummaryMap = new Map<string, ReturnShipmentSummary>();

  for (const shipment of (data ?? []) as unknown as ShipmentSummaryRow[]) {
    shipmentSummaryMap.set(shipment.id, mapShipmentSummaryRow(shipment));
  }

  return shipmentSummaryMap;
}

export async function getReturnsList(
  merchantId: string,
  filters: ReturnsListQuery
): Promise<ReturnsListResult> {
  const supabase = await createClient();
  let returnsQuery = supabase
    .from('returns')
    .select(
      [
        'id',
        'merchant_id',
        'shipment_id',
        'return_status',
        'reason',
        'notes',
        'received_at',
        'resolved_at',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('merchant_id', merchantId);

  if (filters.returnStatus) {
    returnsQuery = returnsQuery.eq('return_status', filters.returnStatus);
  }

  const { data, error } = await returnsQuery;

  if (error) {
    throw error;
  }

  const returnRows = (data ?? []) as unknown as ReturnRow[];
  const shipmentSummaryMap = await getShipmentSummaryMap(
    merchantId,
    returnRows.map((row) => row.shipment_id)
  );

  const filteredRows = returnRows
    .filter((row) => matchesSearch(shipmentSummaryMap.get(row.shipment_id) ?? null, filters.search))
    .sort((left, right) => {
      const leftTimestamp =
        toTimestamp(left.updated_at) || toTimestamp(left.created_at);
      const rightTimestamp =
        toTimestamp(right.updated_at) || toTimestamp(right.created_at);

      return rightTimestamp - leftTimestamp;
    });

  const totalCount = filteredRows.length;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / filters.pageSize);
  const startIndex = (filters.page - 1) * filters.pageSize;
  const items = filteredRows
    .slice(startIndex, startIndex + filters.pageSize)
    .map((row) =>
      mapReturnRow(row, shipmentSummaryMap.get(row.shipment_id) ?? null)
    );

  return {
    items,
    page: filters.page,
    pageSize: filters.pageSize,
    totalCount,
    totalPages,
  };
}

export async function getReturnDetail(
  merchantId: string,
  returnId: string
): Promise<ReturnRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('returns')
    .select(
      [
        'id',
        'merchant_id',
        'shipment_id',
        'return_status',
        'reason',
        'notes',
        'received_at',
        'resolved_at',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('merchant_id', merchantId)
    .eq('id', returnId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const returnRow = data as unknown as ReturnRow;
  const shipmentSummaryMap = await getShipmentSummaryMap(merchantId, [
    returnRow.shipment_id,
  ]);

  return mapReturnRow(
    returnRow,
    shipmentSummaryMap.get(returnRow.shipment_id) ?? null
  );
}

export async function updateReturnDetail({
  merchantId,
  returnId,
  input,
}: {
  merchantId: string;
  returnId: string;
  input: UpdateReturnInput;
}): Promise<ReturnRecord | null> {
  const supabase = await createClient();
  const { data: currentReturnData, error: currentReturnError } = await supabase
    .from('returns')
    .select(
      [
        'id',
        'merchant_id',
        'shipment_id',
        'return_status',
        'reason',
        'notes',
        'received_at',
        'resolved_at',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('merchant_id', merchantId)
    .eq('id', returnId)
    .maybeSingle();

  if (currentReturnError) {
    throw currentReturnError;
  }

  if (!currentReturnData) {
    return null;
  }

  const currentReturn = currentReturnData as unknown as ReturnRow;
  const nextReturnStatus = input.returnStatus ?? currentReturn.return_status;
  const updatePayload: Record<string, unknown> = {};

  if (input.returnStatus !== undefined) {
    updatePayload.return_status = input.returnStatus;

    if (input.returnStatus === 'received' && !currentReturn.received_at) {
      updatePayload.received_at = new Date().toISOString();
    }

    if (input.returnStatus === 'resolved' && !currentReturn.resolved_at) {
      updatePayload.resolved_at = new Date().toISOString();
    }
  }

  if (input.notes !== undefined) {
    updatePayload.notes = input.notes;
  }

  if (input.reason !== undefined) {
    updatePayload.reason = input.reason;
  }

  const { error: updateError } = await supabase
    .from('returns')
    .update(updatePayload)
    .eq('merchant_id', merchantId)
    .eq('id', returnId);

  if (updateError) {
    throw updateError;
  }

  const { error: shipmentUpdateError } = await supabase
    .from('shipments')
    .update({
      is_returned: getAlignedIsReturnedValue(nextReturnStatus),
    })
    .eq('merchant_id', merchantId)
    .eq('id', currentReturn.shipment_id);

  if (shipmentUpdateError) {
    throw shipmentUpdateError;
  }

  return getReturnDetail(merchantId, returnId);
}
