import type { PublicSupabaseConfig } from "@/lib/site-config";

export type CatalogVisibilityStatus = "disabled" | "loading" | "ready" | "error";

export type PublicCatalogVisibilitySnapshot = Readonly<{
  status: CatalogVisibilityStatus;
  familyIds: ReadonlySet<string>;
  modelCodes: ReadonlySet<string>;
}>;

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const emptyIds = (): ReadonlySet<string> => new Set<string>();

export const disabledCatalogVisibility = (): PublicCatalogVisibilitySnapshot => ({
  status: "disabled",
  familyIds: emptyIds(),
  modelCodes: emptyIds(),
});

export const loadingCatalogVisibility = (): PublicCatalogVisibilitySnapshot => ({
  status: "loading",
  familyIds: emptyIds(),
  modelCodes: emptyIds(),
});

export const failedCatalogVisibility = (): PublicCatalogVisibilitySnapshot => ({
  status: "error",
  familyIds: emptyIds(),
  modelCodes: emptyIds(),
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function loadPublicCatalogVisibility(options: {
  enabled: boolean;
  config: PublicSupabaseConfig;
  knownFamilyIds: ReadonlySet<string>;
  knownModelCodes: ReadonlySet<string>;
  knownModelFamilies: ReadonlyMap<string, string>;
  fetchImpl?: FetchLike;
  signal?: AbortSignal;
}): Promise<PublicCatalogVisibilitySnapshot> {
  if (!options.enabled) return disabledCatalogVisibility();
  if (!options.config.url || !options.config.publishableKey) return failedCatalogVisibility();

  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const url = new URL("/rest/v1/public_catalog_rows", options.config.url);
    url.searchParams.set("select", "family_id,model_code");
    const response = await fetchImpl(url, {
      headers: { apikey: options.config.publishableKey },
      cache: "no-store",
      signal: options.signal,
    });
    if (!response.ok) return failedCatalogVisibility();

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) return failedCatalogVisibility();

    const familyIds = new Set<string>();
    const modelCodes = new Set<string>();
    const modelFamilies = new Map<string, string>();
    for (const row of payload) {
      if (!isObject(row) || typeof row.family_id !== "string" || !row.family_id || typeof row.model_code !== "string" || !row.model_code) {
        return failedCatalogVisibility();
      }
      const previousFamily = modelFamilies.get(row.model_code);
      if (previousFamily && previousFamily !== row.family_id) return failedCatalogVisibility();
      modelFamilies.set(row.model_code, row.family_id);
      if (!options.knownFamilyIds.has(row.family_id) || !options.knownModelCodes.has(row.model_code)) continue;
      if (options.knownModelFamilies.get(row.model_code) !== row.family_id) return failedCatalogVisibility();
      familyIds.add(row.family_id);
      modelCodes.add(row.model_code);
    }

    return { status: "ready", familyIds, modelCodes };
  } catch {
    return failedCatalogVisibility();
  }
}
