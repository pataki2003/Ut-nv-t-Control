import { z } from 'zod';

import type { ShipmentStatus } from '@/lib/types/shipment';
import type { NormalizedShipmentImportRow } from '@/lib/csv/shipment-import-mapper';

import { SHIPMENT_STATUSES } from '@/lib/constants/shipment-status';

export interface ValidatedShipmentImportRow {
  rowNumber: number;
  trackingNumber: string;
  orderNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  courierName: string | null;
  shipmentStatus: ShipmentStatus;
  codAmount: number;
  codCurrency: string | null;
  lastStatusAt: string | null;
  notes: string | null;
}

export type ShipmentImportRowValidationResult =
  | {
      success: true;
      data: ValidatedShipmentImportRow;
    }
  | {
      success: false;
      rowNumber: number;
      errors: string[];
    };

function normalizeOptionalTextValue(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : trimmedValue;
}

const nullableTextSchema = z.preprocess(
  normalizeOptionalTextValue,
  z.string().trim().min(1).nullable()
);

const shipmentStatusSchema = z.preprocess(
  normalizeOptionalTextValue,
  z
    .string()
    .trim()
    .min(1, 'Shipment status is required.')
    .refine((value): value is ShipmentStatus => {
      return SHIPMENT_STATUSES.includes(value as ShipmentStatus);
    }, {
      message: 'Shipment status must match a supported shipment status.',
    })
    .transform((value) => value as ShipmentStatus)
);

const codAmountSchema = z.preprocess((value) => {
  if (value === undefined || value === null) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue === '') {
      return 0;
    }

    return Number(trimmedValue.replace(',', '.'));
  }

  return value;
}, z.number().min(0, 'COD amount must be zero or greater.'));

const shipmentImportRowSchema = z.object({
  rowNumber: z.number().int().min(2),
  trackingNumber: z.preprocess(
    normalizeOptionalTextValue,
    z.string().trim().min(1, 'Tracking number is required.')
  ),
  orderNumber: nullableTextSchema,
  customerName: nullableTextSchema,
  customerPhone: nullableTextSchema,
  customerEmail: z.preprocess(
    normalizeOptionalTextValue,
    z
      .string()
      .trim()
      .email('Customer email must be a valid email address.')
      .nullable()
  ),
  deliveryAddress: nullableTextSchema,
  courierName: nullableTextSchema,
  shipmentStatus: shipmentStatusSchema,
  codAmount: codAmountSchema,
  codCurrency: z.preprocess(
    normalizeOptionalTextValue,
    z
      .string()
      .trim()
      .min(1)
      .transform((value) => value.toUpperCase())
      .nullable()
  ),
  lastStatusAt: z.preprocess(
    normalizeOptionalTextValue,
    z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'Last status timestamp must be a valid date.',
      })
      .nullable()
  ),
  notes: nullableTextSchema,
});

export function validateShipmentImportRow(
  row: NormalizedShipmentImportRow
): ShipmentImportRowValidationResult {
  const validationResult = shipmentImportRowSchema.safeParse(row);

  if (!validationResult.success) {
    return {
      success: false,
      rowNumber: row.rowNumber,
      errors: validationResult.error.issues.map((issue) => issue.message),
    };
  }

  return {
    success: true,
    data: validationResult.data,
  };
}
