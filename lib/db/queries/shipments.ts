import 'server-only';

import type {
  CreateShipmentInput,
  ManualShipmentStatusUpdateInput,
  ShipmentListQuery,
} from '@/lib/validations/shipment';
import type { Shipment, ShipmentDetail, ShipmentStatusHistoryEntry } from '@/lib/types/shipment';
import type { ReturnRecord } from '@/lib/types/return';

import { createClient } from '@/lib/supabase/server';
import { deriveShipmentSideEffects } from '@/lib/utils/status';

export type ShipmentsListResult = {
  items: Shipment[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type ShipmentRow = {
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
  shipment_status: Shipment['shipmentStatus'];
  cod_status: Shipment['codStatus'];
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

type ShipmentStatusHistoryRow = {
  id: string;
  merchant_id: string;
  shipment_id: string;
  status: Shipment['shipmentStatus'];
  source: string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
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

type CreateManualShipmentArgs = {
  merchantId: string;
  userId: string;
  input: CreateShipmentInput;
};

type UpdateShipmentDetailInput = {
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  deliveryAddress?: string | null;
  courierName?: string | null;
  codAmount?: number;
  notes?: string | null;
};

type UpdateShipmentStatusArgs = {
  merchantId: string;
  userId: string;
  shipmentId: string;
  currentShipment: ShipmentDetail;
  input: ManualShipmentStatusUpdateInput;
};

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

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsedValue = Date.parse(value);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function mapShipmentRow(row: ShipmentRow): Shipment {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    trackingNumber: row.tracking_number,
    orderNumber: row.order_number,
    carrierName: row.carrier_name,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    customerEmail: row.customer_email,
    deliveryAddress: row.delivery_address,
    notes: row.notes,
    isReturned: row.is_returned,
    codAmount: parseCodAmount(row.cod_amount),
    shipmentStatus: row.shipment_status,
    codStatus: row.cod_status,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function matchesSearch(row: ShipmentRow, search?: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();

  return (
    row.tracking_number.toLowerCase().includes(normalizedSearch) ||
    (row.order_number?.toLowerCase().includes(normalizedSearch) ?? false)
  );
}

function getDerivedCodStatus(codAmount: number) {
  return codAmount > 0 ? 'pending' : 'not_applicable';
}

function mapShipmentStatusHistoryRow(
  row: ShipmentStatusHistoryRow
): ShipmentStatusHistoryEntry {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    shipmentId: row.shipment_id,
    status: row.status,
    source: row.source,
    note: row.note,
    changedBy: row.changed_by,
    createdAt: row.created_at,
  };
}

function mapReturnRow(row: ReturnRow): ReturnRecord {
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
    shipment: null,
  };
}

function getNextCodStatus(
  currentCodStatus: Shipment['codStatus'],
  nextCodAmount?: number
) {
  if (nextCodAmount === undefined) {
    return currentCodStatus;
  }

  if (nextCodAmount === 0) {
    return currentCodStatus === 'collected' ? 'collected' : 'not_applicable';
  }

  if (currentCodStatus === 'not_applicable') {
    return 'pending';
  }

  return currentCodStatus;
}

export async function getShipmentsList(
  merchantId: string,
  filters: ShipmentListQuery
): Promise<ShipmentsListResult> {
  const supabase = await createClient();
  let shipmentsQuery = supabase
    .from('shipments')
    .select(
      [
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
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('merchant_id', merchantId);

  if (filters.shipmentStatus) {
    shipmentsQuery = shipmentsQuery.eq('shipment_status', filters.shipmentStatus);
  }

  if (filters.codStatus) {
    shipmentsQuery = shipmentsQuery.eq('cod_status', filters.codStatus);
  }

  if (filters.courierName) {
    shipmentsQuery = shipmentsQuery.ilike(
      'carrier_name',
      `%${filters.courierName}%`
    );
  }

  const { data, error } = await shipmentsQuery;

  if (error) {
    throw error;
  }

  const filteredShipments = ((data ?? []) as unknown as ShipmentRow[]).filter(
    (row) =>
    matchesSearch(row, filters.search)
  );

  const totalCount = filteredShipments.length;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / filters.pageSize);

  if (totalCount === 0) {
    return {
      items: [],
      page: filters.page,
      pageSize: filters.pageSize,
      totalCount,
      totalPages,
    };
  }

  const shipmentIds = filteredShipments.map((shipment) => shipment.id);
  const { data: historyData, error: historyError } = await supabase
    .from('shipment_status_history')
    .select('id, merchant_id, shipment_id, status, source, note, changed_by, created_at')
    .eq('merchant_id', merchantId)
    .in('shipment_id', shipmentIds)
    .order('created_at', { ascending: false });

  if (historyError) {
    throw historyError;
  }

  const latestStatusByShipmentId = new Map<string, string>();

  for (const entry of (historyData ?? []) as unknown as ShipmentStatusHistoryRow[]) {
    if (!latestStatusByShipmentId.has(entry.shipment_id)) {
      latestStatusByShipmentId.set(entry.shipment_id, entry.created_at);
    }
  }

  filteredShipments.sort((left, right) => {
    const leftStatusAt = latestStatusByShipmentId.get(left.id) ?? left.created_at;
    const rightStatusAt =
      latestStatusByShipmentId.get(right.id) ?? right.created_at;

    return toTimestamp(rightStatusAt) - toTimestamp(leftStatusAt);
  });

  const startIndex = (filters.page - 1) * filters.pageSize;
  const paginatedShipments = filteredShipments
    .slice(startIndex, startIndex + filters.pageSize)
    .map(mapShipmentRow);

  return {
    items: paginatedShipments,
    page: filters.page,
    pageSize: filters.pageSize,
    totalCount,
    totalPages,
  };
}

export async function createManualShipment({
  merchantId,
  userId,
  input,
}: CreateManualShipmentArgs): Promise<Shipment> {
  const supabase = await createClient();
  const codStatus = getDerivedCodStatus(input.codAmount);
  const shipmentStatus = input.shipmentStatus;

  const { data: shipmentData, error: shipmentError } = await supabase
    .from('shipments')
    .insert({
      merchant_id: merchantId,
      tracking_number: input.trackingNumber,
      order_number: input.orderNumber ?? null,
      carrier_name: input.carrierName ?? null,
      recipient_name: input.recipientName ?? null,
      recipient_phone: input.recipientPhone ?? null,
      customer_email: null,
      delivery_address: null,
      notes: null,
      is_returned: false,
      cod_amount: input.codAmount,
      shipment_status: shipmentStatus,
      cod_status: codStatus,
      shipped_at: input.shippedAt ?? null,
      delivered_at: input.deliveredAt ?? null,
    })
    .select(
      [
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
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .single();

  if (shipmentError) {
    throw shipmentError;
  }

  const shipment = shipmentData as unknown as ShipmentRow;

  const { error: historyError } = await supabase
    .from('shipment_status_history')
    .insert({
      merchant_id: merchantId,
      shipment_id: shipment.id,
      status: shipment.shipment_status,
      changed_by: userId,
      source: 'manual',
    });

  if (historyError) {
    throw historyError;
  }

  return mapShipmentRow(shipment);
}

export async function getShipmentDetail(
  merchantId: string,
  shipmentId: string
): Promise<ShipmentDetail | null> {
  const supabase = await createClient();
  const { data: shipmentData, error: shipmentError } = await supabase
    .from('shipments')
    .select(
      [
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
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('merchant_id', merchantId)
    .eq('id', shipmentId)
    .maybeSingle();

  if (shipmentError) {
    throw shipmentError;
  }

  if (!shipmentData) {
    return null;
  }

  const shipment = mapShipmentRow(shipmentData as unknown as ShipmentRow);

  const { data: historyData, error: historyError } = await supabase
    .from('shipment_status_history')
    .select('id, merchant_id, shipment_id, status, source, note, changed_by, created_at')
    .eq('merchant_id', merchantId)
    .eq('shipment_id', shipmentId)
    .order('created_at', { ascending: false });

  if (historyError) {
    throw historyError;
  }

  const { data: returnData, error: returnError } = await supabase
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
    .eq('shipment_id', shipmentId)
    .maybeSingle();

  if (returnError) {
    throw returnError;
  }

  return {
    ...shipment,
    statusHistory: ((historyData ?? []) as unknown as ShipmentStatusHistoryRow[]).map(
      mapShipmentStatusHistoryRow
    ),
    returnRecord: returnData ? mapReturnRow(returnData as unknown as ReturnRow) : null,
  };
}

export async function updateShipmentDetail({
  merchantId,
  shipmentId,
  input,
}: {
  merchantId: string;
  shipmentId: string;
  input: UpdateShipmentDetailInput;
}): Promise<ShipmentDetail | null> {
  const supabase = await createClient();
  const { data: currentShipmentData, error: currentShipmentError } = await supabase
    .from('shipments')
    .select(
      [
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
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('merchant_id', merchantId)
    .eq('id', shipmentId)
    .maybeSingle();

  if (currentShipmentError) {
    throw currentShipmentError;
  }

  if (!currentShipmentData) {
    return null;
  }

  const currentShipment = currentShipmentData as unknown as ShipmentRow;
  const nextCodAmount = input.codAmount;
  const nextCodStatus = getNextCodStatus(
    currentShipment.cod_status,
    nextCodAmount
  );

  const updatePayload: Record<string, unknown> = {};

  if (input.customerName !== undefined) {
    updatePayload.recipient_name = input.customerName;
  }

  if (input.customerPhone !== undefined) {
    updatePayload.recipient_phone = input.customerPhone;
  }

  if (input.customerEmail !== undefined) {
    updatePayload.customer_email = input.customerEmail;
  }

  if (input.deliveryAddress !== undefined) {
    updatePayload.delivery_address = input.deliveryAddress;
  }

  if (input.courierName !== undefined) {
    updatePayload.carrier_name = input.courierName;
  }

  if (input.notes !== undefined) {
    updatePayload.notes = input.notes;
  }

  if (nextCodAmount !== undefined) {
    updatePayload.cod_amount = nextCodAmount;
    updatePayload.cod_status = nextCodStatus;
  }

  const { error: updateError } = await supabase
    .from('shipments')
    .update(updatePayload)
    .eq('merchant_id', merchantId)
    .eq('id', shipmentId);

  if (updateError) {
    throw updateError;
  }

  return getShipmentDetail(merchantId, shipmentId);
}

export async function updateShipmentStatus({
  merchantId,
  userId,
  shipmentId,
  currentShipment,
  input,
}: UpdateShipmentStatusArgs): Promise<ShipmentDetail> {
  const supabase = await createClient();
  const sideEffects = deriveShipmentSideEffects(
    {
      deliveredAt: currentShipment.deliveredAt,
      isReturned: currentShipment.isReturned,
      codStatus: currentShipment.codStatus,
    },
    input.shipmentStatus,
    input.codStatus
  );

  const { error: shipmentUpdateError } = await supabase
    .from('shipments')
    .update({
      shipment_status: input.shipmentStatus,
      cod_status: sideEffects.nextCodStatus,
      delivered_at: sideEffects.deliveredAt,
      is_returned: sideEffects.isReturned,
    })
    .eq('merchant_id', merchantId)
    .eq('id', shipmentId);

  if (shipmentUpdateError) {
    throw shipmentUpdateError;
  }

  if (sideEffects.shouldCreateReturn && !currentShipment.returnRecord) {
    const { error: returnCreateError } = await supabase
      .from('returns')
      .insert({
        merchant_id: merchantId,
        shipment_id: shipmentId,
        return_status: 'requested',
      });

    if (returnCreateError) {
      throw returnCreateError;
    }
  }

  if (input.shipmentStatus === 'return_initiated') {
    const { error: returnFlagUpdateError } = await supabase
      .from('shipments')
      .update({
        is_returned: true,
      })
      .eq('merchant_id', merchantId)
      .eq('id', shipmentId);

    if (returnFlagUpdateError) {
      throw returnFlagUpdateError;
    }
  }

  const { error: historyInsertError } = await supabase
    .from('shipment_status_history')
    .insert({
      merchant_id: merchantId,
      shipment_id: shipmentId,
      status: input.shipmentStatus,
      source: 'manual',
      note: input.note ?? null,
      changed_by: userId,
    });

  if (historyInsertError) {
    throw historyInsertError;
  }

  const updatedShipment = await getShipmentDetail(merchantId, shipmentId);

  if (!updatedShipment) {
    throw new Error('Shipment detail was not found after the status update.');
  }

  return updatedShipment;
}
