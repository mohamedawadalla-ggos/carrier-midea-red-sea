import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const {
  loadPublicCatalogVisibility,
} = await import(new URL("../lib/public-catalog-visibility.ts", import.meta.url));

const config = { url: "https://example.supabase.co", publishableKey: "sb_publishable_test" };
const knownFamilyIds = new Set(["family-a", "family-b"]);
const knownModelCodes = new Set(["MODEL-A", "MODEL-B"]);
const knownModelFamilies = new Map([["MODEL-A", "family-a"], ["MODEL-B", "family-b"]]);

const load = (payload, overrides = {}) => loadPublicCatalogVisibility({
  enabled: true,
  config,
  knownFamilyIds,
  knownModelCodes,
  knownModelFamilies,
  fetchImpl: async (input, init) => {
    assert.equal(new URL(String(input)).searchParams.get("select"), "family_id,model_code");
    assert.equal(init.headers.apikey, config.publishableKey);
    assert.equal(init.cache, "no-store");
    return new Response(JSON.stringify(payload), { status: 200 });
  },
  ...overrides,
});

test("disabled visibility does not fetch and preserves the static catalog mode", async () => {
  let fetched = false;
  const snapshot = await load([], { enabled: false, fetchImpl: async () => { fetched = true; return new Response("[]"); } });
  assert.equal(snapshot.status, "disabled");
  assert.equal(fetched, false);
});

test("builds a live allowlist from exact known family and model pairs", async () => {
  const snapshot = await load([
    { family_id: "family-a", model_code: "MODEL-A" },
    { family_id: "future-family", model_code: "FUTURE-MODEL" },
  ]);
  assert.equal(snapshot.status, "ready");
  assert.deepEqual([...snapshot.familyIds], ["family-a"]);
  assert.deepEqual([...snapshot.modelCodes], ["MODEL-A"]);
});

test("fails closed for unavailable, malformed, or inconsistent live data", async () => {
  const unavailable = await load([], { fetchImpl: async () => new Response("unavailable", { status: 503 }) });
  assert.equal(unavailable.status, "error");
  assert.equal(unavailable.familyIds.size, 0);

  assert.equal((await load([{ family_id: "family-a" }])).status, "error");
  assert.equal((await load([{ family_id: "family-b", model_code: "MODEL-A" }])).status, "error");
});

test("provider refreshes on the approved triggers and storefront surfaces consume visibility", async () => {
  const provider = await readFile(new URL("../components/catalog/PublicCatalogVisibilityProvider.tsx", import.meta.url), "utf8");
  assert.match(provider, /60_000/);
  assert.match(provider, /addEventListener\("focus"/);
  assert.match(provider, /addEventListener\("online"/);
  assert.match(provider, /visibilitychange/);

  const files = [
    "../components/products/ProductFamilyGrid.tsx",
    "../components/products/ProductCategoryGrid.tsx",
    "../components/home/BestSellingProducts.tsx",
    "../components/home/FeaturedProductFamilies.tsx",
    "../components/advisor/CoolPetAdvisor.tsx",
    "../components/products/SimilarProducts.tsx",
    "../components/cart/RequestCartProvider.tsx",
    "../components/products/ProductFamilyLiveContent.tsx",
  ];
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /useVisibleCatalog|usePublicCatalogVisibility|activeVariantIds/);
  }
});
