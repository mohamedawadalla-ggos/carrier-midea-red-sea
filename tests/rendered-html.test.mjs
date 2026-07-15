import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the branded Arabic experience", async () => {
  const response = await render("/ar/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Carrier–Midea Red Sea/);
  assert.match(html, /كاريير ميديا البحر الأحمر/);
  assert.match(html, /راحة استثنائية/);
  assert.match(html, /مش عارف تختار التكييف المناسب؟/);
  assert.match(html, /href="\/ar\/products"/);
  assert.match(html, /<form/);
  assert.match(html, /<html[^>]+lang="ar"[^>]+dir="rtl"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("server-renders the English experience", async () => {
  const response = await render("/en/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Exceptional comfort/);
  assert.match(html, /Request service/);
  assert.match(html, /Send via WhatsApp/);
  assert.match(html, /Not sure which AC is right for you\?/);
  assert.match(html, /href="\/en\/products"/);
  assert.match(html, /<html[^>]+lang="en"[^>]+dir="ltr"/);
});
