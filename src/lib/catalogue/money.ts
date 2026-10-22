/**
 * Formats a price. USD keeps the prototype's exact format ("$160", "$128.50"); other currencies
 * use the locale format, e.g. INR → "₹2,499" with Indian digit grouping.
 */
export function formatMoney(n: number, currency: string): string {
  if (currency === "USD") return "$" + (Number.isInteger(n) ? n : n.toFixed(2));
  const locale = currency === "INR" ? "en-IN" : "en";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}
