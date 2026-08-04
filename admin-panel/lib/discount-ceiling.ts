export type CeilingPriceInput = Readonly<{ modelCode: string; salePriceMinor: number }>;

function inputToMinor(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Enter a valid non-negative amount.");
  return Math.round(parsed * 100);
}

export function calculateDiscountBps(listPriceMinor: number, salePriceMinor: number): number {
  if (!Number.isSafeInteger(listPriceMinor) || listPriceMinor <= 0) return 0;
  return Math.floor(((listPriceMinor - salePriceMinor) * 10_000) / listPriceMinor);
}

// Excel paste always delimits columns with a tab, so split on tabs when one
// is present -- this leaves commas free to be thousand separators inside the
// price cell (e.g. "57,135.00"), which inputToMinor strips separately. Only
// fall back to comma-as-delimiter for input with no tab at all (e.g. a
// hand-typed or CSV-style line), and even then split on just the first comma
// so any further commas in the price are treated as formatting, not columns.
function splitPasteLine(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((cell) => cell.trim());
  const commaIndex = line.indexOf(",");
  if (commaIndex === -1) return [line.trim()];
  return [line.slice(0, commaIndex).trim(), line.slice(commaIndex + 1).trim()];
}

export function parseCeilingPricePaste(value: string): CeilingPriceInput[] {
  const seen = new Set<string>();
  return value.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    const [rawCode, rawPrice, ...extra] = splitPasteLine(line);
    const modelCode = rawCode?.toUpperCase();
    if (!modelCode || !rawPrice || extra.length) {
      throw new Error(`Row ${index + 1} must contain model code and offer price only.`);
    }
    if (seen.has(modelCode)) throw new Error(`Duplicate model code: ${modelCode}.`);
    seen.add(modelCode);
    const salePriceMinor = inputToMinor(rawPrice.replaceAll(",", ""));
    if (salePriceMinor <= 0) throw new Error(`Offer price for ${modelCode} must be positive.`);
    return { modelCode, salePriceMinor };
  });
}

export function validateCeilingPrice(options: {
  modelCode: string;
  listPriceMinor: number;
  minimumPriceMinor: number | null;
  salePriceMinor: number;
}): string | null {
  if (options.salePriceMinor >= options.listPriceMinor) {
    return `${options.modelCode}: offer price must be below the customer price.`;
  }
  if (options.minimumPriceMinor === null) {
    return `${options.modelCode}: no approved minimum price is available.`;
  }
  if (options.salePriceMinor < options.minimumPriceMinor) {
    return `${options.modelCode}: offer price is below the approved minimum.`;
  }
  return null;
}
