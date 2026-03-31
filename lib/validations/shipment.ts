import { z } from 'zod';

import { COD_STATUSES } from '@/lib/constants/cod-status';
import { SHIPMENT_STATUSES } from '@/lib/constants/shipment-status';

const MAX_PAGE_SIZE = 100;

function normalizeOptionalQueryValue(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

function normalizeOptionalTextValue(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : trimmedValue;
}

function normalizeOptionalDateValue(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : trimmedValue;
}

function hasChanges(payload: Record<string, unknown>) {
  return Object.values(payload).some((value) => value !== undefined);
}

const optionalQueryTextSchema = z.preprocess(
  normalizeOptionalQueryValue,
  z.string().trim().min(1).optional()
);

const nullableTextSchema = z.preprocess(
  normalizeOptionalTextValue,
  z.string().trim().min(1).nullable().optional()
);

const nullableDateTimeSchema = z.preprocess(
  normalizeOptionalDateValue,
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Enter a valid date.',
    })
    .nullable()
    .optional()
);

const paginationPageSchema = z.preprocess(
  normalizeOptionalQueryValue,
  z.coerce.number().int().min(1).default(1)
);

const paginationPageSizeSchema = z.preprocess(
  normalizeOptionalQueryValue,
  z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20)
);

export const shipmentStatusSchema = z.enum(SHIPMENT_STATUSES);
export const codStatusSchema = z.enum(COD_STATUSES);

export const shipmentListQuerySchema = z.object({
  page: paginationPageSchema,
  pageSize: paginationPageSizeSchema,
  search: optionalQueryTextSchema,
  shipmentStatus: z.preprocess(
    normalizeOptionalQueryValue,
    shipmentStatusSchema.optional()
  ),
  codStatus: z.preprocess(normalizeOptionalQueryValue, codStatusSchema.optional()),
  courierName: optionalQueryTextSchema,
});

export const createShipmentSchema = z
  .object({
    trackingNumber: z.string().trim().min(1, 'Tracking number is required.'),
    orderNumber: nullableTextSchema,
    carrierName: nullableTextSchema,
    recipientName: nullableTextSchema,
    recipientPhone: nullableTextSchema,
    codAmount: z.coerce
      .number()
      .min(0, 'COD amount must be zero or greater.')
      .default(0),
    shipmentStatus: shipmentStatusSchema.default('created'),
    shippedAt: nullableDateTimeSchema,
    deliveredAt: nullableDateTimeSchema,
  })
  .strict();

export const updateShipmentSchema = z
  .object({
    trackingNumber: z.string().trim().min(1, 'Tracking number is required.').optional(),
    orderNumber: nullableTextSchema,
    carrierName: nullableTextSchema,
    recipientName: nullableTextSchema,
    recipientPhone: nullableTextSchema,
    codAmount: z.coerce
      .number()
      .min(0, 'COD amount must be zero or greater.')
      .optional(),
    shippedAt: nullableDateTimeSchema,
    deliveredAt: nullableDateTimeSchema,
  })
  .strict()
  .refine(hasChanges, {
    message: 'Provide at least one shipment field to update.',
  });

export const manualShipmentStatusUpdateSchema = z
  .object({
    shipmentStatus: shipmentStatusSchema,
    codStatus: codStatusSchema.optional(),
    note: nullableTextSchema,
  })
  .strict();

export type ShipmentListQuery = z.infer<typeof shipmentListQuerySchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type ManualShipmentStatusUpdateInput = z.infer<
  typeof manualShipmentStatusUpdateSchema
>;
