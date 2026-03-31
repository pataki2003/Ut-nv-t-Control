import Papa, { type ParseError } from 'papaparse';

export type ParsedCsvRow = Record<string, string | null>;

export type CsvParseIssue = {
  type: 'header' | 'parse';
  code: string;
  message: string;
  rowNumber: number | null;
};

export type ParseCsvResult = {
  headers: string[];
  rows: ParsedCsvRow[];
  errors: CsvParseIssue[];
};

function normalizeCsvCellValue(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : trimmedValue;
}

function mapParseError(error: ParseError): CsvParseIssue {
  return {
    type: 'parse',
    code: error.code,
    message: error.message,
    rowNumber: typeof error.row === 'number' ? error.row + 2 : null,
  };
}

function normalizeParsedRow(row: Record<string, unknown>): ParsedCsvRow {
  const normalizedRow: ParsedCsvRow = {};

  for (const [key, value] of Object.entries(row)) {
    if (key === '__parsed_extra') {
      continue;
    }

    normalizedRow[key] = normalizeCsvCellValue(value);
  }

  return normalizedRow;
}

export function normalizeCsvHeader(header: string) {
  return header
    .replace(/^\ufeff/, '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function parseCsv(text: string): ParseCsvResult {
  const parseResult = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: normalizeCsvHeader,
  });

  const headers = (parseResult.meta.fields ?? []).filter((header) => header !== '');
  const errors = parseResult.errors.map(mapParseError);

  if (headers.length === 0) {
    errors.unshift({
      type: 'header',
      code: 'missing_headers',
      message: 'CSV header row is required.',
      rowNumber: 1,
    });
  }

  const rows = (parseResult.data ?? []).map((row) =>
    normalizeParsedRow(row as Record<string, unknown>)
  );

  return {
    headers,
    rows,
    errors,
  };
}
