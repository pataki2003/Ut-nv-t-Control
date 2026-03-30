const DEFAULT_LOCALE = 'hu-HU';
const DEFAULT_CURRENCY = 'HUF';

export function formatCurrency(
  value: number,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE
) {
  if (!Number.isFinite(value)) {
    return '';
  }

  const options: Intl.NumberFormatOptions =
    currency === DEFAULT_CURRENCY
      ? {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }
      : {
          style: 'currency',
          currency,
        };

  return new Intl.NumberFormat(locale, options).format(value);
}
