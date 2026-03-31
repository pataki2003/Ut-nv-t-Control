import { z } from 'zod';

const ALLOWED_CSV_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
] as const;

function normalizeOptionalValue(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

export const csvImportFileMetadataSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1, 'File name is required.')
      .refine((value) => value.toLowerCase().endsWith('.csv'), {
        message: 'Only CSV files are supported.',
      }),
    mimeType: z.preprocess(
      normalizeOptionalValue,
      z
        .string()
        .trim()
        .toLowerCase()
        .refine(
          (value) => ALLOWED_CSV_MIME_TYPES.some((mimeType) => mimeType === value),
          {
          message: 'Unsupported CSV file type.',
          }
        )
        .optional()
    ),
    sizeBytes: z.coerce
      .number()
      .int()
      .positive('File size must be greater than zero.'),
  })
  .strict();

export type CsvImportFileMetadataInput = z.infer<
  typeof csvImportFileMetadataSchema
>;
