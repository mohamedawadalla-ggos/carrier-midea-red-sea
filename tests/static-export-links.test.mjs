import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const categoryCard = await readFile(new URL("../components/products/ProductCategoryCard.tsx", import.meta.url), "utf8");
const familyCard = await readFile(new URL("../components/products/ProductFamilyCard.tsx", import.meta.url), "utf8");
const variantCard = await readFile(new URL("../components/products/ProductVariantCard.tsx", import.meta.url), "utf8");
const featuredFamilies = await readFile(new URL("../components/home/FeaturedProductFamilies.tsx", import.meta.url), "utf8");
const home = await readFile(new URL("../components/SiteExperience.tsx", import.meta.url), "utf8");
const familySource = await readFile(new URL("../content/product-families.ts", import.meta.url), "utf8");
const catalogComponentSources = await Promise.all((await readdir(new URL("../components/products/", import.meta.url))).filter((name) => name.endsWith(".tsx")).map((name) => readFile(new URL(`../components/products/${name}`, import.meta.url), "utf8")));
const productTypes = ["wall-mounted-split", "concealed-ducted", "ceiling-cassette", "floor-standing"];
const families = [...familySource.matchAll(/id: "(?:carrier|midea)-[^"]+", slug: "([^"]+)"[\s\S]*?productType: "([^"]+)"/g)].map((match) => ({ slug: match[1], type: match[2] }));

function linkTags(source) {
  return [...source.matchAll(/<Link\b[^>]*>/g)].map((match) => match[0]);
}

test("catalog Next links disable automatic static-export prefetching", () => {
  const categoryLinks = linkTags(categoryCard);
  const familyLinks = linkTags(familyCard);
  const variantLinks = linkTags(variantCard);
  const homeLinks = [...linkTags(featuredFamilies), ...linkTags(home)];
  assert.equal(categoryLinks.length, 1);
  assert.equal(familyLinks.length, 2);
  // The redundant "Request current price" link was removed from variant
  // cards now that every card already shows its live price directly.
  assert.equal(variantLinks.length, 1);
  assert.equal(homeLinks.length, 2);
  for (const link of [...categoryLinks, ...familyLinks, ...variantLinks, ...homeLinks]) {
    assert.match(link, /prefetch=\{false\}/);
    assert.match(link, /href=/);
  }
});

test("catalog navigation does not use imperative click routing", () => {
  const source = catalogComponentSources.join("\n");
  assert.doesNotMatch(source, /router\.push\s*\(/);
  assert.doesNotMatch(source, /window\.location\.(?:assign|replace)\s*\(/);
  assert.doesNotMatch(source, /window\.location\s*=/);
});

test("exported Arabic and English catalog hrefs resolve to generated routes", async () => {
  for (const locale of ["ar", "en"]) {
    const catalogHtml = await readFile(join(root, "out", locale, "products", "index.html"), "utf8");
    for (const type of productTypes) {
      const href = `/${locale}/products/${type}/`;
      assert.ok(catalogHtml.includes(`href="${href}"`), href);
      await access(join(root, "out", locale, "products", type, "index.html"));
    }
    for (const family of families) {
      const href = `/${locale}/products/${family.type}/${family.slug}/`;
      assert.ok(catalogHtml.includes(`href="${href}"`), href);
      await access(join(root, "out", locale, "products", family.type, family.slug, "index.html"));
    }
  }
});

test("static-safe catalog changes preserve hash and external link components and all 75 routes", async () => {
  const familyHero = await readFile(new URL("../components/products/FamilyHero.tsx", import.meta.url), "utf8");
  const facebookLink = await readFile(new URL("../components/social/FacebookLink.tsx", import.meta.url), "utf8");
  assert.match(familyHero, /href=\{`\/\$\{locale\}#contact`\}/);
  assert.match(facebookLink, /target="_blank"/);
  assert.match(facebookLink, /rel="noreferrer"/);

  let routeCount = 0;
  async function countRoutes(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await countRoutes(path);
      else if (entry.name === "index.html") routeCount += 1;
    }
  }
  await countRoutes(join(root, "out"));
  // 73 + /ar/order-status + /en/order-status = 75, added for the real-time
  // checkout return flow.
  assert.equal(routeCount, 75);
});
