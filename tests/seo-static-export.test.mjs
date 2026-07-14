import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const origin = "https://carrier-midea-red-sea.pages.dev";
const organizationId = `${origin}/#organization`;
const websiteId = `${origin}/#website`;

if (existsSync(join(root, ".env.local"))) process.loadEnvFile(join(root, ".env.local"));

const [familySource, typeSource] = await Promise.all([
  readFile(new URL("../content/product-families.ts", import.meta.url), "utf8"),
  readFile(new URL("../content/catalog-types.ts", import.meta.url), "utf8"),
]);

const productTypes = [...typeSource.matchAll(/\{ id: "([^"]+)", name:/g)].map((match) => match[1]);
const families = [...familySource.matchAll(/id: "(?:carrier|midea)-[^"]+", slug: "([^"]+)"[\s\S]*?productType: "([^"]+)"/g)].map((match) => ({ slug: match[1], type: match[2] }));
const suffixes = ["", "/products", ...productTypes.map((type) => `/products/${type}`), ...families.map((family) => `/products/${family.type}/${family.slug}`)];
const localizedPaths = ["ar", "en"].flatMap((locale) => suffixes.map((suffix) => `/${locale}${suffix}/`.replace(/\/\/$/, "/")));

function exportedHtml(path) {
  return join(root, "out", ...path.split("/").filter(Boolean), "index.html");
}

function links(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => {
    const attributes = Object.fromEntries([...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map((attribute) => [attribute[1].toLowerCase(), attribute[2]]));
    return attributes;
  });
}

function jsonLd(html) {
  return [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}

test("sitemap exports exactly the 38 canonical localized URLs", async () => {
  assert.equal(localizedPaths.length, 38);
  const xml = await readFile(join(root, "out", "sitemap.xml"), "utf8");
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const expected = localizedPaths.map((path) => `${origin}${path}`);
  assert.deepEqual([...locations].sort(), [...expected].sort());
  assert.equal(new Set(locations).size, 38);
  assert.ok(locations.every((location) => location.startsWith(origin) && location.endsWith("/")));
});

test("robots allows public crawling and points to the canonical sitemap", async () => {
  const robots = await readFile(join(root, "out", "robots.txt"), "utf8");
  assert.match(robots, /^User-Agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/sitemap\\.xml$`, "m"));
  assert.doesNotMatch(robots, /Disallow:\s*\//);
});

test("every canonical localized page exports self-canonical and paired hreflang links", async () => {
  for (const suffix of suffixes) {
    for (const locale of ["ar", "en"]) {
      const path = `/${locale}${suffix}/`.replace(/\/\/$/, "/");
      const html = await readFile(exportedHtml(path), "utf8");
      const pageLinks = links(html);
      const canonical = pageLinks.find((link) => link.rel === "canonical");
      assert.equal(canonical?.href, `${origin}${path}`, `canonical ${path}`);
      for (const alternateLocale of ["ar", "en"]) {
        const expectedPath = `/${alternateLocale}${suffix}/`.replace(/\/\/$/, "/");
        const alternate = pageLinks.find((link) => link.rel === "alternate" && link.hreflang === alternateLocale);
        assert.equal(alternate?.href, `${origin}${expectedPath}`, `${alternateLocale} alternate ${path}`);
      }
    }
  }

  const rootHtml = await readFile(join(root, "out", "index.html"), "utf8");
  const rootLinks = links(rootHtml);
  assert.equal(rootLinks.find((link) => link.rel === "canonical")?.href, `${origin}/ar/`);
  assert.equal(rootLinks.find((link) => link.rel === "alternate" && link.hreflang === "ar")?.href, `${origin}/ar/`);
  assert.equal(rootLinks.find((link) => link.rel === "alternate" && link.hreflang === "en")?.href, `${origin}/en/`);
});

test("WebSite and HVACBusiness JSON-LD use approved stable fields only", async () => {
  const html = await readFile(exportedHtml("/en/"), "utf8");
  const entities = jsonLd(html);
  const website = entities.find((entity) => entity["@type"] === "WebSite");
  const business = entities.find((entity) => entity["@type"] === "HVACBusiness");
  assert.ok(website);
  assert.ok(business);
  assert.equal(website["@id"], websiteId);
  assert.deepEqual(website.publisher, { "@id": organizationId });
  assert.equal(business["@id"], organizationId);
  assert.equal(business.name, "Carrier–Midea Red Sea");
  assert.deepEqual(business.address, {
    "@type": "PostalAddress",
    streetAddress: "طريق النصر، أمام بنك سي أي بي (CIB)",
    addressLocality: "الغردقة",
    addressRegion: "البحر الأحمر",
    addressCountry: "EG",
  });
  assert.deepEqual(business.areaServed, [
    { "@type": "City", name: "Ain Sokhna" },
    { "@type": "AdministrativeArea", name: "Red Sea Governorate" },
  ]);

  const expectedMap = process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL || process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL;
  if (expectedMap) assert.equal(business.hasMap, expectedMap);
  else assert.equal("hasMap" in business, false);

  const serialized = JSON.stringify(business);
  for (const prohibited of ["postalCode", "geo", "latitude", "longitude", "neighborhood", "buildingNumber", "floor", "openingHours", "openingHoursSpecification", "aggregateRating", "review", "priceRange"]) {
    assert.doesNotMatch(serialized, new RegExp(`"${prohibited}"`));
  }
});

test("approved bilingual address is visibly rendered from the site export", async () => {
  const [arabic, english] = await Promise.all([readFile(exportedHtml("/ar/"), "utf8"), readFile(exportedHtml("/en/"), "utf8")]);
  assert.match(arabic, /<address class="footer-address">/);
  assert.match(english, /<address class="footer-address">/);
  assert.ok(arabic.includes("طريق النصر، أمام بنك سي أي بي (CIB)، الغردقة، البحر الأحمر، مصر"));
  assert.ok(english.includes("El Nasr Road, opposite CIB Bank, Hurghada, Red Sea, Egypt"));
});

test("Google verification file exports byte-for-byte unchanged", async () => {
  const [source, exported] = await Promise.all([
    readFile(join(root, "public", "google4fffc71c8f8eb9e2.html")),
    readFile(join(root, "out", "google4fffc71c8f8eb9e2.html")),
  ]);
  const expectedHash = "2e2a3d30859585026cacf7a0cf5f348bcee4589c77350f54bf09ddc7396c95f6";
  assert.equal(source.toString("utf8"), "google-site-verification: google4fffc71c8f8eb9e2.html");
  assert.equal(createHash("sha256").update(source).digest("hex"), expectedHash);
  assert.equal(createHash("sha256").update(exported).digest("hex"), expectedHash);
  assert.equal(source.equals(exported), true);
});
