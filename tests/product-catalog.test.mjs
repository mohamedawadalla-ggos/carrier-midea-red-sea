import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const familySource = await readFile(new URL("../content/product-families.ts", import.meta.url), "utf8");
const variantSource = await readFile(new URL("../content/product-variants.ts", import.meta.url), "utf8");
const { productVariants } = await import(new URL("../content/product-variants.ts", import.meta.url));
const models = productVariants.map((variant) => variant.modelCode);
const families = [...familySource.matchAll(/id: "((?:carrier|midea)-[^"]+)", slug: "([^"]+)"[\s\S]*?productType: "([^"]+)"/g)].map((match) => ({ id: match[1], slug: match[2], type: match[3], brand: match[1].split("-")[0] }));

async function getWorker() { const url = new URL("../dist/server/index.js", import.meta.url); url.searchParams.set("catalog", `${process.pid}-${Date.now()}`); return (await import(url.href)).default; }
async function render(worker, path) { return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} }); }

test("catalog reconciles exactly to the approved family and variant counts", () => {
  assert.equal(families.length, 13);
  assert.equal(models.length, 61);
  assert.equal(models.filter((model) => model.startsWith("53")).length, 39);
  assert.equal(models.filter((model) => model.startsWith("M1")).length, 22);
  assert.equal(new Set(models).size, models.length);
  assert.equal(new Set(families.map((family) => family.id)).size, families.length);
  assert.equal(new Set(families.map((family) => family.slug)).size, families.length);
  const familyIds = new Set(families.map((family) => family.id));
  for (const variant of productVariants) assert.ok(familyIds.has(variant.familyId), variant.familyId);
  const counts = Object.fromEntries(["wall-mounted-split", "concealed-ducted", "ceiling-cassette", "floor-standing"].map((type) => [type, 0]));
  const familyTypes = new Map(families.map((family) => [family.id, family.type]));
  for (const variant of productVariants) counts[familyTypes.get(variant.familyId)] += 1;
  assert.deepEqual(counts, { "wall-mounted-split": 44, "concealed-ducted": 12, "ceiling-cassette": 2, "floor-standing": 3 });
  const assignmentHash = createHash("sha256").update(productVariants.map((variant) => `${variant.familyId}:${variant.modelCode}`).join("\n")).digest("hex");
  assert.equal(assignmentHash, "808b97a6b78014c731c939e01bb6e6c50602c4f099a253e66b5aa4d8097e5f70");
  const horsepowerCounts = Object.fromEntries([1.5, 2.25, 3, 4, 5, 6, 7.5].map((horsepower) => [horsepower, productVariants.filter((variant) => variant.capacityHp === horsepower).length]));
  assert.deepEqual(horsepowerCounts, { 1.5: 13, 2.25: 14, 3: 14, 4: 5, 5: 8, 6: 3, 7.5: 4 });
  assert.ok(productVariants.every((variant) => variant.capacityHp !== null));
  assert.deepEqual([...new Set(productVariants.map((variant) => variant.capacityHp))].sort((a, b) => a - b), [1.5, 2.25, 3, 4, 5, 6, 7.5]);
  assert.match(variantSource, /priceMode: "request-quote"/);
  assert.doesNotMatch(familySource + variantSource, /dealerPrice|publicGuidePrice|sourceDocument|sourceUrl|internalVerificationNotes/);
});

test("every bilingual type and family route renders", async () => {
  const worker = await getWorker();
  for (const locale of ["ar", "en"]) {
    for (const type of new Set(families.map((family) => family.type))) assert.equal((await render(worker, `/${locale}/products/${type}/`)).status, 200);
    for (const family of families) { const response = await render(worker, `/${locale}/products/${family.type}/${family.slug}/`); assert.equal(response.status, 200, `${locale}/${family.slug}`); const html = await response.text(); assert.match(html, /ProductGroup/); assert.doesNotMatch(html, /"offers"|"price"|"availability"|src=""/i); }
  }
});

test("public source and build contain no confidential catalog fields or price claims", async () => {
  const files = [];
  async function walk(directory) { for (const entry of await readdir(directory, { withFileTypes: true })) { if (["node_modules", ".next", "dist", "out", "internal", "private-source", "tests"].includes(entry.name)) continue; const path = join(directory, entry.name); if (entry.isDirectory()) await walk(path); else if (/\.(?:ts|tsx|js|mjs|html)$/.test(entry.name)) files.push(path); } }
  await walk(root);
  const publicSource = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.doesNotMatch(publicSource, /dealerPrice|publicGuidePrice/);
  assert.doesNotMatch(publicSource, /\b(?:best-?seller|most popular|cheapest|number one|inStock|OutOfStock)\b/i);
});

test("WhatsApp cannot create an empty-recipient URL", async () => {
  const source = await readFile(new URL("../lib/whatsapp.ts", import.meta.url), "utf8");
  assert.match(source, /if \(!siteConfig\.whatsappNumber\) return null/);
  assert.doesNotMatch(source, /"https:\/\/wa\.me\/"/);
});
