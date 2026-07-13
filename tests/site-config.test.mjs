import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const keys = [
  "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_FACEBOOK_PAGE_URL", "NEXT_PUBLIC_WHATSAPP_NUMBER", "NEXT_PUBLIC_PHONE_TEL", "NEXT_PUBLIC_PHONE_DISPLAY",
  "NEXT_PUBLIC_EMAIL", "NEXT_PUBLIC_GOOGLE_MAPS_URL", "NEXT_PUBLIC_GOOGLE_BUSINESS_URL", "NEXT_PUBLIC_META_PIXEL_ID", "NEXT_PUBLIC_GA_MEASUREMENT_ID",
];

test("documents every public variable and accesses environment values explicitly", async () => {
  const [example, config, ignore] = await Promise.all([
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../lib/site-config.ts", import.meta.url), "utf8"),
    readFile(new URL("../.gitignore", import.meta.url), "utf8"),
  ]);
  for (const key of keys) {
    assert.match(example, new RegExp(`^${key}=`, "m"));
    assert.match(config, new RegExp(`process\\.env\\.${key}`));
  }
  assert.doesNotMatch(config, /process\.env\s*\[/);
  assert.match(ignore, /\.env\*/);
  assert.match(ignore, /!\.env\.example/);
});

test("defines legitimate Facebook click tracking and consent-gated pixel behavior", async () => {
  const source = await readFile(new URL("../lib/social-tracking.ts", import.meta.url), "utf8");
  for (const event of ["facebook_header_click", "facebook_home_section_click", "facebook_footer_click", "facebook_share_click"]) assert.match(source, new RegExp(event));
  assert.match(source, /marketing_consent/);
  assert.match(source, /FacebookFollowClick/);
  assert.doesNotMatch(source, /followed|completion.*true|scrap|bot/i);
});
