import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const offer = await readFile(new URL("../content/offers.ts", import.meta.url), "utf8");
const { approvedOffer, isOfferActiveAt } = await import(new URL("../content/offers.ts", import.meta.url));
const banner = await readFile(new URL("../components/offers/OfferBanner.tsx", import.meta.url), "utf8");
const home = await readFile(new URL("../components/SiteExperience.tsx", import.meta.url), "utf8");
const featured = await readFile(new URL("../components/home/FeaturedProductFamilies.tsx", import.meta.url), "utf8");
const heroShowcase = await readFile(new URL("../components/home/HeroProductShowcase.tsx", import.meta.url), "utf8");
const checkpoint = await readFile(new URL("../components/home/AdvisorCheckpoint.tsx", import.meta.url), "utf8");
const company = await readFile(new URL("../content/site.ts", import.meta.url), "utf8");

test("approved offer is typed, manually controlled, exact, and free of price or stock claims", () => {
  assert.match(offer, /active: true/);
  assert.match(offer, /startsAt: "2026-07-14T00:00:00\+03:00"/);
  assert.match(offer, /endsAtExclusive: "2026-08-02T00:00:00\+03:00"/);
  assert.match(offer, /discountPercentage: 10/);
  assert.match(offer, /scope: "air-conditioning-units-only"/);
  assert.match(offer, /خصم 10% على أجهزة التكييف لفترة محدودة/);
  assert.match(offer, /10% off air-conditioning units for a limited time/);
  assert.match(offer, /اطلب السعر الحالي وتفاصيل العرض عبر واتساب/);
  assert.match(offer, /Request the current price and offer details on WhatsApp/);
  assert.match(offer, /ساري حتى 1 أغسطس 2026/);
  assert.match(offer, /Valid through 1 August 2026/);
  assert.match(offer, /"installation", "maintenance", "delivery", "service-charges"/);
  assert.doesNotMatch(`${offer}\n${banner}`, /endDate|validThrough|availability|inStock|priceCurrency|offers:/i);
});

test("offer remains visible throughout 1 August and expires at the start of 2 August in Egypt", () => {
  assert.equal(isOfferActiveAt(approvedOffer, "2026-08-01T00:00:00+03:00"), true);
  assert.equal(isOfferActiveAt(approvedOffer, "2026-08-01T23:59:59.999+03:00"), true);
  assert.equal(isOfferActiveAt(approvedOffer, "2026-08-02T00:00:00+03:00"), false);
  assert.equal(isOfferActiveAt({ ...approvedOffer, active: false }, "2026-08-01T12:00:00+03:00"), false);
});

test("offer banner starts hidden and decides visibility only in the browser", async () => {
  assert.match(banner, /"use client"/);
  assert.match(banner, /useState\(false\)/);
  assert.match(banner, /setVisible\(isOfferActiveAt\(offer, now\)\)/);
  assert.match(banner, /if \(!visible\) return null/);
  assert.match(banner, /window\.setTimeout\(updateVisibility/);
  assert.match(banner, /offer = approvedOffer/);
  assert.match(home, /<OfferBanner locale=\{locale\}/);
  const exportedArabicHome = await readFile(new URL("../out/ar/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(exportedArabicHome, /خصم 10% على أجهزة التكييف/);
});

test("approved discount excludes installation, maintenance, and delivery", () => {
  assert.deepEqual([...approvedOffer.exclusions], ["installation", "maintenance", "delivery", "service-charges"]);
  assert.match(approvedOffer.terms.ar, /لا يشمل التركيب أو الصيانة أو التوصيل/);
  assert.match(approvedOffer.terms.en, /excludes installation, maintenance, delivery/);
});

test("homepage conversion links are localized static links and checkpoint reuses CoolPet", () => {
  assert.match(home, /href=\{`\/\$\{locale\}\/products`\} prefetch=\{false\}/);
  assert.match(featured, /<Link className="catalog-link"[^>]+prefetch=\{false\}/);
  assert.ok(home.indexOf("<AdvisorCheckpoint") > home.indexOf("<FeaturedProductFamilies"));
  assert.ok(home.indexOf("<AdvisorCheckpoint") < home.indexOf("services-section"));
  assert.match(checkpoint, /openCoolPetAdvisor\(event\.currentTarget\)/);
  assert.doesNotMatch(checkpoint, /calculateAcSizing|AdvisorQuestionFlow|href=/);
});

test("homepage leads with catalog selections and uses only approved local hero product assets", () => {
  assert.ok(home.indexOf("<FeaturedProductFamilies") < home.indexOf("section className=\"section solutions\""));
  assert.match(home, /<HeroProductShowcase locale=\{locale\}/);
  assert.match(heroShowcase, /assetAuthorization === "approved"/);
  assert.doesNotMatch(heroShowcase, /https?:\/\//);
  assert.match(heroShowcase, /carrier-optimax-pro/);
  assert.match(heroShowcase, /midea-xtreme-pro/);
  assert.match(heroShowcase, /carrier-classicool-inverter/);
});

test("exclusive dealer wording matches the client-approved bilingual copy", () => {
  assert.match(company, /الوكيل الحصري المعتمد لكاريير وميديا في البحر الأحمر/);
  assert.match(company, /Authorized exclusive Carrier and Midea dealer in the Red Sea/);
});
