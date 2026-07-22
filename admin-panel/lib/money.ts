export function minorToInput(value: number | null | undefined): string {
  return typeof value === "number" ? (value / 100).toFixed(2) : "";
}

export function inputToMinor(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Enter a valid non-negative amount.");
  return Math.round(parsed * 100);
}

export function formatMoney(value: number | null | undefined, currency = "EGP"): string {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-EG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100);
}
