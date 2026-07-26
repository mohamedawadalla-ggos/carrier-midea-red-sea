import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated output in nested apps/packages (e.g. admin-panel), not
    // covered by the patterns above since flat config ignores don't
    // recurse into subdirectories by default:
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/dist/**",
    "**/node_modules/**",
  ]),
]);

export default eslintConfig;
