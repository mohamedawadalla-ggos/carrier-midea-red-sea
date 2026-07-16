import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sources = Object.fromEntries(await Promise.all([
  "../components/advisor/CoolPetAdvisor.tsx",
  "../components/advisor/AdvisorDialog.tsx",
  "../components/advisor/AdvisorQuestionFlow.tsx",
  "../components/advisor/AdvisorResults.tsx",
  "../components/home/AdvisorCheckpoint.tsx",
  "../lib/ac-advisor-access.ts",
  "../app/(default)/layout.tsx",
  "../app/[locale]/layout.tsx",
].map(async (path) => [path, await readFile(new URL(path, import.meta.url), "utf8")])));
const copy = await readFile(new URL("../content/ac-advisor-copy.ts", import.meta.url), "utf8");
const mascot = await readFile(new URL("../components/advisor/CoolPetMascot.tsx", import.meta.url), "utf8");

test("advisor mounts in both static layouts without a route or server API", () => {
  assert.match(sources["../app/(default)/layout.tsx"], /<CoolPetAdvisor locale="ar"/);
  assert.match(sources["../app/[locale]/layout.tsx"], /<CoolPetAdvisor locale=\{locale\}/);
});

test("dialog, keyboard, progress, validation, and catalog links retain accessible native behavior", () => {
  assert.match(sources["../components/advisor/AdvisorDialog.tsx"], /<dialog/);
  assert.match(sources["../components/advisor/AdvisorDialog.tsx"], /onCancel=\{onClose\}/);
  assert.match(sources["../components/advisor/AdvisorDialog.tsx"], /event\.key !== "Escape"/);
  assert.match(sources["../components/advisor/AdvisorDialog.tsx"], /removeEventListener\("keydown", handleEscape\)/);
  assert.match(sources["../components/advisor/CoolPetAdvisor.tsx"], /aria-haspopup="dialog"/);
  assert.match(sources["../components/advisor/CoolPetAdvisor.tsx"], /OPEN_COOLPET_ADVISOR_EVENT/);
  assert.match(sources["../components/advisor/CoolPetAdvisor.tsx"], /externalOpenerRef/);
  assert.match(sources["../components/home/AdvisorCheckpoint.tsx"], /aria-haspopup="dialog"/);
  assert.match(sources["../components/home/AdvisorCheckpoint.tsx"], /openCoolPetAdvisor\(event\.currentTarget\)/);
  assert.match(sources["../components/advisor/CoolPetAdvisor.tsx"], /<progress/);
  assert.match(sources["../components/advisor/AdvisorQuestionFlow.tsx"], /role="alert"/);
  assert.match(sources["../components/advisor/AdvisorResults.tsx"], /<a href=\{`\/\$\{locale\}\/products\//);
  assert.doesNotMatch(sources["../components/advisor/AdvisorResults.tsx"], /<Link/);
});

test("advisor has no persistence, AI API, runtime fetch, or imperative catalog routing", () => {
  const combined = Object.values(sources).join("\n");
  assert.doesNotMatch(combined, /localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(combined, /fetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(combined, /OpenAI|generative AI|AI-powered/i);
  assert.doesNotMatch(combined, /router\.push|window\.location\.(?:assign|replace)/);
});

test("advisor presents the approved Mr. Cool identity and playful accessible vector", () => {
  assert.match(copy, /مستر كول/);
  assert.match(copy, /Mr\. Cool/);
  assert.doesNotMatch(copy, /كول بيت|CoolPet/);
  assert.match(mascot, /Mr\. Cool playful air-conditioning advisor character/);
  assert.match(mascot, /coolpet-cheek/);
  assert.match(mascot, /coolpet-bow/);
});
