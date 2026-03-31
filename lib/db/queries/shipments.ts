import 'server-only';

import type { CreateShipmentInput, ShipmentListQuery } from '@/lib/validations/shipment';
import type { Shipment } from '@/lib/types/shipment';

import { createClient } from '@/lib/supabase/server';

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
  cod_amount: number | string | null;
  shipment_status: Shipment['shipmentStatus'];
  cod_status: Shipment['codStatus'];
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

type ShipmentStatusHistoryRow = {
  shipment_id: string;
  created_at: string;
};

type CreateManualShipmentArgs = {
  merchantId: string;
  userId: string;
  input: CreateShipmentInput;
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
    .select('shipment_id, created_at')
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
