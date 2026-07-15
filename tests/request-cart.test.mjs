import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cart = await import(new URL("../lib/request-cart.ts", import.meta.url));
const { productVariants } = await import(new URL("../content/product-variants.ts", import.meta.url));
const { productFamilies } = await import(new URL("../content/product-families.ts", import.meta.url));

const first = productVariants[0];
const second = productVariants[1];
const activeVariantIds = new Set(productVariants.filter((variant) => variant.active).map((variant) => variant.id));

test("request cart adds, bounds, updates, removes, and clears active variants", () => {
  let items = cart.addRequestCartItem([], first.id, 1, activeVariantIds);
  items = cart.addRequestCartItem(items, first.id, 200, activeVariantIds);
  items = cart.addRequestCartItem(items, second.id, 2, activeVariantIds);
  assert.deepEqual(items, [{ variantId: first.id, quantity: 99 }, { variantId: second.id, quantity: 2 }]);
  items = cart.updateRequestCartItem(items, second.id, 4, activeVariantIds);
  assert.equal(items[1].quantity, 4);
  items = cart.removeRequestCartItem(items, first.id, activeVariantIds);
  assert.deepEqual(items, [{ variantId: second.id, quantity: 4 }]);
  assert.deepEqual(cart.clearRequestCart(), []);
});

test("versioned persistence allowlists only variantId and quantity", () => {
  const raw = JSON.stringify({ version: 1, items: [{ variantId: first.id, quantity: 2, customerName: "secret", telephone: "010", area: "Hurghada", notes: "secret", installationRequired: true }] });
  const serialized = cart.serializeRequestCart(cart.parseRequestCart(raw, activeVariantIds), activeVariantIds);
  assert.deepEqual(JSON.parse(serialized), { version: 1, items: [{ variantId: first.id, quantity: 2 }] });
  for (const forbidden of ["customerName", "telephone", "area", "notes", "installationRequired"]) assert.doesNotMatch(serialized, new RegExp(forbidden));
  assert.deepEqual(cart.parseRequestCart("broken"), []);
  assert.deepEqual(cart.parseRequestCart(JSON.stringify({ version: 2, items: [{ variantId: first.id, quantity: 1 }] }), activeVariantIds), []);
  assert.deepEqual(cart.parseRequestCart(JSON.stringify({ version: 1, items: [{ variantId: "unknown", quantity: 1 }, { variantId: first.id, quantity: 0 }] }), activeVariantIds), []);
});

test("localized WhatsApp request includes catalog model codes and exact disclaimer", () => {
  const family = productFamilies.find((candidate) => candidate.id === first.familyId);
  const items = [{ variantId: first.id, quantity: 2, variant: first, family }];
  const common = { items, customerName: "Nael", telephone: "01000000000", area: "Hurghada", installationRequired: true, notes: "" };
  const ar = cart.buildRequestCartMessage({ ...common, locale: "ar" });
  const en = cart.buildRequestCartMessage({ ...common, locale: "en" });
  assert.match(ar, new RegExp(first.modelCode));
  assert.match(en, new RegExp(first.modelCode));
  assert.match(ar, /يتم تأكيد الأسعار والتوافر وتكلفة التركيب بعد مراجعة الطلب\./);
  assert.match(en, /Prices, availability, and installation costs are confirmed after reviewing the request\./);
  assert.doesNotMatch(`${ar}\n${en}`, /(?:checkout|payment|إجمالي|دفع)/i);
});

test("cart components keep customer fields ephemeral and submit through LeadProvider", async () => {
  const provider = await readFile(new URL("../components/cart/RequestCartProvider.tsx", import.meta.url), "utf8");
  const panel = await readFile(new URL("../components/cart/RequestCartPanel.tsx", import.meta.url), "utf8");
  const lead = await readFile(new URL("../services/leads/whatsapp-provider.ts", import.meta.url), "utf8");
  assert.match(provider, /serializeRequestCart\(items, activeVariantIds\)/);
  assert.doesNotMatch(provider, /customerName|telephone|area|notes|installationRequired/);
  assert.match(panel, /openPreparedLink\(leadProvider\.submitRequestCart/);
  assert.match(lead, /createWhatsAppUrl\(buildRequestCartMessage\(data\)\)/);
});

test("localized layouts provide cart state and the prioritized header exposes its count", async () => {
  const [defaultLayout, localeLayout, header, panel, modelCard] = await Promise.all([
    "../app/(default)/layout.tsx",
    "../app/[locale]/layout.tsx",
    "../components/layout/SiteHeader.tsx",
    "../components/cart/RequestCartPanel.tsx",
    "../components/products/ProductVariantCard.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.match(defaultLayout, /<RequestCartProvider locale="ar">/);
  assert.match(localeLayout, /<RequestCartProvider locale=\{locale\}>/);
  assert.match(header, /itemCount, toggleCart/);
  assert.ok(header.indexOf('["Products", "/products"]') < header.indexOf('["Home", ""]'));
  assert.ok(header.indexOf('["التكييفات", "/products"]') < header.indexOf('["الرئيسية", ""]'));
  assert.match(modelCard, /AddToRequestButton/);
  assert.doesNotMatch(modelCard, /modelCode/);
  assert.match(panel, /Prices, availability, and installation costs are confirmed after reviewing the request/);
  assert.doesNotMatch(panel, /type="(?:submit|button)"[^>]*>[^<]*(?:Pay|ادفع)/i);
});
