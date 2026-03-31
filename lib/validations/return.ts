import { z } from 'zod';

import { RETURN_STATUSES } from '@/lib/constants/return-status';

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

export const returnStatusSchema = z.enum(RETURN_STATUSES);

export const returnsListQuerySchema = z.object({
  page: z.preprocess(
    normalizeOptionalQueryValue,
    z.coerce.number().int().min(1).default(1)
  ),
  pageSize: z.preprocess(
    normalizeOptionalQueryValue,
    z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20)
  ),
  search: optionalQueryTextSchema,
  returnStatus: z.preprocess(
    normalizeOptionalQueryValue,
    returnStatusSchema.optional()
  ),
});

export const updateReturnSchema = z
  .object({
    returnStatus: returnStatusSchema.optional(),
    reason: nullableTextSchema,
    notes: nullableTextSchema,
  })
  .strict()
  .refine(hasChanges, {
    message: 'Provide at least one return field to update.',
  });

export type ReturnsListQuery = z.infer<typeof returnsListQuerySchema>;
export type UpdateReturnInput = z.infer<typeof updateReturnSchema>;
