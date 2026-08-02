import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputUrl = new URL("../content/generated-public-catalog.json", import.meta.url);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();

if (!supabaseUrl || !publishableKey) {
  console.warn("Catalog sync skipped: public Supabase build variables are not configured; using the reviewed local fallback.");
  process.exit(0);
}

const endpoint = new URL("/rest/v1/public_catalog_rows", supabaseUrl);
endpoint.searchParams.set("select", "*");
const response = await fetch(endpoint, { headers: { apikey: publishableKey }, cache: "no-store" });
if (!response.ok) throw new Error(`Catalog sync failed (${response.status}): ${await response.text()}`);
const rows = await response.json();
if (!Array.isArray(rows) || rows.length === 0) throw new Error("Catalog sync returned no published rows; refusing to build a blank storefront.");

const familyMap = new Map();
const variants = [];
for (const row of rows) {
  if (!row || typeof row !== "object" || typeof row.family_id !== "string" || typeof row.model_code !== "string") {
    throw new Error("Catalog sync returned an invalid row.");
  }
  if (!familyMap.has(row.family_id)) {
    const highlightsAr = Array.isArray(row.highlights_ar) ? row.highlights_ar : [];
    const highlightsEn = Array.isArray(row.highlights_en) ? row.highlights_en : [];
    if (highlightsAr.length !== highlightsEn.length) throw new Error(`Highlight translation mismatch for ${row.family_id}.`);
    familyMap.set(row.family_id, {
      id: row.family_id,
      slug: row.family_slug,
      brand: row.brand,
      name: { ar: row.family_name_ar, en: row.family_name_en },
      productType: row.product_type,
      marketSegments: row.market_segments,
      technology: row.technology,
      refrigerant: row.refrigerant,
      description: { ar: row.description_ar, en: row.description_en },
      highlights: highlightsAr.map((ar, index) => ({ ar, en: highlightsEn[index] })),
      familyImagePath: row.family_image_path,
      assetAuthorization: row.asset_authorization,
      featured: row.featured,
      displayOrder: row.family_display_order,
    });
  }
  const capacity = Number(row.capacity_hp);
  if (![1.5, 2.25, 3, 4, 5, 6, 7.5].includes(capacity)) throw new Error(`Unsupported horsepower ${row.capacity_hp} for ${row.model_code}.`);
  variants.push({
    id: `${row.family_id}-${row.model_code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    familyId: row.family_id,
    modelCode: row.model_code,
    capacityHp: capacity,
    capacityBtu: row.capacity_btu,
    coolingMode: row.cooling_mode,
    energyClass: row.energy_class,
    priceMode: "request-quote",
    priceReferenceDate: "2026-06-07",
    active: true,
    displayOrder: row.product_display_order,
  });
}

const snapshot = { families: [...familyMap.values()], variants, generatedAt: new Date().toISOString() };
await writeFile(fileURLToPath(outputUrl), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Catalog sync complete: ${snapshot.families.length} families, ${variants.length} models.`);
