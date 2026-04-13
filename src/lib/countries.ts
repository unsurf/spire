export const COUNTRIES = [
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "BR", name: "Brazil", currency: "BRL" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "CN", name: "China", currency: "CNY" },
  { code: "DK", name: "Denmark", currency: "DKK" },
  { code: "EU", name: "European Union", currency: "EUR" },
  { code: "HK", name: "Hong Kong", currency: "HKD" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "MX", name: "Mexico", currency: "MXN" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "NO", name: "Norway", currency: "NOK" },
  { code: "SG", name: "Singapore", currency: "SGD" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
  { code: "SE", name: "Sweden", currency: "SEK" },
  { code: "CH", name: "Switzerland", currency: "CHF" },
  { code: "TH", name: "Thailand", currency: "THB" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
