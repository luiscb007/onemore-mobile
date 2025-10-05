const CURRENCY_SYMBOLS: Record<string, string> = {
  'EUR': '€',
  'PLN': 'zł',
  'GBP': '£',
  'USD': '$',
};

export function formatPrice(priceAmount: string | number | null, currencyCode: string | null): string {
  if (priceAmount === null || priceAmount === undefined) {
    return 'Free';
  }

  const amount = typeof priceAmount === 'string' ? parseFloat(priceAmount) : priceAmount;
  
  if (isNaN(amount) || amount === 0) {
    return 'Free';
  }

  const symbol = currencyCode ? (CURRENCY_SYMBOLS[currencyCode] || currencyCode) : '€';
  
  return `${symbol}${amount.toFixed(2)}`;
}

export function getCurrencySymbol(currencyCode: string | null): string {
  if (!currencyCode) return '€';
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}
