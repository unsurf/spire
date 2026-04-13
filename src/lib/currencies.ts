export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "NZD", symbol: "$", name: "New Zealand Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "HKD", symbol: "$", name: "Hong Kong Dollar" },
  { code: "SGD", symbol: "$", name: "Singapore Dollar" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function getCurrency(code: string): (typeof CURRENCIES)[number] | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

export function formatCurrency(amount: number, currency: string): string {
  const curr = getCurrency(currency);
  if (!curr) return `${amount.toFixed(2)}`;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${curr.symbol}${amount.toFixed(2)}`;
  }
}
