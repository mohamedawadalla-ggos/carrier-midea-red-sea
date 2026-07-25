import type { PublicSupabaseConfig } from "./site-config";
import type { Locale } from "@/content/site";
import type { ProductVariant } from "@/types/catalog";

export type StockStatusValue = "in_stock" | "out_of_stock";

export type PublicStockSnapshot = Readonly<{
  enabled: boolean;
  statuses: ReadonlyMap<string, StockStatusValue>;
}>;

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
const emptySnapshot = (): PublicStockSnapshot => ({ enabled: false, statuses: new Map() });
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

async function getJson(fetchImpl: FetchLike, url: URL, config: PublicSupabaseConfig): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: { apikey: config.publishableKey },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Public stock status request failed");
  return response.json();
}

export async function loadPublicStock(options: {
  config?: PublicSupabaseConfig;
  fetchImpl?: FetchLike;
} = {}): Promise<PublicStockSnapshot> {
  const config = options.config ?? { url: "", publishableKey: "" };
  const fetchImpl = options.fetchImpl ?? fetch;
  if (!config.url || !config.publishableKey) return emptySnapshot();

  try {
    const statusUrl = new URL("/rest/v1/public_stock_status", config.url);
    statusUrl.searchParams.set("select", "model_code,status");
    const response = await getJson(fetchImpl, statusUrl, config);
    if (!Array.isArray(response)) return emptySnapshot();

    const statuses = new Map<string, StockStatusValue>();
    for (const row of response) {
      if (!isObject(row) || typeof row.model_code !== "string" || (row.status !== "in_stock" && row.status !== "out_of_stock")) {
        return emptySnapshot();
      }
      if (statuses.has(row.model_code)) return emptySnapshot();
      statuses.set(row.model_code, row.status);
    }
    return { enabled: true, statuses };
  } catch {
    return emptySnapshot();
  }
}

// Models with no row are treated as in_stock — matches the admin panel's own default.
export function getPublicStock(snapshot: PublicStockSnapshot, modelCode: string): StockStatusValue {
  if (!snapshot.enabled) return "in_stock";
  return snapshot.statuses.get(modelCode) ?? "in_stock";
}

export function getStockProps(variant: ProductVariant, locale: Locale): { modelCode: string; locale: Locale } {
  return { modelCode: variant.modelCode, locale };
}
