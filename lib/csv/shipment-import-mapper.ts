import type { ParsedCsvRow } from '@/lib/csv/parse-csv';

export type ShipmentImportFieldKey =
  | 'trackingNumber'
  | 'orderNumber'
  | 'customerName'
  | 'customerPhone'
  | 'customerEmail'
  | 'deliveryAddress'
  | 'courierName'
  | 'shipmentStatus'
  | 'codAmount'
  | 'codCurrency'
  | 'lastStatusAt'
  | 'notes';

export interface NormalizedShipmentImportRow {
  rowNumber: number;
  trackingNumber: string | null;
  orderNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  courierName: string | null;
  shipmentStatus: string | null;
  codAmount: string | null;
  codCurrency: string | null;
  lastStatusAt: string | null;
  notes: string | null;
}

const SHIPMENT_IMPORT_HEADER_ALIASES: Record<
  ShipmentImportFieldKey,
  string[]
> = {
  trackingNumber: ['tracking_number'],
  orderNumber: ['external_order_id', 'order_id', 'order_number'],
  customerName: ['customer_name', 'recipient_name'],
  customerPhone: ['customer_phone', 'recipient_phone'],
  customerEmail: ['customer_email'],
  deliveryAddress: ['delivery_address'],
  courierName: ['courier_name', 'carrier_name'],
  shipmentStatus: ['shipment_status', 'status'],
  codAmount: ['cod_amount'],
  codCurrency: ['cod_currency'],
  lastStatusAt: ['last_status_at'],
  notes: ['notes', 'note'],
};

function getMappedValue(
  row: ParsedCsvRow,
  fieldName: ShipmentImportFieldKey
) {
  const aliases = SHIPMENT_IMPORT_HEADER_ALIASES[fieldName];

  for (const alias of aliases) {
    const value = row[alias];

    if (value !== undefined) {
      return value;
    }
  }

  return null;
}

export function getProvidedShipmentImportFields(headers: string[]) {
  const providedFields = new Set<ShipmentImportFieldKey>();

  for (const [fieldName, aliases] of Object.entries(
    SHIPMENT_IMPORT_HEADER_ALIASES
  ) as [ShipmentImportFieldKey, string[]][]) {
    if (aliases.some((alias) => headers.includes(alias))) {
      providedFields.add(fieldName);
    }
  }

  return providedFields;
}

export function mapShipmentImportRow(
  rawRow: ParsedCsvRow,
  rowNumber: number
): NormalizedShipmentImportRow {
  return {
    rowNumber,
    trackingNumber: getMappedValue(rawRow, 'trackingNumber'),
    orderNumber: getMappedValue(rawRow, 'orderNumber'),
    customerName: getMappedValue(rawRow, 'customerName'),
    customerPhone: getMappedValue(rawRow, 'customerPhone'),
    customerEmail: getMappedValue(rawRow, 'customerEmail'),
    deliveryAddress: getMappedValue(rawRow, 'deliveryAddress'),
    courierName: getMappedValue(rawRow, 'courierName'),
    shipmentStatus: getMappedValue(rawRow, 'shipmentStatus'),
    codAmount: getMappedValue(rawRow, 'codAmount'),
    codCurrency: getMappedValue(rawRow, 'codCurrency'),
    lastStatusAt: getMappedValue(rawRow, 'lastStatusAt'),
    notes: getMappedValue(rawRow, 'notes'),
  };
}
