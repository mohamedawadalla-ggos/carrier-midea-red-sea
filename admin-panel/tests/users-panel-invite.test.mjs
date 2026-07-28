import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const usersPanel = await readFile(new URL("../components/UsersPanel.tsx", import.meta.url), "utf8");

test("staff invitation retains the form element across asynchronous work", () => {
  assert.match(usersPanel, /const formElement = event\.currentTarget;/);
  assert.match(usersPanel, /new FormData\(formElement\)/);
  assert.match(usersPanel, /await invoke\(\{ action: "invite"/);
  assert.match(usersPanel, /formElement\.reset\(\);/);
  assert.doesNotMatch(usersPanel, /await invoke[\s\S]*event\.currentTarget\.reset\(\)/);
});
