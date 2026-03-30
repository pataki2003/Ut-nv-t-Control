type DateValue = Date | string | number;

const DEFAULT_LOCALE = 'hu-HU';

function toDate(value: DateValue) {
  return value instanceof Date ? value : new Date(value);
}

function isInvalidDate(date: Date) {
  return Number.isNaN(date.getTime());
}

export function formatDate(
  value: DateValue,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
) {
  const date = toDate(value);

  if (isInvalidDate(date)) {
    return '';
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(date);
}

export function formatDateTime(
  value: DateValue,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
) {
  const date = toDate(value);

  if (isInvalidDate(date)) {
    return '';
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(date);
}
